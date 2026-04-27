import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function generateSummary(transcript: string): Promise<Summary> {
  try {
    const systemPrompt = `You are an expert meeting analyst. Your output must be valid JSON only, with no preamble or markdown fences.

Analyze the meeting transcript and extract:
1. A 2-sentence TLDR summary of what was discussed
2. A list of key decisions that were made
3. A list of action items with owner, task description, and deadline (if mentioned)

Output format:
{
  "tldr": "string (2 sentences max)",
  "keyDecisions": ["string", "string", ...],
  "actionItems": [
    {
      "owner": "string (person name or 'Unassigned')",
      "task": "string (clear action description)",
      "deadline": "string (ISO date or relative time like 'next week', or omit if not specified)"
    },
    ...
  ]
}

Rules:
- Use the exact names of people mentioned in the transcript
- If no deadline is mentioned, omit the deadline field entirely
- If no action items, return empty array []
- If no key decisions, return empty array []
- Be concise but comprehensive`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Please analyze this meeting transcript:\n\n${transcript}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const parsed = JSON.parse(content) as Summary;

    // Validate and normalize the response
    return {
      tldr: parsed.tldr || "Summary unavailable.",
      keyDecisions: Array.isArray(parsed.keyDecisions)
        ? parsed.keyDecisions
        : [],
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems.map((item) => ({
            owner: item.owner || "Unassigned",
            task: item.task || "",
            deadline: item.deadline,
          }))
        : [],
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    // Fallback to prevent app crashes
    return {
      tldr: "Summary unavailable due to processing error.",
      keyDecisions: [],
      actionItems: [],
    };
  }
}
