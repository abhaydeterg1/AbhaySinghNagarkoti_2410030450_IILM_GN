import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorToastProps {
  error: string | null;
  onDismiss: () => void;
}

const ErrorToast = ({ error, onDismiss }: ErrorToastProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!error) { setVisible(false); return; }
    setVisible(true);
    const timer = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 8000);
    return () => clearTimeout(timer);
  }, [error, onDismiss]);

  if (!error) return null;

  const handleDismiss = () => { setVisible(false); setTimeout(onDismiss, 300); };

  return (
    <div
      className={cn(
        "fixed safe-top-6 left-1/2 z-50 w-[90vw] max-w-md rounded-xl border border-destructive/50 bg-card/50 backdrop-blur-xl px-5 py-4 shadow-lg",
        visible ? "animate-slide-down" : "animate-fade-out"
      )}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 font-inter text-sm text-foreground">{error}</p>
        <button onClick={handleDismiss} className="shrink-0 rounded-md p-2 sm:p-1 text-muted-foreground transition-colors hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ErrorToast;
