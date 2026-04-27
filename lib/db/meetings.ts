import { createClient } from "@/lib/supabase/server";

// Type definitions
export interface Utterance {
  speaker: string;
  start: number;
  end: number;
  transcript: string;
}

export interface ActionItem {
  owner: string;
  task: string;
  deadline?: string;
}

export interface Summary {
  tldr: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
}

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  duration_seconds: number | null;
  speaker_count: number | null;
  audio_url: string | null;
  utterances: Utterance[] | null;
  summary: Summary | null;
  status: 'processing' | 'ready' | 'failed';
}

export interface CreateMeetingInput {
  title: string;
  audio_url?: string;
}

export interface UpdateMeetingInput {
  duration_seconds?: number;
  speaker_count?: number;
  utterances?: Utterance[];
  summary?: Summary;
  status?: 'ready' | 'failed';
}

/**
 * Create a new meeting with status 'processing'
 */
export async function createMeeting(
  userId: string,
  data: CreateMeetingInput
): Promise<string> {
  const supabase = await createClient();

  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      user_id: userId,
      title: data.title,
      audio_url: data.audio_url || null,
      status: 'processing',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating meeting:', error);
    throw new Error(`Failed to create meeting: ${error.message}`);
  }

  return meeting.id;
}

/**
 * Update a meeting with transcription results
 */
export async function updateMeeting(
  id: string,
  data: UpdateMeetingInput
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('meetings')
    .update({
      ...data,
      status: 'ready',
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating meeting:', error);
    throw new Error(`Failed to update meeting: ${error.message}`);
  }
}

/**
 * Mark a meeting as failed
 */
export async function failMeeting(
  id: string,
  errorMsg: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('meetings')
    .update({
      status: 'failed',
    })
    .eq('id', id);

  if (error) {
    console.error('Error failing meeting:', error);
    throw new Error(`Failed to update meeting status: ${error.message}`);
  }

  // Optionally, we could store the error message in a separate column or log it
  console.error(`Meeting ${id} failed:`, errorMsg);
}

/**
 * Get all meetings for a user, optionally filtered by search query
 */
export async function getMeetings(
  userId: string,
  searchQuery?: string
): Promise<Meeting[]> {
  const supabase = await createClient();

  let query = supabase
    .from('meetings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Add full-text search if query provided
  if (searchQuery && searchQuery.trim()) {
    query = query.textSearch('fts_vector', searchQuery.trim());
  }

  const { data: meetings, error } = await query;

  if (error) {
    console.error('Error fetching meetings:', error);
    throw new Error(`Failed to fetch meetings: ${error.message}`);
  }

  return meetings || [];
}

/**
 * Get a single meeting by ID (with RLS check via userId)
 */
export async function getMeetingById(
  id: string,
  userId: string
): Promise<Meeting | null> {
  const supabase = await createClient();

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching meeting:', error);
    throw new Error(`Failed to fetch meeting: ${error.message}`);
  }

  return meeting;
}

/**
 * Delete a meeting
 */
export async function deleteMeeting(
  id: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting meeting:', error);
    throw new Error(`Failed to delete meeting: ${error.message}`);
  }
}

// Dashboard-specific types
export interface DashboardStats {
  totalMeetings: number;
  hoursTranscribed: number;
  actionItemsThisWeek: number;
}

export interface RecentMeeting {
  id: string;
  title: string;
  created_at: string;
  duration_seconds: number | null;
  speaker_count: number | null;
  status: 'processing' | 'ready' | 'failed';
}

/**
 * Get dashboard statistics for a user
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  try {
    const supabase = await createClient();

    // Get total meetings count
    const { count: totalMeetings, error: countError } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error counting meetings:', countError);
    }

    // Get sum of duration_seconds for hours transcribed
    const { data: durationData, error: durationError } = await supabase
      .from('meetings')
      .select('duration_seconds')
      .eq('user_id', userId)
      .eq('status', 'ready')
      .not('duration_seconds', 'is', null);

    if (durationError) {
      console.error('Error fetching durations:', durationError);
    }

    const totalSeconds = durationData?.reduce((sum: number, m: { duration_seconds: number | null }) => sum + (m.duration_seconds || 0), 0) || 0;
    const hoursTranscribed = Math.round((totalSeconds / 3600) * 10) / 10;

    // Get action items from meetings in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: recentMeetings, error: recentError } = await supabase
      .from('meetings')
      .select('summary')
      .eq('user_id', userId)
      .eq('status', 'ready')
      .gte('created_at', oneWeekAgo.toISOString());

    if (recentError) {
      console.error('Error fetching recent meetings:', recentError);
    }

    const actionItemsThisWeek = recentMeetings?.reduce((count: number, m: { summary: { actionItems?: unknown[] } | null }) => {
      return count + (m.summary?.actionItems?.length || 0);
    }, 0) || 0;

    return {
      totalMeetings: totalMeetings || 0,
      hoursTranscribed,
      actionItemsThisWeek,
    };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    // Return empty stats if table doesn't exist or other error
    return {
      totalMeetings: 0,
      hoursTranscribed: 0,
      actionItemsThisWeek: 0,
    };
  }
}

/**
 * Get recent meetings for dashboard (last 5)
 */
export async function getRecentMeetings(userId: string, limit: number = 5): Promise<RecentMeeting[]> {
  try {
    const supabase = await createClient();

    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('id, title, created_at, duration_seconds, speaker_count, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent meetings:', error);
      return [];
    }

    return meetings || [];
  } catch (error) {
    console.error('Error in getRecentMeetings:', error);
    return [];
  }
}
