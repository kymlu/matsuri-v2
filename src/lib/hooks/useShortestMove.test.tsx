import { act, render, renderHook, screen } from "@testing-library/react";
import { Choreo } from "../../models/choreo";
import { useShortestMove } from "./useShortestMove";

const dp = (id: string, x: number, y: number, color = "red", sectionId = "s2") =>
  ({ dancerId: id, x, y, z: 0, color, sectionId, type: "dancer" as const });

// a and b start left and right in s1 but cross over into s2; c stays out of the way.
function makeChoreo(colourB = "red"): Choreo {
  const section = (id: string, positions: ReturnType<typeof dp>[]) => ({
    id, name: id === "s1" ? "Aメロ" : "Bメロ",
    formation: { dancerPositions: Object.fromEntries(positions.map(p => [p.dancerId, p])), dancerActions: [], propPositions: {} },
  });
  return {
    id: "c", name: "隊列", event: "祭り", stageType: "stage",
    stageGeometry: { stageWidth: 16, stageLength: 8, margin: { topMargin: 1, bottomMargin: 1, leftMargin: 1, rightMargin: 1 }, yAxis: "top-down" },
    sections: [
      section("s1", [dp("a", 0, 0, "red", "s1"), dp("b", 10, 0, colourB, "s1"), dp("c", 5, 7, "red", "s1")]),
      section("s2", [dp("a", 10, 5), dp("b", 0, 5, colourB), dp("c", 5, 7)]),
    ],
    dancers: { a: { id: "a", name: "花子" }, b: { id: "b", name: "一郎" }, c: { id: "c", name: "松子" } },
    props: {}, obstacles: {},
  } as unknown as Choreo;
}
const none = { dancers: [] as string[], props: [] as string[], obstacles: [] as string[] };

function setUp(state: Choreo, selectedIds = none) {
  const commitState = jest.fn();
  const hook = renderHook(
    ({ state, sectionIndex }) => useShortestMove({
      state, section: state.sections[sectionIndex], prevSection: state.sections[sectionIndex - 1], selectedIds, commitState,
    }),
    { initialProps: { state, sectionIndex: 1 } });
  return { ...hook, commitState };
}

describe("useShortestMove", () => {
  it("offers the button from the second section, with two people outside stacks", () => {
    expect(setUp(makeChoreo()).result.current.canShortestMove).toBe(true);
    const state = makeChoreo();
    const first = renderHook(() => useShortestMove({ state, section: state.sections[0], selectedIds: none, commitState: jest.fn() }));
    expect(first.result.current.canShortestMove).toBe(false);
  });

  it("opens the preview with the proposal on stage, and applies it as one commit", () => {
    const { result, commitState, rerender } = setUp(makeChoreo());
    act(() => result.current.startShortestMove());
    expect(result.current.isPreviewingShortestMove).toBe(true);
    const preview = result.current.shortestMovePreview!;
    expect(preview.routes.kind).toBe("after");
    expect(preview.section.formation.dancerPositions.a).toMatchObject({ x: 0, y: 5 });
    expect(preview.fadedDancerIds.size).toBe(0); // everyone is considered when nothing is selected

    act(() => result.current.startShortestMove()); // reopening is harmless
    render(result.current.shortestMoveSheet!);
    act(() => screen.getByText("入れ替える").click());
    expect(commitState).toHaveBeenCalledTimes(1);
    const committed = commitState.mock.calls[0][0];
    expect(committed.sections[1].formation.dancerPositions.a).toMatchObject({ x: 0, y: 5 });
    // It closes when the committed state comes back, like the page does.
    expect(result.current.isPreviewingShortestMove).toBe(true);
    rerender({ state: committed, sectionIndex: 1 });
    expect(result.current.isPreviewingShortestMove).toBe(false);
  });

  it("offers each changing colour as a toggle, and leaving one out keeps its people in place", () => {
    const state = makeChoreo();
    // A second, blue pair that also crosses.
    state.sections[0].formation.dancerPositions.d = dp("d", 0, 20, "blue", "s1");
    state.sections[0].formation.dancerPositions.e = dp("e", 10, 20, "blue", "s1");
    state.sections[1].formation.dancerPositions.d = dp("d", 10, 25, "blue");
    state.sections[1].formation.dancerPositions.e = dp("e", 0, 25, "blue");
    const { result } = setUp(state);
    act(() => result.current.startShortestMove());
    const { unmount } = render(result.current.shortestMoveSheet!);
    expect(screen.getAllByRole("button", { pressed: true }).map(b => b.getAttribute("aria-label"))).toEqual(["red", "blue"]);
    act(() => screen.getByRole("button", { name: "blue" }).click());
    unmount();
    const preview = result.current.shortestMovePreview!;
    expect(preview.section.formation.dancerPositions.d).toMatchObject({ x: 10, y: 25 }); // blue stays
    expect(preview.section.formation.dancerPositions.a).toMatchObject({ x: 0, y: 5 }); // red still swaps
    expect(preview.fadedDancerIds.has("d")).toBe(true);
  });

  it("says why nothing would get shorter, whatever the colour choices", () => {
    const { result } = setUp(makeChoreo());
    act(() => result.current.startShortestMove());
    const message = () => {
      const { unmount } = render(result.current.shortestMoveSheet!);
      const text = screen.queryByText(/短くなりません|選んでください/)?.textContent;
      unmount();
      return text;
    };
    expect(message()).toBeUndefined();
    // Only red is moving; turning it off leaves nothing to gain.
    let r = render(result.current.shortestMoveSheet!);
    act(() => screen.getByRole("button", { name: "red" }).click());
    r.unmount();
    expect(message()).toBe("色を1つ以上選んでください");
  });

  it("fades people who were left out of the selection", () => {
    const { result } = setUp(makeChoreo(), { ...none, dancers: ["a", "b"] });
    act(() => result.current.startShortestMove());
    expect([...result.current.shortestMovePreview!.fadedDancerIds]).toEqual(["c"]);
  });

  it("opens with nothing to apply when only crossing colours helps", () => {
    const { result } = setUp(makeChoreo("blue"));
    act(() => result.current.startShortestMove());
    expect(result.current.shortestMovePreview!.routes.kind).toBe("now");
    render(result.current.shortestMoveSheet!);
    expect(screen.getByText("同じ色どうしでは、これ以上短くなりません")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: "表示" })).toBeNull();
  });

  it("shows the dialog instead when nothing would get shorter", () => {
    const state = makeChoreo();
    state.sections[1].formation.dancerPositions.a = dp("a", 0, 5);
    state.sections[1].formation.dancerPositions.b = dp("b", 10, 5);
    const { result } = setUp(state);
    act(() => result.current.startShortestMove());
    expect(result.current.isPreviewingShortestMove).toBe(false);
    render(result.current.shortestMoveDialog);
    expect(screen.getByText("入れ替えても移動は短くなりません")).toBeInTheDocument();
  });

  it("closes if the choreo changes underneath it", () => {
    const { result, rerender } = setUp(makeChoreo());
    act(() => result.current.startShortestMove());
    rerender({ state: makeChoreo(), sectionIndex: 1 });
    expect(result.current.isPreviewingShortestMove).toBe(false);
  });
});
