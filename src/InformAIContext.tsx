"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

import { StateMessage, EventMessage, Message, ComponentState, ComponentEvent, Conversation } from "./types";

/**
 * Defines the shape of the InformAIContext.
 */
interface InformAIContextType {
  messages: Message[];
  conversation: Conversation;
  addMessage: (message: Message) => void;
  addState: (state: ComponentState) => void;
  addEvent: (event: ComponentEvent) => void;
  addStateMessage: (state: StateMessage) => void;
  addEventMessage: (event: EventMessage) => void;
  getEvents?: () => Message[];
  getState: (componentId: string) => ComponentState | undefined;
  updateState: (componentId: string, updates: object) => void;
  onEvent?: (event: any) => void;
  getMessagesSince: (since: Date) => Message[];
  popRecentMessages: (since?: Date) => Message[];
  clearRecentMessages: (since?: Date) => void;
  getRecentMessages: () => Message[];
}

/**
 * The InformAIContext that provides access to messages and conversation state.
 */
const InformAIContext = createContext<InformAIContextType | undefined>(undefined);

/**
 * Props for the InternalInformAIProvider component.
 */
interface InformAIProviderProps {
  children: ReactNode;
  onEvent?: (event: any) => void;
}

/**
 * The internal implementation of the InformAIProvider component.
 */
export const InternalInformAIProvider = ({ children, onEvent }: InformAIProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation>({
    id: uuidv4(),
    createdAt: new Date(),
    lastSentAt: new Date(),
  });

  /**
   * Retrieves the state of a component with the specified componentId.
   * @param componentId The ID of the component.
   * @returns The state of the component, if found; otherwise, undefined.
   */
  function getState(componentId: string) {
    return messages
      .filter((message) => message.type === "state")
      .map((message) => message as StateMessage)
      .find((message) => message.content.componentId === componentId)?.content;
  }

  /**
   * Adds a message to the list of messages.
   * @param message The message to add.
   */
  function addMessage(message: Message) {
    setMessages((prevMessages) => [...prevMessages, message]);
  }

  /**
   * Adds a state message to the list of messages.
   * @param state The state message to add.
   */
  function addState(state: ComponentState) {
    addMessage({
      id: uuidv4(),
      createdAt: new Date(),
      type: "state",
      content: state,
    });
  }

  /**
   * Updates the state of a component with the specified componentId.
   * @param componentId The ID of the component.
   * @param updates The updates to apply to the state.
   */
  function updateState(componentId: string, updates: object) {
    const mostRecentState = getState(componentId);

    if (mostRecentState) {
      return addState({ ...mostRecentState, ...updates });
    } else {
      return addState(updates as ComponentState);
    }
  }

  /**
   * Clears the recent messages up to the specified date.
   * @param since The date to clear messages from. If not specified, clears all recent messages.
   */
  function clearRecentMessages(since?: Date) {
    const cutoff = since || conversation.lastSentAt;
    setMessages((prevMessages) => prevMessages.filter((message) => message.createdAt <= cutoff));
  }

  /**
   * Retrieves and removes the recent messages up to the specified date.
   * @param since The date to retrieve messages from. If not specified, retrieves all recent messages.
   * @returns The recent messages.
   */
  function popRecentMessages(since?: Date) {
    const cutoff = since || conversation.lastSentAt;
    const recentMessages = messages.filter((message) => message.createdAt > cutoff);

    setConversation((prevConversation) => ({
      ...prevConversation,
      lastSentAt: new Date(),
    }));

    return recentMessages;
  }

  /**
   * Adds an event message to the list of messages.
   * @param event The event message to add.
   */
  function addEvent(event: ComponentEvent) {
    addMessage({
      id: uuidv4(),
      createdAt: new Date(),
      type: "event",
      content: event,
    });
  }

  /**
   * Adds a state message to the list of messages.
   * @param state The state message to add.
   */
  function addStateMessage(state: StateMessage) {
    addMessage(state);
  }

  /**
   * Adds an event message to the list of messages and triggers the onEvent callback.
   * @param event The event message to add.
   */
  function addEventMessage(event: EventMessage) {
    addMessage(event);

    if (onEvent) {
      onEvent(event);
    }
  }

  /**
   * Retrieves the messages since the specified date.
   * @param since The date to retrieve messages from.
   * @returns The messages since the specified date.
   */
  function getMessagesSince(since: Date) {
    return messages.filter((message) => message.createdAt > since);
  }

  /**
   * Retrieves the recent messages.
   * @returns The recent messages.
   */
  function getRecentMessages() {
    return getMessagesSince(conversation.lastSentAt);
  }

  return (
    <InformAIContext.Provider
      value={{
        messages,
        conversation,
        onEvent,
        getState,
        updateState,
        addEvent,
        addState,
        addMessage,
        addStateMessage,
        addEventMessage,
        getMessagesSince,
        popRecentMessages,
        clearRecentMessages,
        getRecentMessages,
      }}
    >
      {children}
    </InformAIContext.Provider>
  );
};

/**
 * Removes duplicate state messages from the list of messages, keeping only the most recent.
 * Keeps all the event messages intact.
 * @param messages The list of messages.
 * @returns The deduplicated list of messages.
 */
export function dedupeMessages(messages: Message[]) {
  const seen = new Set<string>();
  return messages
    .reverse()
    .filter((message) => {
      if (message.type === "state") {
        const { componentId } = message.content;

        if (componentId) {
          if (seen.has(componentId)) {
            return false;
          }
          seen.add(componentId);
        }
      }

      return true;
    })
    .reverse();
}

/**
 * Custom hook for accessing the InformAIContext.
 * @returns The InformAIContext.
 * @throws An error if used outside of an InformAIProvider.
 */
export const useInformAIContext = () => {
  const context = useContext(InformAIContext);
  if (!context) {
    throw new Error("useInformAIContext must be used within an InformAIProvider");
  }
  return context;
};
