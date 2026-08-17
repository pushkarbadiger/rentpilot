"use client";

const prompts = [
  {
    label: "How is my portfolio doing?",
    icon: "📊",
  },
  {
    label: "Who owes me money?",
    icon: "💰",
  },
  {
    label: "Show me overdue rent.",
    icon: "⚠️",
  },
  {
    label: "Which property needs attention?",
    icon: "🏠",
  },
  {
    label: "Give me a monthly summary.",
    icon: "📋",
  },
  {
    label: "What should I follow up on?",
    icon: "🎯",
  },
];

export function SuggestedPrompts({
  onSelect,
  disabled,
}: {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt.label}
          type="button"
          onClick={() => onSelect(prompt.label)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">{prompt.icon}</span>
          {prompt.label}
        </button>
      ))}
    </div>
  );
}
