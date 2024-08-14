# inform-ai

## Installation

## Usage

Inside a file like `actions/AI.tsx`, set up the Vercel AI SDK and inform-ai like this:

The 3 main exports here are the Vercel SDK AI Provider (`AI`), the inform-ai Provider (`InformAI`) and the `submitUserMessage` function, which takes the new combined system and user messages and passes them to the LLM:

```tsx
"use server";

import { createAI, getMutableAIState, streamUI, createStreamableValue } from "ai/rsc";
import { openai } from "@ai-sdk/openai";
import { streamMulti } from "ai-stream-multi";
import { Spinner } from "@/components/common/spinner";

import { createInformAI, AssistantMessage } from "inform-ai";
import { CoreMessage, generateId } from "ai";

export async function submitUserMessage(messages: ClientMessage[]) {
  "use server";

  const aiState = getMutableAIState<typeof AI>();

  //add the new messages to the AI State so the user can refresh and not lose the context
  aiState.update({
    ...aiState.get(),
    messages: [...aiState.get().messages, ...messages],
  });

  //set up our streaming LLM response, with a couple of tools, a prompt and some onSegment logic
  //to add any tools and text responses from the LLM to the AI State
  const result = await streamMulti({
    model: openai("gpt-4o-2024-08-06"),
    initial: <Spinner />,
    system: `\
    You are a helpful assistant who can help a user to navigate through information they
    are seeing on their screen. The user interface that that user is looking at has a collection
    of components that can send events and have states. The user can interact with the components,
    and the components can send events to the assistant. Messages sent from components will usually
    have a unique componentId, may have a human-friendly name, may also have a self-description that
    is intended to help you understand what the component does
    
    Components can also send events, which are messages that describe something that happened in the
    interface, like the user clicking something, or some other event.
    
    All messages from components will be sent via the system role in this conversation.`,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name,
      })),
    ],
    textComponent: AssistantMessage,
    onSegment: (segment: any) => {
      if (segment.type === "tool-call") {
        const { args, toolName } = segment.toolCall;

        const toolCallId = generateId();

        const toolCall = {
          id: generateId(),
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName,
              toolCallId,
              args,
            },
          ],
        } as ClientMessage;

        const toolResult = {
          id: generateId(),
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolName,
              toolCallId,
              result: args,
            },
          ],
        } as ClientMessage;

        aiState.update({
          ...aiState.get(),
          messages: [...aiState.get().messages, toolCall, toolResult],
        });
      } else if (segment.type === "text") {
        const text = segment.text;

        const textMessage = {
          id: generateId(),
          role: "assistant",
          content: text,
        } as ClientMessage;

        aiState.update({
          ...aiState.get(),
          messages: [...aiState.get().messages, textMessage],
        });
      }
    },
    onFinish: () => {
      //once the LLM has finished its response, finalize the AI state
      aiState.done(aiState.get());
    },
    tools: {
      // firewallTable: FirewallsTableTool,
    },
  });

  return {
    id: generateId(),
    content: result.ui.value,
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
  role?: string;
  content: React.ReactNode;
}[];

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [] as UIState,
  initialAIState: { chatId: generateId(), messages: [] } as AIState,
});

export const InformAI = createInformAI();
```

Inside your `layout.tsx`, add both the Vercel AI SDK and inform-ai Providers:

```tsx
import "./globals.css";

//the 2 Providers you just created
import { AI, InformAI } from "./actions/AI";

//optionally include the CurrentState component for easier inform-ui debugging
import { CurrentState } from "inform-ai";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AI>
          <InformAI>
            {children}
            <CurrentState className="fixed top-20 right-3 bottom-20 w-96" />
          </InformAI>
        </AI>
      </body>
    </html>
  );
}
```

The easiest way to now give the AI the context already stored inside your components is to use the `<InformAI />` component.

Let's say you have a page that shows information about a Schedule. We can add inform-ai support in 3 lines of code:

```tsx
//load the InformAI component
import { InformAI } from "inform-ai";
```

```tsx
//provide a meaningful prompt string that tells the LLM exactly what this LLM is showing
//this could be a dynamically-generated string, does not have to be static like this
const prompt = `A page that shows the details of a schedule. It should show the schedule's configuration, the devices in the schedule, and recent jobs for the schedule. It should also have buttons to run the schedule, edit the schedule, and delete the schedule.`;
```

```tsx
//pass the component name, prompt and any props you like to the InformAI component
<InformAI name="Schedule Detail Page" prompt={prompt} props={{ schedule, devices, jobs }} />
```

The `<InformAI />` component does not render anything, but behind the scenes it calls `useInformAI` with the `name`, `prompt` and `props` you gave it, which in turn passes that information along to inform-ai.

Here's the whole file:

```tsx
import { InformAI } from "inform-ai";

const prompt = `A page that shows the details of a schedule. It should show the schedule's configuration, the devices in the schedule, and recent jobs for the schedule. It should also have buttons to run the schedule, edit the schedule, and delete the schedule.`;

export default async function SchedulePage({ params: { id } }: { params: { id: string } }) {
  const schedule = await getSchedule(parseInt(id, 10));

  if (!schedule) {
    return notFound();
  }

  const devices = await getScheduleDevices(schedule.id);
  const jobs = await recentJobs(schedule.id);

  return (
    <div className="flex flex-col gap-8">
      <InformAI name="Schedule Detail Page" prompt={prompt} props={{ schedule, devices, jobs }} />
      <div className="flex w-full flex-wrap items-end justify-between">
        <Heading>Schedule Details</Heading>
        <div className="flex gap-4">
          <RunScheduleForm schedule={schedule} />

          <Button href={`/schedules/${schedule.id}/edit`}>Edit</Button>
          <DeleteScheduleButton schedule={schedule} />
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <ScheduleConfiguration schedule={schedule} />
        <DevicesList devices={devices} />
      </div>
      <Subheading className="mt-8 mb-2">Recent Jobs</Subheading>
      <NoContentYet items={jobs} message="No recent jobs" />
      {jobs.length ? <JobsTable jobs={jobs} /> : null}
      {/* <RecentBackups deviceId={schedule.id} /> */}
    </div>
  );
}
```
