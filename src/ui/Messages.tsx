"use client";

import { useStreamableContent } from "../useStreamableContent";

export type Role = "assistant" | "user" | "system";

export function Messages({ messages, showRoles = ["user", "assistant"] }: { messages: any[]; showRoles?: Role[] }) {
  return (
    <div className="flex flex-col gap-2">
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
    <div className="flex justify-end ">
      <div className="max-w-96 border border-blue-200 px-4 py-2 rounded-lg bg-blue-200">{message}</div>
    </div>
  );
}

export function AssistantMessage({ content }: { content: any }) {
  const text = useStreamableContent(content);

  return (
    <div className="flex justify-start ">
      <div className="max-w-3xl border border-gray-200 px-4 py-2 rounded-lg bg-gray-50">{text}</div>
    </div>
  );
}
