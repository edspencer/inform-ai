"use client";

export function ChatBox({ onSubmit }: { onSubmit: (message: string) => Promise<boolean> }) {
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
          autoFocus
          id="message"
          name="message"
          type="message"
          placeholder="Ask me anything..."
          className="chatbox-input"
        />
      </div>
      <button type="submit" className="chatbox-button">
        Send
      </button>
    </form>
  );
}
