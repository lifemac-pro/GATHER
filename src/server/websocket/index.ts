import { type Server as HTTPServer } from "http";

/**
 * Mock SocketIO server type
 */
interface MockSocketIO {
  use: (middleware: Function) => void;
  on: (event: string, callback: Function) => void;
  to: (room: string) => { emit: (event: string, data: any) => void };
}

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer) {
  // Create a mock io object until socket.io is installed
  const io: MockSocketIO = {
    use: (middleware) => {
      // Mock implementation
      console.log("Socket middleware registered");
    },
    on: (event, callback) => {
      // Mock implementation
      console.log(`Socket event handler registered: ${event}`);
    },
    to: (room) => ({
      emit: (event, data) => {
        // Mock implementation
        console.log(`Emitting ${event} to ${room}`);
      },
    }),
  };

  // Authentication middleware - mocked
  io.use((socket: any, next: any) => {
    // Mock session
    const session = { user: { id: "user-id" } };
    next();
  });

  // Mock connection handler
  io.on("connection", (socket: any) => {
    console.log(`User connected: mock-user`);

    // All socket event handlers are mocked
    socket.on = (event: string, handler: Function) => {
      console.log(`Registered handler for ${event}`);
      return socket;
    };

    socket.join = (room: string) => {
      console.log(`Joined room: ${room}`);
      return socket;
    };

    socket.leave = (room: string) => {
      console.log(`Left room: ${room}`);
      return socket;
    };

    // Register mock handlers
    socket.on("joinEvent", () => {});
    socket.on("leaveEvent", () => {});
    socket.on("chatMessage", () => {});
    socket.on("eventUpdate", () => {});
    socket.on("disconnect", () => {});
  });

  return io;
}
