import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ChatWrapper } from "../ui/ChatWrapper";
import { InformAIProvider, useInformAIContext } from "../InformAIContext";
import { useState } from "react";
import { useInformAI } from "../useInformAI";
import { FormattedMessage } from "../types";

describe("ChatWrapper", () => {
  let currentMessages: any[];

  const AppChatWrapper = ({ submitUserMessage = jest.fn() }: { submitUserMessage?: jest.Mock }) => {
    const [messages, setMessages] = useState<any[]>([]);

    currentMessages = messages;

    return <ChatWrapper setMessages={setMessages} submitUserMessage={submitUserMessage} messages={messages} />;
  };

  it("renders correctly", () => {
    render(
      <InformAIProvider>
        <AppChatWrapper />
      </InformAIProvider>
    );

    //just checks that the component renders the ChatBox
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders user messages correctly", async () => {
    render(
      <InformAIProvider>
        <AppChatWrapper />
      </InformAIProvider>
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "test message" },
    });
    fireEvent.submit(screen.getByRole("form"));

    await waitFor(() => screen.getByText("test message"));
  });

  describe("collecting messages to send to the LLM", () => {
    let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;
    let mockSubmitUserMessage: jest.Mock;

    const AppComponent = () => {
      const { addState } = useInformAI({
        name: "MyAppComponent",
        props: { key: "value" },
        prompt: "MyAppComponent prompt",
      });

      contextValues = useInformAIContext();

      const handleClick = () => {
        addState({ props: { key: "newValue" } });
      };

      return <div onClick={handleClick}>clickable element</div>;
    };

    beforeEach(async () => {
      mockSubmitUserMessage = jest.fn(async () => ({
        id: "response-id",
        content: "response message",
        role: "assistant",
      }));

      render(
        <InformAIProvider>
          <AppComponent />
          <AppChatWrapper submitUserMessage={mockSubmitUserMessage} />
        </InformAIProvider>
      );

      //after this we should have 2 state messages in the context
      fireEvent.click(screen.getByText("clickable element"));

      expect(contextValues!.messages.length).toBe(2);

      //submit a message from the user
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "test message" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("form"));
      });
    });

    it("sends the correct deduped state and user messages to submitUserMessage", async () => {
      //test that the correct messages were sent to submitUserMessage
      expect(mockSubmitUserMessage).toHaveBeenCalledTimes(1);
      const [submittedMessages] = mockSubmitUserMessage.mock.calls[0];

      //the 2 state messages for the component should have been deduped into 1 (plus the user message)
      expect(submittedMessages.length).toBe(2);

      const stateMessage = submittedMessages[0] as FormattedMessage;
      expect(stateMessage.content).toContain('Component props: {"key":"newValue"}');
      expect(stateMessage.role).toEqual("system");
      expect(stateMessage.id.length).toEqual(10);

      const userMessage = submittedMessages[1] as FormattedMessage;
      expect(userMessage.content).toEqual("test message");
      expect(userMessage.role).toEqual("user");
      expect(userMessage.id.length).toEqual(10);
    });

    it("ends up with the correct messages", async () => {
      //we should end up with 3 messages - a state message, a user message, and an LLM response
      expect(currentMessages.length).toBe(3);

      const stateMessage = currentMessages[0] as FormattedMessage;
      expect(stateMessage.content).toContain('Component props: {"key":"newValue"}');
      expect(stateMessage.role).toEqual("system");
      expect(stateMessage.id.length).toEqual(10);

      const userMessage = currentMessages[1] as FormattedMessage;
      expect(userMessage.role).toEqual("user");
      expect(userMessage.id.length).toEqual(10);

      const responseMessage = currentMessages[2] as FormattedMessage;
      expect(responseMessage.role).toEqual("assistant");
      expect(responseMessage.content).toEqual("response message");
      expect(responseMessage.id).toEqual("response-id");
    });

    it("clears the text input", async () => {
      expect(screen.getByRole("textbox")).toHaveValue("");
    });
  });
});
