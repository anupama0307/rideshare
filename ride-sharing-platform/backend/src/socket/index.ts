import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyToken } from '../middleware/auth.js';
import { SocketEvents } from '@rideshare/shared';
import { logger } from '../config/logger.js';
import { rideRepository } from '../repositories/index.js';
import type { Coordinates, RerouteAlert } from '@rideshare/shared';
import { haversineDistanceMeters } from '@rideshare/shared';
import { config } from '../config/index.js';
import { redisPub, redisSub } from '../config/redis.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface LocationUpdate {
  coordinates: Coordinates;
  heading?: number;
  speed?: number;
  rideId?: string;
}

// Store driver locations in memory (use Redis for production scaling)
const driverLocations = new Map<string, {
  coordinates: Coordinates;
  heading: number;
  speed: number;
  rideId?: string;
  updatedAt: Date;
}>();

// Store planned routes for deviation detection
const plannedRoutes = new Map<string, Coordinates[]>();

export function initializeSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Configure Redis adapter for horizontal scaling
  // This enables Socket.io to work across multiple server instances
  io.adapter(createAdapter(redisPub, redisSub));
  logger.info('Socket.io Redis adapter configured');

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // ============================================
    // DRIVER LOCATION UPDATES
    // ============================================
    socket.on(SocketEvents.DRIVER_LOCATION_UPDATE, async (data: LocationUpdate) => {
      if (!socket.userId || socket.userRole !== 'driver') {
        socket.emit(SocketEvents.ERROR, { message: 'Not authorized' });
        return;
      }

      try {
        const { coordinates, heading = 0, speed = 0, rideId } = data;

        // Store location in memory
        // Only include rideId if defined (avoids exactOptionalPropertyTypes error)
        driverLocations.set(socket.userId, {
          coordinates,
          heading,
          speed,
          ...(rideId ? { rideId } : {}),
          updatedAt: new Date(),
        });

        // Update database
        if (rideId) {
          await rideRepository.updateCurrentLocation(rideId, coordinates, heading);

          // Broadcast to ride room
          io.to(`ride:${rideId}`).emit(SocketEvents.DRIVER_LOCATION_BROADCAST, {
            driverId: socket.userId,
            coordinates,
            heading,
            speed,
            timestamp: new Date(),
          });

          // Check for route deviation
          await checkRouteDeviation(io, socket.userId, rideId, coordinates);
        }
      } catch (error) {
        logger.error('Error updating driver location:', error);
        socket.emit(SocketEvents.ERROR, { message: 'Failed to update location' });
      }
    });

    // ============================================
    // JOIN/LEAVE RIDE ROOMS
    // ============================================
    socket.on(SocketEvents.JOIN_RIDE_ROOM, (rideId: string) => {
      socket.join(`ride:${rideId}`);
      logger.debug(`Socket ${socket.id} joined ride room: ${rideId}`);
    });

    socket.on(SocketEvents.LEAVE_RIDE_ROOM, (rideId: string) => {
      socket.leave(`ride:${rideId}`);
      logger.debug(`Socket ${socket.id} left ride room: ${rideId}`);
    });

    // ============================================
    // DRIVER ONLINE/OFFLINE
    // ============================================
    socket.on(SocketEvents.DRIVER_ONLINE, () => {
      if (socket.userId && socket.userRole === 'driver') {
        socket.join('drivers:online');
        io.to('dispatch').emit(SocketEvents.DRIVER_ONLINE, { driverId: socket.userId });
        logger.info(`Driver ${socket.userId} is now online`);
      }
    });

    socket.on(SocketEvents.DRIVER_OFFLINE, () => {
      if (socket.userId) {
        socket.leave('drivers:online');
        driverLocations.delete(socket.userId);
        io.to('dispatch').emit(SocketEvents.DRIVER_OFFLINE, { driverId: socket.userId });
        logger.info(`Driver ${socket.userId} is now offline`);
      }
    });

    // ============================================
    // CHAT MESSAGES
    // ============================================
    socket.on(SocketEvents.CHAT_MESSAGE, (data: {
      rideId: string;
      message: string;
    }) => {
      if (!socket.userId) return;

      io.to(`ride:${data.rideId}`).emit(SocketEvents.CHAT_MESSAGE, {
        senderId: socket.userId,
        message: data.message,
        timestamp: new Date(),
      });
    });

    socket.on(SocketEvents.CHAT_TYPING, (data: { rideId: string }) => {
      socket.to(`ride:${data.rideId}`).emit(SocketEvents.CHAT_TYPING, {
        userId: socket.userId,
      });
    });

    // ============================================
    // SOS ALERTS
    // ============================================
    socket.on(SocketEvents.SOS_ALERT, (data: {
      location: Coordinates;
      rideId?: string;
      message?: string;
    }) => {
      if (!socket.userId) return;

      // Broadcast to admins/dispatch
      io.to('dispatch').emit(SocketEvents.SOS_ALERT, {
        userId: socket.userId,
        ...data,
        timestamp: new Date(),
      });

      // Broadcast to ride participants if applicable
      if (data.rideId) {
        io.to(`ride:${data.rideId}`).emit(SocketEvents.SOS_ALERT, {
          userId: socket.userId,
          ...data,
          timestamp: new Date(),
        });
      }

      logger.warn(`SOS Alert from user ${socket.userId}`);
    });

    // ============================================
    // DISCONNECT
    // ============================================
    socket.on('disconnect', () => {
      if (socket.userId) {
        driverLocations.delete(socket.userId);
      }
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.io server initialized');
  return io;
}

/**
 * Check if driver has deviated from planned route
 * Triggers reroute event if deviation exceeds threshold
 */
async function checkRouteDeviation(
  io: Server,
  driverId: string,
  rideId: string,
  currentLocation: Coordinates
): Promise<void> {
  const plannedRoute = plannedRoutes.get(rideId);
  if (!plannedRoute || plannedRoute.length === 0) {
    return;
  }

  // Find minimum distance to any point on the planned route
  let minDistance = Infinity;
  for (const point of plannedRoute) {
    const distance = haversineDistanceMeters(currentLocation, point);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  // If deviation exceeds threshold, trigger reroute event
  if (minDistance > config.app.routeDeviationThresholdMeters) {
    const ride = await rideRepository.findById(rideId);
    if (!ride) return;

    const rerouteAlert: RerouteAlert = {
      rideId,
      reason: 'traffic',
      originalEta: ride.estimatedArrival || new Date(),
      newEta: new Date(Date.now() + 10 * 60 * 1000), // +10 minutes
      delayMinutes: 10,
    };

    io.to(`ride:${rideId}`).emit(SocketEvents.RIDE_REROUTED, rerouteAlert);
    logger.info(`Route deviation detected for ride ${rideId}, reroute alert sent`);
  }
}

// ============================================
// UTILITY FUNCTIONS FOR EXTERNAL USE
// ============================================

export function setPlannedRoute(rideId: string, route: Coordinates[]): void {
  plannedRoutes.set(rideId, route);
}

export function getDriverLocation(driverId: string) {
  return driverLocations.get(driverId);
}

export function getOnlineDrivers(): string[] {
  return Array.from(driverLocations.keys());
}

export function emitToUser(io: Server, userId: string, event: string, data: unknown): void {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToRide(io: Server, rideId: string, event: string, data: unknown): void {
  io.to(`ride:${rideId}`).emit(event, data);
}
