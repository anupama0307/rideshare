'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { Socket } from 'socket.io-client';
import socketClient, {
  DriverLocation,
  ETAUpdate,
  ChatMessage,
  RouteDeviation,
  SOSAlert,
} from '@/lib/socket';
import { useAuth } from './useAuth';
import api from '@/lib/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRide: (rideId: string) => void;
  leaveRide: (rideId: string) => void;
  sendMessage: (rideId: string, message: string) => void;
  updateLocation: (rideId: string, location: { latitude: number; longitude: number; heading?: number; speed?: number }) => void;
  triggerSOS: (rideId: string, location: { latitude: number; longitude: number }) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = api.getToken();
    
    if (isAuthenticated && token) {
      const newSocket = socketClient.connect(token);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      return () => {
        socketClient.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      socketClient.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  const joinRide = useCallback((rideId: string) => {
    socketClient.joinRide(rideId);
  }, []);

  const leaveRide = useCallback((rideId: string) => {
    socketClient.leaveRide(rideId);
  }, []);

  const sendMessage = useCallback((rideId: string, message: string) => {
    socketClient.sendMessage(rideId, message);
  }, []);

  const updateLocation = useCallback(
    (rideId: string, location: { latitude: number; longitude: number; heading?: number; speed?: number }) => {
      socketClient.updateLocation(rideId, location);
    },
    []
  );

  const triggerSOS = useCallback((rideId: string, location: { latitude: number; longitude: number }) => {
    socketClient.triggerSOS(rideId, location);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinRide,
        leaveRide,
        sendMessage,
        updateLocation,
        triggerSOS,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Hook for subscribing to real-time location updates
export function useDriverLocation(rideId: string | null) {
  const [location, setLocation] = useState<DriverLocation | null>(null);

  useEffect(() => {
    if (!rideId) return;

    const handleLocation = (data: DriverLocation) => {
      if (data.rideId === rideId) {
        setLocation(data);
      }
    };

    socketClient.onLocationUpdate(handleLocation);

    return () => {
      socketClient.offLocationUpdate(handleLocation);
    };
  }, [rideId]);

  return location;
}

// Hook for ETA updates
export function useETAUpdates(rideId: string | null) {
  const [eta, setEta] = useState<ETAUpdate | null>(null);

  useEffect(() => {
    if (!rideId) return;

    const handleETA = (data: ETAUpdate) => {
      if (data.rideId === rideId) {
        setEta(data);
      }
    };

    socketClient.onETAUpdate(handleETA);

    return () => {
      socketClient.offETAUpdate(handleETA);
    };
  }, [rideId]);

  return eta;
}

// Hook for chat messages
export function useChatMessages(rideId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!rideId) return;

    const handleMessage = (data: ChatMessage) => {
      if (data.rideId === rideId) {
        setMessages((prev) => [...prev, data]);
      }
    };

    socketClient.onChatMessage(handleMessage);

    return () => {
      socketClient.offChatMessage(handleMessage);
      setMessages([]);
    };
  }, [rideId]);

  return messages;
}

// Hook for route deviation alerts
export function useRouteDeviation(rideId: string | null) {
  const [deviation, setDeviation] = useState<RouteDeviation | null>(null);

  useEffect(() => {
    if (!rideId) return;

    const handleDeviation = (data: RouteDeviation) => {
      if (data.rideId === rideId) {
        setDeviation(data);
      }
    };

    socketClient.onRouteDeviation(handleDeviation);

    return () => {
      socketClient.offRouteDeviation(handleDeviation);
    };
  }, [rideId]);

  return deviation;
}

// Hook for SOS alerts
export function useSOSAlerts() {
  const [alert, setAlert] = useState<SOSAlert | null>(null);

  useEffect(() => {
    const handleSOS = (data: SOSAlert) => {
      setAlert(data);
    };

    socketClient.onSOSAlert(handleSOS);

    return () => {
      socketClient.offSOSAlert(handleSOS);
    };
  }, []);

  return alert;
}
