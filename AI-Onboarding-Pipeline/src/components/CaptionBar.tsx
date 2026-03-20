import { cn } from "@/lib/utils";

interface CaptionBarProps {
  text: string;
  visible: boolean;
}

const CaptionBar = ({ text, visible }: CaptionBarProps) => {
  if (!visible || !text) return null;

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 z-10 px-4 pb-4",
        "transition-opacity duration-300",
        text ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="mx-auto max-w-[90%] rounded-xl border border-border/30 bg-card/80 px-4 py-2.5 backdrop-blur-sm">
        <p className="font-inter text-xs sm:text-sm leading-relaxed text-foreground text-center">
          {text}
        </p>
      </div>
    </div>
  );
};

export default CaptionBar;
