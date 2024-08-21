import { render, screen, act } from "@testing-library/react";
import { InformAIContextType, InformAIProvider, useInformAIContext } from "../InformAIContext";
import { ComponentState, ComponentEvent } from "../types";

describe("InformAIProvider", () => {
  it("renders children correctly", () => {
    render(
      <InformAIProvider>
        <div>Test Child</div>
      </InformAIProvider>
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("provides the correct default context values", () => {
    let contextValues: InformAIContextType | undefined = undefined;
    const TestComponent = () => {
      contextValues = useInformAIContext();
      return null;
    };

    render(
      <InformAIProvider>
        <TestComponent />
      </InformAIProvider>
    );

    expect(contextValues!.messages).toEqual([]);
    expect(contextValues!.conversation.id).toBeDefined();
    expect(contextValues!.conversation.createdAt).toBeInstanceOf(Date);
  });

  it("adds a state message and retrieves it by componentId", () => {
    const testComponentId = "test-component-id";
    const testState: ComponentState = { componentId: testComponentId, props: { key: "value" } };

    let contextValues: InformAIContextType;
    const TestComponent = () => {
      contextValues = useInformAIContext();
      return null;
    };

    render(
      <InformAIProvider>
        <TestComponent />
      </InformAIProvider>
    );

    act(() => {
      contextValues!.addState(testState);
    });

    const retrievedState = contextValues!.getState(testComponentId);
    expect(retrievedState).toEqual(testState);
  });

  it("updates the state of an existing component", () => {
    const testComponentId = "test-component-id";
    const initialState: ComponentState = { componentId: testComponentId, props: { key: "initial" } };
    const updatedState = { props: { key: "updated" } };

    let contextValues: InformAIContextType;
    const TestComponent = () => {
      contextValues = useInformAIContext();
      return null;
    };

    render(
      <InformAIProvider>
        <TestComponent />
      </InformAIProvider>
    );

    act(() => {
      contextValues.addState(initialState);
    });

    act(() => {
      contextValues.updateState(testComponentId, updatedState);
    });

    const retrievedState = contextValues!.getState(testComponentId);
    expect(retrievedState).toEqual({ componentId: testComponentId, ...updatedState });
  });

  it("adds and retrieves event messages", () => {
    const testEvent: ComponentEvent = { componentId: "test-event", type: "clicked" };

    let contextValues;
    const TestComponent = () => {
      contextValues = useInformAIContext();
      return null;
    };

    render(
      <InformAIProvider>
        <TestComponent />
      </InformAIProvider>
    );

    act(() => {
      contextValues!.addEvent(testEvent);
    });

    const recentMessages = contextValues!.getRecentMessages();

    expect(recentMessages.length).toBe(1);
    expect(recentMessages[0].content).toEqual(testEvent);
  });

  it("clears recent messages correctly", () => {
    const testEvent: ComponentEvent = { componentId: "test-event", type: "clicked" };

    let contextValues: InformAIContextType;
    const TestComponent = () => {
      contextValues = useInformAIContext();
      return null;
    };

    render(
      <InformAIProvider>
        <TestComponent />
      </InformAIProvider>
    );

    act(() => {
      contextValues!.addEvent(testEvent);
    });

    act(() => {
      contextValues!.clearRecentMessages();
    });

    const recentMessages = contextValues!.getRecentMessages();
    expect(recentMessages.length).toBe(0);
  });

  it("throws error when useInformAIContext is used outside of provider", () => {
    const renderOutsideProvider = () => {
      const TestComponent = () => {
        useInformAIContext();
        return null;
      };

      render(<TestComponent />);
    };

    expect(renderOutsideProvider).toThrow("useInformAIContext must be used within an InformAIProvider");
  });
});
