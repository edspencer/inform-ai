"use client";

import { useInformAIContext, dedupeMessages } from "../InformAIContext";
import { ChatBox } from "./ChatBox";
import { Messages, UserMessage } from "./Messages";
import clsx from "clsx";
import { mapComponentMessages, randomId } from "../utils";
import { FormattedMessage } from "../types";

export interface ChatWrapperProps {
  className?: string;
  submitUserMessage: (messages: any[]) => Promise<any>;
  messages?: any[];
  setMessages: (value: any[] | ((prevState: any[]) => any[])) => void;
}

/**
 * A basic chat wrapper that provides a chat box and message list.
 * Supports streaming LLM responses.
 * Sample usage, using the Vercel AI SDK:
 *
 * import { ChatWrapper } from "inform-ai";
 * import { useActions, useUIState } from "ai/rsc";
 * import { AIProvider } from "./AI";
 *
 * export function MyCustomChatWrapper() {
 *   const { submitUserMessage } = useActions();
 *   const [messages, setMessages] = useUIState<typeof AIProvider>();
 *
 *   return (
 *     <ChatWrapper
 *       submitUserMessage={submitUserMessage}
 *       messages={messages}
 *       setMessages={setMessages}
 *     />
 *   );
 * }
 *
 * This assumes you have set up a Vercel AI Provider like this in a file called ./AI.tsx:
 *
 * "use server";
 *
 * import { CoreMessage, generateId } from "ai";
 * import { createInformAI } from "inform-ai";
 * import { createAI } from "ai/rsc";
 * import { submitUserMessage } from "../actions/AI";
 *
 * export type ClientMessage = CoreMessage & {
 *   id: string;
 * };
 *
 * export type AIState = {
 *   chatId: string;
 *   messages: ClientMessage[];
 * };
 *
 * export type UIState = {
 *   id: string;
 *   role?: string;
 *   content: React.ReactNode;
 * }[];
 *
 * function submitUserMessage() {
 *   //your implementation to send message to the LLM via Vercel AI SDK
 * }
 *
 * export const AIProvider = createAI<AIState, UIState>({
 *   actions: {
 *     submitUserMessage,
 *   },
 *   initialUIState: [] as UIState,
 *   initialAIState: { chatId: generateId(), messages: [] } as AIState,
 * });
 *
 *
 * @param {ChatWrapperProps} props - The properties of the ChatWrapper component.
 * @param {string} props.className - An optional class name for the component.
 * @param {function} props.submitUserMessage - A function to submit the user's message to the AI.
 * @param {any[]} props.messages - The current messages in the chat history.
 * @param {function} props.setMessages - A function to update the messages in the chat history. Can be async.
 * @return {JSX.Element} The JSX element representing the chat wrapper.
 */
export function ChatWrapper({ className, submitUserMessage, messages = [], setMessages }: ChatWrapperProps) {
  const { popRecentMessages } = useInformAIContext();

  async function onMessage(message: string) {
    const componentMessages = popRecentMessages();

    //deduped set of component-generated messages like state updates and events, since the last user message
    const newSystemMessages = mapComponentMessages(dedupeMessages(componentMessages));

    //this is the new user message that will be sent to the AI
    const newUserMessage: FormattedMessage = { id: randomId(10), content: message, role: "user" };

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
    <div className={clsx("flex flex-col p-1", className)}>
      <Messages messages={messages} />
      <ChatBox onSubmit={onMessage} />
    </div>
  );
}
