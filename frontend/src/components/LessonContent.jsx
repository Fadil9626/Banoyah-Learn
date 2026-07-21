import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders a lesson body written in Markdown — headings, lists, emphasis, links,
// tables, and images (custom SVG diagrams served from /lessons/*.svg, or photos
// from external URLs). Content is authored by admins/instructors (trusted), so
// we render Markdown only — no raw HTML pass-through.
const components = {
  h1: (p) => <h2 className="text-lg font-bold text-content mt-6 mb-2 first:mt-0" {...p} />,
  h2: (p) => <h3 className="text-base font-bold text-content mt-6 mb-2 first:mt-0" {...p} />,
  h3: (p) => <h4 className="text-sm font-bold text-content mt-5 mb-1.5" {...p} />,
  p:  (p) => <p className="text-[15px] text-content/90 leading-relaxed my-3" {...p} />,
  ul: (p) => <ul className="list-disc pl-5 my-3 space-y-1.5 text-[15px] text-content/90 marker:text-brand" {...p} />,
  ol: (p) => <ol className="list-decimal pl-5 my-3 space-y-1.5 text-[15px] text-content/90 marker:text-brand marker:font-semibold" {...p} />,
  li: (p) => <li className="leading-relaxed pl-1" {...p} />,
  strong: (p) => <strong className="font-semibold text-content" {...p} />,
  em: (p) => <em className="italic" {...p} />,
  a: (p) => <a className="text-brand font-medium underline underline-offset-2 hover:opacity-80" target="_blank" rel="noreferrer" {...p} />,
  blockquote: (p) => (
    <blockquote className="my-4 pl-4 border-l-2 text-content/80 italic"
      style={{ borderColor: "rgb(var(--brand))" }} {...p} />
  ),
  code: (p) => <code className="font-mono text-[13px] bg-surface-2 border border-line rounded px-1.5 py-0.5" {...p} />,
  hr: () => <hr className="my-6 border-line" />,
  img: ({ src, alt }) => (
    <figure className="my-5">
      <img src={src} alt={alt || ""} loading="lazy"
        className="w-full max-w-xl mx-auto rounded-xl border border-line bg-white" />
      {alt && <figcaption className="text-xs text-faint text-center mt-2">{alt}</figcaption>}
    </figure>
  ),
  table: (p) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full text-sm border border-line rounded-lg overflow-hidden" {...p} />
    </div>
  ),
  th: (p) => <th className="text-left font-semibold text-content bg-surface-2 px-3 py-2 border-b border-line" {...p} />,
  td: (p) => <td className="px-3 py-2 border-b border-line text-content/90 align-top" {...p} />,
};

export default function LessonContent({ body }) {
  if (!body || !body.trim()) return <p className="text-muted">—</p>;
  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{body}</ReactMarkdown>
    </div>
  );
}
