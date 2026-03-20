interface MicLevelMeterProps {
  level: number;
}

const MicLevelMeter = ({ level }: MicLevelMeterProps) => (
  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
    <div
      className="h-full rounded-full bg-primary transition-[width] duration-100 ease-out"
      style={{ width: `${level * 100}%` }}
    />
  </div>
);

export default MicLevelMeter;
