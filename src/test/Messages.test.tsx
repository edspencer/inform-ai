import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Messages } from "../ui/Messages";

describe("Messages", () => {
  it("renders correctly", () => {
    render(<Messages messages={[]} />);
    // expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
