"use client";

import { useState, useCallback, useRef } from "react";
import { TranscriptView } from "@/components/results/TranscriptView";
import { SummaryPanel } from "@/components/results/SummaryPanel";
import { Upload, X, FileAudio, Send, AlertCircle, Loader2, RotateCcw } from "lucide-react";

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

type ProcessingState = "idle" | "uploading" | "processing" | "complete" | "error";

const ALLOWED_TYPES = [
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

interface UploadedFile {
  file: File;
  previewURL: string;
}

export function FileUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscribeResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload MP3, WAV, WEBM, or M4A files.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large. Maximum size is 500MB.";
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    setValidationError(null);
    setApiError(null);
    setResult(null);
    setProcessingState("idle");

    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    const previewURL = URL.createObjectURL(file);
    setUploadedFile({ file, previewURL });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.previewURL);
    }
    setUploadedFile(null);
    setValidationError(null);
    setApiError(null);
    setResult(null);
    setProcessingState("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!uploadedFile) return;

    setProcessingState("processing");
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append("audio", uploadedFile.file);

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
      setApiError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      setProcessingState("error");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Validation Error Message */}
      {validationError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{validationError}</span>
        </div>
      )}

      {/* API Error Message */}
      {processingState === "error" && apiError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{apiError}</span>
        </div>
      )}

      {!uploadedFile ? (
        /* Upload Zone */
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? "border-[#7C3AED] bg-[#7C3AED]/10"
              : "border-white/20 hover:border-[#7C3AED]/50 hover:bg-white/[0.02]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mp3,audio/wav,audio/webm,audio/mpeg,audio/mp4,.m4a"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              <Upload className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              Drop your audio file here
            </h3>
            <p className="text-sm text-white/50 mb-4">
              or click to browse from your device
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-white/40">
              <span>Supported: MP3, WAV, WEBM, M4A</span>
              <span>•</span>
              <span>Max 500MB</span>
            </div>
          </div>
        </div>
      ) : (
        /* File Preview */
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          {/* File Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center flex-shrink-0">
              <FileAudio className="w-6 h-6 text-[#7C3AED]" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium truncate">
                {uploadedFile.file.name}
              </h4>
              <p className="text-sm text-white/50">
                {formatFileSize(uploadedFile.file.size)}
              </p>
            </div>

            <button
              onClick={handleClear}
              className="p-2 text-white/40 hover:text-white/80 hover:bg-white/10 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Audio Preview */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <audio
              src={uploadedFile.previewURL}
              controls
              className="w-full"
              style={{ filter: "invert(1) hue-rotate(180deg)" }}
            />
          </div>

          {/* Processing State */}
          {processingState === "processing" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-10 h-10 text-[#7C3AED] animate-spin" />
              <p className="text-white/80">🧠 Analyzing your meeting...</p>
              <p className="text-sm text-white/50">This may take a minute</p>
            </div>
          )}

          {/* Submit Button - hide when processing */}
          {processingState !== "processing" && processingState !== "complete" && (
            <button
              onClick={handleSubmit}
              disabled={processingState === "processing"}
              className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-white/10 disabled:text-white/50 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]"
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
          )}

          {/* Results - show when complete */}
          {processingState === "complete" && result && (
            <div className="space-y-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Meeting Results</h3>
                <button
                  onClick={handleClear}
                  className="text-sm text-[#7C3AED] hover:text-[#22D3EE] transition-colors"
                >
                  Upload New File
                </button>
              </div>

              <SummaryPanel summary={result.summary} />
              <TranscriptView utterances={result.utterances} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
