import { useState, useRef, useEffect, useCallback } from "react";
import DailyIframe, { DailyCall, DailyCallOptions, DailyEventObjectAppMessage, DailyEventObjectParticipant, DailyEventObjectTrack, DailyReceiveSettings } from "@daily-co/daily-js";
import type { ConnectionState } from "@/types/connection";
import { TAVUS_PROXY_URL, TAVUS_PERSONA_ID, TAVUS_REPLICA_ID } from "@/config";
import { reportSDKError } from "@/lib/error-reporter";

const isConfigured = Boolean(TAVUS_PERSONA_ID && TAVUS_REPLICA_ID);

const FRIENDLY_ERROR = "Unable to start session. Please check your connection and try again.";
const MAX_RECONNECT_ATTEMPTS = 3;
const MUTE_NUDGE_DELAY_MS = 10_000;
const CAPTION_FADE_DELAY_MS = 3_000;
const END_SESSION_TIMEOUT_MS = 5_000;
const RESTART_COOLDOWN_S = 10;
const RESTART_PRECREATE_DELAY_MS = 3_000;

// Request highest simulcast layer from Daily SFU for sharp avatar video
// join() requires "base" key; updateReceiveSettings() accepts "*"
const HIGH_QUALITY_RECEIVE: DailyReceiveSettings = {
  base: { video: { layer: 2 } },
};

interface ConnectOptions {
  fromRestart?: boolean;
  email?: string;
}

export function useTavusAgent(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  mediaDevices: { requestMicPermission: () => Promise<boolean>; permissionState: string },
  selectedMicId?: string,
  selectedSpeakerId?: string
) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMuteNudgeVisible, setIsMuteNudgeVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCaption, setCurrentCaption] = useState<string>("");
  const [manualRetryAvailable, setManualRetryAvailable] = useState(false);
  const [restartCountdown, setRestartCountdown] = useState(-1);

  // Refs
  const dailyRef = useRef<DailyCall | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const conversationUrlRef = useRef<string | null>(null);
  const connectionStateRef = useRef<ConnectionState>("idle");
  const muteNudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captionFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const userInitiatedDisconnectRef = useRef(false);
  const endConversationRef = useRef<() => void>(() => {});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAvatarSpeakingRef = useRef(false);
  const endSessionPendingRef = useRef(false);
  const endSessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const upgradeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestartRef = useRef(false);
  const restartIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restartPreCreateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref in sync so Daily callbacks always see latest state
  connectionStateRef.current = connectionState;

  // Keep speaker ID ref in sync for callbacks
  const selectedSpeakerIdRef = useRef(selectedSpeakerId);
  selectedSpeakerIdRef.current = selectedSpeakerId;

  // Keep avatar speaking ref in sync for callbacks
  isAvatarSpeakingRef.current = isAvatarSpeaking;

  const clearError = useCallback(() => setError(null), []);

  const clearCaptionFadeTimer = useCallback(() => {
    if (captionFadeTimerRef.current) {
      clearTimeout(captionFadeTimerRef.current);
      captionFadeTimerRef.current = null;
    }
  }, []);

  const clearEndSessionTimer = useCallback(() => {
    if (endSessionTimerRef.current) {
      clearTimeout(endSessionTimerRef.current);
      endSessionTimerRef.current = null;
    }
  }, []);

  const clearRestartTimers = useCallback(() => {
    if (restartIntervalRef.current) {
      clearInterval(restartIntervalRef.current);
      restartIntervalRef.current = null;
    }
    if (restartPreCreateTimerRef.current) {
      clearTimeout(restartPreCreateTimerRef.current);
      restartPreCreateTimerRef.current = null;
    }
  }, []);

  // Mute nudge timer — start when muted + connected, clear on unmute or disconnect
  useEffect(() => {
    if (isMuted && connectionState === "connected") {
      muteNudgeTimerRef.current = setTimeout(() => {
        setIsMuteNudgeVisible(true);
      }, MUTE_NUDGE_DELAY_MS);
    } else {
      if (muteNudgeTimerRef.current) {
        clearTimeout(muteNudgeTimerRef.current);
        muteNudgeTimerRef.current = null;
      }
      setIsMuteNudgeVisible(false);
    }
    return () => {
      if (muteNudgeTimerRef.current) {
        clearTimeout(muteNudgeTimerRef.current);
      }
    };
  }, [isMuted, connectionState]);

  // Route audio output through Daily.js to the selected speaker
  const setSpeaker = useCallback(async (outputDeviceId?: string) => {
    if (!outputDeviceId || !dailyRef.current) return;
    try {
      await dailyRef.current.setOutputDeviceAsync({ outputDeviceId });
      console.log("[Tavus] Speaker output set to:", outputDeviceId);
    } catch (err) {
      console.warn("[Tavus] Could not set speaker output:", err);
    }
    // Also route our explicit audio element to the selected speaker
    if (audioRef.current && "setSinkId" in audioRef.current) {
      (audioRef.current as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> })
        .setSinkId(outputDeviceId).catch(() => {});
    }
  }, []);

  // React to speaker selection changes while connected
  useEffect(() => {
    if (selectedSpeakerId && dailyRef.current && connectionState === "connected") {
      setSpeaker(selectedSpeakerId);
    }
  }, [selectedSpeakerId, connectionState, setSpeaker]);

  // Cleanup Daily call object
  const destroyDaily = useCallback(() => {
    clearRestartTimers();
    if (upgradeTimerRef.current) {
      clearTimeout(upgradeTimerRef.current);
      upgradeTimerRef.current = null;
    }
    if (dailyRef.current) {
      dailyRef.current.leave().catch(() => {});
      dailyRef.current.destroy();
      dailyRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }
  }, [videoRef, clearRestartTimers]);

  // Handle all Tavus events arriving via Daily's app-message
  const handleAppMessage = useCallback((event: DailyEventObjectAppMessage) => {
    const data = event?.data;
    if (!data || data.message_type !== "conversation") return;

    switch (data.event_type) {
      // Captions — utterance events contain full speech text
      case "conversation.utterance": {
        const speech = data.properties?.speech;
        const role = data.properties?.role;
        if (speech && role === "replica") {
          setCurrentCaption(speech);
          console.log("[Tavus] Utterance:", speech);
          clearCaptionFadeTimer();
        }
        break;
      }

      // Avatar speaking state
      case "conversation.replica.started_speaking":
        setIsAvatarSpeaking(true);
        console.log("[Tavus] Replica started speaking");
        clearCaptionFadeTimer();
        break;

      case "conversation.replica.stopped_speaking":
        setIsAvatarSpeaking(false);
        console.log("[Tavus] Replica stopped speaking");
        clearCaptionFadeTimer();
        captionFadeTimerRef.current = setTimeout(() => {
          setCurrentCaption("");
        }, CAPTION_FADE_DELAY_MS);
        if (endSessionPendingRef.current) {
          console.log("[Tavus] Deferred end — avatar finished speaking, ending now");
          endSessionPendingRef.current = false;
          clearEndSessionTimer();
          endConversationRef.current();
        }
        break;

      // Tool call — check for session-end signal
      case "conversation.tool_call": {
        const toolName = data.properties?.name;
        console.log("[Tavus] Tool call received:", toolName);
        if (toolName === "end_session" || toolName === "end_conversation") {
          if (isAvatarSpeakingRef.current) {
            console.log("[Tavus] Deferring end — avatar still speaking");
            endSessionPendingRef.current = true;
            // Clear any existing timer first (handles duplicate tool calls)
            clearEndSessionTimer();
            endSessionTimerRef.current = setTimeout(() => {
              console.log("[Tavus] End session safety timeout — forcing end");
              endSessionPendingRef.current = false;
              endConversationRef.current();
            }, END_SESSION_TIMEOUT_MS);
          } else {
            endConversationRef.current();
          }
        }
        break;
      }
    }
  }, [clearCaptionFadeTimer, clearEndSessionTimer]);

  // End conversation via Tavus API and clean up
  const endConversation = useCallback(async () => {
    console.log("[Tavus] Ending conversation...");
    const convId = conversationIdRef.current;
    if (convId) {
      try {
        await fetch(`${TAVUS_PROXY_URL}/api/conversations/${convId}/end`, {
          method: "POST",
        });
      } catch {
        // Best-effort — session may already be ended
      }
    }
    destroyDaily();
    conversationIdRef.current = null;
    conversationUrlRef.current = null;
    setConnectionState("ended");
    console.log("[Tavus] Session ended");
    setIsAvatarSpeaking(false);
    setIsMuted(false);
    setCurrentCaption("");
    clearCaptionFadeTimer();
    endSessionPendingRef.current = false;
    clearEndSessionTimer();
  }, [destroyDaily, clearCaptionFadeTimer, clearEndSessionTimer]);

  // Keep ref in sync so app-message callback always calls latest endConversation
  endConversationRef.current = endConversation;

  // Wire up Daily event listeners
  const setupDailyEvents = useCallback((daily: DailyCall) => {
    // Remote video track — attach to video element
    daily.on("track-started", (event: DailyEventObjectTrack) => {
      if (!event?.participant?.local && event?.track?.kind === "video" && videoRef.current) {
        const stream = new MediaStream([event.track]);
        videoRef.current.srcObject = stream;
        console.log("[Tavus] Remote video track attached");
      }
      if (!event?.participant?.local && event?.track?.kind === "audio") {
        // Explicitly create an audio element for remote audio playback
        // Daily.js auto-play can fail silently due to browser autoplay policies
        if (audioRef.current) {
          audioRef.current.srcObject = null;
        }
        const audioEl = new Audio();
        audioEl.srcObject = new MediaStream([event.track]);
        audioEl.autoplay = true;
        audioEl.play().catch((err) => {
          console.warn("[Tavus] Audio autoplay blocked:", err);
        });
        audioRef.current = audioEl;

        // Route to selected speaker if supported
        const speakerId = selectedSpeakerIdRef.current;
        if (speakerId && "setSinkId" in audioEl) {
          (audioEl as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> })
            .setSinkId(speakerId).catch(() => {});
        }

        console.log("[Tavus] Remote audio track attached to audio element");
      }
    });

    // Remote track stopped — clear video and audio
    daily.on("track-stopped", (event: DailyEventObjectTrack) => {
      if (!event?.participant?.local && event?.track?.kind === "video" && videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (!event?.participant?.local && event?.track?.kind === "audio" && audioRef.current) {
        audioRef.current.srcObject = null;
        audioRef.current = null;
      }
    });

    // Tavus events arrive via app-message
    daily.on("app-message", handleAppMessage);

    // Remote participant left — trigger reconnection if not user-initiated
    daily.on("participant-left", (event: DailyEventObjectParticipant) => {
      if (!event?.participant?.local && connectionStateRef.current === "connected") {
        if (!userInitiatedDisconnectRef.current) {
          setConnectionState("disconnected");
        }
      }
    });

    // Handle errors
    daily.on("error", (event) => {
      console.error("[Tavus] Daily error:", event);
      reportSDKError(new Error(event?.errorMsg || "Daily error"));
      setError(FRIENDLY_ERROR);
    });

    // Joined meeting — mark as connected
    daily.on("joined-meeting", () => {
      console.log("[Tavus] Joined Daily room");
      setConnectionState("connected");
      reconnectAttemptsRef.current = 0;


      // After bandwidth estimation stabilizes, re-request highest quality layer
      upgradeTimerRef.current = setTimeout(() => {
        if (dailyRef.current) {
          dailyRef.current.updateReceiveSettings({
            "*": { video: { layer: 2 } },
          }).then(() => {
            console.log("[Tavus] Requested high-quality video layer");
          }).catch((err) => {
            console.warn("[Tavus] Could not upgrade receive settings:", err);
          });
        }
      }, 3000);
    });

    // Left meeting
    daily.on("left-meeting", () => {
      if (connectionStateRef.current === "connected" && !userInitiatedDisconnectRef.current) {
        setConnectionState("disconnected");
      }
    });
  }, [videoRef, handleAppMessage]);

  // Connect — create conversation + join Daily room
  const connect = useCallback(async (options?: ConnectOptions) => {
    if (!isConfigured) return;

    if (options?.fromRestart) {
      if (connectionState !== "restarting") return;
    } else {
      if (connectionState !== "idle") return;
    }

    setError(null);
    setConnectionState("connecting");
    userInitiatedDisconnectRef.current = false;

    if (!options?.fromRestart && mediaDevices.permissionState !== "granted") {
      const granted = await mediaDevices.requestMicPermission();
      if (!granted) {
        setError("Microphone access is required for voice sessions. Please allow microphone access and try again.");
        setConnectionState("idle");
        return;
      }
    }

    const isRestart = isRestartRef.current;
    isRestartRef.current = false;

    const contextText = isRestart
      ? "The client restarted their session. Greet them briefly, acknowledge the fresh start, and begin with the first objective. Speak first."
      : "New onboarding session. Speak first — greet the client and ask your first question immediately. Do not wait for them to speak.";

    // Platform-level greeting — Tavus speaks this immediately when user joins, no LLM delay
    const customGreeting = "Hey there! I'm Shettyana from APEX Consulting — so excited to get to know you and your business today. Let's dive right in — what's your name?";

    const maxAttempts = options?.fromRestart ? 1 : 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          console.warn("[Tavus] Conversation creation failed, retrying in 3s...");
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log("[Tavus] Creating conversation...");
        const response = await fetch(`${TAVUS_PROXY_URL}/api/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            replica_id: TAVUS_REPLICA_ID,
            persona_id: TAVUS_PERSONA_ID,
            conversational_context: contextText,
            custom_greeting: customGreeting,
            properties: {
              participant_left_timeout: 120,
              participant_absent_timeout: 120,
            },
            // Custom field — server caches this and includes in n8n webhook
            client_email: options?.email || undefined,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          throw new Error(`Tavus API error: ${response.status} ${errorBody}`);
        }

        const data = await response.json();
        conversationIdRef.current = data.conversation_id;
        conversationUrlRef.current = data.conversation_url;
        console.log("[Tavus] Conversation created:", data.conversation_id);

        let daily = dailyRef.current;
        if (!daily) {
          daily = DailyIframe.createCallObject({
            audioSource: selectedMicId || true,
            videoSource: false,
          });
          dailyRef.current = daily;
          setupDailyEvents(daily);
        }

        const joinOptions: DailyCallOptions = {
          url: data.conversation_url,
          receiveSettings: HIGH_QUALITY_RECEIVE,
        };
        if (data.meeting_token) {
          joinOptions.token = data.meeting_token;
        }

        console.log("[Tavus] Joining Daily room...");
        await daily.join(joinOptions);
        return;
      } catch (err: unknown) {
        if (attempt === maxAttempts) {
          if (attempt > 1) {
            console.error("[Tavus] Retry failed, giving up");
          }
          console.error("[Tavus] Connection failed:", err);
          reportSDKError(err instanceof Error ? err : new Error(String(err)));
          destroyDaily();
          setError(FRIENDLY_ERROR);
          setConnectionState("idle");
        }
      }
    }
  }, [connectionState, mediaDevices, selectedMicId, setupDailyEvents, destroyDaily]);

  // Disconnect — user-initiated session end (called by tool_call handler)
  const disconnect = useCallback(() => {
    userInitiatedDisconnectRef.current = true;
    endConversation();
  }, [endConversation]);

  // Cancel an in-progress connection attempt
  const cancelConnect = useCallback(async () => {
    if (connectionState !== "connecting") return;
    userInitiatedDisconnectRef.current = true;
    await endConversation();
    setConnectionState("idle");
  }, [connectionState, endConversation]);

  // Reconnect — auto-retry within participant_left_timeout window
  const reconnect = useCallback(async () => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setManualRetryAvailable(true);
      setError("Connection lost. Please refresh the page to try again.");
      setConnectionState("disconnected");
      return;
    }

    const url = conversationUrlRef.current;
    if (!url) {
      // No room URL — can't rejoin, offer hard refresh
      setError("Session expired. Please refresh the page to start a new session.");
      setConnectionState("disconnected");
      return;
    }

    reconnectAttemptsRef.current += 1;
    setConnectionState("connecting");
    setError(null);

    try {
      // Destroy old call object and create a fresh one
      destroyDaily();

      const daily = DailyIframe.createCallObject({
        audioSource: selectedMicId || true,
        videoSource: false,
      });

      dailyRef.current = daily;
      setupDailyEvents(daily);

      await daily.join({ url, receiveSettings: HIGH_QUALITY_RECEIVE });
      console.log("[Tavus] Reconnected to Daily room");
    } catch {
      // Retry after delay
      setTimeout(() => reconnect(), 2000);
    }
  }, [selectedMicId, setupDailyEvents, destroyDaily]);

  // One extra reconnect attempt triggered by the "Try Again" button
  // Only available after 3 auto-retries are exhausted
  const manualRetry = useCallback(async () => {
    setManualRetryAvailable(false);

    const url = conversationUrlRef.current;
    if (!url) {
      setError("Session expired. Refresh to start a new session.");
      setConnectionState("disconnected");
      return;
    }

    reconnectAttemptsRef.current = 0;
    setConnectionState("connecting");
    setError(null);

    try {
      destroyDaily();
      const daily = DailyIframe.createCallObject({
        audioSource: selectedMicId || true,
        videoSource: false,
      });
      dailyRef.current = daily;
      setupDailyEvents(daily);
      await daily.join({ url, receiveSettings: HIGH_QUALITY_RECEIVE });
      console.log("[Tavus] Manual retry succeeded");
    } catch {
      setError("Session expired. Refresh to start a new session.");
      setConnectionState("disconnected");
    }
  }, [selectedMicId, setupDailyEvents, destroyDaily]);

  // Reset — back to idle (for future use, not exposed to onboardee)
  const reset = useCallback(() => {
    destroyDaily();
    conversationIdRef.current = null;
    conversationUrlRef.current = null;
    reconnectAttemptsRef.current = 0;
    setManualRetryAvailable(false);
    setConnectionState("idle");
    setIsAvatarSpeaking(false);
    setIsMuted(false);
    setIsMuteNudgeVisible(false);
    setCurrentCaption("");
    setError(null);
    clearCaptionFadeTimer();
    endSessionPendingRef.current = false;
    clearEndSessionTimer();
  }, [destroyDaily, clearCaptionFadeTimer, clearEndSessionTimer]);

  // End the current conversation and restart with a cooldown
  // Unlike endConversation() which goes to "ended" (EndScreen),
  // restart goes to "restarting" (countdown) then auto-connects
  const restart = useCallback(async () => {
    console.log("[Tavus] Restarting session...");
    userInitiatedDisconnectRef.current = true;
    isRestartRef.current = true;

    const convId = conversationIdRef.current;
    if (convId) {
      try {
        await fetch(`${TAVUS_PROXY_URL}/api/conversations/${convId}/end`, {
          method: "POST",
        });
      } catch {
        // Best-effort
      }
    }

    destroyDaily();
    conversationIdRef.current = null;
    conversationUrlRef.current = null;
    reconnectAttemptsRef.current = 0;
    setManualRetryAvailable(false);
    setIsAvatarSpeaking(false);
    setIsMuted(false);
    setIsMuteNudgeVisible(false);
    setCurrentCaption("");
    setError(null);
    clearCaptionFadeTimer();
    endSessionPendingRef.current = false;
    clearEndSessionTimer();

    setConnectionState("restarting");
    setRestartCountdown(RESTART_COOLDOWN_S);

    restartIntervalRef.current = setInterval(() => {
      setRestartCountdown(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(restartIntervalRef.current!);
          restartIntervalRef.current = null;
        }
        return next;
      });
    }, 1000);

    restartPreCreateTimerRef.current = setTimeout(() => {
      const daily = DailyIframe.createCallObject({
        audioSource: selectedMicId || true,
        videoSource: false,
      });
      dailyRef.current = daily;
      setupDailyEvents(daily);
      console.log("[Tavus] Pre-created Daily call object during restart cooldown");
    }, RESTART_PRECREATE_DELAY_MS);

    console.log("[Tavus] Restart cooldown started (%ds)", RESTART_COOLDOWN_S);
  }, [destroyDaily, clearCaptionFadeTimer, clearEndSessionTimer, selectedMicId, setupDailyEvents]);

  // Toggle mute — mutes the Daily audio track
  const toggleMute = useCallback(() => {
    if (dailyRef.current) {
      dailyRef.current.setLocalAudio(isMuted); // unmute if muted, mute if unmuted
    }
    setIsMuted((prev) => !prev);
  }, [isMuted]);

  // Interrupt — send interrupt interaction via Daily app-message
  const interrupt = useCallback(() => {
    if (dailyRef.current && conversationIdRef.current) {
      dailyRef.current.sendAppMessage(
        {
          message_type: "conversation",
          event_type: "conversation.interrupt",
          conversation_id: conversationIdRef.current,
        },
        "*"
      );
    }
  }, []);

  // Pre-acquire mic stream early (e.g., on button hover)
  const preAcquireMic = useCallback(async () => {
    try {
      await mediaDevices.requestMicPermission();
    } catch {
      // Silent fail — permission will be requested on connect
    }
  }, [mediaDevices]);

  // Keep connect ref in sync so the auto-connect effect always calls the latest version
  // without re-running whenever connect is recreated (it recreates every render because
  // mediaDevices is a new object each render in App.tsx)
  const connectRef = useRef(connect);
  connectRef.current = connect;

  // Auto-connect when restart countdown reaches 0
  useEffect(() => {
    if (restartCountdown === 0 && connectionState === "restarting") {
      console.log("[Tavus] Restart countdown finished — auto-connecting");
      setRestartCountdown(-1);
      connectRef.current({ fromRestart: true });
    }
  }, [restartCountdown, connectionState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRestartTimers();
      if (upgradeTimerRef.current) {
        clearTimeout(upgradeTimerRef.current);
        upgradeTimerRef.current = null;
      }
      clearCaptionFadeTimer();
      clearEndSessionTimer();
      if (muteNudgeTimerRef.current) {
        clearTimeout(muteNudgeTimerRef.current);
      }
      if (dailyRef.current) {
        const convId = conversationIdRef.current;
        if (convId) {
          fetch(`${TAVUS_PROXY_URL}/api/conversations/${convId}/end`, {
            method: "POST",
          }).catch(() => {});
        }
        dailyRef.current.leave().catch(() => {});
        dailyRef.current.destroy();
        dailyRef.current = null;
      }
    };
  }, [clearRestartTimers, clearCaptionFadeTimer, clearEndSessionTimer]);

  return {
    connectionState,
    isAvatarSpeaking,
    isMuted,
    isMuteNudgeVisible,
    isConfigured,
    connect,
    disconnect,
    cancelConnect,
    toggleMute,
    interrupt,
    reconnect,
    manualRetry,
    manualRetryAvailable,
    reset,
    restart,
    restartCountdown,
    clearError,
    error,
    currentCaption,
    preAcquireMic,
    setSpeaker,
  };
}
