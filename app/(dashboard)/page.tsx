import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardStats,
  getRecentMeetings,
  type DashboardStats,
  type RecentMeeting,
} from "@/lib/db/meetings";
import { MeetingCard } from "@/components/ui/MeetingCard";
import { RecordingUploadPanel } from "@/components/dashboard/RecordingUploadPanel";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// Stats section with skeleton fallback
async function StatsSection({ userId }: { userId: string }) {
  const stats = await getDashboardStats(userId);

  const statItems = [
    {
      label: "Total Meetings",
      value: stats.totalMeetings.toString(),
      icon: Calendar,
      color: "#7C3AED",
    },
    {
      label: "Hours Transcribed",
      value: stats.hoursTranscribed.toString(),
      icon: Clock,
      color: "#22D3EE",
    },
    {
      label: "Action Items This Week",
      value: stats.actionItemsThisWeek.toString(),
      icon: CheckCircle2,
      color: "#10B981",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
      {statItems.map((stat, index) => (
        <div
          key={stat.label}
          className="relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/[0.04] transition-all duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-sm font-medium mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-semibold text-white tracking-tight">
                {stat.value}
              </p>
            </div>
            <div
              className="p-3 rounded-lg bg-opacity-10"
              style={{ backgroundColor: `${stat.color}20` }}
            >
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function StatsSkeleton() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SkeletonCard lines={2} className="h-24" />
      <SkeletonCard lines={2} className="h-24" />
      <SkeletonCard lines={2} className="h-24" />
    </section>
  );
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
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hrs > 0) {
    return `${hrs}h ${remainingMins}m`;
  }
  return `${mins}m`;
}

// Recent meetings section with skeleton fallback
async function RecentMeetingsSection({ userId }: { userId: string }) {
  const meetings = await getRecentMeetings(userId, 5);

  if (meetings.length === 0) {
    return (
      <section className="animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Meetings</h2>
          <Link
            href="/history"
            className="text-sm text-[#7C3AED] hover:text-[#22D3EE] transition-colors flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
          <p className="text-white/50">No meetings yet. Record or upload your first meeting!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-slide-up" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Recent Meetings</h2>
        <Link
          href="/history"
          className="text-sm text-[#7C3AED] hover:text-[#22D3EE] transition-colors flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-6 text-xs font-medium text-white/50 uppercase tracking-wider">
                Title
              </th>
              <th className="text-left py-4 px-6 text-xs font-medium text-white/50 uppercase tracking-wider">
                Date
              </th>
              <th className="text-left py-4 px-6 text-xs font-medium text-white/50 uppercase tracking-wider">
                Duration
              </th>
              <th className="text-left py-4 px-6 text-xs font-medium text-white/50 uppercase tracking-wider">
                Speakers
              </th>
              <th className="text-left py-4 px-6 text-xs font-medium text-white/50 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {meetings.map((meeting) => (
              <tr
                key={meeting.id}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-4 px-6">
                  <Link
                    href={`/history/${meeting.id}`}
                    className="text-white font-medium hover:text-[#7C3AED] transition-colors"
                  >
                    {meeting.title}
                  </Link>
                </td>
                <td className="py-4 px-6">
                  <span className="text-white/70">{formatDate(meeting.created_at)}</span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-white/70">{formatDuration(meeting.duration_seconds)}</span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1 text-white/70">
                    <Users className="w-4 h-4" />
                    <span>{meeting.speaker_count || "—"}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <MeetingCard
                    title={meeting.title}
                    date={formatDate(meeting.created_at)}
                    duration={formatDuration(meeting.duration_seconds)}
                    speakerCount={meeting.speaker_count || 0}
                    status={meeting.status}
                    compact
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentMeetingsSkeleton() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
      </div>
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} lines={1} className="h-12" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Ambient Glow Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#7C3AED]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#22D3EE]/5 rounded-full blur-[100px]" />
      </div>

      {/* Hero Stats Row */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection userId={user.id} />
      </Suspense>

      {/* Recording / Upload Tab Panel */}
      <RecordingUploadPanel />

      {/* Recent Meetings Table */}
      <Suspense fallback={<RecentMeetingsSkeleton />}>
        <RecentMeetingsSection userId={user.id} />
      </Suspense>
    </div>
  );
}
