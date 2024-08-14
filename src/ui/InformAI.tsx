/**
 * Component for relaying information about a component to a LLM via InformAI.
 * Sample Usage:
 *
 * import { InformAI } from "inform-ai";
 *
 * //inside your component's template
 * <InformAI name="Logs" prompt="This component displays backup logs in a monospace font" props={{data, logs}} />
 *
 * This is equivalent to calling the useInformAI hook in the component's code. The InformAI component can be used
 * in either client side React components or React Server Components.
 *
 * @component
 * @param {string} name - The name of the component.
 * @param {string} prompt - The prompt for the InformAI service.
 * @param {any} props - Additional props for the component.
 * @returns {null}
 */
"use client";

import { useInformAI } from "../useInformAI";

export function InformAI({ name, prompt, props }: { name: string; prompt: string; props: any }) {
  useInformAI({
    name,
    prompt,
    props,
  });

  return null;
}
