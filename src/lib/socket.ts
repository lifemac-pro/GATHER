import { io, Socket } from "socket.io-client";
import { env } from "@/env";

let socket: Socket | null = null;

export const initializeSocket = (userId: string) => {
  if (socket) return socket;
  
  // Create socket connection
  socket = io(env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
    path: "/api/socket",
    auth: {
      userId,
    },
  });
  
  // Connection events
  socket.on("connect", () => {
    console.log("Socket connected");
  });
  
  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });
  
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
  
  return socket;
};

export const getSocket = () => {
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Event listeners
export const subscribeToNotifications = (
  userId: string,
  callback: (notification: any) => void
) => {
  const socket = getSocket();
  if (!socket) return;
  
  socket.on(`notification:${userId}`, callback);
  
  return () => {
    socket.off(`notification:${userId}`, callback);
  };
};

export const subscribeToEventUpdates = (
  eventId: string,
  callback: (data: any) => void
) => {
  const socket = getSocket();
  if (!socket) return;
  
  socket.on(`event:${eventId}`, callback);
  
  return () => {
    socket.off(`event:${eventId}`, callback);
  };
};

export const subscribeToSurveyUpdates = (
  surveyId: string,
  callback: (data: any) => void
) => {
  const socket = getSocket();
  if (!socket) return;
  
  socket.on(`survey:${surveyId}`, callback);
  
  return () => {
    socket.off(`survey:${surveyId}`, callback);
  };
};
