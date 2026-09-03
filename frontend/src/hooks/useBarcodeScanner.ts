// src/hooks/useBarcodeScanner.ts
import { useEffect, useRef } from "react";

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minCharacters?: number;
  maxKeyIntervalMs?: number;
  playBeepOnScan?: boolean;
}

export function useBarcodeScanner({
  onScan,
  enabled = true,
  minCharacters = 3,
  maxKeyIntervalMs = 50,
  playBeepOnScan = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  const playBeep = () => {
    if (!playBeepOnScan) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // 1.2 kHz crisp POS beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // Audio not supported or blocked, ignore safely
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an open input element that isn't barcode scanning
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";

      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Handle barcode scanner Enter key (terminator)
      if (e.key === "Enter") {
        if (bufferRef.current.length >= minCharacters) {
          const scannedCode = bufferRef.current.trim();
          bufferRef.current = "";
          playBeep();
          onScan(scannedCode);
          if (isInput) {
            e.preventDefault();
          }
        } else {
          bufferRef.current = "";
        }
        return;
      }

      // If keys are arriving slowly (> maxKeyIntervalMs), it's human typing — reset buffer
      if (elapsed > maxKeyIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      // Append printable single characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, minCharacters, maxKeyIntervalMs, onScan, playBeepOnScan]);
}
