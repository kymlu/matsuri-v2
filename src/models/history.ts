import * as z from "zod";


export type HistoryEntry<T> = {
  state: T;
  currentSectionId?: string;
};


export type EditHistory<T> = {
  undoStack: HistoryEntry<T>[];
  presentState: HistoryEntry<T>;
  redoStack: HistoryEntry<T>[];
};


export type EditAction<T> =
  | { type: "SET_STATE"; newState: T; currentSectionId: string; commit?: boolean }
  | { type: "UNDO" }
  | { type: "REDO" };