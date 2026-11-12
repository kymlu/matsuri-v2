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
  // Folds a change into the last undo step instead of adding one (e.g. stacking right after the move that prompted it).
  | { type: "AMEND_STATE"; newState: T; currentSectionId: string }
  | { type: "UNDO" }
  | { type: "REDO" };

export type StageEntities<TProp, TDancer = TProp, TObstacle = TProp> = {
  props: TProp;
  dancers: TDancer;
  obstacles: TObstacle,
}