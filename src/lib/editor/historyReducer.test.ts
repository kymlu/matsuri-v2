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

describe("which section undo and redo show", () => {
  const set = (h: any, newState: number, sectionId: string) => historyReducer(h, { type: "SET_STATE", newState, currentSectionId: sectionId, commit: true });
  const start = () => ({ undoStack: [], presentState: { state: 0, currentSectionId: "a" }, redoStack: [] } as any);

  it("undo shows where the undone edit was made, not the edit before it", () => {
    let h = set(set(start(), 1, "a"), 2, "b"); // edit in A, then in B
    h = historyReducer(h, { type: "UNDO" });
    expect(h.presentState.state).toBe(1);
    expect(h.shownSectionId).toBe("b");
    h = historyReducer(h, { type: "UNDO" });
    expect(h.shownSectionId).toBe("a");
  });

  it("the first undo of a session stays in the section edited, not the first section", () => {
    const h = historyReducer(set(start(), 1, "c"), { type: "UNDO" });
    expect(h.shownSectionId).toBe("c");
  });

  it("redo shows where the redone edit was made, and the record survives undo/redo round trips", () => {
    let h = set(set(start(), 1, "a"), 2, "b");
    h = historyReducer(historyReducer(h, { type: "UNDO" }), { type: "UNDO" });
    h = historyReducer(h, { type: "REDO" });
    expect(h.shownSectionId).toBe("a");
    h = historyReducer(h, { type: "REDO" });
    expect(h.shownSectionId).toBe("b");
    h = historyReducer(historyReducer(h, { type: "UNDO" }), { type: "UNDO" });
    expect(h.shownSectionId).toBe("a");
  });
});
