import { useEffect, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";
import type { ConnectionState } from "@/types/connection";
import WelcomeBriefing from "./WelcomeBriefing";
import EndScreen from "./EndScreen";
import CaptionBar from "./CaptionBar";
import CountdownTimer from "./CountdownTimer";
import SessionCredits from "./SessionCredits";

interface AvatarStageProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  connectionState: ConnectionState;
  isAvatarSpeaking: boolean;
  onStartSession?: (email: string) => void;
  isConfigured?: boolean;
  currentCaption?: string;
  onPreAcquireMic?: () => void;
  reconnectError?: string | null;
  manualRetryAvailable?: boolean;
  onManualRetry?: () => void;
  restartCountdown?: number;
  hasRestarted?: boolean;
}

const glowStyles: Record<ConnectionState, string> = {
  idle: "0 0 30px hsl(var(--primary) / 0.15)",
  connecting: "0 0 40px hsl(var(--primary) / 0.25), 0 0 80px hsl(var(--primary) / 0.12)",
  restarting: "0 0 40px hsl(var(--primary) / 0.25), 0 0 80px hsl(var(--primary) / 0.12)",
  connected: "0 0 60px hsl(var(--primary) / 0.35), 0 0 120px hsl(var(--primary) / 0.18)",
  disconnected: "0 0 30px hsl(var(--primary) / 0.15)",
  ended: "0 0 20px hsl(var(--primary) / 0.08)",
};

const shouldBreathe = (s: ConnectionState) => s === "idle" || s === "disconnected";
const showVideo = (s: ConnectionState) => s === "connected";

const AvatarStage = ({ videoRef, connectionState, isAvatarSpeaking, onStartSession, isConfigured, currentCaption, onPreAcquireMic, reconnectError, manualRetryAvailable, onManualRetry, restartCountdown, hasRestarted }: AvatarStageProps) => {
  const [videoReady, setVideoReady] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Reset when leaving connected state
  useEffect(() => {
    if (connectionState !== "connected") setVideoReady(false);
  }, [connectionState]);

  // Fade in after the first video frame renders
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlaying = () => setVideoReady(true);
    video.addEventListener("playing", onPlaying);
    return () => video.removeEventListener("playing", onPlaying);
  }, [videoRef]);

  // Tick every second while connected — drives the countdown timer
  // Resets to 0 when connection drops or session ends (including restart)
  useEffect(() => {
    if (connectionState !== "connected") {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [connectionState]);

  return (
  <div className="flex w-full max-w-3xl flex-col items-center px-3 sm:px-4">
    <div
      className={cn(
        "relative flex w-full items-center justify-center rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl sm:aspect-video min-h-[56vw] sm:min-h-0 overflow-hidden transition-shadow duration-[600ms]",
        shouldBreathe(connectionState) && "animate-breathe"
      )}
      style={{ boxShadow: glowStyles[connectionState] }}
    >
      {connectionState === "idle" && (
        <WelcomeBriefing onBegin={(email) => onStartSession!(email)} isConfigured={isConfigured ?? true} onHoverBegin={onPreAcquireMic} hasRestarted={hasRestarted} />
      )}
      {connectionState === "disconnected" && (
        <div className="flex flex-col items-center gap-4 px-4 sm:px-6 text-center">
          {reconnectError ? (
            <>
              <p className="font-outfit text-lg font-semibold text-foreground">Connection lost</p>
              <p className="font-inter text-sm text-muted-foreground">{reconnectError}</p>
              {manualRetryAvailable && onManualRetry && (
                <button
                  onClick={onManualRetry}
                  className="mt-2 min-h-[48px] rounded-full bg-gradient-to-br from-primary to-primary-glow px-6 py-2.5 font-inter text-sm font-medium text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-shadow hover:shadow-[0_0_28px_hsl(var(--primary)/0.45)]"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "mt-2 rounded-full bg-gradient-to-br from-primary to-primary-glow px-6 py-2.5 font-inter text-sm font-medium text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-shadow hover:shadow-[0_0_28px_hsl(var(--primary)/0.45)]",
                  manualRetryAvailable && "opacity-60"
                )}
              >
                Refresh Page
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="h-3 w-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <p className="font-inter text-sm font-medium text-muted-foreground">Reconnecting...</p>
            </>
          )}
        </div>
      )}
      {connectionState === "connecting" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="h-3 w-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="font-inter text-sm font-medium text-muted-foreground">Connecting to your consultant...</p>
        </div>
      )}
      {connectionState === "restarting" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="h-3 w-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="font-outfit text-lg font-semibold text-foreground">
            Restarting session...
          </p>
          <p className="font-inter text-sm text-muted-foreground">
            New session in {restartCountdown}...
          </p>
          <SessionCredits hasRestarted={hasRestarted ?? false} variant="restarting" />
        </div>
      )}
      {connectionState === "ended" && <EndScreen />}
      {connectionState === "connected" && (
        <button
          onClick={() => setCaptionsEnabled(prev => !prev)}
          className="absolute top-3 right-3 z-20 flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border/30 bg-card/60 backdrop-blur-sm font-inter text-xs font-bold text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
          aria-label={captionsEnabled ? "Hide captions" : "Show captions"}
          style={{ opacity: captionsEnabled ? 1 : 0.5 }}
        >
          CC
        </button>
      )}
      {connectionState === "connected" && (
        <CountdownTimer elapsedSeconds={elapsedSeconds} />
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          showVideo(connectionState) ? (videoReady ? "opacity-100 animate-video-blur-fadeout" : "opacity-0") : "hidden"
        )}
      />
      <CaptionBar
        text={currentCaption ?? ""}
        visible={connectionState === "connected" && captionsEnabled}
      />
    </div>
  </div>
  );
};

export default AvatarStage;
