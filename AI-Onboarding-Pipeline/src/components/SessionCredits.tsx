interface SessionCreditsProps {
  hasRestarted: boolean;
  variant: "welcome" | "connected" | "restarting";
}

const configs = {
  welcome:    { dots: 2, text: "2 sessions available" },
  connected:  { dots: 1, text: "1 restart remaining" },
  restarting: { dots: 1, text: "Final session" },
};

const SessionCredits = ({ hasRestarted, variant }: SessionCreditsProps) => {
  if (hasRestarted && variant === "connected") return null;

  const { dots, text } = hasRestarted
    ? configs.restarting
    : configs[variant];

  return (
    <div className="flex items-center gap-2 font-inter text-xs text-muted-foreground">
      <span className="flex gap-1">
        {Array.from({ length: dots }).map((_, i) => (
          <span
            key={i}
            data-testid="credit-dot"
            className="h-2 w-2 rounded-full bg-[hsl(var(--status-connected))]"
          />
        ))}
      </span>
      <span>{text}</span>
    </div>
  );
};

export default SessionCredits;
