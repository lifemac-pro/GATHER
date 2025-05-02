import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponse } from "next";
import { getUserRole } from "@/lib/user-role";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const initializeSocketServer = (
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) => {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...");
    
    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
    });
    
    // Authentication middleware
    io.use(async (socket, next) => {
      const userId = socket.handshake.auth.userId;
      
      if (!userId) {
        return next(new Error("Unauthorized"));
      }
      
      try {
        // Get user role
        const role = await getUserRole(userId);
        
        // Attach user info to socket
        socket.data.userId = userId;
        socket.data.role = role;
        
        // Join user-specific room
        socket.join(`user:${userId}`);
        
        // Join role-specific room
        if (role) {
          socket.join(`role:${role}`);
        }
        
        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication error"));
      }
    });
    
    // Connection handler
    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);
      
      // Disconnect handler
      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
      
      // Join event room
      socket.on("join:event", (eventId) => {
        socket.join(`event:${eventId}`);
      });
      
      // Leave event room
      socket.on("leave:event", (eventId) => {
        socket.leave(`event:${eventId}`);
      });
      
      // Join survey room
      socket.on("join:survey", (surveyId) => {
        socket.join(`survey:${surveyId}`);
      });
      
      // Leave survey room
      socket.on("leave:survey", (surveyId) => {
        socket.leave(`survey:${surveyId}`);
      });
    });
    
    res.socket.server.io = io;
  }
  
  return res.socket.server.io;
};

// Helper function to send notifications
export const sendNotification = (
  io: SocketIOServer,
  userId: string,
  notification: any
) => {
  io.to(`user:${userId}`).emit(`notification:${userId}`, notification);
};

// Helper function to send event updates
export const sendEventUpdate = (
  io: SocketIOServer,
  eventId: string,
  data: any
) => {
  io.to(`event:${eventId}`).emit(`event:${eventId}`, data);
};

// Helper function to send survey updates
export const sendSurveyUpdate = (
  io: SocketIOServer,
  surveyId: string,
  data: any
) => {
  io.to(`survey:${surveyId}`).emit(`survey:${surveyId}`, data);
};

// Helper function to send role-specific broadcasts
export const sendRoleBroadcast = (
  io: SocketIOServer,
  role: string,
  event: string,
  data: any
) => {
  io.to(`role:${role}`).emit(event, data);
};
