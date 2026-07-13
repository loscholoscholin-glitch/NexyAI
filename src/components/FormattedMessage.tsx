import React from "react";

export function FormattedMessage({ content }: { content: string }) {
  // Simple markdown parser to avoid external dependencies while preserving their old features.
  
  if (!content) return null;

  const parts = content.split(/(```[\w]*\n[\s\S]*?```|`[^`\n]+`|\*\*.+?\*\*|\*[^*\n]+\*)/g);

  return (
    <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const match = part.match(/```([\w]*)\n([\s\S]*?)```/);
          if (match) {
            const [, lang, code] = match;
            return (
              <div key={index} className="my-3 rounded-xl border border-white/10 bg-black/30 overflow-hidden">
                {lang && (
                  <div className="bg-black/40 px-4 py-1.5 text-xs font-mono text-[var(--muted)] border-b border-white/5">
                    {lang}
                  </div>
                )}
                <pre className="p-4 overflow-x-auto text-sm font-mono">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }
        }
        
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={index} className="rounded-md bg-black/20 px-1.5 py-0.5 font-mono text-sm text-[var(--cyan)]">
              {part.slice(1, -1)}
            </code>
          );
        }

        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
        }

        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={index} className="italic">{part.slice(1, -1)}</em>;
        }

        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}
