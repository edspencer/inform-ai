import { generateId } from "ai";
import { EventMessage, Message, StateMessage } from "./types";

/**
 * Maps an array of component messages to an array of formatted messages.
 * @param componentMessages - The array of component messages to be mapped.
 * @returns An array of formatted messages.
 */
export function mapComponentMessages(componentMessages: Message[]) {
  return componentMessages.map((message) => {
    return {
      id: generateId(),
      content: message.type === "event" ? mapEventToContent(message) : mapStateToContent(message),
      role: "system",
    };
  });
}

/**
 * Maps an event message to its formatted content.
 * @param event - The event message to be mapped.
 * @returns The formatted content of the event message.
 */
export function mapEventToContent(event: EventMessage) {
  return `Component ${event.content.componentId} sent event ${event.content.type}.
  Description was: ${event.content.description}`;
}

/**
 * Maps a state message to its formatted content.
 * @param state - The state message to be mapped.
 * @returns The formatted content of the state message.
 */
export function mapStateToContent(state: StateMessage) {
  const content = [];

  const { name, componentId, prompt, props } = state.content;

  content.push(`Component ${componentId} has updated its state`);

  if (name) {
    content.push(`Component Name: ${name}`);
  }

  if (prompt) {
    content.push(`Component self-description: ${prompt}`);
  }

  if (props) {
    content.push(`Component props: ${JSON.stringify(props)}`);
  }

  return content.join("\n");
}
