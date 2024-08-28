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
  sendButtonText = "Send",
  onSubmit,
}: {
  autoFocus?: boolean;
  placeholder?: string | null;
  sendButtonText?: string;
  onSubmit: (message: string) => Promise<boolean>;
}) {
  return (
    <form
      role="form"
      onSubmit={async (e: any) => {
        e.preventDefault();

        const messageEl = e.target.elements["message"];

        // Blur focus on mobile
        if (window.innerWidth < 600) {
          messageEl?.blur();
        }

        const submitSuccess = await onSubmit(messageEl?.value);

        if (submitSuccess) {
          messageEl.value = "";
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
          name="message"
          type="message"
          placeholder={placeholder || undefined}
          className="chatbox-input"
        />
      </div>
      <button type="submit" className="chatbox-button">
        {sendButtonText}
      </button>
    </form>
  );
}
