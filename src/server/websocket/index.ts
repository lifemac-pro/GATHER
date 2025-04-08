import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { getSession } from "next-auth/react";
import { Event, Chat, Notification } from "@/server/db/models";

export function initializeWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    path: "/api/ws",
    cors: {
      origin: process.env.NEXTAUTH_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const session = await getSession({ req: socket.request });
    if (!session?.user) {
      next(new Error("Unauthorized"));
    } else {
      socket.data.user = session.user;
      next();
    }
  });

  // Handle connections
  io.on("connection", (socket) => {
    const userId = socket.data.user.id;

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // Handle joining event rooms
    socket.on("joinEvent", async (eventId: string) => {
      const event = await Event.findOne({ id: eventId });
      if (event) {
        socket.join(`event:${eventId}`);
      }
    });

    // Handle leaving event rooms
    socket.on("leaveEvent", (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    // Handle chat messages
    socket.on("chatMessage", async (data: { eventId: string; message: string }) => {
      const { eventId, message } = data;

      const chat = await Chat.create({
        eventId,
        userId,
        message,
        type: "text",
      });

      // Broadcast to event room
      io.to(`event:${eventId}`).emit("newChatMessage", chat);

      // Create notifications for event attendees
      const event = await Event.findOne({ id: eventId });
      if (event) {
        const notifications = await Notification.insertMany(
          event.attendees
            .filter((attendeeId: string) => attendeeId !== userId)
            .map((attendeeId: string) => ({
              userId: attendeeId,
              title: "New Chat Message",
              message: `New message in ${event.name}`,
              type: "chat",
              eventId: event.id,
              actionUrl: `/events/${event.id}/chat`,
            }))
        );

        // Send notifications to each user
        notifications.forEach((notification) => {
          io.to(`user:${notification.userId}`).emit("notification", notification);
        });
      }
    });

    // Handle real-time event updates
    socket.on("eventUpdate", async (data: { eventId: string; update: any }) => {
      const { eventId, update } = data;
      await Event.findOneAndUpdate({ id: eventId }, { $set: update });
      io.to(`event:${eventId}`).emit("eventUpdated", { eventId, update });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}
