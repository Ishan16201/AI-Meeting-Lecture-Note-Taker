"use client";

import { useState } from "react";
import { RecorderPanel } from "@/components/recorder/RecorderPanel";
import { FileUploadZone } from "@/components/recorder/FileUploadZone";
import { Mic, Upload } from "lucide-react";

export function RecordingUploadPanel() {
  const [activeTab, setActiveTab] = useState<"record" | "upload">("record");

  return (
    <section className="animate-slide-up" style={{ animationDelay: "300ms" }}>
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("record")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-inset ${
              activeTab === "record"
                ? "bg-[#7C3AED]/10 text-white border-b-2 border-[#7C3AED]"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <Mic className="w-5 h-5" />
            <span>Record</span>
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-inset ${
              activeTab === "upload"
                ? "bg-[#7C3AED]/10 text-white border-b-2 border-[#7C3AED]"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>Upload</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === "record" ? (
            <RecorderPanel />
          ) : (
            <FileUploadZone />
          )}
        </div>
      </div>
    </section>
  );
}
