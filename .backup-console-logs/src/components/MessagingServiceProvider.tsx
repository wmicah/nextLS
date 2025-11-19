"use client";

import { createContext, useContext, ReactNode } from "react";

interface MessagingServiceContextType {
  // Add any messaging service context values here if needed
  // For now, this is a placeholder provider
}

const MessagingServiceContext = createContext<
  MessagingServiceContextType | undefined
>(undefined);

interface MessagingServiceProviderProps {
  children: ReactNode;
}

export default function MessagingServiceProvider({
  children,
}: MessagingServiceProviderProps) {
  // For now, this is a simple pass-through provider
  // You can add messaging service logic here in the future
  const contextValue: MessagingServiceContextType = {
    // Add any messaging service values here
  };

  return (
    <MessagingServiceContext.Provider value={contextValue}>
      {children}
    </MessagingServiceContext.Provider>
  );
}

// Optional: Export a hook to use the messaging service context
export function useMessagingService() {
  const context = useContext(MessagingServiceContext);
  if (context === undefined) {
    throw new Error(
      "useMessagingService must be used within a MessagingServiceProvider"
    );
  }
  return context;
}
