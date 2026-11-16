import { EditHistory } from "../../models/history"

export function commit<T>(history: EditHistory<T>, currentSectionId: string, newState: T): EditHistory<T> {
  return {
    undoStack: [...history.undoStack, history.presentState],
    presentState: {state: newState, currentSectionId: currentSectionId},
    redoStack: [],
    shownSectionId: currentSectionId,
  }
}

// Shows the section of the edit being undone, not the one before it.
export function undo<T>(history: EditHistory<T>): EditHistory<T> {
  if (history.undoStack.length === 0) return history
  const previous = history.undoStack[history.undoStack.length - 1]
  return {
    undoStack: history.undoStack.slice(0, -1),
    presentState: previous,
    redoStack: [history.presentState, ...history.redoStack],
    shownSectionId: history.presentState.currentSectionId,
  }
}

export function redo<T>(history: EditHistory<T>): EditHistory<T> {
  if (history.redoStack.length === 0) return history
  const next = history.redoStack[0]
  return {
    undoStack: [...history.undoStack, history.presentState],
    presentState: next,
    redoStack: history.redoStack.slice(1),
    shownSectionId: next.currentSectionId,
  }
}
