import { useState, useEffect } from "react";
import { Settings, Mic, Volume2 } from "lucide-react";
import type { ConnectionState } from "@/types/connection";
import DeviceSelectRow from "./DeviceSelectRow";
import MicLevelMeter from "./MicLevelMeter";
import { useMicLevel } from "@/hooks/useMicLevel";

interface DeviceSelectorProps {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  selectedMicId: string;
  selectedSpeakerId: string;
  onMicChange: (id: string) => void;
  onSpeakerChange: (id: string) => void;
  supportsSpeakerSelection: boolean;
  connectionState: ConnectionState;
  permissionState: string;
  requestMicPermission: () => Promise<boolean>;
}

const hidden: ConnectionState[] = ["connecting", "ended", "disconnected"];

const DeviceSelector = ({ audioInputs, audioOutputs, selectedMicId, selectedSpeakerId, onMicChange, onSpeakerChange, supportsSpeakerSelection, connectionState, permissionState, requestMicPermission }: DeviceSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const level = useMicLevel(selectedMicId, isOpen);
  useEffect(() => {
    if (connectionState === "connected") setIsOpen(false);
  }, [connectionState]);

  // When gear panel opens and mic permission hasn't been granted yet, request it
  // so device dropdowns populate immediately
  useEffect(() => {
    if (isOpen && permissionState === "prompt") {
      requestMicPermission();
    }
  }, [isOpen, permissionState, requestMicPermission]);

  if (hidden.includes(connectionState)) return null;

  return (
    <div className="hidden md:flex flex-col items-center gap-2">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border/50 bg-card/50 backdrop-blur-xl text-muted-foreground transition-colors hover:text-foreground hover:border-border"
        aria-label="Audio settings"
      >
        <Settings size={18} className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ maxHeight: isOpen ? "200px" : "0px", opacity: isOpen ? 1 : 0 }}
      >
        <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 backdrop-blur-xl p-4 min-w-[200px] md:min-w-[240px]">
          <DeviceSelectRow label="Microphone" icon={<Mic size={14} />} devices={audioInputs} selectedId={selectedMicId} onChange={onMicChange} />
          <MicLevelMeter level={level} />
          {supportsSpeakerSelection && (
            <DeviceSelectRow label="Speaker" icon={<Volume2 size={14} />} devices={audioOutputs} selectedId={selectedSpeakerId} onChange={onSpeakerChange} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceSelector;
