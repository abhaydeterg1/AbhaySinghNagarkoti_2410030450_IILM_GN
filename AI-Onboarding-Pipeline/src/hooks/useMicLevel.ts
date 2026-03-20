import { useState, useEffect, useRef } from "react";

export function useMicLevel(deviceId: string, enabled: boolean) {
  const [level, setLevel] = useState(0);
  const rafRef = useRef(0);
  const frameCount = useRef(0);

  useEffect(() => {
    if (!enabled) { setLevel(0); return; }

    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let cancelled = false;

    (async () => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Float32Array(analyser.fftSize);

        const tick = () => {
          if (cancelled) return;
          frameCount.current++;
          if (frameCount.current % 4 === 0) {
            analyser.getFloatTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
            setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        console.warn("Mic level capture failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close();
      setLevel(0);
    };
  }, [deviceId, enabled]);

  return level;
}
