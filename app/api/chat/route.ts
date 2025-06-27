import { NextRequest } from "next/server";
import { streamText, convertToCoreMessages } from "ai";
import { getLanguageModel, getModelById } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { generateConversationTitle } from "@/lib/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { getUser } from "@/lib/auth";

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
  max_tokens: z.number().min(1).max(200000).optional().default(8192),
  conversationId: z.string().optional(),
  personaId: z.string().optional(),
  branchName: z.string().optional().default("main"),
  apiKeys: z.record(z.string()).optional(), // Client-provided API keys
  attachments: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["image", "document"]),
        name: z.string(),
        url: z.string(),
        size: z.number(),
        mime_type: z.string(),
        extractedText: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    console.log("Chat API called");

    // Parse and validate request
    const body = await req.json();
    console.log("Request body:", body);
    console.log("Body attachments:", body.attachments);

    const {
      messages,
      model,
      temperature,
      max_tokens,
      conversationId,
      personaId,
      branchName,
      apiKeys,
      attachments,
    } = chatRequestSchema.parse(body);

    console.log("Parsed attachments:", attachments);

    console.log("Parsed params:", {
      messages,
      model,
      temperature,
      max_tokens,
      conversationId,
      hasApiKeys: !!apiKeys && Object.keys(apiKeys).length > 0,
    });

    // Validate max_tokens against model capabilities
    const modelInfo = getModelById(model);
    if (modelInfo && max_tokens > modelInfo.maxTokens) {
      console.warn(
        `Requested max_tokens (${max_tokens}) exceeds model limit (${modelInfo.maxTokens}), capping to model limit`,
      );
      // Don't error, just cap to model limit
    }

    // Get authenticated user
    const supabase = await createClient();
    const user = await getUser();

    console.log("User:", user?.id);

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Use client-provided API keys (no fallback to environment variables)
    const providerApiKeys: Record<string, string> = {};
    if (apiKeys?.openai) {
      providerApiKeys.openai = apiKeys.openai;
    }
    if (apiKeys?.anthropic) {
      providerApiKeys.anthropic = apiKeys.anthropic;
    }
    if (apiKeys?.google) {
      providerApiKeys.google = apiKeys.google;
    }
    if (apiKeys?.openrouter) {
      providerApiKeys.openrouter = apiKeys.openrouter;
    }

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
      .select("id, system_prompt, persona_id")
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
        persona_id: personaId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (convError) {
        console.error("Error creating conversation:", convError);
        return new Response("Error creating conversation", { status: 500 });
      }

      // Create the main branch for the new conversation
      const { error: branchError } = await supabase.from("conversation_branches").insert({
        conversation_id: validConversationId,
        branch_name: "main",
        display_name: "Main",
        is_active: true,
        message_count: 0,
      });

      if (branchError) {
        console.error("Error creating main branch:", branchError);
        // Don't fail the entire request for this, but log it
      }
    }

    // Load existing messages from database to maintain context (for the specific branch)
    const { data: existingMessages, error: messagesError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", validConversationId)
      .eq("branch_name", branchName)
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
        // Save the original user message content to database (not the enhanced version)
        // The enhanced version is only for AI context
        // For image-only messages, use empty string content but still save with attachments
        const { error: msgError } = await saveMessageToDatabase(supabase, {
          conversationId: validConversationId,
          role: "user",
          content: lastMessage.content || "", // Use empty string for image-only messages
          userId: user.id,
          branchName,
          attachments,
        });

        if (msgError) {
          console.error("Error saving user message:", msgError);
          return new Response("Error saving message", { status: 500 });
        }
      }
    }

    // Get persona system prompt if persona is selected
    let systemPrompt = existingConversation?.system_prompt;
    let temperatureOverride = temperature; // Use request temperature by default
    let maxTokensOverride: number | undefined;

    // Check for persona in existing conversation or from request
    const effectivePersonaId = existingConversation?.persona_id || personaId;
    
    if (effectivePersonaId) {
      const { data: persona } = await supabase
        .from("personas")
        .select("system_prompt, temperature, max_tokens")
        .eq("id", effectivePersonaId)
        .single();

      if (persona) {
        systemPrompt = persona.system_prompt;
        temperatureOverride = persona.temperature;
        maxTokensOverride = persona.max_tokens;
      }
    }

    // Combine existing messages with the new user message for full context
    const allMessages = [
      // Add system prompt if it exists, otherwise use a default one
      {
        role: "system" as const,
        content:
          systemPrompt ||
          "You are a helpful AI assistant. You provide accurate, thoughtful, and detailed responses while maintaining context throughout the conversation. You can help with a wide variety of tasks including answering questions, writing, analysis, coding, and creative tasks. When users upload documents, the text content will be extracted and provided to you directly. You should analyze this content and answer questions about it as if you can read the document. Do not say you cannot access files when the content is provided to you in the message.",
      },
      ...existingMessages
        .filter((msg) => msg.content && msg.content.trim() !== "") // Filter out empty messages
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
    ];

    // Add the new user message (only the last user message from normalized messages)
    // Allow messages with empty content if they have attachments (image-only messages)
    const lastUserMessage = normalizedMessages
      .slice()
      .reverse()
      .find(
        (msg) =>
          msg.role === "user" && 
          ((msg.content && msg.content.trim() !== "") || (attachments && attachments.length > 0)),
      );

    if (lastUserMessage) {
      // Check if this is the last message with attachments
      const hasAttachments = attachments && attachments.length > 0;

      if (!hasAttachments) {
        allMessages.push({
          role: lastUserMessage.role,
          content: lastUserMessage.content,
        });
      } else {
        // Process attachments for AI vision
        const processedContent = [];

        // Add the text content first (if it exists and is not empty)
        if (lastUserMessage.content && lastUserMessage.content.trim()) {
          processedContent.push({
            type: "text",
            text: lastUserMessage.content,
          });
        }

        // Process each attachment
        for (const att of attachments) {
          if (att.type === "image") {
            try {
              // Fetch the image and convert to base64
              const response = await fetch(att.url);
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString("base64");

                processedContent.push({
                  type: "image",
                  image: `data:${att.mime_type};base64,${base64}`,
                });
              } else {
                // Fallback to text description if image fetch fails
                processedContent.push({
                  type: "text",
                  text: `[Image: ${att.name} - Unable to load image data]`,
                });
              }
            } catch (error) {
              console.error("Error processing image attachment:", error);
              processedContent.push({
                type: "text",
                text: `[Image: ${att.name} - Error processing image]`,
              });
            }
          } else {
            // Handle document attachments
            if (att.extractedText) {
              processedContent.push({
                type: "text",
                text: `The user has uploaded a document "${att.name}" with the following content:\n\n${att.extractedText}\n\nPlease analyze this content and answer any questions about it.`,
              });
            } else {
              processedContent.push({
                type: "text",
                text: `[Document: ${att.name} (${att.mime_type})] - No text content available`,
              });
            }
          }
        }

        // Only add message if we have content (text or attachments)
        if (processedContent.length > 0) {
          allMessages.push({
            role: lastUserMessage.role,
            content: processedContent,
          });
        }
      }
    }

    console.log("All messages for AI context:", allMessages);
    console.log(
      "Last message content being sent to AI:",
      allMessages[allMessages.length - 1]?.content,
    );
    const coreMessages = convertToCoreMessages(allMessages);

    console.log("Core messages:", coreMessages);

    // Get language model instance with error handling
    let languageModel;
    try {
      console.log("Attempting to create language model:", {
        model,
        clientApiKeys: {
          openai: !!apiKeys?.openai,
          anthropic: !!apiKeys?.anthropic,
          google: !!apiKeys?.google,
          openrouter: !!apiKeys?.openrouter,
        },
      });

      console.log("Provider API keys:", providerApiKeys);
      console.log("Model:", model);

      languageModel = getLanguageModel(model, providerApiKeys);
      console.log("Language model created successfully");
    } catch (modelError) {
      console.error("Error creating language model:", modelError);
      console.error("Model error details:", {
        message:
          modelError instanceof Error ? modelError.message : "Unknown error",
        stack:
          modelError instanceof Error ? modelError.stack : "No stack trace",
        model,
        providerApiKeys: Object.keys(providerApiKeys),
      });

      const errorMessage =
        modelError instanceof Error ? modelError.message : "Unknown error";
      return new Response(
        JSON.stringify({
          error: `Failed to initialize AI model: ${errorMessage}`,
          details: {
            model,
            availableProviders: Object.keys(providerApiKeys),
            errorType:
              modelError instanceof Error
                ? modelError.constructor.name
                : "Unknown",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Stream the response
    try {
      console.log(`About to call streamText with ${model}...`);
      console.log("languageModel", languageModel);

      const result = await streamText({
        model: languageModel,
        messages: coreMessages,
        temperature: temperatureOverride,
        maxTokens: maxTokensOverride || max_tokens,
        async onFinish({ text, usage }) {
          console.log("AI response finished:", text);
          console.log("Usage:", usage);
          // Save the AI response to database
          const { error: msgError } = await saveMessageToDatabase(supabase, {
            conversationId: validConversationId,
            role: "assistant",
            content: text,
            userId: user.id,
            branchName,
            usage,
          });

          if (msgError) {
            console.error("Error saving AI response:", msgError);
          }
        },
        onError(error) {
          console.error("Error during streamText:", error);
        },
      });

      console.log("streamText completed successfully");
      const response = result.toDataStreamResponse();
      console.log("toDataStreamResponse completed");
      return response;
    } catch (streamError) {
      console.error("Error in streamText:", streamError);

      const errorResponse = {
        error: "Failed to generate response",
        details: "An unknown error occurred during streaming.",
      };

      if (streamError instanceof Error) {
        errorResponse.details = streamError.message;
        // The AI SDK often puts detailed error information in the 'cause' property
        if (streamError.cause) {
          console.error("Stream Error Cause:", streamError.cause);
          // Try to stringify, but handle potential circular structures
          try {
            errorResponse.details += ` | Cause: ${JSON.stringify(
              streamError.cause,
            )}`;
          } catch {
            errorResponse.details += ` | Cause: (Could not stringify error cause)`;
          }
        }
      }

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
    branchName,
    usage,
    attachments,
  }: {
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    userId: string;
    branchName?: string;
    usage?: Record<string, unknown>;
    attachments?: Array<{
      id: string;
      type: "image" | "document";
      name: string;
      url: string;
      size: number;
      mime_type: string;
      extractedText?: string | null;
    }>;
  },
) {
  try {
    // Generate message ID beforehand so we can link attachments to it
    const messageId = uuidv4();

    // Insert the message
    const { error: msgError } = await supabase.from("messages").insert({
      id: messageId,
      conversation_id: conversationId,
      role,
      content,
      metadata: usage ? { usage } : null,
      branch_name: branchName || "main",
      attachments: attachments || null,
      created_at: new Date().toISOString(),
    });

    if (msgError) {
      console.error("Error saving message:", msgError);
      return { error: msgError };
    }

    // Link attachments to this message for proper cascade deletion
    if (attachments && attachments.length > 0) {
      const attachmentIds = attachments.map(att => att.id);
      const { error: attachmentError } = await supabase
        .from("attachments")
        .update({ message_id: messageId })
        .in("id", attachmentIds)
        .eq("user_id", userId); // Ensure user can only link their own attachments

      if (attachmentError) {
        console.error("Error linking attachments to message:", attachmentError);
        // Don't fail the entire message save if attachment linking fails
        // The attachments will still be accessible via user_id
      }
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
