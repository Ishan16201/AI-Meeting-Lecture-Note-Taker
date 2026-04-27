"use client";

import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  mediaStream: MediaStream | null;
  isRecording?: boolean;
}

export function WaveformVisualizer({ mediaStream, isRecording = false }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const scanLineRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 80;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let audioContext: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;

    if (mediaStream) {
      // Create audio context and analyser for live recording
      audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }

    const draw = () => {
      if (!ctx || !canvas) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (mediaStream && analyserRef.current && dataArrayRef.current) {
        // Live recording visualization - frequency bars
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        const barCount = 64;
        const barWidth = width / barCount;
        const step = Math.floor(dataArrayRef.current.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * step;
          const value = dataArrayRef.current[dataIndex];
          const percent = value / 255;
          const barHeight = percent * height * 0.8;

          const x = i * barWidth;
          const y = (height - barHeight) / 2;

          // Create gradient from violet to cyan
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, "#7C3AED");
          gradient.addColorStop(1, "#22D3EE");

          ctx.fillStyle = gradient;
          ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        }

        // Animated scanning line while recording
        if (isRecording) {
          scanLineRef.current = (scanLineRef.current + 1) % (height * 2);
          const scanY = Math.abs(scanLineRef.current - height);
          
          ctx.strokeStyle = "#22D3EE";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, scanY);
          ctx.lineTo(width, scanY);
          ctx.stroke();
        }
      } else {
        // Idle state - flat line with gentle pulse
        const centerY = height / 2;
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 2) * 2;

        // Draw idle line
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        // Create subtle wave pattern
        for (let x = 0; x < width; x += 2) {
          const y = centerY + Math.sin((x / width) * Math.PI * 4 + time) * pulse;
          ctx.lineTo(x, y);
        }

        // Gradient stroke
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, "#7C3AED40");
        gradient.addColorStop(0.5, "#22D3EE40");
        gradient.addColorStop(1, "#7C3AED40");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw center glow point
        const glowX = width / 2;
        const glowY = centerY + Math.sin(time * 3) * 3;

        const glowGradient = ctx.createRadialGradient(
          glowX,
          glowY,
          0,
          glowX,
          glowY,
          20
        );
        glowGradient.addColorStop(0, "#7C3AED60");
        glowGradient.addColorStop(1, "transparent");

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(glowX, glowY, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [mediaStream]);

  return (
    <div className="relative" data-testid="waveform-visualizer">
      {/* Radial glow effect behind canvas when recording */}
      {isRecording && (
        <div 
          className="absolute inset-0 bg-[#7C3AED]/20 blur-xl rounded-full scale-150 motion-safe:animate-pulse"
          aria-hidden="true"
        />
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-20 rounded-lg bg-white/[0.02] relative z-10"
        style={{ imageRendering: "crisp-edges" }}
      />
    </div>
  );
}
