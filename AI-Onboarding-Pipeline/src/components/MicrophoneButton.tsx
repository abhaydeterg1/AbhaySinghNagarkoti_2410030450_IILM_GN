import { Mic, MicOff } from "lucide-react";
import type { ConnectionState } from "@/types/connection";
import { useMicLevel } from "@/hooks/useMicLevel";

interface MicrophoneButtonProps {
  connectionState: ConnectionState;
  selectedMicId: string;
  isMuted: boolean;
  onToggleMute: () => void;
  isMuteNudgeVisible: boolean;
}

// 5 bars — center bars are tallest, edges shortest
const barWeights = [0.5, 0.8, 1, 0.8, 0.5];
const MIN_SCALE = 0.3;

const MicrophoneButton = ({ connectionState, selectedMicId, isMuted, onToggleMute, isMuteNudgeVisible }: MicrophoneButtonProps) => {
  // Disabled during active session — useMicLevel opens a separate mic stream
  // that competes with the session's own stream, wasting resources.
  const level = useMicLevel(selectedMicId, false);

  if (connectionState !== "connected") return null;

  // Build bar heights from real audio level
  const barScales = barWeights.map((weight) => {
    const scale = MIN_SCALE + level * weight * (1 - MIN_SCALE);
    return Math.min(1, scale);
  });

  const Icon = isMuted ? MicOff : Mic;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center gap-2">
        {/* Left bars */}
        <div className="flex items-center gap-[3px]">
          {barScales.slice(0, 2).map((scale, i) => (
            <span
              key={`l${i}`}
              className={`block h-4 w-[3px] origin-center rounded-full ${isMuted ? "bg-muted-foreground/40" : "bg-primary"}`}
              style={{ transform: `scaleY(${scale})`, transition: "transform 100ms ease-out" }}
            />
          ))}
        </div>

        {/* Central mic button — clickable to toggle mute */}
        <button
          onClick={onToggleMute}
          className={`flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground transition-all ${
            isMuted
              ? "bg-muted-foreground/30"
              : "bg-gradient-to-br from-primary to-primary-glow animate-breathe-glow"
          }`}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          <Icon size={28} />
        </button>

        {/* Right bars */}
        <div className="flex items-center gap-[3px]">
          {barScales.slice(3).map((scale, i) => (
            <span
              key={`r${i}`}
              className={`block h-4 w-[3px] origin-center rounded-full ${isMuted ? "bg-muted-foreground/40" : "bg-primary"}`}
              style={{ transform: `scaleY(${scale})`, transition: "transform 100ms ease-out" }}
            />
          ))}
        </div>
      </div>
      <span className="font-inter text-xs text-muted-foreground">
        {isMuted ? "Mic muted — tap to unmute" : "Audio active"}
      </span>

      {/* Mute nudge — appears after 10 seconds of being muted */}
      {isMuteNudgeVisible && (
        <p className="animate-fade-in-up text-sm text-muted-foreground text-center max-w-[220px]">
          You're muted — unmute when you're ready to continue
        </p>
      )}
    </div>
  );
};

export default MicrophoneButton;
