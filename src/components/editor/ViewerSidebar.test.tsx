import { fireEvent, render, screen } from "@testing-library/react";
import ViewerSidebar from "./ViewerSidebar";
import { DancerAction } from "../../models/dancerAction";
import { StageGeometry } from "../../models/choreo";

const geometry: StageGeometry = {
  stageWidth: 10,
  stageLength: 8,
  margin: { topMargin: 1, leftMargin: 1, rightMargin: 1, bottomMargin: 1 },
  yAxis: "top-down",
};

const raise: DancerAction = {
  id: "a1", name: "手上げ",
  timings: [{ id: "t1", name: "1", dancerIds: ["d1"] }, { id: "t3", name: "3", dancerIds: ["d2"] }],
};
const empty: DancerAction = { id: "a2", name: "旗振り", timings: [{ id: "t5", name: "5", dancerIds: [] }] };

function renderSidebar(props: Partial<Parameters<typeof ViewerSidebar>[0]> = {}) {
  const onShowAction = jest.fn();
  const onSelectTiming = jest.fn();
  render(<ViewerSidebar
    sectionId="s1"
    sections={[]}
    onChangeSection={() => {}}
    dancer={{ id: "d1", name: "さくら" }}
    position={{ dancerId: "d1", x: 1, y: 1, sectionId: "s1", type: "dancer", color: "#000000" }}
    actions={[raise, empty]}
    geometry={geometry}
    isPositionHintShown={false}
    deselectPosition={() => {}}
    formationSelectionToolbar={null}
    onChangeHeight={() => {}}
    onSelectTiming={onSelectTiming}
    onShowAction={onShowAction}
    {...props}
  />);
  return { onShowAction, onSelectTiming };
}

const allButtons = () => screen.getAllByRole("button", { name: "すべて" });

describe("ViewerSidebar すべて", () => {
  it("shows the action's counts for everyone when tapped", () => {
    const { onShowAction } = renderSidebar();
    fireEvent.click(allButtons()[0]);
    expect(onShowAction).toHaveBeenCalledWith(raise);
  });

  it("turns off when tapped again", () => {
    const { onShowAction } = renderSidebar({ shownActionId: "a1" });
    fireEvent.click(allButtons()[0]);
    expect(onShowAction).toHaveBeenCalledWith(undefined);
  });

  it("is disabled for an action nobody is in", () => {
    renderSidebar();
    expect(allButtons()[1]).toBeDisabled();
  });
});
