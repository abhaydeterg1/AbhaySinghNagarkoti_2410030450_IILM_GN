import type { ConnectionState } from "@/types/connection";

const config: Record<Exclude<ConnectionState, 'ended'>, { label: string; dotClass: string; pillClass: string }> = {
  idle: {
    label: "Ready to connect",
    dotClass: "bg-[hsl(var(--status-idle))]",
    pillClass: "",
  },
  connecting: {
    label: "Connecting...",
    dotClass: "bg-[hsl(var(--status-connecting))] animate-pulse",
    pillClass: "shadow-[0_0_12px_hsl(var(--status-connecting)/0.3)]",
  },
  restarting: {
    label: "Restarting...",
    dotClass: "bg-[hsl(var(--status-connecting))] animate-pulse",
    pillClass: "shadow-[0_0_12px_hsl(var(--status-connecting)/0.3)]",
  },
  connected: {
    label: "Session active",
    dotClass: "bg-[hsl(var(--status-connected))] animate-pulse",
    pillClass: "",
  },
  disconnected: {
    label: "Reconnecting...",
    dotClass: "bg-[hsl(var(--status-error))]",
    pillClass: "",
  },
};

// Shown when connected but mic is muted
// Billing continues while muted — no "paused" language
const mutedConfig = {
  label: "Mic muted",
  dotClass: "bg-[hsl(var(--status-warning))]",
  pillClass: "",
};

const StatusPill = ({ connectionState, isMuted }: { connectionState: ConnectionState; isMuted?: boolean }) => {
  if (connectionState === "ended") return null;

  const { label, dotClass, pillClass } = (connectionState === "connected" && isMuted)
    ? mutedConfig
    : config[connectionState];

  return (
    <div className={`flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 backdrop-blur-xl ${pillClass}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span className="font-inter text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
};

export default StatusPill;
