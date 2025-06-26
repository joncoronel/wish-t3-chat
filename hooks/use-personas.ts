import useSWR from "swr";
import { getPersonas, createPersona, updatePersona, deletePersona } from "@/lib/data/personas";
import { PersonaInsert, PersonaUpdate, PersonaWithMemories } from "@/types/persona";
import { toast } from "sonner";

export function usePersonas() {
  const { data: personas, error, isLoading, mutate } = useSWR<PersonaWithMemories[]>(
    "personas",
    getPersonas
  );

  const createNewPersona = async (persona: Omit<PersonaInsert, "user_id">) => {
    try {
      const newPersona = await createPersona(persona);
      await mutate();
      toast.success("Persona created successfully");
      return newPersona;
    } catch (error) {
      console.error("Error creating persona:", error);
      toast.error("Failed to create persona");
      throw error;
    }
  };

  const updateExistingPersona = async (id: string, updates: PersonaUpdate) => {
    try {
      const updatedPersona = await updatePersona(id, updates);
      await mutate();
      toast.success("Persona updated successfully");
      return updatedPersona;
    } catch (error) {
      console.error("Error updating persona:", error);
      toast.error("Failed to update persona");
      throw error;
    }
  };

  const deleteExistingPersona = async (id: string) => {
    try {
      await deletePersona(id);
      await mutate();
      toast.success("Persona deleted successfully");
    } catch (error) {
      console.error("Error deleting persona:", error);
      toast.error("Failed to delete persona");
      throw error;
    }
  };

  return {
    personas: personas || [],
    isLoading,
    error,
    createPersona: createNewPersona,
    updatePersona: updateExistingPersona,
    deletePersona: deleteExistingPersona,
    mutate
  };
}