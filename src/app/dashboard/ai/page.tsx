"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm RentPilot AI. Ask me about your properties, tenants, or rent payments.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const message = input.trim();

    if (!message || loading) return;

    setMessages((current) => [
      ...current,
      { role: "user", content: message },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message ?? data.error ?? "Something went wrong.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Could not connect to RentPilot AI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-semibold">RentPilot AI</h1>

      <p className="mt-2 text-slate-500">
        Ask questions about your rental business.
      </p>

      <div className="mt-8 min-h-[400px] rounded-2xl border bg-white p-5 shadow-sm">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[80%] rounded-2xl bg-slate-900 px-4 py-3 text-white"
                  : "max-w-[80%] rounded-2xl bg-slate-100 px-4 py-3 text-slate-900"
              }
            >
              {message.content}
            </div>
          ))}

          {loading && (
            <div className="max-w-[80%] rounded-2xl bg-slate-100 px-4 py-3 text-slate-500">
              RentPilot is thinking...
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Ask RentPilot anything..."
            className="flex-1 rounded-xl border px-4 py-3 outline-none"
          />

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white disabled:opacity-40"
          >
            {loading ? "Thinking..." : "Ask AI"}
          </button>
        </div>
      </div>
    </main>
  );
}
