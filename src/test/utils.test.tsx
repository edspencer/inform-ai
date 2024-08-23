import { EventMessage, Message, StateMessage, FormattedMessage } from "../types";
import { randomId, mapComponentMessages } from "../utils";

describe("utils", () => {
  it("generates a random identifier of a specified length", () => {
    expect(randomId(6).length).toEqual(6);
  });

  describe("mapComponentMessages", () => {
    let formattedMessages: FormattedMessage[];
    let stateMessage: StateMessage;
    let eventMessage: EventMessage;
    let componentMessages: Message[];

    beforeEach(() => {
      stateMessage = {
        type: "state",
        id: "message1",
        createdAt: new Date(),
        content: {
          componentId: "test",
          name: "test component name",
          prompt: "test component prompt",
          props: {
            test: "test",
          },
        },
      };

      eventMessage = {
        type: "event",
        id: "message2",
        createdAt: new Date(),
        content: {
          componentId: "test",
          type: "test",
          description: "test",
        },
      };

      componentMessages = [stateMessage, eventMessage];
      formattedMessages = mapComponentMessages(componentMessages);
    });

    it("maps an array of component messages to an array of formatted messages", () => {
      expect(formattedMessages.length).toEqual(2);
    });

    it("creates a new id for each formatted message", () => {
      expect(formattedMessages[0].id).not.toEqual(formattedMessages[1].id);
    });

    describe("mapped state messages", () => {
      it("creates a new message id", () => {
        expect(formattedMessages[0].id).not.toBeUndefined();
      });

      it("exposes the type of event in the content", () => {
        expect(formattedMessages[0].content).toContain("Component test has updated its state");
      });

      it("exposes the name in the content", () => {
        expect(formattedMessages[0].content).toContain("Component Name: test component name");
      });

      it("exposes the props in the content", () => {
        expect(formattedMessages[0].content).toContain('Component props: {"test":"test"}');
      });

      it("exposes the prompt in the content", () => {
        expect(formattedMessages[0].content).toContain("Component self-description: test component prompt");
      });
    });

    describe("mapped event messages", () => {
      it("creates a new message id", () => {
        expect(formattedMessages[0].id).not.toBeUndefined();
      });

      it("maps an event message to its formatted content", () => {
        expect(formattedMessages[1].content).toEqual("Component test sent event test.\n  Description was: test");
      });
    });
  });
});
