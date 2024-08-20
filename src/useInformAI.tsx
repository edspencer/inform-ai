"use client";

import { useEffect, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import { useInformAIContext } from "./InformAIContext";
import { StateMessage, EventMessage, Message, ComponentState, ComponentEvent, OptionalComponentEvent } from "./types";

export interface UseInformAIHook {
  componentId: string;
  addMessage: (message: Message) => void;
  addEvent: (event: OptionalComponentEvent) => void;
  addEventMessage: (event: EventMessage) => void;
  addState: (state: ComponentState) => void;
  addStateMessage: (state: StateMessage) => void;
  updateState: (updates: ComponentState) => void;
}

/**
 * A hook to interact with the Inform AI context.
 *
 * Sample usage:
 *
 * import { useInformAI } from "use-inform-ai";
 *
 * //inside your component:
 * useInformAI({name: "Logs", prompt: "This component displays backup logs in a monospace font", props: {data, logs}});
 *
 * @param {ComponentState} componentData - The data for the component.
 * @return {UseInformAIHook} An object with methods to add messages, events, and states to the Inform AI context.
 */
export function useInformAI(componentData: ComponentState): UseInformAIHook {
  const context = useInformAIContext();
  const componentIdRef = useRef<string>(componentData.componentId || uuidv4());
  const componentId = componentIdRef.current;

  // Memoize componentData to ensure stability
  const stableComponentData = useMemo(() => componentData, [JSON.stringify(componentData)]);

  useEffect(() => {
    if (!componentData.noState) {
      context.addState({
        componentId: componentIdRef.current,
        prompt: stableComponentData.prompt,
        props: stableComponentData.props,
        name: stableComponentData.name,
      });
    }
  }, [componentId, stableComponentData]);

  return {
    componentId,
    addMessage: (message: Message) => {
      return context.addMessage(message);
    },
    addEvent: (event: OptionalComponentEvent) => {
      const updatedEvent: ComponentEvent = {
        ...event,
        componentId: event.componentId || componentIdRef.current,
      };
      return context.addEvent(updatedEvent);
    },
    addEventMessage: (event: EventMessage) => {
      context.addEventMessage(event);
    },
    addState: (state: ComponentState) => {
      state.componentId ||= componentIdRef.current;

      return context.addState(state);
    },
    addStateMessage: (state: StateMessage) => {
      return context.addStateMessage(state);
    },
    updateState: (updates: ComponentState) => {
      return context.updateState(componentIdRef.current, updates);
    },
  };
}
