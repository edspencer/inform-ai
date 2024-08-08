// 'use client'

import { ReactNode } from "react";
import { InternalInformAIProvider } from "../InformAIContext";

interface CustomInformAIProviderProps {
  children: ReactNode;
}

const customSendMessage = (message: string) => {
  // Custom logic to send a message to an LLM
  console.log(`Custom send message: ${message}`);
};

export const AIProvider = ({ children }: CustomInformAIProviderProps) => {
  return <InternalInformAIProvider onEvent={customSendMessage}>{children}</InternalInformAIProvider>;
};
