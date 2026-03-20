import { useState, useEffect, useCallback, useRef } from "react";

type PermissionState = "prompt" | "granted" | "denied";

const supportsSpeakerSelection =
  typeof HTMLMediaElement !== "undefined" &&
  typeof HTMLMediaElement.prototype.setSinkId === "function";

export function useMediaDevices() {
  const [permissionState, setPermissionState] = useState<PermissionState>("prompt");
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState("");
  const mountedRef = useRef(true);

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (!mountedRef.current) return;
      const inputs = devices.filter((d) => d.kind === "audioinput");
      const outputs = devices.filter((d) => d.kind === "audiooutput");
      setAudioInputs(inputs);
      setAudioOutputs(outputs);
      // Auto-select first device if nothing is selected yet
      setSelectedMicId((prev) => (prev === "" && inputs.length > 0) ? inputs[0].deviceId : prev);
      setSelectedSpeakerId((prev) => (prev === "" && outputs.length > 0) ? outputs[0].deviceId : prev);
    } catch (err) {
      console.error("Device enumeration failed:", err);
    }
  }, []);

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      if (!mountedRef.current) return true;
      setPermissionState("granted");
      await enumerateDevices();
      return true;
    } catch {
      if (mountedRef.current) setPermissionState("denied");
      return false;
    }
  }, [enumerateDevices]);

  // Check existing permission on mount
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (!mountedRef.current) return;
        if (status.state === "granted") {
          setPermissionState("granted");
          await enumerateDevices();
        } else if (status.state === "denied") {
          setPermissionState("denied");
        }
      } catch {
        // permissions API not supported — stay at prompt
      }
    })();
    return () => { mountedRef.current = false; };
  }, [enumerateDevices]);

  // Listen for device changes
  useEffect(() => {
    if (permissionState !== "granted") return;
    const handler = () => enumerateDevices();
    navigator.mediaDevices.addEventListener("devicechange", handler);
    return () => navigator.mediaDevices.removeEventListener("devicechange", handler);
  }, [permissionState, enumerateDevices]);

  return {
    permissionState,
    requestMicPermission,
    audioInputs,
    audioOutputs,
    selectedMicId,
    selectedSpeakerId,
    setSelectedMicId,
    setSelectedSpeakerId,
    supportsSpeakerSelection,
  };
}
