import { useRef, useEffect, useState } from "react";
import TopBar from "./components/TopBar";
import AvatarStage from "./components/AvatarStage";
import StatusPill from "./components/StatusPill";
import MicrophoneButton from "./components/MicrophoneButton";
import SessionControls from "./components/SessionControls";
import DeviceSelector from "./components/DeviceSelector";
import Footer from "./components/Footer";
import ErrorToast from "./components/ErrorToast";
import { useTavusAgent } from "./hooks/useTavusAgent";
import { useMediaDevices } from "./hooks/useMediaDevices";

const App = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    requestMicPermission, permissionState,
    audioInputs, audioOutputs,
    selectedMicId, selectedSpeakerId,
    setSelectedMicId, setSelectedSpeakerId,
    supportsSpeakerSelection,
  } = useMediaDevices();
  const {
    connectionState, isAvatarSpeaking, isMuted, isMuteNudgeVisible,
    isConfigured, connect, disconnect, cancelConnect, toggleMute,
    interrupt, reconnect, manualRetry, manualRetryAvailable, reset, restart,
    clearError, error, currentCaption, preAcquireMic, restartCountdown
  } = useTavusAgent(videoRef, { requestMicPermission, permissionState }, selectedMicId, selectedSpeakerId);

  // One restart allowed per page load — survives session reset
  const [hasRestarted, setHasRestarted] = useState(false);

  // Auto-reconnect: when disconnected, trigger reconnect automatically (plan §2.4)
  // The hook handles retry counting (max 3) and sets error after exhaustion
  useEffect(() => {
    if (connectionState === "disconnected" && !error) {
      const timer = setTimeout(() => reconnect(), 1000);
      return () => clearTimeout(timer);
    }
  }, [connectionState, error, reconnect]);

  const handleRestart = async () => {
    setHasRestarted(true);
    await restart();
  };

  // Barge-in: when unmuting while avatar is talking, interrupt first
  const handleToggleMute = () => {
    if (isMuted && isAvatarSpeaking) {
      interrupt();
    }
    toggleMute();
  };

  return (
    <div className="flex min-h-screen flex-col items-center font-inter">
      <div className="animate-fade-in-up delay-0 w-full">
        <TopBar />
      </div>
      <ErrorToast error={error} onDismiss={clearError} />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 sm:gap-6 w-full px-3 sm:px-4 md:px-6">
        <div className="animate-fade-in-up delay-150 w-full flex justify-center">
          <AvatarStage
            videoRef={videoRef}
            connectionState={connectionState}
            isAvatarSpeaking={isAvatarSpeaking}
            onStartSession={(email) => connect({ email })}
            isConfigured={isConfigured}
            currentCaption={currentCaption}
            onPreAcquireMic={preAcquireMic}
            reconnectError={connectionState === "disconnected" ? error : null}
            manualRetryAvailable={connectionState === "disconnected" ? manualRetryAvailable : false}
            onManualRetry={manualRetry}
            restartCountdown={restartCountdown}
            hasRestarted={hasRestarted}
          />
        </div>
        <div className="animate-fade-in-up delay-300 flex flex-col items-center gap-4">
          <StatusPill connectionState={connectionState} isMuted={isMuted} />
          <MicrophoneButton
            connectionState={connectionState}
            selectedMicId={selectedMicId}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            isMuteNudgeVisible={isMuteNudgeVisible}
          />
          <SessionControls
            connectionState={connectionState}
            isConfigured={isConfigured}
            onStartSession={() => connect()}
            onCancelConnect={cancelConnect}
            onEndSession={disconnect}
            onRestart={handleRestart}
            canRestart={connectionState === "connected" && !hasRestarted}
            hasRestarted={hasRestarted}
          />
          <DeviceSelector
            audioInputs={audioInputs}
            audioOutputs={audioOutputs}
            selectedMicId={selectedMicId}
            selectedSpeakerId={selectedSpeakerId}
            onMicChange={setSelectedMicId}
            onSpeakerChange={setSelectedSpeakerId}
            supportsSpeakerSelection={supportsSpeakerSelection}
            connectionState={connectionState}
            permissionState={permissionState}
            requestMicPermission={requestMicPermission}
          />
        </div>
      </main>
      <div className="animate-fade-in-up delay-400 w-full">
        <Footer />
      </div>
    </div>
  );
};

export default App;
