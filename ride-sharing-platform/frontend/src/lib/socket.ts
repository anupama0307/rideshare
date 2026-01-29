import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export interface DriverLocation {
  rideId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface ETAUpdate {
  rideId: string;
  estimatedArrival: string;
  distanceRemaining: number;
  trafficDelay?: number;
}

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface RouteDeviation {
  rideId: string;
  currentLocation: { latitude: number; longitude: number };
  expectedLocation: { latitude: number; longitude: number };
  deviationMeters: number;
  message: string;
}

export interface SOSAlert {
  alertId: string;
  rideId: string;
  userId: string;
  location: { latitude: number; longitude: number };
  timestamp: string;
}

class SocketClient {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }


    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Room management
  joinRide(rideId: string): void {
    this.socket?.emit('join_ride', { rideId });
  }

  leaveRide(rideId: string): void {
    this.socket?.emit('leave_ride', { rideId });
  }

  // Driver location updates
  updateLocation(rideId: string, location: { latitude: number; longitude: number; heading?: number; speed?: number }): void {
    this.socket?.emit('driver_location_update', {
      rideId,
      ...location,
      timestamp: Date.now(),
    });
  }

  onLocationUpdate(callback: (data: DriverLocation) => void): void {
    this.socket?.on('driver_location', callback);
  }

  offLocationUpdate(callback: (data: DriverLocation) => void): void {
    this.socket?.off('driver_location', callback);
  }

  // ETA updates
  onETAUpdate(callback: (data: ETAUpdate) => void): void {
    this.socket?.on('eta_update', callback);
  }

  offETAUpdate(callback: (data: ETAUpdate) => void): void {
    this.socket?.off('eta_update', callback);
  }

  // Route deviation alerts
  onRouteDeviation(callback: (data: RouteDeviation) => void): void {
    this.socket?.on('route_deviation', callback);
  }

  offRouteDeviation(callback: (data: RouteDeviation) => void): void {
    this.socket?.off('route_deviation', callback);
  }

  // Chat
  sendMessage(rideId: string, message: string): void {
    this.socket?.emit('chat_message', { rideId, message });
  }

  onChatMessage(callback: (data: ChatMessage) => void): void {
    this.socket?.on('chat_message', callback);
  }

  offChatMessage(callback: (data: ChatMessage) => void): void {
    this.socket?.off('chat_message', callback);
  }

  // SOS alerts
  triggerSOS(rideId: string, location: { latitude: number; longitude: number }): void {
    this.socket?.emit('sos_alert', { rideId, location });
  }

  onSOSAlert(callback: (data: SOSAlert) => void): void {
    this.socket?.on('sos_alert', callback);
  }

  offSOSAlert(callback: (data: SOSAlert) => void): void {
    this.socket?.off('sos_alert', callback);
  }

  // Ride status updates
  onRideStatusChange(callback: (data: { rideId: string; status: string; message?: string }) => void): void {
    this.socket?.on('ride_status_changed', callback);
  }

  offRideStatusChange(callback: (data: { rideId: string; status: string; message?: string }) => void): void {
    this.socket?.off('ride_status_changed', callback);
  }

  // New booking notifications (for drivers)
  onNewBooking(callback: (data: { rideId: string; booking: any }) => void): void {
    this.socket?.on('new_booking', callback);
  }

  offNewBooking(callback: (data: { rideId: string; booking: any }) => void): void {
    this.socket?.off('new_booking', callback);
  }

  // Demand zone updates
  onDemandUpdate(callback: (data: { zones: any[] }) => void): void {
    this.socket?.on('demand_update', callback);
  }

  offDemandUpdate(callback: (data: { zones: any[] }) => void): void {
    this.socket?.off('demand_update', callback);
  }
}

export const socketClient = new SocketClient();
export default socketClient;
