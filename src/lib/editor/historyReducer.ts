import { EditAction, EditHistory } from "../../models/history"
import { commit, undo, redo } from "./historyHelper"

export function historyReducer<T>(
  state: EditHistory<T>,
  action: EditAction<T>,
): EditHistory<T> {
  switch (action.type) {
    case "SET_STATE": {
      if (action.commit) {
        return commit(state, action.currentSectionId, action.newState)
      }
      // temporary update (no history)
      return {
        ...state,
        presentState: {
          state: action.newState,
          currentSectionId: action.currentSectionId
        }
      }
    }

    case "UNDO":
      return undo(state)

    case "REDO":
      return redo(state)

    default:
      return state
  }
}
