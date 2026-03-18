"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ChatCollapseContextValue {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const ChatCollapseContext = createContext<ChatCollapseContextValue | null>(null);

export function ChatCollapseProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <ChatCollapseContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </ChatCollapseContext.Provider>
  );
}

export function useChatCollapse(): ChatCollapseContextValue {
  const ctx = useContext(ChatCollapseContext);
  if (!ctx) throw new Error("useChatCollapse must be used inside ChatCollapseProvider");
  return ctx;
}
