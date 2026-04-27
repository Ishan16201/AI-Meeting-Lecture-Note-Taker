"use client";

import { useState } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { TranscriptView } from "@/components/results/TranscriptView";
import { SummaryPanel } from "@/components/results/SummaryPanel";
import { LiveBadge } from "./LiveBadge";
import { DurationCounter } from "./DurationCounter";
import { Mic, Square, Pause, Play, Send, RotateCcw, Loader2, AlertCircle } from "lucide-react";

interface Utterance {
  speaker: string;
  start: number;
  end: number;
  transcript: string;
}

interface ActionItem {
  owner: string;
  task: string;
  deadline?: string;
}

interface Summary {
  tldr: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
}

interface TranscribeResponse {
  utterances: Utterance[];
  summary: Summary;
  duration: number;
  speakerCount: number;
}

type ProcessingState = "idle" | "recording" | "processing" | "complete" | "error";

export function RecorderPanel() {
  const [showPreview, setShowPreview] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<TranscribeResponse | null>(null);

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioURL,
    mediaStream,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useAudioRecorder();

  const handleStop = () => {
    stopRecording();
    setShowPreview(true);
  };

  const handleRestart = () => {
    setShowPreview(false);
    // Reset will happen automatically on next startRecording
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;

    setProcessingState("processing");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transcription failed");
      }

      const data: TranscribeResponse = await response.json();
      setResult(data);
      setProcessingState("complete");

      // Result saved to Supabase, meetingId: data.meetingId
    } catch (error) {
      console.error("Transcription error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      setProcessingState("error");
    }
  };

  return (
    <div
      className={`relative bg-white/[0.02] backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 ${
        isRecording
          ? "border-[#7C3AED] ring-2 ring-[#7C3AED] ring-offset-2 ring-offset-[#0A0A0F]"
          : "border-white/10"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-semibold text-white">
              {isRecording
                ? isPaused
                  ? "Recording Paused"
                  : "Recording..."
                : showPreview
                ? "Preview Recording"
                : "Ready to Record"}
            </h3>
            <LiveBadge isRecording={isRecording && !isPaused} />
          </div>
          <p className="text-sm text-white/50 mt-1">
            {isRecording
              ? "Recording in progress"
              : showPreview
              ? "Review your recording before submitting"
              : "Click the button below to start"}
          </p>
        </div>

        {/* Duration Display */}
        <div className="text-right">
          <DurationCounter seconds={duration} />
          <p className="text-xs text-white/50">Duration</p>
        </div>
      </div>

      {/* Waveform Visualizer */}
      <div className="mb-8">
        <WaveformVisualizer mediaStream={isRecording ? mediaStream : null} isRecording={isRecording && !isPaused} />
      </div>

      {/* Error Banner */}
      {processingState === "error" && errorMessage && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Processing State */}
      {processingState === "processing" && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-12 h-12 text-[#7C3AED] animate-spin" />
          <p className="text-lg text-white/80">🧠 Analyzing your meeting...</p>
          <p className="text-sm text-white/50">This may take a minute</p>
        </div>
      )}

      {/* Controls - only show when not processing */}
      {processingState !== "processing" && processingState !== "complete" && (
        <>
          {!showPreview ? (
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium py-3 px-8 rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <>
                  {/* Pause/Resume Button */}
                  <button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-6 rounded-full border border-white/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>

                  {/* Stop Button */}
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium py-3 px-8 rounded-full border border-red-500/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            /* Preview Mode */
            <div className="space-y-6">
              {audioURL && (
                <div className="bg-white/5 rounded-lg p-4">
                  <audio
                    src={audioURL}
                    controls
                    className="w-full"
                    style={{ filter: "invert(1) hue-rotate(180deg)" }}
                  />
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-6 rounded-full border border-white/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Record Again</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={!audioBlob || processingState === "processing"}
                  className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-white/10 disabled:text-white/50 text-white font-medium py-3 px-8 rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]"
                >
                  {processingState === "processing" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit for Transcription</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Results - show when complete */}
      {processingState === "complete" && result && (
        <div className="space-y-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Meeting Results</h3>
            <button
              onClick={handleRestart}
              className="text-sm text-[#7C3AED] hover:text-[#22D3EE] transition-colors"
            >
              Record New Meeting
            </button>
          </div>

          <SummaryPanel summary={result.summary} />
          <TranscriptView utterances={result.utterances} />
        </div>
      )}
    </div>
  );
}
