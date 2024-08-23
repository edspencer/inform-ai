import { render, screen, act, fireEvent } from "@testing-library/react";
import { useInformAI } from "../useInformAI";
import { InformAIProvider, useInformAIContext, dedupeMessages } from "../InformAIContext";
import { EventMessage, StateMessage } from "../types";

describe("useInformAI Hook", () => {
  it('creates a unique "componentId" for each component if not passed', () => {
    let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;

    const TestComponent = () => {
      useInformAI({
        name: "Test Component",
        props: {
          key: "value",
        },
        prompt: "This is a test component",
      });

      contextValues = useInformAIContext();
      return null;
    };

    render(
      <InformAIProvider>
        <TestComponent />
      </InformAIProvider>
    );

    const messages = contextValues!.messages;
    expect(messages[0].content.componentId!.length).toEqual(6);
  });

  it("honors custom componentIds", () => {
    const componentId = "test-component-id";
    let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;

    const TestComponent = () => {
      useInformAI({
        componentId,
        name: "Test Component",
        props: {
          key: "value",
        },
        prompt: "This is a test component",
      });

      contextValues = useInformAIContext();
      return null;
    };

    render(
      <InformAIProvider>
        <TestComponent />
      </InformAIProvider>
    );

    const messages = contextValues!.messages;
    expect(messages[0].content.componentId).toEqual(componentId);
  });

  it("adds a state message when contents are provided", () => {
    let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;

    const TestComponent = () => {
      useInformAI({
        name: "Test Component",
        props: {
          key: "value",
        },
        prompt: "This is a test component",
      });

      contextValues = useInformAIContext();
      return null;
    };

    render(
      <InformAIProvider>
        <TestComponent />
      </InformAIProvider>
    );

    const messages = contextValues!.messages;
    expect(messages.length).toEqual(1);

    const message = messages[0] as StateMessage;
    expect(message.content.name).toEqual("Test Component");
    expect(message.content.prompt).toEqual("This is a test component");
    expect(message.content.props).toEqual({ key: "value" });
  });

  it("adds a message when contents are not provided", () => {
    let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;

    const TestComponent = () => {
      useInformAI();

      contextValues = useInformAIContext();
      return null;
    };

    render(
      <InformAIProvider>
        <TestComponent />
      </InformAIProvider>
    );

    const messages = contextValues!.messages;
    expect(messages.length).toEqual(1);
  });

  it("generates an 8 character message id for each message", () => {
    let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;

    const TestComponent = () => {
      useInformAI({
        name: "Test Component",
        props: {
          key: "value",
        },
        prompt: "This is a test component",
      });

      contextValues = useInformAIContext();
      return null;
    };

    render(
      <InformAIProvider>
        <TestComponent />
      </InformAIProvider>
    );

    const messages = contextValues!.messages;
    expect(messages[0].id).toBeDefined();
    expect(messages[0].id.length).toEqual(8);
  });

  describe("getting recent messages", () => {
    it("returns an empty array if no messages have been added", () => {
      let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;

      const TestComponent = () => {
        contextValues = useInformAIContext();
        return null;
      };

      render(
        <InformAIProvider>
          <TestComponent />
        </InformAIProvider>
      );

      expect(contextValues!.getRecentMessages()).toEqual([]);
    });

    it("returns the most recent messages", () => {
      let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;

      const TestComponent = () => {
        useInformAI({
          name: "Test Component",
          props: {
            key: "value",
          },
          prompt: "This is a test component",
        });

        contextValues = useInformAIContext();
        return null;
      };

      render(
        <InformAIProvider>
          <TestComponent />
        </InformAIProvider>
      );

      const messages = contextValues!.getRecentMessages();
      expect(messages.length).toEqual(1);
    });
  });

  describe("clearing messages", () => {
    let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;

    beforeEach(() => {
      const TestComponent = () => {
        useInformAI({
          name: "Test Component",
          props: {
            key: "value",
          },
          prompt: "This is a test component",
        });

        contextValues = useInformAIContext();
        return null;
      };

      render(
        <InformAIProvider>
          <TestComponent />
        </InformAIProvider>
      );
    });

    it("clears all messages", () => {
      act(() => {
        contextValues!.clearRecentMessages();
      });

      expect(contextValues!.messages.length).toEqual(0);
    });
  });

  describe("popping recent messages", () => {
    it("sets the conversation lastSentAt to now", () => {
      let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;

      const TestComponent = () => {
        useInformAI({
          name: "Test Component",
          props: {
            key: "value",
          },
          prompt: "This is a test component",
        });

        contextValues = useInformAIContext();
        return null;
      };

      render(
        <InformAIProvider>
          <TestComponent />
        </InformAIProvider>
      );

      const previousDate = contextValues!.conversation.lastSentAt;

      act(() => {
        contextValues!.popRecentMessages();
      });

      expect(+contextValues!.conversation.lastSentAt).toBeGreaterThanOrEqual(+previousDate);
    });
  });

  describe("Multiple state messages from the same component", () => {
    let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;

    beforeEach(() => {
      const TestComponent = () => {
        const { addState, addEvent } = useInformAI({
          name: "Test Component",
          props: {
            key: "value",
          },
          prompt: "This is a test component",
        });

        contextValues = useInformAIContext();

        const handleClick = () => {
          addEvent({ type: "click", data: { key: "value" } });
          addState({ props: { key: "newValue" } });
        };

        return <div onClick={handleClick}>test component</div>;
      };

      render(
        <InformAIProvider>
          <TestComponent />
        </InformAIProvider>
      );

      fireEvent.click(screen.getByText("test component"));
    });

    it("does not generate a new componentId", () => {
      const messages = contextValues!.messages;

      expect(messages.length).toEqual(3);
      expect(messages[0].content.componentId!.length).toEqual(6);
      expect(messages[0].content.componentId).toEqual(messages[1].content.componentId);
    });

    it("dedupes correctly, returning only the latest state message", () => {
      const deduped = dedupeMessages(contextValues!.messages);
      expect(deduped.length).toEqual(2);

      const eventMessage = deduped[0] as EventMessage;
      const stateMessage = deduped[1] as StateMessage;
      expect(stateMessage.content.props).toEqual({ key: "newValue" });

      //should leave event messages unmolested
      expect(eventMessage.content.type).toEqual("click");
      expect(eventMessage.content.data).toEqual({ key: "value" });
    });
  });

  describe("event messages", () => {
    let contextValues: ReturnType<typeof useInformAIContext> | undefined = undefined;

    beforeEach(() => {
      const TestComponent = () => {
        const { addEvent } = useInformAI({
          name: "Test Component",
          props: {
            key: "value",
          },
          prompt: "This is a test component",
        });

        contextValues = useInformAIContext();

        const handleClick = () => {
          addEvent({ type: "click", data: { key: "value" } });
        };

        return <div onClick={handleClick}>test component</div>;
      };

      render(
        <InformAIProvider>
          <TestComponent />
        </InformAIProvider>
      );
    });

    it("adds an event message", () => {
      fireEvent.click(screen.getByText("test component"));

      expect(contextValues!.messages.length).toEqual(2);

      const eventMessage = contextValues!.messages[1] as EventMessage;
      expect(eventMessage.content.type).toEqual("click");
      expect(eventMessage.content.data).toEqual({ key: "value" });
    });
  });
});
