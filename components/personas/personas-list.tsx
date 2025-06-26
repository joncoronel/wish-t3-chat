"use client";

import { useState } from "react";
import { usePersonas } from "@/hooks/use-personas";
import { PersonaCard } from "./persona-card";
import { PersonaForm } from "./persona-form";
import { PersonaWithMemories } from "@/types/persona";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PersonasList() {
  const { personas, isLoading, createPersona, updatePersona, deletePersona } =
    usePersonas();
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] =
    useState<PersonaWithMemories | null>(null);
  const [deletingPersonaId, setDeletingPersonaId] = useState<string | null>(
    null,
  );

  const handleCreate = async (data: Parameters<typeof createPersona>[0]) => {
    await createPersona(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: Parameters<typeof createPersona>[0]) => {
    if (editingPersona) {
      await updatePersona(editingPersona.id, data);
      setEditingPersona(null);
    }
  };

  const handleDelete = async () => {
    if (deletingPersonaId) {
      await deletePersona(deletingPersonaId);
      setDeletingPersonaId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6" />
            AI Personas
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage custom AI personalities for your conversations
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Persona
        </Button>
      </div>

      {personas.length === 0 ? (
        <Alert>
          <AlertDescription>
            You haven&apos;t created any personas yet. Create your first persona
            to give your AI conversations a unique personality!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onEdit={setEditingPersona}
              onDelete={setDeletingPersonaId}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={showForm || !!editingPersona}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingPersona(null);
          }
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          style={{ maxWidth: "1200px", width: "85vw" }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingPersona ? "Edit Persona" : "Create New Persona"}
            </DialogTitle>
            <DialogDescription>
              {editingPersona
                ? "Update the settings for this persona"
                : "Define a new AI persona with custom behavior and characteristics"}
            </DialogDescription>
          </DialogHeader>
          <PersonaForm
            initialData={editingPersona || undefined}
            onSubmit={editingPersona ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingPersona(null);
            }}
            isEdit={!!editingPersona}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingPersonaId}
        onOpenChange={(open) => !open && setDeletingPersonaId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Persona</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this persona? This action cannot
              be undone. All conversation memories associated with this persona
              will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
