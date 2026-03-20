import { Sparkles } from "lucide-react";

const TopBar = () => (
  <header className="flex w-full items-center justify-between px-3 py-3 sm:px-6 sm:py-4 md:px-8">
    <h1
      className="font-outfit text-base sm:text-xl font-bold tracking-widest text-foreground"
      style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--primary) / 0.3)" }}
    >
      APEX CONSULTING
    </h1>

    <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1.5 backdrop-blur-xl">
      <Sparkles className="h-3.5 w-3.5 text-accent" />
      <span className="font-inter text-xs font-medium text-muted-foreground">Powered by AI</span>
    </div>
  </header>
);

export default TopBar;
