"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Bot,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ChatMessage } from "@/components/ai/ChatMessage";
import { SuggestedPrompts } from "@/components/ai/SuggestedPrompts";
import { AILoading } from "@/components/ai/AILoading";
import { PortfolioBrief } from "@/components/ai/PortfolioBrief";
import { PriorityList } from "@/components/ai/PriorityList";
import type { PortfolioContext } from "@/lib/services/ai/portfolio-context";
import type { DeterministicInsight } from "@/lib/services/ai/deterministic-insights";

type Message = { role: "user" | "assistant"; content: string };

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioContext, setPortfolioContext] =
    useState<PortfolioContext | null>(null);
  const [insights, setInsights] = useState<DeterministicInsight[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const [propertiesRes, tenantsRes, paymentsRes] = await Promise.all([
          fetch("/api/properties"),
          fetch("/api/tenants"),
          fetch("/api/rent-payments"),
        ]);

        if (!propertiesRes.ok || !tenantsRes.ok || !paymentsRes.ok) {
          throw new Error("Failed to load portfolio data");
        }

        const [properties, tenants, payments] = await Promise.all([
          propertiesRes.json(),
          tenantsRes.json(),
          paymentsRes.json(),
        ]);

        const props = Array.isArray(properties) ? properties : [];
        const tnts = Array.isArray(tenants) ? tenants : [];
        const pmts = Array.isArray(payments) ? payments : [];

        const { buildPortfolioContext } = await import(
          "@/lib/services/ai/portfolio-context"
        );
        const { calculateDeterministicInsights } = await import(
          "@/lib/services/ai/deterministic-insights"
        );

        const ctx = buildPortfolioContext(props, tnts, pmts);
        const ins = calculateDeterministicInsights(props, tnts, pmts);

        setPortfolioContext(ctx);
        setInsights(ins);
      } catch (err) {
        console.error("[AI] Failed to load portfolio", err);
        setInitialError(
          "Unable to load portfolio data. Please try refreshing."
        );
      } finally {
        setInitialLoading(false);
      }
    }

    void loadPortfolio();
  }, []);

  async function sendMessage(value = input) {
    const message = value.trim();
    if (!message || loading) return;

    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "RentPilot AI is unavailable right now."
        );
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message ?? "I could not generate a response.",
        },
      ]);
    } catch (requestError) {
      console.error("[RentPilot AI] request failed", requestError);
      setError(
        "RentPilot AI couldn't answer right now. Check the AI service and try again."
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  const hasPortfolio =
    portfolioContext &&
    (portfolioContext.portfolio.totalProperties > 0 ||
      portfolioContext.tenants.length > 0);
  const showWelcome = messages.length === 0 && !loading;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-950">
              RentPilot AI
            </h1>
            <p className="text-xs text-slate-500">
              Portfolio intelligence assistant
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh data
        </Button>
      </div>

      {initialLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
          <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
        </div>
      ) : initialError ? (
        <Alert variant="error">{initialError}</Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {portfolioContext && <PortfolioBrief context={portfolioContext} />}
          <PriorityList insights={insights} />
        </div>
      )}

      <section
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40"
        aria-label="RentPilot AI conversation"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Ask RentPilot
            </p>
            <p className="text-xs text-slate-500">
              {hasPortfolio
                ? "Analyzing your live portfolio data"
                : "Portfolio assistant"}
            </p>
          </div>
        </div>

        <div
          className="min-h-[300px] max-h-[500px] space-y-4 overflow-y-auto p-4 sm:min-h-[360px] sm:p-6"
          aria-live="polite"
        >
          {showWelcome && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Ask me about your portfolio
              </h3>
              <p className="mt-1.5 max-w-sm text-sm text-slate-500">
                I can analyze your properties, tenants, and rent payments.
                Ask a question or try a suggestion below.
              </p>
              <div className="mt-5">
                <SuggestedPrompts
                  onSelect={(p) => void sendMessage(p)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <ChatMessage
              key={`${message.role}-${index}`}
              role={message.role}
              content={message.content}
            />
          ))}

          {loading && <AILoading />}

          {error && (
            <Alert variant="error" className="mx-auto max-w-md">
              {error}
            </Alert>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 p-4 sm:p-5">
          {messages.length > 0 && !loading && (
            <div className="mb-3">
              <SuggestedPrompts
                onSelect={(p) => void sendMessage(p)}
                disabled={loading}
              />
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your portfolio…"
              aria-label="Ask RentPilot AI"
              disabled={loading}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors duration-150 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-11 sm:w-28"
            >
              {loading ? (
                "Thinking…"
              ) : (
                <>
                  Ask <ArrowUp className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
