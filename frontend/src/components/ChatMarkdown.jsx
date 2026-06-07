import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const COMPONENTS = {
  p: (props) => <p className="mb-2 whitespace-pre-wrap last:mb-0" {...props} />,
  ul: (props) => <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0" {...props} />,
  ol: (props) => <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0" {...props} />,
  li: (props) => <li className="leading-snug" {...props} />,
  a: ({ href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2"
      {...props}
    />
  ),
  // react-markdown v9+ removed the `inline` prop. Inline code hits `code` directly (no parent
  // <pre>); block code is <code> inside <pre>. Give `code` the inline pill styling always,
  // and neutralize it inside <pre> via the arbitrary-variant selector on `pre`.
  code: (props) => (
    <code className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]" {...props} />
  ),
  pre: (props) => (
    <pre
      className="mb-2 overflow-x-auto rounded-lg bg-foreground/10 p-2 last:mb-0 [&>code]:block [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
  h1: (props) => <h1 className="mb-1 mt-1 text-base font-semibold" {...props} />,
  h2: (props) => <h2 className="mb-1 mt-1 text-sm font-semibold" {...props} />,
  h3: (props) => <h3 className="mb-1 mt-1 text-sm font-semibold" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="mb-2 border-l-2 border-foreground/30 pl-2 italic opacity-80 last:mb-0"
      {...props}
    />
  ),
  table: (props) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-[0.85em]" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="border border-foreground/20 px-2 py-1 text-left font-semibold" {...props} />
  ),
  td: (props) => <td className="border border-foreground/20 px-2 py-1" {...props} />,
  hr: (props) => <hr className="my-2 border-foreground/20" {...props} />,
};

export default function ChatMarkdown({ children }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={COMPONENTS}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
