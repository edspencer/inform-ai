"use client";
import { useInformAIContext } from "../InformAIContext";
import clsx from "clsx";
import type { Message, StateMessage } from "../types";
import { useState } from "react";

import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";

export function CurrentState({ className }: { className?: string }) {
  const {
    messages,
    conversation: { lastSentAt },
  } = useInformAIContext();

  const sentMessages = messages.filter((message) => message.createdAt < lastSentAt);
  const unsentMessages = messages.filter((message) => message.createdAt >= lastSentAt);

  return (
    <div
      className={clsx("border border-gray-300 flex flex-col gap-2 rounded-lg bg-background min-w-96 p-2", className)}
    >
      <h1 className="text-lg font-semibold">Current InformAI State</h1>

      <div className="overflow-auto">
        {sentMessages.map((message, index) => (
          <Row key={index} message={message} />
        ))}
        <LastSentDivider />
        {unsentMessages.map((message, index) => (
          <Row key={index} message={message} />
        ))}
      </div>
    </div>
  );
}

export function LastSentDivider() {
  const {
    conversation: { lastSentAt },
  } = useInformAIContext();

  return (
    <div className="flex justify-center items-center">
      <div className="h-0.5 w-1/2 bg-gray-300"></div>
      <p className="mx-2 text-sm text-gray-500">
        Last Sent: {lastSentAt.getHours()}:{lastSentAt.getMinutes().toString().padStart(2, "0")}
      </p>
      <div className="h-0.5 w-1/2 bg-gray-300"></div>
    </div>
  );
}

const pills = {
  state: "text-green-700 bg-green-50 ring-green-600/20",
  event: "text-orange-600 bg-orange-50 ring-orange-500/10",
};

export function MessageTypePill({ message }: { message: Message }) {
  return (
    <p
      className={clsx(
        pills[message.type],
        "mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset"
      )}
    >
      {message.type}
    </p>
  );
}

export function ComponentName({ message }: { message: Message }) {
  const name = message.type === "state" ? message.content.name : message.content.type;

  return <p className="flex-1 font-bold pl-1">{name}</p>;
}

export function Row({ message }: { message: Message }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="flex flex-col pb-1">
      <div className="flex items-center">
        <button onClick={toggleExpanded}>{expanded ? <span>-</span> : <span>+</span>}</button>
        <ComponentName message={message} />
        <MessageTypePill message={message} />
      </div>
      <div className="">
        <p>{message.createdAt.toLocaleTimeString()}</p>
      </div>
      {expanded && (
        <div className="ml-4">
          <pre className="overflow-x-auto">
            <JsonView src={message.content} />
          </pre>
        </div>
      )}
    </div>
  );
}
