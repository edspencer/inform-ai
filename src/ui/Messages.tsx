"use client";

import clsx from "clsx";
import { useStreamableContent } from "../useStreamableContent";

export type Role = "assistant" | "user" | "system";

/**
 * A component for rendering a list of messages, filtered by role.
 *
 * @param {any[]} messages - The list of messages to render.
 * @param {Role[]} [showRoles=["user", "assistant"]] - The roles of messages to show.
 * @param {string} [className=""] - Additional CSS class names for the component.
 * @return {JSX.Element|null} The rendered message list, or null if no messages are provided.
 */
export function Messages({
  messages,
  showRoles = ["user", "assistant"],
  className = "",
}: {
  messages: any[];
  showRoles?: Role[];
  className?: string;
}) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className={clsx("iai-messages", className)}>
      {messages
        .filter((message) => showRoles.includes(message.role))
        .map((message, index) => (
          <div key={index}>{message.content}</div>
        ))}
    </div>
  );
}

/**
 * A component for rendering a user message.
 *
 * @param {string} message - The content of the user message.
 * @return {JSX.Element} The rendered user message component.
 */
export function UserMessage({ message }: { message: string }) {
  return (
    <div className="message user-message ">
      <div className="inner">{message}</div>
    </div>
  );
}

/**
 * A component for rendering an assistant message. Supports streaming.
 *
 * @param {any} content - The content of the assistant message.
 * @return {JSX.Element} The rendered assistant message component.
 */
export function AssistantMessage({ content }: { content: any }) {
  const text = useStreamableContent(content);

  return (
    <div className="message assistant-message">
      <div className="inner">{text}</div>
    </div>
  );
}
