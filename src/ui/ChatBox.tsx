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
      className="sm:flex flex-1"
    >
      <div className="w-full">
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
          className="px-4 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
      </div>
      <button
        type="submit"
        className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:mt-0 sm:w-auto"
      >
        Send
      </button>
    </form>
  );
}
