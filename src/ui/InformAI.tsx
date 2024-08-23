"use client";

import { useInformAI } from "../useInformAI";

/**
 * A component for relaying information about a component to a LLM via InformAI.
 * Sample usage:
 *
 * import { InformAI } from "inform-ai";
 *
 * //inside your component's template
 * <InformAI name="Logs" prompt="This component displays backup logs in a monospace font" props={{data, logs}} />
 *
 * This is equivalent to calling the useInformAI hook in the component's code. The InformAI component can be used
 * in either client side React components or React Server Components.
 *
 * @param {string} name - The name of the component. Passed to the LLM so make it meaningful
 * @param {string} prompt - The prompt to pass to the LLM describing the component
 * @param {any} props - Props that will be sent to the LLM as part of the prompt. Must be JSON serializable
 * @param {string} [componentId] - A unique identifier for the component (one will be generated if not provided)
 * @returns {null}
 */
export function InformAI({
  name,
  prompt,
  props,
  componentId,
}: {
  name: string;
  prompt: string;
  props: any;
  componentId?: string;
}) {
  useInformAI({
    name,
    prompt,
    props,
    componentId,
  });

  return null;
}
