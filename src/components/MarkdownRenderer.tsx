import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { soundEngine } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

function highlightCode(code: string, lang: string): React.ReactNode[] {
  const language = (lang || '').toLowerCase();
  
  if (language === 'html' || language === 'xml' || language === 'svg') {
    const htmlRegex = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z0-9:-]+>?)|(\s[a-zA-Z0-9:-]+(?=\=))|("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g;
    return runTokenize(code, htmlRegex, (match, g1, g2, g3, g4) => {
      if (g1) return { type: 'comment', text: g1 };
      if (g2) return { type: 'tag', text: g2 };
      if (g3) return { type: 'attr-name', text: g3 };
      if (g4) return { type: 'attr-value', text: g4 };
      return { type: 'text', text: match };
    });
  }

  if (language === 'css') {
    const cssRegex = /(\/\*[\s\S]*?\*\/)|(\.[a-zA-Z0-9_-]+|#[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+(?=\s*\{))|([a-zA-Z0-9_-]+(?=\s*:))|(:[^;{}]+)/g;
    return runTokenize(code, cssRegex, (match, g1, g2, g3, g4) => {
      if (g1) return { type: 'comment', text: g1 };
      if (g2) return { type: 'selector', text: g2 };
      if (g3) return { type: 'property', text: g3 };
      if (g4) return { type: 'value', text: g4 };
      return { type: 'text', text: match };
    });
  }

  const isPython = language === 'python' || language === 'py';
  const isJson = language === 'json';
  
  let keywordRegexStr = '\\b(?:const|let|var|function|return|import|export|from|class|extends|if|else|for|while|switch|case|break|continue|new|this|typeof|instanceof|try|catch|finally|throw|async|await|yield|null|undefined|true|false|default|interface|type|public|private|protected|readonly|static|get|set|as|any|void|unknown|never|string|number|boolean)\\b';
  if (isPython) {
    keywordRegexStr = '\\b(?:def|class|return|import|from|as|if|elif|else|for|while|in|is|not|and|or|try|except|finally|raise|with|yield|lambda|pass|break|continue|global|nonlocal|assert|None|True|False)\\b';
  } else if (isJson) {
    keywordRegexStr = '\\b(?:true|false|null)\\b';
  }

  const commentPattern = isPython ? '(#.*)' : '(\/\/.*|\\/\\*[\\s\\S]*?\\*\\/)';
  const stringPattern = '(\'(?:\\\\.|[^\'\\\\])*\'|"(?:\\\\.|[^"\\\\])*"|`(?:\\\\.|[^`\\\\])*`)';
  const numberPattern = '(\\b\\d+(?:\\.\\d+)?\\b)';
  const keywordPattern = `(${keywordRegexStr})`;
  const functionPattern = '(\\b\\w+(?=\\((?:[^()]*|\\([^()]*\\))*\\)))';
  const classNamePattern = '(\\b[A-Z]\\w*\\b)';
  const operatorPattern = '([+\\-*/%&|^!=<>?~:]+)';
  const punctuationPattern = '([{}()\\[\\],.;])';

  const combinedRegex = new RegExp(
    `${commentPattern}|${stringPattern}|${numberPattern}|${keywordPattern}|${functionPattern}|${classNamePattern}|${operatorPattern}|${punctuationPattern}`,
    'g'
  );

  return runTokenize(code, combinedRegex, (match, g1, g2, g3, g4, g5, g6, g7, g8) => {
    if (g1) return { type: 'comment', text: g1 };
    if (g2) return { type: 'string', text: g2 };
    if (g3) return { type: 'number', text: g3 };
    if (g4) return { type: 'keyword', text: g4 };
    if (g5) return { type: 'function', text: g5 };
    if (g6) return { type: 'class-name', text: g6 };
    if (g7) return { type: 'operator', text: g7 };
    if (g8) return { type: 'punctuation', text: g8 };
    return { type: 'text', text: match };
  });
}

function runTokenize(
  code: string,
  regex: RegExp,
  mapFn: (match: string, ...groups: string[]) => { type: string; text: string }
): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      const plainText = code.slice(lastIndex, match.index);
      result.push(<span key={`text-${lastIndex}`}>{plainText}</span>);
    }

    const matchedText = match[0];
    const groups = match.slice(1).map(g => g || '');
    const token = mapFn(matchedText, ...groups);

    let className = "";
    if (token.type === 'comment') className = "text-zinc-500 italic";
    else if (token.type === 'string') className = "text-amber-300";
    else if (token.type === 'number') className = "text-orange-400";
    else if (token.type === 'keyword') className = "text-pink-400 font-bold";
    else if (token.type === 'function') className = "text-sky-400";
    else if (token.type === 'class-name') className = "text-teal-300 font-semibold";
    else if (token.type === 'operator') className = "text-indigo-300";
    else if (token.type === 'punctuation') className = "text-zinc-400";
    else if (token.type === 'tag') className = "text-sky-400 font-semibold";
    else if (token.type === 'attr-name') className = "text-purple-300";
    else if (token.type === 'attr-value') className = "text-amber-200";
    else if (token.type === 'selector') className = "text-teal-400 font-bold";
    else if (token.type === 'property') className = "text-pink-300";
    else if (token.type === 'value') className = "text-amber-100";

    if (className) {
      result.push(
        <span key={`token-${match.index}`} className={className}>
          {token.text}
        </span>
      );
    } else {
      result.push(<span key={`token-${match.index}`}>{token.text}</span>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < code.length) {
    const plainText = code.slice(lastIndex);
    result.push(<span key={`text-${lastIndex}`}>{plainText}</span>);
  }

  return result;
}

function CodeBlock({ node, inline, className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const { settings } = useAppStore();
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const isBlock = !inline && (match || String(children).includes('\n'));

  const handleCopy = () => {
    if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isBlock) {
    const displayLanguage = language || 'text';
    return (
      <div className="relative my-4 rounded-xl overflow-hidden border border-white/10 bg-[#121318]">
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
          <span className="text-xs font-mono text-[var(--muted)]">{displayLanguage}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm font-mono scrollbar-thin text-zinc-100 bg-transparent">
          <code>{highlightCode(String(children).replace(/\n$/, ''), displayLanguage)}</code>
        </pre>
      </div>
    );
  }

  return (
    <code {...props} className="rounded-md bg-black/20 px-1.5 py-0.5 font-mono text-sm text-[var(--cyan)]">
      {children}
    </code>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none text-[15px] leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-[var(--cyan)] hover:underline" />
          ),
          p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-[var(--violet)] pl-4 italic text-[var(--muted)] my-4" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
