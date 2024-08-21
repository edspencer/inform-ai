# InformAI - Easy & Useful AI for React apps

InformAI allows you to easily retrofit context-aware AI into any React application. It works really well alongside the excellent [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction). It shines when used in combination with Next JS and especially React Server Components, but these are not mandatory.

InformAI provides a simple way to expose the state of your React components to any LLM. It also lets your components publish events, like user clicks or other interactions. It makes it easy to send this information in an LLM-optimized format to calls to your LLM. It doesn't send stuff to the LLM, but it makes it easy to integrate with libraries that do (like the Vercel AI SDK).

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

InformAI allows you to expose the state of any number of your React components to an AI - usually an LLM. It also allows components to notify the LLM of events that have occurred, such as the user clicking something, entering text, or some other interaction with the Component.

Under the covers, InformAI creates an array of component-generated messages that will be sent to the LLM along with whatever message the user types in to your chat box (a simple ChatBox component is included in InformAI). When you are ready to execute the LLM (usually in response to the user entering some text into a chat box), these component-generated messages are processed, deduped, made LLM-friendly and passed along with your user's message.

InformAI contains the following:

- A React Context Provider, created by `createInformAI()` - analogous to Vercel AI SDK's [createAI](https://sdk.vercel.ai/docs/reference/ai-sdk-rsc/create-ai) function
- A React Component called `<InformAI />`, which takes a name, a prompt to pass to the LLM, and arbitrary props
- A React hook called `useInformAI`, which allows you to do the same as `<InformAI />` but programmatically
- A handful of pre-built UI components like a `ChatBox`, `CurrentState` (to debug what InformAI currently knows about) and simple message wrappers

## Usage

InformAI doesn't integrate directly with an LLM itself - there are several libraries out there already that do that. One of the best of the bunch is the Vercel AI SDK
This assumes that you have both the Vercel AI SDK and inform-ai npm packages installed.

To use InformAI, first we need to define our Vercel AI Provider and our InformAI Provider (we will come back to the definition of `submitUserMessage` later):

```tsx
"use server";

import { CoreMessage, generateId } from "ai";
import { createAI } from "ai/rsc";

import { InformAIProvider } from "inform-ai";
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

export default async function AIProviders({ children }: { children: React.ReactNode }) {
  return (
    <AIProvider>
      <InformAIProvider>{children}</InformAIProvider>
    </AIProvider>
  );
}
```

Most of that was just setting up Vercel AI SDK and defining a couple of TypeScript types for the messages sent between the user and the LLM. As a convenience, we created and exported a React component called `<AIProviders>`, which just injects both the Vercel AI Provider and the InformAI Provider into your React component tree.

Inside your `layout.tsx`, we'll add that `<AIProviders>` component, along with the `<CurrentState />` component that is bundled with inform-ai. `<CurrentState />` is not intended to be used in production, but helps you keep track of what information you have surfaced to the LLM as you develop your code:

```tsx
import "inform-ai/dist/main.css";
import "./globals.css";

//the 2 Providers you just created
import { AIProviders } from "./providers/AI";

//optionally include the CurrentState component for easier InformAI debugging
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

Now that we have set up the Providers, exposing Component state to InformAI is easy:

#### Page-level integration

The fastest way to add InformAI to your app is by doing so at the page level. Below is an example from the [lansaver application](https://github.com/edspencer/lansaver), which is a nextjs app that backs up configurations for network devices like firewalls and managed switches ([see the full SchedulePage component here](https://github.com/edspencer/lansaver/blob/main/app/schedules/%5Bid%5D/page.tsx)).

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

When possible, it is usually better to use InformAI at the component level rather than the page level. Here's an example taken from the [backups table from lansaver](https://github.com/edspencer/lansaver/blob/main/components/backup/table.tsx), showing how to achieve this with the `useInformAI` hook:

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

import { getMutableAIState, streamUI } from "ai/rsc";
import { openai } from "@ai-sdk/openai";
import { Spinner } from "@/components/common/spinner";

import { AssistantMessage } from "inform-ai";
import { generateId } from "ai";

import { AIState, ClientMessage } from "../providers/AI";

import RedirectTool from "../tools/Redirect";
import BackupsTableTool from "../tools/BackupsTable";

export async function submitUserMessage(messages: ClientMessage[]) {
  const aiState = getMutableAIState();

  //add the new messages to the AI State so the user can refresh and not lose the context
  aiState.update({
    ...aiState.get(),
    messages: [...aiState.get().messages, ...messages],
  });

  //set up our streaming LLM response, with a couple of tools, a prompt and some onSegment logic
  //to add any tools and text responses from the LLM to the AI State
  const result = await streamUI({
    model: openai("gpt-4o-2024-08-06"),
    initial: <Spinner />,
    system: `\
    You are a helpful assistant who can blah blah blah - 
    give your LLM detailed instructions about your app here`,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name,
      })),
    ],
    text: ({ content, done }) => {
      if (done) {
        //store the LLM's response into AIState
        aiState.update({
          ...aiState.get(),
          messages: [...aiState.get().messages, { role: "assistant", content }],
        });

        // console.log(aiState.get().messages); //if you want to see the message history
        aiState.done(aiState.get());
      }

      return <AssistantMessage content={content} />;
    },
    tools: {
      redirect: RedirectTool,
      backupsTable: BackupsTableTool,
    },
  });

  return {
    id: generateId(),
    content: result.value,
  };
}
```

Here we're using the Vercel AI SDK's `streamUI` function, which allows us to easily send back streaming text like a basic chatbot, but also streaming UI in the shape of our React Server Components.

All of the InformAI messages along with whatever the user wants to ask for will be passed in via the `messages` argument to this function. We'll see how that happens in the final section below.

#### Streaming UI using Tools

In the code snippet above we defined 2 tools that the LLM can execute if it thinks it makes sense to do so. If the tool has a `generate` function, it can render arbitrary React components that will be streamed to the browser.

Here's a real-world example of a tool definition used in the [LANsaver](https://github.com/edspencer/lansaver) project ([see the full tool source](https://github.com/edspencer/lansaver/blob/main/app/tools/BackupsTable.tsx)). Most of this file is just textual description telling the LLM what the tool is and how to use it.

The important part of the tool is the `generate` function. Note that this is all just vanilla Vercel AI SDK functionality, and you can read more about it [in their docs](https://sdk.vercel.ai/examples/next-app/interface/route-components). Basically, though, this function `yield`s a Spinner component while it is loading the data for the real component it will show, then does some basic fuzzy searching, then finally returns the `<BackupsTable>` component, which will be streamed to the UI:

```tsx
import { z } from "zod";
import { BackupsTable } from "@/components/backup/table";
import { getDeviceBackups, getDeviceByHostname } from "@/models/device";
import { getPaginatedBackups } from "@/models/backup";
import { Spinner } from "@/components/common/spinner";

type BackupsTableToolParameters = {
  condensed?: boolean;
  showDevice?: boolean;
  deviceId?: number;
  deviceName?: string;
  perPage?: number;
  name?: string;
};

const BackupsTableTool = {
  //tells the LLM what this tool is and when to use it
  description:
    "Renders a table of backups. Optionally, you can show the device column and condense the table. If the user requests to see all backups, do not pass in a deviceId.",

  //tells the LLM how to invoke the tool, what the arguments are and which are optional
  parameters: z.object({
    condensed: z
      .boolean()
      .optional()
      .describe("Set to true to condense the table and hide some of the extraneous columns"),
    showDevice: z.boolean().optional().describe("Set to true to show the device column"),
    deviceId: z
      .number()
      .optional()
      .describe("The ID of the device to show backups for (do not set to show all backups)"),
    deviceName: z
      .string()
      .optional()
      .describe(
        "The name of the device to show backups for. Pass this if the user asks for backups for a device by name. The tool will perform a fuzzy search for this device"
      ),
    perPage: z.number().optional().describe("The number of backups to show per page (defaults to 5)"),
    name: z.string().optional().describe("A name to give to this table. For example, 'Recent Backups for Device X'"),
  }),

  //if the LLM decides to call this tool, generate will be called with the arguments the LLM decided to use
  //this function can yield a temporary piece of UI, like a spinner, and then return the permanent UI when ready
  generate: async function* (config: BackupsTableToolParameters) {
    const { condensed, showDevice, deviceId, deviceName, perPage = 5, name } = config;

    let backups;

    yield <Spinner />;

    if (deviceName) {
      // Perform a fuzzy search for the device
      const device = await getDeviceByHostname(deviceName);

      if (device) {
        backups = await getDeviceBackups(device.id, { take: perPage });
      }
    } else if (deviceId) {
      backups = await getDeviceBackups(deviceId, { take: perPage });
    }

    if (!backups) {
      backups = (await getPaginatedBackups({ includeDevice: true, page: 1, perPage })).backups;
    }

    return <BackupsTable name={name} backups={backups} condensed={condensed} showDevice={showDevice} />;
  },
};

export default BackupsTableTool;
```

### Sending message from the UI to the LLM

The final piece of the puzzle is some piece of UI that allows the user to send messages to the LLM. InformAI comes bundled with a couple of simple UI components out of the box to make this a little faster, but you don't have to use them.

Here's one way you might do that, with a React component called `ChatWrapper`. This pulls in the `Messages`, `UserMessage` and `ChatBox` React components from InformAI, which are super simple components that just either render messages or allow the user to send a new one.

The meat of this `ChatWrapper` is the `onMessage` function, which does a few things:

- Calls `popRecentMessages()` to pull all of the latest component-sent `state` and `event` messages out of `inform-ai`
- Dedupes these messages (multiple React renders will cause repeated `state` messages)
- Runs the messages through `mapComponentMessages`, which just turns the message objects into an LLM-friendly string (you can swap this out for your own implementation)
- Creates a new message object with the text the user just entered
- Adds the LLM-friendly InformAI messages plus the new user message to the message history
- Sends the new messages to our `submitUserMessage` function
- Once the LLM response is received, add it to the messages array so that the InformAI `<Messages>` component will render it
- Returns true to tell `<ChatBox>` to clear the input

A future version of InformAI may provide a `<ChatWrapper>` component out of the box so that you don't have to copy/paste this into your project, but it is likely that much of what the `onMessage` handler does will be at least somewhat specific to your application. This also gives you the option to provide your own `mapComponentMessages`, `dedupeMessages` and other functions if desired:

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

//optionally include the CurrentState component for easier InformAI debugging
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

And you're done. You should now see the `<CurrentState>` component rendering at the top right of the screen, showing all of the `state` and `event` messages your components have exposed to InformAI, and a simple chat box with message history at the bottom right. When you next send a message to the LLM via the chat input, all of the InformAI messages that have not previously been sent will be, along with your message, giving the LLM all the context you gave it to answer your question.

### What the LLM sees

Here's an example of a quick conversation with the LLM after just integrating InformAI into the `SchedulePage` component that we showed above. `SchedulePage` is just a Next JS page (therefore a React component) that shows some simple details about a backup schedule for devices on a network:

![Example Chat on Schedules page](/docs/inform-ai-chat-example.png)

By just adding the `<InformAI />` tag to our `SchedulePage`, we were able to have this conversation with the LLM about its contents, without having to do any other integration. But because we also defined our `FirewallsTableTool` tool, the LLM knew how to stream our `<BackupsTable>` component back instead of a text response.

Because `<BackupsTable>` also uses InformAI, via the `useInformAI` hook, the LLM also sees all of the information in the React component that it just streamed back, so it was able to answer questions about that too ("did all of those complete successfully?").

As our project was using the bundled `<CurrentState>` component while we had this conversation, we could easily see what the state sent to the LLM looks like directly in our UI:

![CurrentState after this exchange](/docs/current-state-example.png)

Here you can see that 4 `state` messages were published to InformAI - the first 2 were for the `SchedulePage` (which has name=`Schedule Detail Page`), and 2 for the freshly-streamed `<BackupsTable>` that the LLM sent back. Expanding the last message there, we can see that the LLM gave the streamed component a sensible name based on the user's request, and also has the `prompt` and `props` that we supply it in `<BackupsTable>`.

The 'Last Sent' message at the bottom tells us that all of the messages above were already sent to the LLM, as they were popped off the stack using `popRecentMessages` in our `<ChatWrapper>` component. `ChatWrapper` also did some deduping and conversion of the messages into an LLM-friendly format (see the [Sending Messages to the LLM](#sending-message-from-the-ui-to-the-llm) section), so now if we modify our `actions/AI.tsx` file and `console.log(aiState.get().messages)` we will see this:

```
[
  {
    id: '492b4wc',
    content: 'Component adc51d8c-8ada-464a-a924-3f2ddb604b16 has updated its state\n' +
      'Component Name: Schedule Detail Page\n' +
      "Component self-description: A page that shows the details of a schedule. It should show the schedule's configuration, the devices in the schedule, and recent jobs for the schedule. It should also have buttons to run the schedule, edit the schedule, and delete the schedule.\n" +
      'Component props: {"schedule":{"id":6,"disabled":false,"cron":"0 0 * * *","name":"Daily","devices":"21,19,83","createdAt":"2024-06-14T19:55:29.825Z","updatedAt":"2024-08-13T21:17:43.936Z"},"devices":[{"id":21,"type":"tplink","hostname":"masterclosetswitch.local","credentials":"fdbec89f1c1bb41b0e55d60f46092da3:7391a495c95411ebc5f087c4b8f5bcfb2b903d370cedd6a819a9e69b15f03999b9fbc4378a5254751ddb038bfec87facd5b642d0aa28b48b9ecf675b0deceb28","config":"{}","createdAt":"2024-06-14T19:55:29.824Z","updatedAt":"2024-06-14T19:55:29.824Z"},{"id":19,"type":"opnsense","hostname":"firewall.local","credentials":"dd503eaafa2acdae999023a63735b7b8:9af028d461a8b3aea27c6edc013d64e98d33476d8614bdd0ad1cab42601a2517c01cc0342b6946fee8bb5a31ceaa26a659b37051da1584ba163360f9465997154ff7f9344ff5726683fe6183e6e7054f622aeeaaa2402dc416e5ae6edea6cb34ff9d80720bb9942d2ccb90015821f8fa103ec0f116bcc3532b2ff285dad80ec56c90503996b094daf52b5775b224b137a8ba0dc13d29e2e4c37d244ff10bda30bc7ed892390efc3e3ac19dd0845e7cb0e6b3cd88c2f126d2f8d9b7191f85f72f","config":"{}","createdAt":"2024-06-14T19:55:29.823Z","updatedAt":"2024-06-16T16:06:39.091Z"},{"id":83,"type":"hass","hostname":"13232pct.duckdns.org","credentials":"6628e50a7bd550741dd1963ef98bfb67:107376648f66355e19787eb82036ea506a9cae6152ed98f1f1739640d2a930f30c54683c9bc3eaebd49043434afeed16b7928ba31b44048477b40d68f2a1638d83a9e1aaf83f015ffc53ed5114eb77fd90e06cfe3f52f804d9433056b985a0f00358e42d04733440e7c3c245a926266e3f5d1232022850baa970e38d8a33b032e1ccdadc563574420447cacb8498dbb637dfdfa19272cf226df112730cd8e4282e09ce99c30e0854c7ca5144426ad8f7f349fcffea7da3f7970c3ad5af9b33023ad7f057ad4144817f9df0e4c69e1466","config":"{\\"port\\":\\"3000\\"}","createdAt":"2024-07-16T17:13:33.455Z","updatedAt":"2024-07-16T17:13:33.455Z"}],"jobs":[{"id":24,"createdAt":"2024-08-13T21:17:54.387Z","updatedAt":"2024-08-13T21:18:31.499Z","startedAt":"2024-08-13T21:17:54.400Z","finishedAt":"2024-08-13T21:18:31.496Z","status":"completed","scheduleId":6,"_count":{"backups":3}},{"id":23,"createdAt":"2024-08-13T21:15:46.991Z","updatedAt":"2024-08-13T21:15:47.571Z","startedAt":"2024-08-13T21:15:47.004Z","finishedAt":"2024-08-13T21:15:47.570Z","status":"completed","scheduleId":6,"_count":{"backups":2}},{"id":22,"createdAt":"2024-08-13T21:09:42.083Z","updatedAt":"2024-08-13T21:09:42.083Z","startedAt":null,"finishedAt":null,"status":"pending","scheduleId":6,"_count":{"backups":1}},{"id":18,"createdAt":"2024-07-15T15:37:38.955Z","updatedAt":"2024-07-15T15:38:14.366Z","startedAt":"2024-07-15T15:37:38.967Z","finishedAt":"2024-07-15T15:38:14.365Z","status":"completed","scheduleId":6,"_count":{"backups":2}},{"id":17,"createdAt":"2024-07-15T15:36:30.814Z","updatedAt":"2024-07-15T15:37:06.483Z","startedAt":"2024-07-15T15:36:30.828Z","finishedAt":"2024-07-15T15:37:06.482Z","status":"completed","scheduleId":6,"_count":{"backups":2}}]}',
    role: 'system'
  },
  {
    id: 'QfhU2Z2',
    content: 'how many devices does this schedule back up?',
    role: 'user'
  },
  { role: 'assistant', content: 'This schedule backs up 3 devices.' },
  {
    id: '3Rytlyw',
    content: 'Component 7df18442-843c-4fc8-a1cf-a5eaa5a9ba9a has updated its state\n' +
      'Component Name: 3 Most Recent Backups for firewall.local\n' +
      'Component self-description: This table displays a list of backups taken for various devices. The data will be provided to you in JSON format\n' +
      'Component props: {"backups":[{"id":65,"jobId":24,"deviceId":19,"createdAt":"2024-08-13T21:17:54.391Z","updatedAt":"2024-08-13T21:17:54.626Z","status":"completed","bytes":57117},{"id":63,"jobId":23,"deviceId":19,"createdAt":"2024-08-13T21:15:46.996Z","updatedAt":"2024-08-13T21:15:47.571Z","status":"completed","bytes":57117},{"id":61,"jobId":22,"deviceId":19,"createdAt":"2024-08-13T21:09:42.091Z","updatedAt":"2024-08-13T21:09:42.091Z","status":"pending","bytes":null}]}',
    role: 'system'
  },
  {
    id: 'Min6j9V',
    content: 'did all of those complete successfully?',
    role: 'user'
  },
  {
    role: 'assistant',
    content: 'Out of the three most recent backups for the device "firewall.local," two backups completed successfully, and one is still pending:\n' +
      '\n' +
      '1. Backup ID 65: Completed\n' +
      '2. Backup ID 63: Completed\n' +
      '3. Backup ID 61: Pending'
  }
]
```

It's a little dense to the human eye, but here we can see the first message is from the `system` role, and is a string representation of the content that we supplied to `<InformAI>` in our `SchedulePage` React component. After that we see our user message, followed by another `system` message that InformAI injected for us because the `<BackupsTable>` was streamed in as a response and published data to InformAI.

The internal messages stored by InformAI are converted into LLM-friendly strings via the [mapComponentMessages](https://github.com/edspencer/inform-ai/blob/main/src/utils.ts) function, but it's easy to swap that out for any function you like. The default `mapComponentMessages` function just delegates to a function that looks like this:

```tsx
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
```
