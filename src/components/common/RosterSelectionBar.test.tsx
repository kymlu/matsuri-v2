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
    isBusy={false}
    onAddCategories={() => {}}
    onRemoveCategories={() => {}}
    onDelete={() => {}}
    {...props}/>);

describe("RosterSelectionBar", () => {
  it("asks for a selection and disables the actions when nothing is selected", () => {
    renderBar({ selectedCount: 0 });
    expect(screen.getByText("名前をタップして選択")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /区分を追加/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /区分を外す/ })).toBeDisabled();
  });

  it("says how many selected names are hidden", () => {
    renderBar({ selectedCount: 4, hiddenCount: 3 });
    expect(screen.getByText(/4名を選択中/)).toBeInTheDocument();
    expect(screen.getByText("（うち3名は非表示）")).toBeInTheDocument();
  });

  it("disables 区分を外す when no selected name has a category", () => {
    renderBar({ canRemoveCategories: false });
    expect(screen.getByRole("button", { name: /区分を追加/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /区分を外す/ })).toBeDisabled();
  });

  it("shows the last result with 元に戻す", () => {
    const undo = jest.fn();
    renderBar({ lastAction: { message: "3名に旗士を追加しました", undo } });
    expect(screen.getByText("3名に旗士を追加しました")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "元に戻す" }));
    expect(undo).toHaveBeenCalled();
  });
});
