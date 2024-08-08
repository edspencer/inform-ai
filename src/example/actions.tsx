"use server";

import { createAI, getMutableAIState, streamUI, createStreamableValue } from "ai/rsc";
import { openai } from "@ai-sdk/openai";

import z from "zod";

import { createInformAI } from "../createInformAI";
import { CoreMessage, generateId } from "ai";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function submitUserMessage(content: string, role: string = "user") {
  "use server";

  const aiState = getMutableAIState<typeof AI>();

  console.log("submitUserMessage");

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: generateId(),
        role: "user",
        content,
      },
    ],
  });

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
  let textNode: undefined | React.ReactNode;

  const result = await streamUI({
    model: openai("gpt-3.5-turbo"),
    initial: "Spinner...", //<SpinnerMessage />,
    system: `\
    You are a stock trading conversation bot and you can help users buy stocks, step by step.
    You and the user can discuss stock prices and the user can adjust the amount of stocks they want to buy, or place an order, in the UI.
    
    Messages inside [] means that it's a UI element or a user event. For example:
    - "[Price of AAPL = 100]" means that an interface of the stock price of AAPL is shown to the user.
    - "[User has changed the amount of AAPL to 10]" means that the user has changed the amount of AAPL to 10 in the UI.
    
    If the user requests purchasing a stock, call \`show_stock_purchase_ui\` to show the purchase UI.
    If the user just wants the price, call \`show_stock_price\` to show the price.
    If you want to show trending stocks, call \`list_stocks\`.
    If you want to show events, call \`get_events\`.
    If the user wants to sell stock, or complete another impossible task, respond that you are a demo and cannot do that.
    
    Besides that, you can also chat with users and do some calculations if needed.`,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name,
      })),
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue("");
        // textNode = <div>{textStream.value}</div>;
      }

      if (done) {
        textStream.done();
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: generateId(),
              role: "assistant",
              content,
            },
          ],
        });
      } else {
        textStream.update(delta);
      }

      return textNode;
    },
    tools: {
      listStocks: {
        description: "List three imaginary stocks that are trending.",
        parameters: z.object({
          stocks: z.array(
            z.object({
              symbol: z.string().describe("The symbol of the stock"),
              price: z.number().describe("The price of the stock"),
              delta: z.number().describe("The change in price of the stock"),
            })
          ),
        }),
        generate: async function* ({ stocks }) {
          yield <div>Loading...</div>;

          await sleep(1000);

          const toolCallId = generateId();

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: generateId(),
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolName: "listStocks",
                    toolCallId,
                    args: { stocks },
                  },
                ],
              },
              {
                id: generateId(),
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "listStocks",
                    toolCallId,
                    result: stocks,
                  },
                ],
              },
            ],
          });

          return <div>Done</div>;
        },
      },
    },
  });

  return {
    id: generateId(),
    display: result.value,
  };
}

export type ClientMessage = CoreMessage & {
  id: string;
};

export type AIState = {
  chatId: string;
  messages: ClientMessage[];
};

export type UIState = {
  id: string;
  display: React.ReactNode;
}[];

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [] as UIState,
  initialAIState: { chatId: generateId(), messages: [] } as AIState,
});

export const InformAI = createInformAI({
  // vercel: AI,
  onEvent: (message: string) => {
    // Custom logic to send a message to an LLM
    //this is happening on the server
    console.log(`Custom send message: ${message}`);
    console.log(JSON.stringify(message, null, 4));
  },
});
