import { Loader2, LogOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ConnectionState } from "@/types/connection";
import SessionCredits from "./SessionCredits";

interface SessionControlsProps {
  connectionState: ConnectionState;
  isConfigured: boolean;
  onStartSession: () => void;
  onCancelConnect?: () => void;
  onEndSession?: () => void;
  onRestart?: () => void;
  canRestart?: boolean;
  hasRestarted?: boolean;
}

const SessionControls = ({ connectionState, isConfigured, onStartSession, onCancelConnect, onEndSession, onRestart, canRestart, hasRestarted }: SessionControlsProps) => {
  if (connectionState !== "idle" && connectionState !== "connecting" && connectionState !== "connected") {
    return null;
  }

  const isConnecting = connectionState === "connecting";

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Button
          disabled
          className="min-h-[48px] min-w-[160px] sm:min-w-[200px] bg-gradient-to-r from-primary/70 to-primary-glow/70 font-outfit text-base font-semibold"
        >
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Connecting...
        </Button>
        {onCancelConnect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelConnect}
            className="font-inter text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        )}
      </div>
    );
  }

  if (connectionState === "connected") {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          {/* End Session — calls POST /end which preserves conversation data + webhooks */}
          {onEndSession && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[48px] gap-2 font-inter text-xs text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  End Session
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-outfit">
                    End session?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-inter">
                    This will end your onboarding session. Your conversation data is preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onEndSession}>
                    End Session
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {/* Restart — only if allowed */}
          {canRestart && onRestart && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[48px] gap-2 font-inter text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restart Session
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-outfit">
                    Restart session?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-inter">
                    You have 1 restart left. Your current session will end and a new one will begin. Are you sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onRestart}>
                    Restart
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <SessionCredits hasRestarted={hasRestarted ?? false} variant="connected" />
        </div>
      </div>
    );
  }

  // Idle: WelcomeBriefing handles the Begin button and unconfigured message
  return null;
};

export default SessionControls;
