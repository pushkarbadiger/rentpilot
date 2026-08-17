import Link from "next/link";
import { Bot, UserRound, ExternalLink } from "lucide-react";

function parseContent(content: string) {
  const segments: { type: "text" | "link"; text: string; href?: string }[] = [];
  const linkPattern =
    /\[([^\]]+)\]\((\/dashboard\/(?:tenants|properties|rent|payments)\/[^)]+)\)/g;

  let lastIndex = 0;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        text: content.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "link",
      text: match[1],
      href: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      text: content.slice(lastIndex),
    });
  }

  return segments;
}

function RenderedContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  function flushList() {
    if (!currentList) return;
    const ListTag = currentList.type === "ol" ? "ol" : "ul";
    elements.push(
      <ListTag
        key={`list-${elements.length}`}
        className={`my-2 space-y-1 ${currentList.type === "ol" ? "list-decimal pl-5" : "list-disc pl-5"}`}
      >
        {currentList.items.map((item, i) => (
          <li key={i} className="text-sm text-slate-700">
            <ParseInline content={item} />
          </li>
        ))}
      </ListTag>
    );
    currentList = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^\d+\.\s/.test(trimmed)) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(trimmed.replace(/^\d+\.\s/, ""));
      continue;
    }

    if (/^[-*]\s/.test(trimmed)) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(trimmed.replace(/^[-*]\s/, ""));
      continue;
    }

    flushList();

    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      elements.push(
        <p
          key={`h-${elements.length}`}
          className="mt-3 text-sm font-semibold text-slate-900"
        >
          {trimmed.slice(2, -2)}
        </p>
      );
      continue;
    }

    if (trimmed === "") {
      elements.push(<div key={`sp-${elements.length}`} className="h-2" />);
      continue;
    }

    elements.push(
      <p key={`p-${elements.length}`} className="text-sm text-slate-700">
        <ParseInline content={trimmed} />
      </p>
    );
  }

  flushList();

  return <>{elements}</>;
}

function ParseInline({ content }: { content: string }) {
  const segments = parseContent(content);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "link" ? (
          <Link
            key={i}
            href={seg.href!}
            className="inline-flex items-center gap-0.5 font-medium text-indigo-600 hover:text-indigo-700"
          >
            {seg.text}
            <ExternalLink className="inline h-3 w-3" />
          </Link>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

export function ChatMessage({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <span
        className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "order-2 bg-slate-900 text-white"
            : "bg-indigo-100 text-indigo-700"
        }`}
      >
        {isUser ? (
          <UserRound className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </span>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 ${
          isUser
            ? "order-1 bg-slate-900 text-white"
            : "bg-slate-100 text-slate-900"
        }`}
      >
        {isUser ? (
          <p className="text-sm">{content}</p>
        ) : (
          <RenderedContent content={content} />
        )}
      </div>
    </div>
  );
}
