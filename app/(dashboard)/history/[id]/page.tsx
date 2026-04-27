import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMeetingById } from "@/lib/db/meetings";
import { TranscriptView } from "@/components/results/TranscriptView";
import { SummaryPanel } from "@/components/results/SummaryPanel";
import { NotionExportButton } from "@/components/export/NotionExportButton";
import {
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

export const metadata = {
  title: "Meeting Details | Lumina AI",
  description: "View meeting transcript and summary",
};

interface MeetingDetailPageProps {
  params: {
    id: string;
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "Unknown duration";
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  if (hrs > 0) {
    return `${hrs}h ${remainingMins}m`;
  }
  return `${mins}m`;
}

export default async function MeetingDetailPage({
  params,
}: MeetingDetailPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const meeting = await getMeetingById(params.id, user.id);

  if (!meeting) {
    notFound();
  }

  // Handle processing state
  if (meeting.status === "processing") {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Ambient Glow Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#7C3AED]/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative">
          {/* Back Button */}
          <a
            href="/history"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to History</span>
          </a>

          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#7C3AED]/20 flex items-center justify-center animate-pulse">
              <Clock className="w-8 h-8 text-[#7C3AED]" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">
              Processing Meeting...
            </h1>
            <p className="text-white/50 max-w-md mx-auto">
              This meeting is still being transcribed and analyzed. Check back in a few minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle failed state
  if (meeting.status === "failed") {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Ambient Glow Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative">
          {/* Back Button */}
          <a
            href="/history"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to History</span>
          </a>

          <div className="bg-white/[0.02] backdrop-blur-sm border border-red-500/30 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">
              Processing Failed
            </h1>
            <p className="text-white/50 max-w-md mx-auto">
              Something went wrong while processing this meeting. Please try recording or uploading again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ready state - show full meeting details
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Ambient Glow Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#7C3AED]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#22D3EE]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative space-y-8">
        {/* Back Button */}
        <a
          href="/history"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to History</span>
        </a>

        {/* Meeting Header */}
        <section className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                {meeting.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/50">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(meeting.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(meeting.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Export to Notion Button */}
            <NotionExportButton meetingId={meeting.id} />
          </div>

          {/* Metadata Stats */}
          <div className="flex flex-wrap gap-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#7C3AED]" />
              <div>
                <p className="text-sm text-white/50">Duration</p>
                <p className="text-white font-medium">
                  {formatDuration(meeting.duration_seconds)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#22D3EE]" />
              <div>
                <p className="text-sm text-white/50">Speakers</p>
                <p className="text-white font-medium">
                  {meeting.speaker_count || "Unknown"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Status</p>
                <p className="text-white font-medium capitalize">
                  {meeting.status}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Summary Panel */}
        {meeting.summary && (
          <section>
            <SummaryPanel summary={meeting.summary} />
          </section>
        )}

        {/* Transcript View */}
        {meeting.utterances && (
          <section>
            <TranscriptView utterances={meeting.utterances} />
          </section>
        )}

        {/* Export Section - Placeholder */}
        <section className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Export Options
              </h3>
              <p className="text-sm text-white/50">
                Export this meeting to your preferred platform
              </p>
            </div>
            <div className="flex gap-3">
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/40 cursor-not-allowed"
                title="TODO: Prompt 5"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Export to Notion</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-white/30 mt-4">
            TODO: Prompt 5 - Export functionality will be implemented here
          </p>
        </section>
      </div>
    </div>
  );
}
