import { fireEvent, render, screen } from "@testing-library/react";
import RosterSelectionBar from "./RosterSelectionBar";

type Props = Partial<React.ComponentProps<typeof RosterSelectionBar>>;

const renderBar = (props: Props) => render(
  <RosterSelectionBar
    kind="dancer"
    selectedCount={3}
    hiddenCount={0}
    hasCategories
    canRemoveCategories
    canClearLook
    isBusy={false}
    onAddCategories={() => {}}
    onRemoveCategories={() => {}}
    onSetSize={() => {}}
    onSetColor={() => {}}
    onClearLook={() => {}}
    onDelete={() => {}}
    {...props}/>);

describe("RosterSelectionBar", () => {
  it("asks for a selection and disables the actions when nothing is selected", () => {
    renderBar({ selectedCount: 0 });
    expect(screen.getByText("名前をタップして選択")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /区分/ })).toHaveAttribute("data-disabled");
    expect(screen.getByRole("button", { name: "名簿から削除" })).toBeDisabled();
  });

  it("asks for prop names on the 道具 tab", () => {
    renderBar({ kind: "prop", selectedCount: 0 });
    expect(screen.getByText("道具名をタップして選択")).toBeInTheDocument();
  });

  it("shows 大きさ・色 only for props", () => {
    renderBar({ kind: "dancer" });
    expect(screen.queryByRole("button", { name: /大きさ・色/ })).not.toBeInTheDocument();
  });

  it("says how many selected names are hidden", () => {
    renderBar({ selectedCount: 4, hiddenCount: 3 });
    expect(screen.getByText(/4名を選択中/)).toBeInTheDocument();
    expect(screen.getByText("（うち3名は非表示）")).toBeInTheDocument();
  });

  it("greys 区分を外す in the menu when no selected name has a category", async () => {
    const onRemoveCategories = jest.fn();
    const onAddCategories = jest.fn();
    renderBar({ canRemoveCategories: false, onRemoveCategories, onAddCategories });
    fireEvent.click(screen.getByRole("button", { name: /区分/ }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /区分を外す/ }));
    expect(onRemoveCategories).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("menuitem", { name: /区分を追加/ }));
    expect(onAddCategories).toHaveBeenCalled();
  });

  it("offers size, colour and clearing for props", async () => {
    const onSetColor = jest.fn();
    const onClearLook = jest.fn();
    renderBar({ kind: "prop", canClearLook: false, onSetColor, onClearLook });
    fireEvent.click(screen.getByRole("button", { name: /大きさ・色/ }));
    expect(await screen.findByRole("menuitem", { name: /大きさと色を消す/ })).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(screen.getByRole("menuitem", { name: /大きさと色を消す/ }));
    expect(onClearLook).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("menuitem", { name: /色を設定/ }));
    expect(onSetColor).toHaveBeenCalled();
  });

  it("shows the last result with 元に戻す", () => {
    const undo = jest.fn();
    renderBar({ lastAction: { message: "3名に旗士を追加しました", undo } });
    expect(screen.getByText("3名に旗士を追加しました")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "元に戻す" }));
    expect(undo).toHaveBeenCalled();
  });
});
