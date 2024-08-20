import { StreamableValue, readStreamableValue } from "ai/rsc";
import { useEffect, useState } from "react";

/**
 * A hook to handle streamable content, allowing it to be used in a React component. Accepts either a string or a StreamableValue.
 *
 * @param {string | StreamableValue<string>} content - The content to be streamed, either as a string or a StreamableValue.
 * @return {string} The raw content, updated as the streamable content is received.
 */
export const useStreamableContent = (content: string | StreamableValue<string>) => {
  const [rawContent, setRawContent] = useState(typeof content === "string" ? content : "");

  useEffect(() => {
    (async () => {
      if (typeof content === "object") {
        let value = "";
        for await (const delta of readStreamableValue(content)) {
          if (typeof delta === "string") {
            setRawContent(delta);
          }
        }
      }
    })();
  }, [content]);

  return rawContent;
};
