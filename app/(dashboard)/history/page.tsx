import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMeetings, type Meeting } from "@/lib/db/meetings";
import { MeetingCard } from "@/components/ui/MeetingCard";
import { MeetingCardSkeleton } from "@/components/ui/MeetingCardSkeleton";
import { SearchBar } from "@/components/history/SearchBar";
import { Mic, FileText } from "lucide-react";

export const metadata = {
  title: "Meeting History | Lumina AI",
  description: "View and search your meeting transcripts",
};

interface HistoryPageProps {
  searchParams: { q?: string };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

async function MeetingsList({ userId, searchQuery }: { userId: string; searchQuery?: string }) {
  const meetings = await getMeetings(userId, searchQuery);

  if (meetings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#22D3EE]/10 flex items-center justify-center">
          <FileText className="w-12 h-12 text-white/40" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {searchQuery ? "No meetings found" : "No meetings yet"}
        </h3>
        <p className="text-white/50 max-w-md mx-auto mb-8">
          {searchQuery
            ? `No meetings match your search for "${searchQuery}". Try a different search term.`
            : "Start recording or uploading audio to see your meeting history here."}
        </p>
        {!searchQuery && (
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
          >
            <Mic className="w-5 h-5" />
            <span>Start Recording</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <a
          key={meeting.id}
          href={`/history/${meeting.id}`}
          className="block hover:scale-[1.01] transition-transform duration-200"
        >
          <MeetingCard
            title={meeting.title}
            date={formatDate(meeting.created_at)}
            duration={formatDuration(meeting.duration_seconds)}
            speakerCount={meeting.speaker_count || 0}
            status={meeting.status}
          />
        </a>
      ))}
    </div>
  );
}

function MeetingsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <MeetingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const query = searchParams.q || "";
  const meetings = await getMeetings("placeholder-user-id", query);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Ambient Glow Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#7C3AED]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#22D3EE]/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <section className="animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Meeting History</h1>
            <p className="text-white/50 mt-1">
              View and search all your transcribed meetings
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mb-8">
          <SearchBar />
        </div>
      </section>

      {/* Meetings List */}
      <section className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <Suspense fallback={<MeetingsListSkeleton />}>
          <MeetingsList userId="placeholder-user-id" searchQuery={query} />
        </Suspense>
      </section>
    </div>
  );
}
