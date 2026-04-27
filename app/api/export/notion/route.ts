import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { createClient } from "@/lib/supabase/server";
import { getMeetingById } from "@/lib/db/meetings";

// Initialize Notion client
const notionApiKey = process.env.NOTION_API_KEY;
const notionParentPageId = process.env.NOTION_PARENT_PAGE_ID;

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!notionApiKey || !notionParentPageId) {
      return NextResponse.json(
        { error: "Notion integration not configured" },
        { status: 500 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
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

    // Parse request body
    const { meetingId } = await request.json();

    if (!meetingId) {
      return NextResponse.json(
        { error: "Meeting ID is required" },
        { status: 400 }
      );
    }

    // Fetch meeting from database (with RLS check via userId)
    const meeting = await getMeetingById(meetingId, user.id);

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    if (meeting.status !== "ready") {
      return NextResponse.json(
        { error: "Meeting is not ready for export" },
        { status: 400 }
      );
    }

    // Initialize Notion client
    const notion = new Client({ auth: notionApiKey });

    // Format date for title
    const meetingDate = new Date(meeting.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const pageTitle = `${meeting.title} - ${meetingDate}`;

    // Build Notion page blocks
    const blocks: any[] = [];

    // TLDR Section - Callout block
    if (meeting.summary?.tldr) {
      blocks.push({
        object: "block",
        type: "callout",
        callout: {
          icon: { emoji: "💡" },
          color: "yellow_background",
          rich_text: [
            {
              type: "text",
              text: { content: "TL;DR\n" },
              annotations: { bold: true },
            },
            {
              type: "text",
              text: { content: meeting.summary.tldr },
            },
          ],
        },
      });

      // Add spacing
      blocks.push({
        object: "block",
        type: "divider",
        divider: {},
      });
    }

    // Key Decisions Section
    if (meeting.summary?.keyDecisions && meeting.summary.keyDecisions.length > 0) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Key Decisions" } }],
        },
      });

      for (const decision of meeting.summary.keyDecisions) {
        blocks.push({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: decision } }],
          },
        });
      }

      blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: [] } });
    }

    // Action Items Section
    if (meeting.summary?.actionItems && meeting.summary.actionItems.length > 0) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Action Items" } }],
        },
      });

      // Create table for action items
      const tableRows: any[] = [
        // Header row
        {
          object: "block",
          type: "table_row",
          table_row: {
            cells: [
              [{ type: "text", text: { content: "Owner" }, annotations: { bold: true } }],
              [{ type: "text", text: { content: "Task" }, annotations: { bold: true } }],
              [{ type: "text", text: { content: "Deadline" }, annotations: { bold: true } }],
            ],
          },
        },
      ];

      // Data rows
      for (const item of meeting.summary.actionItems) {
        tableRows.push({
          object: "block",
          type: "table_row",
          table_row: {
            cells: [
              [{ type: "text", text: { content: item.owner } }],
              [{ type: "text", text: { content: item.task } }],
              [{ type: "text", text: { content: item.deadline || "—" } }],
            ],
          },
        });
      }

      blocks.push({
        object: "block",
        type: "table",
        table: {
          table_width: 3,
          has_column_header: true,
          has_row_header: false,
          children: tableRows,
        },
      });

      blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: [] } });
    }

    // Full Transcript Section - Toggle block
    if (meeting.utterances && meeting.utterances.length > 0) {
      blocks.push({
        object: "block",
        type: "divider",
        divider: {},
      });

      // Format timestamp helper
      const formatTimestamp = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      };

      // Create toggle with transcript
      const transcriptBlocks = meeting.utterances.map((utterance) => ({
        object: "block" as const,
        type: "paragraph" as const,
        paragraph: {
          rich_text: [
            {
              type: "text" as const,
              text: { content: `[${utterance.speaker}] ` },
              annotations: { bold: true, color: utterance.speaker === "Speaker A" ? "purple" : "blue" },
            },
            {
              type: "text" as const,
              text: { content: `[${formatTimestamp(utterance.start)}] ` },
              annotations: { code: true },
            },
            {
              type: "text" as const,
              text: { content: utterance.transcript },
            },
          ],
        },
      }));

      blocks.push({
        object: "block",
        type: "toggle",
        toggle: {
          rich_text: [
            {
              type: "text",
              text: { content: "📝 Full Transcript" },
              annotations: { bold: true },
            },
          ],
          children: transcriptBlocks,
        },
      });
    }

    // Create the Notion page
    const notionPage = await notion.pages.create({
      parent: { page_id: notionParentPageId },
      properties: {
        title: {
          title: [{ text: { content: pageTitle } }],
        },
      },
      children: blocks,
    });

    // Return the Notion page URL
    const notionUrl = `https://notion.so/${notionPage.id.replace(/-/g, "")}`;

    return NextResponse.json({ notionUrl });
  } catch (error) {
    console.error("Notion export error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during export",
      },
      { status: 500 }
    );
  }
}
