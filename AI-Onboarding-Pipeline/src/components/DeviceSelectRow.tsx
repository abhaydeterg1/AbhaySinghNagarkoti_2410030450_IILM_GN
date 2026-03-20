import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeviceSelectRowProps {
  label: string;
  icon: ReactNode;
  devices: MediaDeviceInfo[];
  selectedId: string;
  onChange: (id: string) => void;
}

const DeviceSelectRow = ({ label, icon, devices, selectedId, onChange }: DeviceSelectRowProps) => {
  // Filter out devices with empty deviceId — Radix Select forbids empty string values,
  // and a device with no ID can't be selected anyway
  const validDevices = devices.filter((d) => d.deviceId);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 font-inter text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </span>
      {validDevices.length <= 1 ? (
        <span className="font-inter text-sm text-foreground/70">Default device</span>
      ) : (
        <Select value={selectedId || undefined} onValueChange={onChange}>
          <SelectTrigger className="w-full border-border bg-input font-inter text-sm text-foreground h-10">
            <SelectValue placeholder="Select device" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card/95 backdrop-blur-xl">
            {validDevices.map((d) => (
              <SelectItem key={d.deviceId} value={d.deviceId}>
                {d.label || "Default"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default DeviceSelectRow;
