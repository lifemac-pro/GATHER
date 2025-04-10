"use client";

import React, { createContext, useContext, useState } from "react";

interface EventContextType {
  lastUpdated: Date | null;
  setLastUpdated: (date: Date) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  return (
    <EventContext.Provider value={{ lastUpdated, setLastUpdated }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventContext() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEventContext must be used within an EventProvider");
  }
  return context;
}
