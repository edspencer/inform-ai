"use client";

import clsx from "clsx";
import { useStreamableContent } from "../useStreamableContent";

export type Role = "assistant" | "user" | "system";

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

export function UserMessage({ message }: { message: string }) {
  return (
    <div className="message user-message ">
      <div className="inner">{message}</div>
    </div>
  );
}

export function AssistantMessage({ content }: { content: any }) {
  const text = useStreamableContent(content);

  return (
    <div className="message assistant-message">
      <div className="inner">{text}</div>
    </div>
  );
}
