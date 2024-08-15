"use client";

// import type { AI } from "@/actions/AI";

import { useActions, useUIState } from "ai/rsc";
import { useInformAIContext, dedupeMessages } from "../InformAIContext";
import { ChatBox } from "./ChatBox";
import { generateId } from "ai";
import { Messages, UserMessage } from "./Messages";
import clsx from "clsx";
import { mapComponentMessages } from "../utils";

export function ChatWrapper({ className, AI }: { className?: string; AI: any }) {
  const { submitUserMessage } = useActions();
  const { popRecentMessages } = useInformAIContext();
  const [messages, setMessages] = useUIState<typeof AI>();

  async function onMessage(message: string) {
    const componentMessages = popRecentMessages();

    //deduped set of component-generated messages like state updates and events, since the last user message
    const newSystemMessages = mapComponentMessages(dedupeMessages(componentMessages));

    //this is the new user message that will be sent to the AI
    const newUserMessage = { id: generateId(), content: message, role: "user" };

    //the new user message UI that will be added to the chat history
    const newUserMessageUI = { ...newUserMessage, content: <UserMessage message={message} /> };
    setMessages([...messages, ...newSystemMessages, newUserMessageUI]);

    //send the new user message to the AI, along with the all the recent messages from components
    const responseMessage = await submitUserMessage([...newSystemMessages, newUserMessage]);

    //update the UI with whatever the AI responded with
    setMessages((currentMessages: any[]) => [...currentMessages, { ...responseMessage, role: "assistant" }]);

    //return true to clear the chat box
    return true;
  }

  return (
    <div className={clsx("flex flex-col border border-blue-600 p-1", className)}>
      <Messages messages={messages} />
      <ChatBox onSubmit={onMessage} />
    </div>
  );
}
