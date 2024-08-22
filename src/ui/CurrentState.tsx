"use client";
import { useInformAIContext } from "../InformAIContext";
import clsx from "clsx";
import type { Message } from "../types";
import { useState } from "react";

import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";

/**
 * Displays the current state of the InformAI conversation, including sent and unsent messages.
 *
 * @param {object} props - The component props.
 * @param {string} props.className - An optional CSS class name to apply to the component.
 * @return {JSX.Element} The rendered component.
 */
export function CurrentState({ className }: { className?: string }) {
  const {
    messages,
    conversation: { lastSentAt },
  } = useInformAIContext();

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={clsx("current-state", className)}>
      <h1 onClick={() => setCollapsed(!collapsed)}>
        Current InformAI State{" "}
        <span className="toggle">
          <Chevron collapsed={collapsed} />
        </span>
      </h1>

      {collapsed ? null : <CurrentStateRows messages={messages} lastSentAt={lastSentAt} />}
    </div>
  );
}

function CurrentStateRows({ messages, lastSentAt }: { messages: Message[]; lastSentAt: Date }) {
  if (!messages || messages.length === 0) {
    return <p className="text-center my-4">No messages yet. Use useInformAI() or add an InformAI component</p>;
  }

  const sentMessages = messages.filter((message) => message.createdAt < lastSentAt);
  const unsentMessages = messages.filter((message) => message.createdAt >= lastSentAt);

  return (
    <div className="rows">
      {sentMessages.map((message, index) => (
        <Row key={index} message={message} />
      ))}
      <LastSentDivider />
      {unsentMessages.map((message, index) => (
        <Row key={index} message={message} />
      ))}
    </div>
  );
}

function Chevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      version="1.1"
      viewBox="0 0 8 5"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="8px"
      height="5px"
      className={`chevron ${collapsed ? "" : "chevron--flip"}`}
    >
      <g className="chevron__group">
        <path
          d="M1.30834787,0.121426937 L4.87569247,3.68780701 C5.04143584,3.8541036 5.04143584,4.11557261 4.87569247,4.2818692 L4.2807853,4.87693487 C4.20364253,4.95546204 4.09599241,5 3.98333171,5 C3.87067101,5 3.76302089,4.95546204 3.68587812,4.87693487 L0.122730401,1.30754434 C-0.0409101338,1.14044787 -0.0409101338,0.880578628 0.122730401,0.713482155 L0.718686793,0.119419971 C0.79596299,0.0427616956 0.902628913,-0.000376468522 1.01396541,2.47569236e-06 C1.1253019,0.000381419907 1.2316441,0.0442445771 1.30834787,0.121426937 L1.30834787,0.121426937 Z"
          className="chevron__box chevron__box--left"
        />
        <path
          d="M3.12493976,3.68899585 L6.68683713,0.123119938 C6.76404711,0.0445502117 6.8717041,3.56458529e-15 6.98436032,0 C7.09701655,-3.56458529e-15 7.20467353,0.0445502117 7.28188351,0.123119938 L7.87588228,0.717098143 C8.04137257,0.883371226 8.04137257,1.14480327 7.87588228,1.31107635 L4.31398491,4.87695226 C4.23695994,4.95546834 4.1294742,5 4.01698553,5 C3.90449685,5 3.79701111,4.95546834 3.71998614,4.87695226 L3.12493976,4.28197072 C2.95998402,4.11649361 2.95814736,3.85659624 3.12074929,3.68899585 L3.12493976,3.68899585 Z"
          className="chevron__box chevron__box--right"
        />
      </g>
    </svg>
  );
}

/**
 * Displays a divider indicating the last sent message in the InformAI conversation.
 *
 * @return {JSX.Element} The rendered divider component.
 */
export function LastSentDivider() {
  const {
    conversation: { lastSentAt },
  } = useInformAIContext();

  return (
    <div className="last-sent-divider">
      <div className="last-sent-border"></div>
      <p>
        Last Sent: {lastSentAt.getHours()}:{lastSentAt.getMinutes().toString().padStart(2, "0")}
      </p>
      <div className="last-sent-border"></div>
    </div>
  );
}

/**
 * Renders a pill-shaped element displaying the type of a given message.
 *
 * @param {Object} props - The component props.
 * @param {Message} props.message - The message object.
 * @return {JSX.Element} The rendered pill element.
 */
export function MessageTypePill({ message }: { message: Message }) {
  return <span className={clsx(message.type, "pill")}>{message.type}</span>;
}

/**
 * Displays the name of a component based on the provided message.
 *
 * @param {Message} message - The message containing the component name or type.
 * @return {JSX.Element} The rendered component name as a paragraph element.
 */
export function ComponentName({ message }: { message: Message }) {
  const name = message.type === "state" ? message.content.name : message.content.type;

  return <p>{name}</p>;
}

/**
 * Displays a single message in the InformAI conversation.
 *
 * @param {Message} message - The message to be displayed.
 * @return {JSX.Element} The rendered message component.
 */
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
