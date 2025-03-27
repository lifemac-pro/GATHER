// 'use client';
// import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// // Define the context type
// interface EventContextType {
//   registeredEvents: any[];
//   registerEvent: (event: any) => void;
// }

// // Provide default values
// const EventContext = createContext<EventContextType | undefined>(undefined);

// // Custom Hook to use the context
// export const useEventContext = () => {
//   const context = useContext(EventContext);
//   if (!context) {
//     throw new Error("useEventContext must be used within an EventProvider");
//   }
//   return context;
// };

// // Define the provider props type
// interface EventProviderProps {
//   children: ReactNode;
// }

// // Provider Component
// export const EventProvider = ({ children }: EventProviderProps) => {
//   const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);

//   // Load registered events from localStorage
//   useEffect(() => {
//     const storedEvents = localStorage.getItem("registeredEvents");
//     if (storedEvents) {
//       setRegisteredEvents(JSON.parse(storedEvents));
//     }
//   }, []);

//   // Register an event
//   const registerEvent = (event: any) => {
//     const updatedEvents = [...registeredEvents, event];
//     setRegisteredEvents(updatedEvents);
//     localStorage.setItem("registeredEvents", JSON.stringify(updatedEvents));
//   };

//   return (
//     <EventContext.Provider value={{ registeredEvents, registerEvent }}>
//       {children}
//     </EventContext.Provider>
//   );
// };
