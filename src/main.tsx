import React from "react";
import { createRoot } from "react-dom/client";
import "./utils/focusedSeo";
import App from "./App.tsx";
import "./index.css";

// Keep a directly opened IDE reusable from PocketBI ecosystem navigation without
// overwriting purpose-specific names used by OAuth/callback/handoff contexts.
if (typeof window !== "undefined" && !window.name) {
  window.name = "BIDEWorkbench";
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
