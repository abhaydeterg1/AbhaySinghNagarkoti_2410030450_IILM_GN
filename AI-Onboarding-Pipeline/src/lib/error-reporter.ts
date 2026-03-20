// Lightweight runtime error reporter using navigator.sendBeacon
// Captures unhandled errors, promise rejections, and SDK failures
// To activate: set VITE_ERROR_ENDPOINT in .env to your collection URL

const ERROR_ENDPOINT = import.meta.env.VITE_ERROR_ENDPOINT as string | undefined;

interface ErrorReport {
  type: "unhandled-error" | "unhandled-rejection" | "sdk-error";
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
}

function send(report: ErrorReport) {
  if (!ERROR_ENDPOINT) return;
  try {
    navigator.sendBeacon(ERROR_ENDPOINT, JSON.stringify(report));
  } catch {
    // sendBeacon itself failed — nothing we can do
  }
}

function buildReport(
  type: ErrorReport["type"],
  message: string,
  stack?: string
): ErrorReport {
  return {
    type,
    message,
    stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
}

// Call once at app startup (main.tsx) to wire up global listeners
export function initErrorReporter() {
  if (!ERROR_ENDPOINT) return;

  window.addEventListener("error", (event) => {
    send(buildReport("unhandled-error", event.message, event.error?.stack));
  });

  window.addEventListener("unhandledrejection", (event) => {
    const message =
      event.reason instanceof Error
        ? event.reason.message
        : String(event.reason);
    const stack =
      event.reason instanceof Error ? event.reason.stack : undefined;
    send(buildReport("unhandled-rejection", message, stack));
  });
}

// Call from useTavusAgent's error handler for SDK-specific failures
export function reportSDKError(err: Error, context?: object) {
  send(
    buildReport(
      "sdk-error",
      err.message,
      err.stack
    )
  );
}
