import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatBox } from "../ui/ChatBox";

describe("ChatBox", () => {
  it("renders correctly", () => {
    render(<ChatBox onSubmit={async () => true} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("honors autoFocus", () => {
    render(<ChatBox onSubmit={async () => true} autoFocus={true} />);
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("honors placeholder", () => {
    render(<ChatBox onSubmit={async () => true} placeholder="test placeholder" />);
    expect(screen.getByPlaceholderText("test placeholder")).toBeInTheDocument();
  });

  it('clears the input if "onSubmit" returns true', async () => {
    const onSubmit = jest.fn(async () => true);

    render(<ChatBox onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox");
    const button = screen.getByRole("button");

    fireEvent.change(input, { target: { value: "test" } });
    expect(input).toHaveValue("test");

    fireEvent.click(button);

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not clear the input if "onSubmit" returns false', async () => {
    const onSubmit = jest.fn(async () => false);

    render(<ChatBox onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox");
    const form = screen.getByRole("form");

    fireEvent.change(input, { target: { value: "test" } });

    expect(input).toHaveValue("test");

    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("test");
  });
});
