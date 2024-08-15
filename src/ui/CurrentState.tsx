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
    <div className={clsx("current-state", className)}>
      <h1>Current InformAI State</h1>

      <div className="rows">
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
    <div className="last-sent-divider">
      <div className="border"></div>
      <p>
        Last Sent: {lastSentAt.getHours()}:{lastSentAt.getMinutes().toString().padStart(2, "0")}
      </p>
      <div className="border"></div>
    </div>
  );
}

export function MessageTypePill({ message }: { message: Message }) {
  return <span className={clsx(message.type, "pill")}>{message.type}</span>;
}

export function ComponentName({ message }: { message: Message }) {
  const name = message.type === "state" ? message.content.name : message.content.type;

  return <p>{name}</p>;
}

export function Row({ message }: { message: Message }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="row">
      <div className="heading">
        <button onClick={toggleExpanded}>{expanded ? <span>-</span> : <span>+</span>}</button>
        <ComponentName message={message} />
        <MessageTypePill message={message} />
      </div>
      <div>
        <p>{message.createdAt.toLocaleTimeString()}</p>
      </div>
      {expanded && (
        <pre>
          <JsonView src={message.content} />
        </pre>
      )}
    </div>
  );
}
