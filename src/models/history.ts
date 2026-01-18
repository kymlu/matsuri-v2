export interface HistoryEntry<T> {
  state: T
  currentSectionId?: string
}

export interface EditHistory<T> {
  undoStack: HistoryEntry<T>[],
  presentState: HistoryEntry<T>,
  redoStack: HistoryEntry<T>[],
}

export type EditAction<T> =
  | { type: "SET_STATE"; newState: T; currentSectionId: string, commit?: boolean } // commit = true → undoable
  | { type: "UNDO" } // TODO: ensure undos and redos navigate to the current section
  | { type: "REDO" }
