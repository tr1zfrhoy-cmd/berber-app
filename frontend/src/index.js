import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Global safety net: kill Chrome's long-press context menu on EVERY element
// (images, links, buttons, navbar). Works even on elements that don't carry
// React's onContextMenu handler (e.g. raw HTML inside 3rd-party libs).
if (typeof window !== "undefined") {
  window.addEventListener("contextmenu", (e) => e.preventDefault(), { capture: true });
  // Some Android Chrome versions still raise this on links — block it too.
  window.addEventListener("dragstart", (e) => e.preventDefault(), { capture: true });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
