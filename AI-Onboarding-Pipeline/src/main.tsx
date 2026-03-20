import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initErrorReporter } from "./lib/error-reporter.ts";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import App from "./App.tsx";
import "./index.css";

initErrorReporter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
