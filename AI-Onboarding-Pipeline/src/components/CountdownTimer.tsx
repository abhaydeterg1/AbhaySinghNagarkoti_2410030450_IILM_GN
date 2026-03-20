import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  /** Seconds elapsed since WebRTC session became "connected" */
  elapsedSeconds: number;
}

const CountdownTimer = ({ elapsedSeconds }: CountdownTimerProps) => {
  // Hidden for the first 10 minutes of connected time
  if (elapsedSeconds < 600) return null;

  // After 20 min total (10 hidden + 10 countdown), switch to overtime
  const isOvertime = elapsedSeconds >= 1200;

  // Countdown: seconds remaining from 10:00 to 0:00
  // Overtime: seconds past the 20-minute mark, counting up
  const displaySeconds = isOvertime
    ? elapsedSeconds - 1200
    : 1200 - elapsedSeconds;

  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const formatted = `${isOvertime ? "+" : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "absolute bottom-3 left-3 z-20 rounded-lg border border-border/30 bg-card/80 px-3 py-1.5 backdrop-blur-sm",
        isOvertime ? "text-destructive" : "text-muted-foreground"
      )}
    >
      <span className="font-mono text-sm font-medium">{formatted}</span>
    </div>
  );
};

export default CountdownTimer;
