import { act, renderHook } from "@testing-library/react";
import { Choreo } from "../../models/choreo";
import { overflowWarning, useStageResize } from "./useStageResize";

const dp = (id: string, x: number) => ({ dancerId: id, x, y: 2, z: 0, color: "red", sectionId: "s1", type: "dancer" as const });

// a sits near the left edge, b in the middle of a 16m stage with 1m margins.
function makeChoreo(): Choreo {
  return {
    id: "c", name: "隊列", event: "祭り", stageType: "stage",
    stageGeometry: { stageWidth: 16, stageLength: 8, margin: { topMargin: 1, bottomMargin: 1, leftMargin: 1, rightMargin: 1 }, yAxis: "top-down" },
    sections: [{ id: "s1", name: "Aメロ", formation: { dancerPositions: { a: dp("a", 1), b: dp("b", 9) }, dancerActions: [], propPositions: {} } }],
    dancers: { a: { id: "a", name: "花子" }, b: { id: "b", name: "一郎" } },
    props: {}, obstacles: {},
  } as unknown as Choreo;
}

function setUp() {
  const state = makeChoreo();
  const commitState = jest.fn();
  const view = renderHook(() => useStageResize({ state, section: state.sections[0], commitState }));
  return { ...view, state, commitState };
}

describe("overflowWarning", () => {
  it("says nothing when everyone fits", () => {
    expect(overflowWarning(0, 0, 0)).toBeUndefined();
  });

  it("counts what will be moved", () => {
    expect(overflowWarning(2, 1, 0)).toBe("2人・道具1個が舞台の外に出ます。保存すると端に移動します。");
  });
});

describe("useStageResize", () => {
  it("previews the new size without committing, and highlights who gets moved", () => {
    const { result, commitState } = setUp();
    act(() => result.current.startStageResize());
    act(() => result.current.stageSizeSheet!.props.onChange("stageWidth", 4));

    expect(result.current.stageResizePreview?.choreo.stageGeometry.stageWidth).toBe(4);
    expect([...result.current.stageResizePreview!.halfFadedDancerIds]).toEqual(["b"]);
    expect(commitState).not.toHaveBeenCalled();
  });

  it("cancelling leaves the choreo as it was", () => {
    const { result, commitState } = setUp();
    act(() => result.current.startStageResize());
    act(() => result.current.stageSizeSheet!.props.onChange("stageWidth", 4));
    act(() => result.current.stageSizeSheet!.props.onCancel());

    expect(result.current.isResizingStage).toBe(false);
    expect(result.current.stageResizePreview).toBeUndefined();
    expect(commitState).not.toHaveBeenCalled();
  });

  it("saves the new size once", () => {
    const { result, commitState } = setUp();
    act(() => result.current.startStageResize());
    act(() => result.current.stageSizeSheet!.props.onChange("stageWidth", 20));
    act(() => result.current.stageSizeSheet!.props.onSave());

    expect(commitState).toHaveBeenCalledTimes(1);
    expect(commitState.mock.calls[0][0].stageGeometry.stageWidth).toBe(20);
  });

  it("saving without changes doesn't add an undo step", () => {
    const { result, commitState } = setUp();
    act(() => result.current.startStageResize());
    act(() => result.current.stageSizeSheet!.props.onSave());

    expect(commitState).not.toHaveBeenCalled();
    expect(result.current.isResizingStage).toBe(false);
  });
});
