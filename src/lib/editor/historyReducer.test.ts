import { historyReducer } from "./historyReducer";

describe("historyReducer AMEND_STATE", () => {
  it("folds a change into the last undo step", () => {
    let h = { undoStack: [], presentState: { state: 0, currentSectionId: "s" }, redoStack: [] } as any;
    h = historyReducer(h, { type: "SET_STATE", newState: 1, currentSectionId: "s", commit: true }); // the move
    h = historyReducer(h, { type: "AMEND_STATE", newState: 2, currentSectionId: "s" }); // stacking it
    expect(h.presentState.state).toBe(2);
    expect(h.undoStack.length).toBe(1);
    h = historyReducer(h, { type: "UNDO" });
    expect(h.presentState.state).toBe(0);
  });
});
