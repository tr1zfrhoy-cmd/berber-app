import React from "react";

/**
 * Lightweight Arabic-friendly Markdown renderer for admin-editable legal text.
 * Supports a tiny subset that matches what the editor uses:
 *
 *   # Heading 1      → page-level title (skipped — title already in page header)
 *   ## Heading 2     → section heading (gold)
 *   - bullet         → list item with gold bullet
 *   **bold**         → inline bold
 *   blank line       → paragraph break
 *
 * Anything else renders as a plain paragraph with preserved line wrapping.
 */

const inlineRender = (text) => {
  // Split on **bold** keeping the markers, then alternate.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return <b key={`b-${i}-${p}`} className="text-white font-black">{p.slice(2, -2)}</b>;
    }
    return <React.Fragment key={`t-${i}-${p.length}`}>{p}</React.Fragment>;
  });
};

export default function Markdown({ text = "", testid }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  const blocks = [];
  let listBuf = [];
  let paraBuf = [];

  const flushList = () => {
    if (!listBuf.length) return;
    blocks.push(
      <ul key={`l${blocks.length}`} className="mt-2 mb-3 space-y-1.5 list-none">
        {listBuf.map((item, i) => (
          <li key={`li-${i}-${item.length}`} className="flex gap-2">
            <span className="text-[#D4AF37] flex-shrink-0">•</span>
            <span>{inlineRender(item)}</span>
          </li>
        ))}
      </ul>
    );
    listBuf = [];
  };

  const flushPara = () => {
    if (!paraBuf.length) return;
    blocks.push(
      <p key={`p${blocks.length}`} className="text-zinc-300 leading-7 mb-3">
        {paraBuf.map((line, i) => (
          <React.Fragment key={`fr-${i}-${line.length}`}>
            {i > 0 && <br />}
            {inlineRender(line)}
          </React.Fragment>
        ))}
      </p>
    );
    paraBuf = [];
  };

  const flushAll = () => { flushList(); flushPara(); };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (/^##\s+/.test(line)) {
      flushAll();
      blocks.push(
        <h2 key={`h${blocks.length}`} className="font-black text-base text-[#D4AF37] mb-2 mt-5 first:mt-0">
          {inlineRender(line.replace(/^##\s+/, ""))}
        </h2>
      );
      continue;
    }
    if (/^#\s+/.test(line)) {
      // Top-level title — skip silently; the page header shows the title.
      flushAll();
      continue;
    }
    if (/^[-•]\s+/.test(line)) {
      flushPara();
      listBuf.push(line.replace(/^[-•]\s+/, ""));
      continue;
    }
    if (line === "") {
      flushAll();
      continue;
    }
    flushList();
    paraBuf.push(line);
  }
  flushAll();

  return <div data-testid={testid}>{blocks}</div>;
}
