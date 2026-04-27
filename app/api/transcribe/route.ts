import { NextRequest, NextResponse } from "next/server";
import { createClient, DeepgramClient } from "@deepgram/sdk";
import OpenAI from "openai";
import { generateSummary } from "@/lib/ai/summarize";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import {
  createMeeting,
  updateMeeting,
  failMeeting,
  type Utterance,
  type Summary,
} from "@/lib/db/meetings";

export interface ActionItem {
  owner: string;
  task: string;
  deadline?: string;
}

export interface TranscribeResponse {
  meetingId: string;
  utterances: Utterance[];
  summary: Summary;
  duration: number;
  speakerCount: number;
}

// Initialize clients
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

let deepgram: DeepgramClient | null = null;
if (deepgramApiKey) {
  deepgram = createClient(deepgramApiKey);
}

const openai = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

// Speaker label mapping (0, 1, 2... -> Speaker A, B, C...)
function mapSpeakerLabel(speakerIndex: number): string {
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (speakerIndex < labels.length) {
    return `Speaker ${labels[speakerIndex]}`;
  }
  return `Speaker ${speakerIndex + 1}`;
}

// Format duration from seconds to HH:MM:SS
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export async function POST(request: NextRequest) {
  let meetingId: string | null = null;

  try {
    // Get authenticated user
    const supabase = await createSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Create meeting entry in database with 'processing' status
    const title = audioFile.name || "New Meeting";
    meetingId = await createMeeting(user.id, { title });
    console.log(`Created meeting with ID: ${meetingId}`);

    // Validate file type
    const allowedTypes = [
      "audio/mp3",
      "audio/wav",
      "audio/webm",
      "audio/mpeg",
      "audio/mp4",
      "audio/x-m4a",
      "audio/ogg",
    ];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${audioFile.type}. Allowed: MP3, WAV, WEBM, M4A, OGG` },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    let utterances: Utterance[] = [];
    let fullTranscript = "";
    let duration = 0;

    // Try Deepgram first, fallback to OpenAI Whisper
    if (deepgram) {
      try {
        console.log("Using Deepgram for transcription...");
        const response = await deepgram.listen.prerecorded.transcribeFile(
          audioBuffer,
          {
            model: "nova-2",
            diarize: true,
            punctuate: true,
            utterances: true,
            language: "en",
            smart_format: true,
          }
        );

        if (response.error) {
          throw new Error(`Deepgram error: ${response.error}`);
        }

        const result = response.result;
        const deepgramUtterances = result.results?.utterances || [];

        // Parse Deepgram utterances
        utterances = deepgramUtterances.map((u: { speaker: number; start: number; end: number; transcript: string }) => ({
          speaker: mapSpeakerLabel(u.speaker),
          start: u.start,
          end: u.end,
          transcript: u.transcript,
        }));

        // Build full transcript
        fullTranscript = utterances
          .map((u) => `${u.speaker}: ${u.transcript}`)
          .join("\n\n");

        // Get duration from last utterance or metadata
        duration =
          result.results?.utterances?.[result.results.utterances.length - 1]
            ?.end || 0;

        console.log(`Deepgram transcription complete: ${utterances.length} utterances`);
      } catch (deepgramError) {
        console.error("Deepgram failed, falling back to Whisper:", deepgramError);

        if (!openai) {
          return NextResponse.json(
            { error: "Deepgram failed and no OpenAI API key available for fallback" },
            { status: 500 }
          );
        }

        // Fallback to OpenAI Whisper
        const whisperResponse = await openai.audio.transcriptions.create({
          file: new File([audioBuffer], "audio.webm", { type: audioFile.type }),
          model: "whisper-1",
          response_format: "verbose_json",
        });

        // Whisper doesn't support diarization, so treat as single speaker
        fullTranscript = whisperResponse.text || "";
        duration = whisperResponse.duration || 0;

        utterances = [
          {
            speaker: "Speaker A",
            start: 0,
            end: duration,
            transcript: fullTranscript,
          },
        ];

        console.log(`Whisper transcription complete: ${fullTranscript.length} chars`);
      }
    } else if (openai) {
      // Use OpenAI Whisper directly (no Deepgram key)
      console.log("Using OpenAI Whisper for transcription...");
      const whisperResponse = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], "audio.webm", { type: audioFile.type }),
        model: "whisper-1",
        response_format: "verbose_json",
      });

      fullTranscript = whisperResponse.text || "";
      duration = whisperResponse.duration || 0;

      utterances = [
        {
          speaker: "Speaker A",
          start: 0,
          end: duration,
          transcript: fullTranscript,
        },
      ];

      console.log(`Whisper transcription complete: ${fullTranscript.length} chars`);
    } else {
      return NextResponse.json(
        { error: "No transcription API configured. Set DEEPGRAM_API_KEY or OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    // Count unique speakers
    const uniqueSpeakers = new Set(utterances.map((u) => u.speaker));
    const speakerCount = uniqueSpeakers.size;

    // Generate summary using GPT-4o
    console.log("Generating summary with GPT-4o...");
    const summary = await generateSummary(fullTranscript);
    console.log("Summary generation complete");

    // Update meeting with results
    await updateMeeting(meetingId, {
      duration_seconds: Math.round(duration),
      speaker_count: speakerCount,
      utterances,
      summary,
      status: "ready",
    });
    console.log(`Updated meeting ${meetingId} with results`);

    const response: TranscribeResponse = {
      meetingId,
      utterances,
      summary,
      duration: Math.round(duration),
      speakerCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Transcription error:", error);

    // Mark meeting as failed if we have a meetingId
    if (meetingId) {
      try {
        await failMeeting(
          meetingId,
          error instanceof Error ? error.message : "Unknown error"
        );
        console.log(`Marked meeting ${meetingId} as failed`);
      } catch (failError) {
        console.error("Error marking meeting as failed:", failError);
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unknown error occurred during transcription",
        meetingId,
      },
      { status: 500 }
    );
  }
}
