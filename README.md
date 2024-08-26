# InformAI - Context-Aware AI Integration for React Apps

**InformAI** is a tool that enables seamless integration of context-aware AI into any React application. It's designed to work effortlessly with the [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction), but is also compatible with other AI SDK providers.

### Key Features:

- **Contextual AI Integration**: Easily expose the state of your React components to an LLM (Large Language Model) or other AI, providing valuable context with minimal effort.
- **Event Publishing**: Allow your components to publish events, like user interactions, in an LLM-optimized format.
- **Flexible Usage**: Works well with both client-side React components and React Server Components. Though it excels with Next.js and React Server Components, these are not required.

InformAI doesn't directly send data to your LLM but simplifies integration with tools like the Vercel AI SDK, making it easy to incorporate AI into your app.

If ChatGPT and other LLMs can read and write text, and Vercel AI SDK adds the ability to write UI by streaming React components as part of an LLM response, InformAI fills in the missing piece by allowing the LLM to read your UI as well as write to it:

![Where InformAI fits](/docs/magic-square.png)

## Installation

Install the NPM package:

```sh
npm install inform-ai
```

Include the stylesheet if you plan to use the included UI components (or don't, if you want to use them but customize their appearance):

```tsx
import "inform-ai/dist/main.css";
```

## Installing the Provider

InformAI can be used via either the `<InformAI />` Component or the `useInformAI` hook. Either way, you need to wrap any components using InformAI inside an `InformAIProvider`:

```tsx
import { InformAIProvider } from "inform-ai";

//somewhere in your layout.tsx or similar:
<InformAIProvider>{children}</InformAIProvider>;
```

## Exposing Component state

Now, within any React component that will be rendered inside that `InformAIProvider`, you can insert a `<InformAI />` node:

```tsx
import { InformAI } from "inform-ai";

const prompt = "Shows the life history of a person, including their name, title and age";

export function Bio({ name, title, age }) {
  return (
    <div className="my-component">
      <InformAI name={`Biography for ${name}`} props={{ name, title, age }} prompt={prompt} />
      //... rest of the component here
    </div>
  );
}
```

Adding the `<InformAI />` tag to our component we were able to tell the LLM 3 things about our component:

- **name** - a meaningful name for this specific component instance
- **props** - any props we want to pass to the LLM (must be JSON-serializable)
- **prompt** - a string to help the LLM understand what the component does

### useInformAI

An alternative to the `<InformAI />` component is to use the `useInformAI` hook. `useInformAI` is a little more versatile than `<InformAI />`. Here's a slightly simplified example taken from the [backups table from lansaver](https://github.com/edspencer/lansaver/blob/main/components/backup/table.tsx), showing how to use `useInformAI` instead of `<InformAI />`:

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

  return <table>//your table implementation</table>;
}
```

It was useful to use the hook in this case as we render a different table if `condensed` is set to true, but we wanted to surface the same information either way to InformAI, so by using 'useInformAI' we didn't need to maintain 2 duplicate copies of an `<InformAI />` tag in our 2 table components.

## Exposing Component events

Another possibility that is unlocked by using `useInformAI` is telling the LLM about component events like clicks or other user interactions:

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
  const { addEvent } = useInformAI({
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
    <div className="border border-gray-500 flex-1">
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

The `type` and `description` we pass can be any strings we like.

## Viewing Current State

Under the covers, InformAI collects together all of the component state and event messages that are published by `<InformAI />` and `useInformAI`. While in development, it's useful to be able to see what InformAI is aware of, and what will be sent with the next user message to the LLM.

InformAI ships with a small React component called `<CurrentState />` which can be rendered anywhere inside your component tree, and will show you all of the component states and events that InformAI has collected.

Drop this into your layout.tsx like so:

```tsx
import "inform-ai/dist/main.css";
import "./globals.css";

//optionally include the CurrentState component for easier InformAI debugging
import { InformAIProvider, CurrentState } from "inform-ai";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <InformAIProvider>
          {children}
          <CurrentState className="fixed top-20 right-3 max-h-[50vh] overflow-auto w-1/5" />
        </InformAIProvider>
      </body>
    </html>
  );
}
```

`<CurrentState />` accepts a `className` so you can style.position it however you like (this example has it pinned top right). It will collapse/expand when you click the component heading if it's getting in the way.

![CurrentState component](/docs/current-state-example.png)

`<CurrentState />` is intended to help understand/debug in development, and is not something you'd likely ship to your users. Each time a component registers a state or event update, a row is added to CurrentState with the ability to dig down into a JSON view of all of the information.

## Adding a Chatbot

How you add your Chatbot UI is completely up to you. InformAI works well alongside the Vercel AI SDK (`npm install ai`), and provides a couple of rudimentary chatbot UI components out of the box that use Vercel AI SDK.

Here's how you can use that to create your own simple `ChatBot` component using the Vercel AI SDK and InformAI:

```tsx
"use client";

import { ChatWrapper } from "inform-ai";
import { useActions, useUIState } from "ai/rsc";

export function ChatBot() {
  const { submitUserMessage } = useActions();
  const [messages, setMessages] = useUIState();

  return <ChatWrapper submitUserMessage={submitUserMessage} messages={messages} setMessages={setMessages} />;
}
```

InformAI exposes `ChatBox` and `Messages` components, along with a `ChatWrapper` that just combines them both into an easy package. `ChatBox` is a fairly simple form with a text input and a button to submit the user's message, and `Messages` just renders the conversation between the user and the LLM assistant.

Because the Vercel AI SDK is awesome, `Messages` can handle streaming LLM responses as well as streaming React Server Components (if you're using nextjs or similar). Here's an example of a conversation using `ChatWrapper`:

![Example Chat on Schedules page](/docs/inform-ai-chat-example.png)

You're highly encouraged to check out the [ChatWrapper source](/src/ui/ChatWrapper.tsx) as well as that for [ChatBox](/src/ui/ChatBox.tsx) and [Messages](/src/ui/Messages.tsx) - they're all pretty straightforward components so you can use all, some or none of them in your app.

### Vercel AI backend for this example

To get that `ChatBot` component to work, we actually need 2 more things:

- A Vercel `<AIProvider>` in our React tree
- A `submitUserMessage` function

We can define those both in a single file, something like this:

```tsx
"use server";

import { CoreMessage, generateId } from "ai";
import { createAI } from "ai/rsc";
import { AssistantMessage } from "inform-ai";

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

export async function submitUserMessage(messages: ClientMessage[]) {
  const aiState = getMutableAIState();

  //add the new messages to the AI State so the user can refresh and not lose the context
  aiState.update({
    ...aiState.get(),
    messages: [...aiState.get().messages, ...messages],
  });

  //set up our streaming LLM response using Vercel AI SDK
  const result = await streamUI({
    model: openai("gpt-4o-2024-08-06"),
    system: "You are a helpful assistant who blah blah blah",
    messages: aiState.get().messages,
    text: ({ content, done }) => {
      if (done) {
        //save the LLM's response to our AIState
        aiState.done({
          ...aiState.get(),
          messages: [...aiState.get().messages, { role: "assistant", content }],
        });
      }

      //AssistantMessage is a simple, styled component that supports streaming text/UI responses
      return <AssistantMessage content={content} />;
    },
  });

  return {
    id: generateId(),
    content: result.value,
  };
}

export const AIProvider = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [] as UIState,
  initialAIState: { chatId: generateId(), messages: [] } as AIState,
});
```

This gives us our `submitUserMessage` and `<AIProvider>` exports. All you need to do now is add the `<AIProvider>` into your React component tree, just like we did with `<InformAIProvider>`, and everything should Just Work. The `useActions()` hook we used in our `ChatBot.tsx` will be able to pull out our `submitUserMessage` function and pass it to `ChatWrapper`, which will then call it when the user enters and sends a message.

The AIState management we do there is to keep a running context of the conversation so far - see the [Vercel AI SDK AIState docs](https://sdk.vercel.ai/examples/next-app/state-management/ai-ui-states) if you're not familiar with that pattern.

The `text` prop we passed to `streamUI` is doing 2 things - rendering a pretty `<AssistantMessage />` bubble for the streaming LLM response, and saving the finished LLM response into the AIState history when the LLM has finished its answer. This allows the LLM to see the whole conversation when the user sends follow-up messages, without the client needing to send the entire conversation each time.

### Tips & Tricks

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

When possible, it is usually better to use InformAI at the component level rather than the page level to take advantage of React's composability, but it's really up to you.

#### Streaming UI using Tools

We can extend our use of streamUI and other functions like it by providing tools definitions for the LLM to choose from. The streamUI() function and its UI streaming capabilities are 100% Vercel AI SDK functionality and not InformAI itself, but InformAI plays well with it and supports streaming UI instead of/in addition to streaming text responses from the LLM:

```tsx
//inside our submitUserMessage function
const result = await streamUI({
  model: openai("gpt-4o-2024-08-06"),
  system: "You are a helpful assistant who blah blah blah",
  messages: aiState.get().messages,
  text: ({ content, done }) => {
    if (done) {
      //save the LLM's response to our AIState
      aiState.done({
        ...aiState.get(),
        messages: [...aiState.get().messages, { role: "assistant", content }],
      });
    }

    return <AssistantMessage content={content} />;
  },
  tools: {
    redirect: RedirectTool,
    backupsTable: BackupsTableTool,
  },
});
```

In the code snippet above we defined 2 tools that the LLM can execute if it thinks it makes sense to do so. If the tool has a `generate` function, it can render arbitrary React components that will be streamed to the browser. Tools can be defined inline but they're easier to read, test and swap in/out when extracted into their own files (tool-calling LLMs like those from OpenAI are still not great at picking the right tool when given too many options).

Here's a real-world example of a tool definition used in the [LANsaver](https://github.com/edspencer/lansaver) project ([see the full tool source](https://github.com/edspencer/lansaver/blob/main/app/tools/BackupsTable.tsx)). Most of this file is just textual description telling the LLM what the tool is and how to use it. The important part of the tool is the `generate` function:

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

Note that this is all just vanilla Vercel AI SDK functionality, and you can read more about it [in their docs](https://sdk.vercel.ai/examples/next-app/interface/route-components). Basically, though, this function `yield`s a Spinner component while it is loading the data for the real component it will show, then does some basic fuzzy searching, then finally returns the `<BackupsTable>` component, which will be streamed to the UI.

The [Render Interface During Tool Call](https://sdk.vercel.ai/examples/next-app/tools/render-interface-during-tool-call) documentation in the Vercel AI SDK is a good thing to read if you're not familiar with what that can do already.

### What the LLM sees

Here's an example of a quick conversation with the LLM after just integrating InformAI into the `SchedulePage` component that we showed above. `SchedulePage` is just a Next JS page (therefore a React component) that shows some simple details about a backup schedule for devices on a network:

![Example Chat on Schedules page](/docs/inform-ai-chat-example.png)

By just adding the `<InformAI />` tag to our `SchedulePage`, we were able to have this conversation with the LLM about its contents, without having to do any other integration. But because we also defined our `FirewallsTableTool` tool, the LLM knew how to stream our `<BackupsTable>` component back instead of a text response.

Because `<BackupsTable>` also uses InformAI, via the `useInformAI` hook, the LLM also sees all of the information in the React component that it just streamed back, so it was able to answer questions about that too ("did all of those complete successfully?").

As our project was using the bundled `<CurrentState>` component while we had this conversation, we could easily see what the state sent to the LLM looks like directly in our UI:

![CurrentState after this exchange](/docs/current-state-example-2.png)

Here you can see that 4 `state` messages were published to InformAI - the first 2 were for the `SchedulePage` (which has name=`Schedule Detail Page`), and 2 for the freshly-streamed `<BackupsTable>` that the LLM sent back. Expanding the last message there, we can see that the LLM gave the streamed component a sensible name based on the user's request, and also has the `prompt` and `props` that we supply it in `<BackupsTable>`.

The 'Last Sent' message at the bottom tells us that all of the messages above were already sent to the LLM, as they were popped off the stack using `popRecentMessages` in our `<ChatWrapper>` component. `ChatWrapper` also did some deduping and conversion of the messages into an LLM-friendly format. If we add `console.log(aiState.get().messages)` to our `submitUserMessage` function we will see something like this:

```
[
  {
    id: '492b4wc',
    content: 'Component adc51d has updated its state\n' +
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
    content: 'Component 2b5e1c has updated its state\n' +
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

The internal messages stored by InformAI are converted into LLM-friendly strings via the [mapComponentMessages](https://github.com/edspencer/inform-ai/blob/main/src/utils.tsx) function, but it's easy to swap that out for any function you like. The default `mapComponentMessages` function just delegates to a function that looks like this:

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
