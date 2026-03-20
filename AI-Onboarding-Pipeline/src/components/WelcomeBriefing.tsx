import { useState } from "react";
import { Clock, Mic, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import SessionCredits from "./SessionCredits";

interface WelcomeBriefingProps {
  onBegin: (email: string) => void;
  isConfigured: boolean;
  onHoverBegin?: () => void;
  hasRestarted?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WelcomeBriefing = ({ onBegin, isConfigured, onHoverBegin, hasRestarted }: WelcomeBriefingProps) => {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = EMAIL_RE.test(email.trim());
  const showError = touched && !isValid;
  const canBegin = isConfigured && isValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (canBegin) onBegin(email.trim());
  };

  return (
  <form onSubmit={handleSubmit} className="animate-fade-in-up flex flex-col items-center gap-5 px-4 sm:px-6 text-center">
    <h2 className="font-outfit text-lg sm:text-xl font-semibold text-foreground">
      Welcome to Your Onboarding Session
    </h2>
    <ul className="flex flex-col gap-3 text-left">
      <li className="flex items-center gap-3">
        <Clock className="h-5 w-5 shrink-0 text-primary" />
        <span className="font-inter text-sm text-muted-foreground">
          This takes about 10 minutes — have your business details ready
        </span>
      </li>
      <li className="flex items-center gap-3">
        <Mic className="h-5 w-5 shrink-0 text-primary" />
        <span className="font-inter text-sm text-muted-foreground">
          Check your mic and speaker before starting
        </span>
      </li>
      <li className="flex items-center gap-3">
        <MessageSquare className="h-5 w-5 shrink-0 text-primary" />
        <span className="font-inter text-sm text-muted-foreground">
          Answer clearly and concisely — every word is captured
        </span>
      </li>
    </ul>
    {!isConfigured && (
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card/50 px-3 sm:px-6 py-5 text-center backdrop-blur-xl">
        <p className="font-inter text-sm text-muted-foreground">
          Our AI consultant is temporarily unavailable. Please check back shortly.
        </p>
      </div>
    )}

    {/* Email input — mandatory before starting */}
    <div className="w-full max-w-xs flex flex-col gap-1.5">
      <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 bg-card/60 backdrop-blur-sm transition-colors ${showError ? "border-red-500/70" : "border-border/50 focus-within:border-primary/60"}`}>
        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="email"
          placeholder="Enter your email to begin"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (!touched) setTouched(true); }}
          onBlur={() => setTouched(true)}
          required
          className="w-full bg-transparent font-inter text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
        />
      </div>
      {showError && (
        <p className="font-inter text-xs text-red-400">Please enter a valid email address</p>
      )}
    </div>

    <Button
      type="submit"
      onMouseEnter={onHoverBegin}
      onFocus={onHoverBegin}
      disabled={!canBegin}
      className="mt-1 min-h-[48px] min-w-[160px] sm:min-w-[200px] bg-gradient-to-r from-primary to-primary-glow font-outfit text-base font-semibold shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:scale-[1.02] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ transition: "all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)" }}
    >
      Start Onboarding
    </Button>
    <SessionCredits hasRestarted={hasRestarted ?? false} variant="welcome" />
  </form>
  );
};

export default WelcomeBriefing;
