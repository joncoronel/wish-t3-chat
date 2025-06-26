import { atom } from "jotai";
import { Persona } from "@/types/persona";

export const selectedPersonaAtom = atom<Persona | null>(null);