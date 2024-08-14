# inform-ai

inform-ai allows you to easily retrofit context-aware AI into any React application. It builds on top of the excellent [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction). It shines when used in combination with Next JS and especially React Server Components, but these are not mandatory.

inform-ai provides a simple way to expose the state of your React components to any LLM supported by the Vercel AI SDK - including OpenAI, Llama 3 and any number of other LLM providers.

It works with both traditional client side React components as well as React Server Components.

## Installation

Install the NPM package:

```sh
npm install inform-ai
```

Include the stylesheet if you plan to use the included UI components:

```tsx
import "inform-ai/dist/main.css";
```

## Conceptual Overview

inform-ai allows you to expose the state of any number of your React components to an AI - usually an LLM. It also allows components to notify the LLM of events that have occurred, such as the user clicking something, entering text, or some other interaction with the Component.

Under the covers, inform-ai creates an array of component-generated messages that will be sent to the LLM along with whatever message the user types in to your chat box (a simple ChatBox component is included in inform-ai). When you are ready to execute the LLM (usually in response to the user entering some text into a chat box), these component-generated messages are processed, deduped, made LLM-friendly and passed along with your user's message.

inform-ai contains the following:

- A React Context Provider, created by `createInformAI()` - analogous to Vercel AI SDK's [createAI](https://sdk.vercel.ai/docs/reference/ai-sdk-rsc/create-ai) function
- A React Component called `<InformAI />`, which takes a name, a prompt to pass to the LLM, and arbitrary props
- A React hook called `useInformAI`, which allows you to do the same as `<InformAI />` but programmatically
- A handful of pre-built UI components like a `ChatBox`, `CurrentState` (to debug what inform-ai currently knows about) and simple message wrappers

## Usage

This assumes that you have both the Vercel AI SDK and inform-ai npm packages installed.

To use inform-ai, first we need to define our Vercel AI Provider and our inform-ai Provider (we will come back to the definition of `submitUserMessage` later):

```tsx
"use server";

import { CoreMessage, generateId } from "ai";
import { createInformAI } from "inform-ai";
import { createAI } from "ai/rsc";
import { submitUserMessage } from "../actions/AI";

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

export const AIProvider = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [] as UIState,
  initialAIState: { chatId: generateId(), messages: [] } as AIState,
});

export const InformAIProvider = createInformAI();

export default async function AIProviders({ children }: { children: React.ReactNode }) {
  return (
    <AIProvider>
      <InformAIProvider>{children}</InformAIProvider>
    </AIProvider>
  );
}
```

Most of that was just setting up Vercel AI SDK and defining a couple of TypeScript types for the messages sent between the user and the LLM. As a convenience, we created and exported a React component called `<AIProviders>`, which just injects both the Vercel AI Provider and the inform-ai Provider into your React component tree.

Inside your `layout.tsx`, we'll add that `<AIProviders>` component, along with the `<CurrentState />` component that is bundled with inform-ai. `<CurrentState />` is not intended to be used in production, but helps you keep track of what information you have surfaced to the LLM as you develop your code:

```tsx
import "inform-ai/dist/main.css";
import "./globals.css";

//the 2 Providers you just created
import { AIProviders } from "./providers/AI";

//optionally include the CurrentState component for easier inform-ai debugging
import { CurrentState } from "inform-ai";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AIProviders>
          {children}
          <CurrentState className="fixed top-20 right-3 bottom-20 w-96" />
        </AIProviders>
      </body>
    </html>
  );
}
```

### Exposing Component state and events

Now that we have set up the Providers, exposing Component state to inform-ai is easy:

#### Page-level integration

The fastest way to add inform-ai to your app is by doing so at the page level. Below is an example from the [lansaver application](https://github.com/edspencer/lansaver), which is a nextjs app that backs up configurations for network devices like firewalls and managed switches ([see the full SchedulePage component here](https://github.com/edspencer/lansaver/blob/main/app/schedules/%5Bid%5D/page.tsx)).

This is a React Server Component, rendered on the server. It imports the `<InformAI>` React component, defines a `prompt` string to help the LLM understand what this component does, and then renders `<InformAI>` with a meaningful component `name`, the `prompt`, and an arbitrary `props` object, which is passed to the LLM in addition to the name and prompt:

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

In this case we passed the `schedule` (a row from the database), `devices` (an array of device database rows) and `jobs` (an array of recent backup jobs) to the LLM, but we could have passed anything into `props`, so long as it is serializable into JSON. Next time the user sends the LLM a message, it will also receive all of the context we just exposed to it about this page, so can answer questions about what the user is looking at.

#### Component-level integration

When possible, it is usually better to use inform-ai at the component level rather than the page level. Here's an example taken from the [backups table from lansaver](https://github.com/edspencer/lansaver/blob/main/components/backup/table.tsx), showing how to achieve this with the `useInformAI` hook:

```tsx
import { useInformAI } from "inform-ai";

const prompt =
  "This table displays a list of backups taken for various devices. The data will be provided to you in JSON format";

export function BackupsTable({
  name = "Backups Table",
  backups,
  showDevice = false,
}: {
  name?: string;
  backups: BackupWithDevice[];
  showDevice?: boolean;
}) {
  useInformAI({
    name,
    prompt,
    props: {
      backups,
    },
  });

  if (condensed) {
    return <CondensedBackupsTable backups={backups} showDevice={showDevice} />;
  }

  return (
    <Table dense>
      <TableHead>
        <TableRow>
          <TableHeader>ID</TableHeader>
          {showDevice && <TableHeader>Device</TableHeader>}
          <TableHeader>Status</TableHeader>
          <TableHeader>Date</TableHeader>
          <TableHeader>Size</TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {backups.map((backup) => (
          <BackupRow key={backup.id} backup={backup} showDevice={showDevice} />
        ))}
      </TableBody>
    </Table>
  );
}
```

Note that we could have used the `<InformAI ...>` React component again in this case instead of `useInformAI()`, but it was useful to use the hook in this case as we render a different table if `condensed` is set to true.

#### Sending Component Events

In addition to exposing Component state via `<InformAI>` and `useInformAI`, Components may expose events such as clicks and other user interactions.

Here's an example of a different Table component, which can render arbitrary data and exposes `click` events when the user clicks on a table cell:

```tsx
const defaultPrompt = `This component is a table that displays data in a tabular format. 
It takes two props: data and colHeaders. The data prop is an array of objects, where 
each object represents a row in the table. The colHeaders prop is an optional 
array of strings that represent the column headers of the table. 
If the colHeaders prop is not provided, the component will use the 
keys of the first object in the data array as the column headers. 
The component will render the table with the provided data and column headers.`;

export function Table({ data, colHeaders, name = "Table", informPrompt = defaultPrompt, header }: TableProps) {
  const { addEvent, updateState } = useInformAI({
    name,
    prompt: informPrompt,
    props: {
      data,
      colHeaders,
    },
  });

  //adds a new hint to the AI
  const cellClicked = (e: React.MouseEvent<HTMLTableCellElement>) => {
    addEvent({
      type: "user-click",
      description: "User clicked on a cell with data: " + (e.target as HTMLElement).innerHTML,
    });
  };

  return (
    <div className="border border-yellow-500 flex-1">
      {header}
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            {colHeaders
              ? colHeaders.map((header, index) => <TableHeaderCell key={index}>{header.label}</TableHeaderCell>)
              : Object.keys(data[0]).map((header, index) => <TableHeaderCell key={index}>{header}</TableHeaderCell>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Object.values(row).map((cell, cellIndex) => (
                <TableCell key={cellIndex} onClick={cellClicked}>
                  {cell as ReactNode}
                </TableCell>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

The `type` and `description` we pass can be any strings we like, and will be exposed to the LLM next time we trigger it.

### Processing messages from the user

Now we just need an endpoint that will accept messages from our user, along with the `state` and `event` messages that our Components have created.

Inside a file like `actions/AI.tsx`, we can define a `submitUserMessage` function like this (it doesn't have to be called `submitUserMessage`, just has to match whatever you passed into your AI Provider in the first step, and call from the UI in the next step):

```tsx
"use server";

import { getMutableAIState } from "ai/rsc";
import { openai } from "@ai-sdk/openai";
import { streamMulti } from "ai-stream-multi";
import { Spinner } from "@/components/common/spinner";

import { AssistantMessage } from "inform-ai";
import { generateId } from "ai";

import { ClientMessage } from "../providers/AI";

import RedirectTool from "../tools/Redirect";
import BackupsTableTool from "../tools/BackupsTable";

export async function submitUserMessage(messages: ClientMessage[]) {
  const aiState = getMutableAIState();

  //add the new messages to the AI State so the user can refresh and not lose the context
  aiState.update({
    ...aiState.get(),
    messages: [...aiState.get().messages, ...messages],
  });

  //set up our streaming LLM response, with the messages, a couple of tools, and a system prompt
  const result = await streamMulti({
    model: openai("gpt-4o-2024-08-06"),
    initial: <Spinner />,
    system: `\
    You are a helpful assistant who can help a user to navigate through information they
    are seeing on their screen. The user interface that that user is looking at has a collection
    of components that can send events and have states. The user can interact with the components,
    and the components can send events to the assistant. Messages sent from components will usually
    have a unique componentId, may have a human-friendly name, may also have a self-description that
    is intended to help you understand what the component does.

    This application is called LANsaver, and is a tool that helps users back up the configurations
    of network devices such as routers, firewalls, switches and Home Assistant instances. It has the
    following features:

    - CRUD operations for Devices - user can specify the hostname, type and credentials for the device
    - Backup operations - user can back up the configuration of a Device. The Backup is stored as a file,
      and has logs that the user can view
    - Schedule operations - user CRUD Schedules, which apply to a subset of devices and run on a cron schedule
    - Job operations - user can see the status of a job, and see the logs of a job. A Job is a collection of 
      Backup operations, and is associated with a Schedule.
    
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
    onFinish: () => {
      aiState.done(aiState.get());
    },
    tools: {
      redirect: RedirectTool,
      backupsTable: BackupsTableTool,
    },
  });

  return {
    id: generateId(),
    content: result.ui.value,
  };
}
```

Most of this was the system prompt that explains to the LLM what is expected of it. Much of the rest was setting up and updating the Vercel AI aiState so that the LLM can see all of the messages.

All of the inform-ai messages along with whatever the user wants to ask for will be passed in via the `messages` argument to this function. We'll see how that happens in the final section below.

This particular example uses a custom function called [streamMulti()](https://github.com/edspencer/stream-multi), which is just a thin wrapper around the Vercel AI SDK's `streamText` function. This is currently being used here because the Vercel AI SDK's `streamText` and `streamUI` functions only support either a text response or a tool response, but not both, whereas this application wants to be able to show both streaming LLM text responses and streaming UI components rendered by tools. Your application doesn't have to use `streamMulti` - it can use any of the Vercel AI SDK functions instead.

### Sending message from the UI to the LLM

The final piece of the puzzle is some piece of UI that allows the user to send messages to the LLM. inform-ai comes bundled with a couple of simple UI components out of the box to make this a little faster, but you don't have to use them.

Here's one way you might do that, with a React component called `ChatWrapper`. This pulls in the `Messages`, `UserMessage` and `ChatBox` React components from inform-ai, which are super simple components that just either render messages or allow the user to send a new one.

The meat of this `ChatWrapper` is the `onMessage` function, which does a few things:

- Calls `popRecentMessages()` to pull all of the latest component-sent `state` and `event` messages out of `inform-ai`
- Dedupes these messages (multiple React renders will cause repeated `state` messages)
- Runs the messages through `mapComponentMessages`, which just turns the message objects into an LLM-friendly string (you can swap this out for your own implementation)
- Creates a new message object with the text the user just entered
- Adds the LLM-friendly inform-ai messages plus the new user message to the message history
- Sends the new messages to our `submitUserMessage` function
- Once the LLM response is received, add it to the messages array so that the inform-ai `<Messages>` component will render it
- Returns true to tell `<ChatBox>` to clear the input

A future version of inform-ai may provide a `<ChatWrapper>` component out of the box so that you don't have to copy/paste this into your project, but it is likely that much of what the `onMessage` handler does will be at least somewhat specific to your application. This also gives you the option to provide your own `mapComponentMessages`, `dedupeMessages` and other functions if desired:

```tsx
"use client";

import type { AIProvider } from "@/app/providers/AI";

import { useActions, useUIState } from "ai/rsc";
import { generateId } from "ai";
import clsx from "clsx";

import { Messages, UserMessage, ChatBox, useInformAIContext, dedupeMessages, mapComponentMessages } from "inform-ai";

export function ChatWrapper({ className }: { className?: string }) {
  const { submitUserMessage } = useActions();
  const { popRecentMessages } = useInformAIContext();
  const [messages, setMessages] = useUIState<typeof AIProvider>();

  async function onMessage(message: string) {
    const componentMessages = popRecentMessages();

    //deduped set of component-generated messages like state updates and events, since the last user message
    const newSystemMessages = mapComponentMessages(dedupeMessages(componentMessages));

    //this is the new user message that will be sent to the AI
    const newUserMessage = { id: generateId(), content: message, role: "user" };

    //the new user message UI that will be added to the chat history
    const newUserMessageUI = { ...newUserMessage, content: <UserMessage message={message} /> };
    setMessages([...messages, ...newSystemMessages, newUserMessageUI]);

    //send the new user message to the AI, along with the all the recent messages from components
    const responseMessage = await submitUserMessage([...newSystemMessages, newUserMessage]);

    //update the UI with whatever the AI responded with
    setMessages((currentMessages) => [...currentMessages, { ...responseMessage, role: "assistant" }]);

    //return true to clear the chat box
    return true;
  }

  return (
    <div className={clsx("flex flex-col border border-slate-200 rounded-md p-1 bg-white gap-1", className)}>
      <Messages messages={messages} />
      <ChatBox onSubmit={onMessage} />
    </div>
  );
}
```

Drop this into your layout.tsx like so (here we're just using Tailwind to pin it to the bottom right corner):

```tsx
import "inform-ai/dist/main.css";
import "./globals.css";

//the 2 Providers you just created
import { AIProviders } from "./providers/AI";

//optionally include the CurrentState component for easier inform-ai debugging
import { CurrentState } from "inform-ai";

import { ChatWrapper } from "@/components/ChatWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AIProviders>
          {children}
          <CurrentState className="fixed top-20 right-3 bottom-20 w-96" />
          <ChatWrapper className="fixed bottom-10 right-3 max-h-1/3 w-1/4" />
        </AIProviders>
      </body>
    </html>
  );
}
```

And you're done. You should now see the `<CurrentState>` component rendering at the top right of the screen, showing all of the `state` and `event` messages your components have exposed to inform-ai, and a simple chat box with message history at the bottom right. When you next send a message to the LLM via the chat input, all of the inform-ai messages that have not previously been sent will be, along with your message, giving the LLM all the context you gave it to answer your question.
