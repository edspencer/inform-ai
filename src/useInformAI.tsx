"use client";

import { useEffect, useMemo, useRef } from "react";
import { randomId } from "./utils";

import { useInformAIContext } from "./InformAIContext";
import { StateMessage, EventMessage, Message, ComponentState, ComponentEvent, OptionalComponentEvent } from "./types";

/**
 * Represents the hook returned by the `useInformAI` function. This hook provides
 * methods to interact with the Inform AI context.
 */
export interface UseInformAIHook {
  /**
   * The ID of the component associated with this hook.
   */
  componentId: string;

  /**
   * Adds a message to the Inform AI context.
   *
   * @param message - The message to add.
   */
  addMessage: (message: Message) => void;

  /**
   * Adds an event to the Inform AI context.
   *
   * @param event - The event to add.
   */
  addEvent: (event: OptionalComponentEvent) => void;

  /**
   * Adds an event message to the Inform AI context.
   *
   * @param event - The event message to add.
   */
  addEventMessage: (event: EventMessage) => void;

  /**
   * Adds a state to the Inform AI context.
   *
   * @param state - The state to add.
   */
  addState: (state: ComponentState) => void;

  /**
   * Adds a state message to the Inform AI context.
   *
   * @param state - The state message to add.
   */
  addStateMessage: (state: StateMessage) => void;

  /**
   * Updates the state of the component associated with this hook.
   *
   * @param updates - The updates to apply to the state.
   */
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
  const componentIdRef = useRef<string>(componentData.componentId || randomId(6));
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
