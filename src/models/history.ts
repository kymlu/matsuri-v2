import * as z from "zod";

export const HistoryEntrySchema = <T extends z.ZodTypeAny>(StateSchema: T) =>
  z.object({
    state: StateSchema,
    currentSectionId: z.string().optional(),
  });

export type HistoryEntry<T> = {
  state: T;
  currentSectionId?: string;
};

export const EditHistorySchema = <T extends z.ZodTypeAny>(StateSchema: T) => {
  const Entry = HistoryEntrySchema(StateSchema);

  return z.object({
    undoStack: z.array(Entry),
    presentState: Entry,
    redoStack: z.array(Entry),
  });
};

export type EditHistory<T> = {
  undoStack: HistoryEntry<T>[];
  presentState: HistoryEntry<T>;
  redoStack: HistoryEntry<T>[];
};

export const EditActionSchema = <T extends z.ZodTypeAny>(StateSchema: T) =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("SET_STATE"),
      newState: StateSchema,
      currentSectionId: z.string(),
      commit: z.boolean().optional(),
    }),
    z.object({
      type: z.literal("UNDO"),
    }),
    z.object({
      type: z.literal("REDO"),
    }),
  ]);

export type EditAction<T> =
  | { type: "SET_STATE"; newState: T; currentSectionId: string; commit?: boolean }
  | { type: "UNDO" }
  | { type: "REDO" };