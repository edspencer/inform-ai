import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { CurrentState } from "../ui/CurrentState";
import { InformAIProvider } from "../InformAIContext";
import { useInformAI } from "../useInformAI";

describe("CurrentState", () => {
  it("renders correctly", () => {
    render(
      <InformAIProvider>
        <CurrentState />
      </InformAIProvider>
    );
    expect(screen.getByText("Current InformAI State")).toBeInTheDocument();
  });

  it("renders the current state", async () => {
    const name = "TestComponentName";

    const TestComponent = () => {
      useInformAI({
        name,
        props: {
          key: "value",
        },
        prompt: "This is a test component",
      });

      return <div>test-component-id</div>;
    };

    render(
      <InformAIProvider>
        <TestComponent />
        <CurrentState />
      </InformAIProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it("will collapse and expand when clicking the h1", async () => {
    const name = "TestComponentName";
    const prompt = "This is a test component";
    const componentId = "test-component-id";
    const props = { key: "value" };

    const TestComponent = () => {
      useInformAI({
        name,
        componentId,
        props,
        prompt,
      });

      return <div>test-component-id</div>;
    };

    render(
      <InformAIProvider>
        <TestComponent />
        <CurrentState />
      </InformAIProvider>
    );

    //test that the row for the component is shown
    await waitFor(() => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });

    const h1 = screen.getByText("Current InformAI State");
    expect(h1).toBeInTheDocument();
    fireEvent.click(h1);

    //test that the row for the component is hidden
    expect(screen.queryByText(name)).not.toBeInTheDocument();

    //make sure we can expand again
    fireEvent.click(h1);
    expect(screen.getByText(name)).toBeInTheDocument();
  });
});
