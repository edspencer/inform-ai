"use client";

/**
 * A reusable chat box component that accepts user input and submits it via a callback function.
 *
 * @param {boolean} autoFocus - Whether the input field should automatically focus when the component mounts.
 * @param {(message: string) => Promise<boolean>} onSubmit - A callback function that handles the submission of the user's message.
 * @return {JSX.Element} The rendered chat box component.
 */
export function ChatBox({
  autoFocus = false,
  placeholder = "Ask me anything...",
  onSubmit,
}: {
  autoFocus?: boolean;
  placeholder?: string | null;
  onSubmit: (message: string) => Promise<boolean>;
}) {
  return (
    <form
      onSubmit={async (e: any) => {
        e.preventDefault();

        // Blur focus on mobile
        if (window.innerWidth < 600) {
          e.target["message"]?.blur();
        }

        const submitSuccess = await onSubmit(e.target["message"].value);

        if (submitSuccess) {
          e.target["message"].value = "";
        }
      }}
      className="chatbox"
    >
      <div className="chatbox-wrap">
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <input
          autoComplete="off"
          autoFocus={autoFocus}
          id="message"
          name="message"
          type="message"
          placeholder={placeholder || undefined}
          className="chatbox-input"
        />
      </div>
      <button type="submit" className="chatbox-button">
        Send
      </button>
    </form>
  );
}
