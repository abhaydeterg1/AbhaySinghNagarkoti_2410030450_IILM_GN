import { Button } from "@/components/ui/button";

const EndScreen = () => {
  return (
    <div className="animate-fade-in-up flex flex-col items-center gap-6 px-3 sm:px-6 text-center">
      <p className="max-w-md font-inter text-sm leading-relaxed text-muted-foreground">
        Thank you for completing your onboarding session. Our team at Apex
        Consulting will review your information and reach out shortly.
      </p>
      <p className="font-inter text-xs text-muted-foreground/70">
        You can close this tab now.
      </p>
      <Button
        asChild
        className="min-h-[48px] bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-inter font-medium px-6"
        style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" }}
      >
        <a href="https://apex-consulting.ai" target="_blank" rel="noopener noreferrer">
          Visit Apex Consulting
        </a>
      </Button>
    </div>
  );
};

export default EndScreen;
