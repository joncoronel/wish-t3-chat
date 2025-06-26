import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createMemorySchema = z.object({
  persona_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  summary: z.string().min(1),
  key_points: z.array(z.string()).default([]),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createMemorySchema.parse(body);

    // Verify the persona belongs to the user
    const { data: persona, error: personaError } = await supabase
      .from("personas")
      .select("id")
      .eq("id", validatedData.persona_id)
      .eq("user_id", user.id)
      .single();

    if (personaError || !persona) {
      return NextResponse.json(
        { error: "Persona not found or unauthorized" },
        { status: 404 }
      );
    }

    // Verify the conversation belongs to the user
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", validatedData.conversation_id)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create the memory
    const { data: memory, error } = await supabase
      .from("persona_memories")
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating persona memory:", error);
    return NextResponse.json(
      { error: "Failed to create persona memory" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get("persona_id");
    
    if (!personaId) {
      return NextResponse.json(
        { error: "Persona ID is required" },
        { status: 400 }
      );
    }

    // Verify the persona belongs to the user
    const { data: persona, error: personaError } = await supabase
      .from("personas")
      .select("id")
      .eq("id", personaId)
      .eq("user_id", user.id)
      .single();

    if (personaError || !persona) {
      return NextResponse.json(
        { error: "Persona not found or unauthorized" },
        { status: 404 }
      );
    }

    // Fetch memories
    const { data: memories, error } = await supabase
      .from("persona_memories")
      .select(`
        *,
        conversations (
          id,
          title,
          created_at
        )
      `)
      .eq("persona_id", personaId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memories });
  } catch (error) {
    console.error("Error fetching persona memories:", error);
    return NextResponse.json(
      { error: "Failed to fetch persona memories" },
      { status: 500 }
    );
  }
}