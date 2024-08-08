export type Conversation = {
  id: string;
  createdAt: Date;
  lastSentAt: Date;
};

export type ComponentState = {
  componentId?: string;
  name?: string;
  prompt?: string;
  props?: {
    [key: string]: any;
  };
};

export type ComponentEvent = {
  componentId: string;
  type: string;
  data?: any;
  description?: string;
};

export type OptionalComponentEvent = Omit<ComponentEvent, "componentId"> & { componentId?: string };

export type BaseMessage = {
  id: string;
  createdAt: Date;
};

export type StateMessage = BaseMessage & {
  type: "state";
  content: ComponentState;
};

export type EventMessage = BaseMessage & {
  type: "event";
  content: ComponentEvent;
};

export type Message = StateMessage | EventMessage;
