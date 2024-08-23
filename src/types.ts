/**
 * Represents a conversation between a user and an AI.
 */
export type Conversation = {
  /**
   * Unique identifier for the conversation.
   */
  id: string;
  /**
   * Timestamp when the conversation was started.
   */
  createdAt: Date;
  /**
   * Timestamp when the last message was sent in the conversation.
   */
  lastSentAt: Date;
};

/**
 * Represents the state of a component.
 */
export type ComponentState = {
  /**
   * Unique identifier for the component.
   */
  componentId?: string;
  /**
   * Display name for the component.
   */
  name?: string;
  /**
   * A short description of the component.
   */
  prompt?: string;
  /**
   * Additional properties of the component.
   */
  props?: {
    [key: string]: any;
  };
  /**
   * If true, this component does not have any state.
   */
  noState?: boolean;
};

/**
 * Represents an event that was sent by a component.
 */
export type ComponentEvent = {
  /**
   * Unique identifier for the component that sent the event.
   */
  componentId: string;
  /**
   * Type of the event.
   */
  type: string;
  /**
   * Additional data associated with the event.
   */
  data?: any;
  /**
   * A short description of the event.
   */
  description?: string;
};

/**
 * Represents an event that was sent by a component, but with an optional componentId.
 */
export type OptionalComponentEvent = Omit<ComponentEvent, "componentId"> & { componentId?: string };

/**
 * Base type for all messages sent between the user and the AI.
 */
export type BaseMessage = {
  /**
   * Unique identifier for the message.
   */
  id: string;
  /**
   * Timestamp when the message was sent.
   */
  createdAt: Date;
};

/**
 * Represents a message that contains the state of a component.
 */
export type StateMessage = BaseMessage & {
  /**
   * Type of the message.
   */
  type: "state";
  /**
   * The state of the component.
   */
  content: ComponentState;
};

/**
 * Represents a message that contains an event sent by a component.
 */
export type EventMessage = BaseMessage & {
  /**
   * Type of the message.
   */
  type: "event";
  /**
   * The event sent by the component.
   */
  content: ComponentEvent;
};

/**
 * Represents a message that can be sent between the user and the AI.
 */
export type Message = StateMessage | EventMessage;

/**
 * Represents a formatted message that can be displayed to the user or sent to the AI.
 * System messages like state and event messages are formatted into a string so that the LLM
 * can understand the component contents.
 */
export type FormattedMessage = {
  /**
   * Unique identifier for the message.
   */
  id: string;
  /**
   * The content of the message.
   */
  content: string;
  /**
   * The role of the message sender (e.g. user, assistant).
   */
  role: string;
};
