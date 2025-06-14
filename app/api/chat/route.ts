import { NextRequest } from "next/server";
import { streamText, convertToCoreMessages } from "ai";
import { getLanguageModel } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { generateConversationTitle } from "@/lib/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Request schema validation
const chatRequestSchema = z.object({
  id: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      parts: z.array(z.any()).optional(), // useChat sends parts array
    }),
  ),
  model: z.string().optional().default("gpt-4"),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  max_tokens: z.number().min(1).max(4096).optional().default(2048),
  conversationId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    console.log("Chat API called");

    // Parse and validate request
    const body = await req.json();
    console.log("Request body:", body);

    const { messages, model, temperature, max_tokens, conversationId } =
      chatRequestSchema.parse(body);

    console.log("Parsed params:", {
      messages,
      model,
      temperature,
      max_tokens,
      conversationId,
    });

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("User:", user?.id, "Auth error:", authError);

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's API keys if they have custom ones
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("api_keys")
      .eq("user_id", user.id)
      .single();

    const apiKeys = userSettings?.api_keys as Record<string, string> | null;

    // Convert messages to core format
    // First normalize the message format (useChat sends parts array, but we need string content)
    const normalizedMessages = messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : Array.isArray(msg.parts)
            ? msg.parts.map((p) => p.text || p).join("")
            : msg.content,
    }));

    console.log("Normalized messages:", normalizedMessages);

    // Use the provided conversation ID if available
    let validConversationId = conversationId;
    if (!validConversationId) {
      validConversationId = uuidv4();
    }

    // First ensure the conversation exists before saving any messages
    const { data: existingConversation, error: fetchError } = await supabase
      .from("conversations")
      .select("id, system_prompt")
      .eq("id", validConversationId)
      .eq("user_id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error fetching conversation:", fetchError);
      return new Response("Error fetching conversation", { status: 500 });
    }

    if (!existingConversation) {
      // Generate title from first user message
      const firstUserMessage = normalizedMessages.find(
        (msg) => msg.role === "user",
      );
      const title = firstUserMessage
        ? generateConversationTitle(firstUserMessage.content)
        : "New Conversation";

      // Create conversation if it doesn't exist
      const { error: convError } = await supabase.from("conversations").insert({
        id: validConversationId,
        user_id: user.id,
        title: title,
        model: model,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (convError) {
        console.error("Error creating conversation:", convError);
        return new Response("Error creating conversation", { status: 500 });
      }
    }

    // Load existing messages from database to maintain context
    const { data: existingMessages, error: messagesError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", validConversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching existing messages:", messagesError);
      return new Response("Error fetching conversation history", {
        status: 500,
      });
    }

    // Save the user message to database first (the last message should be the new user message)
    if (messages.length > 0) {
      const lastMessage = normalizedMessages[normalizedMessages.length - 1];
      if (lastMessage?.role === "user") {
        const { error: msgError } = await saveMessageToDatabase(supabase, {
          conversationId: validConversationId,
          role: "user",
          content: lastMessage.content,
          userId: user.id,
        });

        if (msgError) {
          console.error("Error saving user message:", msgError);
          return new Response("Error saving message", { status: 500 });
        }
      }
    }

    // Combine existing messages with the new user message for full context
    const allMessages = [
      // Add system prompt if it exists, otherwise use a default one
      {
        role: "system" as const,
        content:
          existingConversation?.system_prompt ||
          "You are a helpful AI assistant. You provide accurate, thoughtful, and detailed responses while maintaining context throughout the conversation. You can help with a wide variety of tasks including answering questions, writing, analysis, coding, and creative tasks.",
      },
      ...existingMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      // Add the new user message if it's not already in the database
      ...normalizedMessages.filter(
        (msg) =>
          msg.role === "user" &&
          !existingMessages.some(
            (existing) =>
              existing.role === "user" && existing.content === msg.content,
          ),
      ),
    ];

    console.log("All messages for AI context:", allMessages);
    const coreMessages = convertToCoreMessages(allMessages);

    console.log("Core messages:", coreMessages);

    // Get language model instance
    const languageModel = getLanguageModel(
      model,
      apiKeys?.openai || process.env.OPENAI_API_KEY,
    );

    console.log("Language model created:", languageModel);
    console.log(
      "API Key available:",
      !!(apiKeys?.openai || process.env.OPENAI_API_KEY),
    );

    // Stream the response
    try {
      console.log("About to call streamText with OpenAI...");

      const result = await streamText({
        model: languageModel,
        messages: coreMessages,
        temperature,
        maxTokens: max_tokens,
        async onFinish({ text, usage }) {
          console.log("AI response finished:", text);
          console.log("Usage:", usage);
          // Save the AI response to database
          const { error: msgError } = await saveMessageToDatabase(supabase, {
            conversationId: validConversationId,
            role: "assistant",
            content: text,
            userId: user.id,
            usage,
          });

          if (msgError) {
            console.error("Error saving AI response:", msgError);
          }
        },
      });

      console.log("streamText completed successfully");
      const response = result.toDataStreamResponse();
      console.log("toDataStreamResponse completed");
      return response;
    } catch (streamError) {
      console.error("Error in streamText:", streamError);
      return new Response(
        JSON.stringify({ error: "Failed to generate response" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Chat API error:", error);

    if (error instanceof z.ZodError) {
      return new Response("Invalid request parameters", { status: 400 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}

// Helper function to save messages to database
async function saveMessageToDatabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  {
    conversationId,
    role,
    content,
    userId,
    usage,
  }: {
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    userId: string;
    usage?: Record<string, unknown>;
  },
) {
  try {
    // Insert the message
    const { error: msgError } = await supabase.from("messages").insert({
      id: uuidv4(), // Ensure each message has a unique ID
      conversation_id: conversationId,
      role,
      content,
      metadata: usage ? { usage } : null,
      created_at: new Date().toISOString(),
    });

    if (msgError) {
      console.error("Error saving message:", msgError);
      return { error: msgError };
    }

    // Update conversation timestamp
    const { error: updateError } = await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating conversation timestamp:", updateError);
      return { error: updateError };
    }

    return { error: null };
  } catch (error) {
    console.error("Error in saveMessageToDatabase:", error);
    return { error };
  }
}
