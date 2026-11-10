import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import { ActionManagerDialog } from "./ActionManagerDialog";
import { ChoreoSection } from "../../models/choreoSection";

const makeSection = (): ChoreoSection => ({
  id: "s1",
  name: "サビ1",
  order: 1,
  formation: {
    dancerPositions: {},
    propPositions: {},
    dancerActions: [
      { id: "a1", name: "ウェーブ", timings: [{ id: "t1", name: "1", dancerIds: ["d1"] }, { id: "t2", name: "2", dancerIds: [] }] },
      { id: "a2", name: "ジャンプ", timings: [{ id: "t3", name: "1", dancerIds: [] }] },
    ],
  },
} as ChoreoSection);

const renderDialog = (section: ChoreoSection, onSubmit: jest.Mock) => render(
  <Dialog.Root open><ActionManagerDialog section={section} onSubmit={onSubmit}/></Dialog.Root>);

describe("ActionManagerDialog deleting", () => {
  it("keeps a deleted action until 保存, and undo brings it back", async () => {
    const onSubmit = jest.fn();
    renderDialog(makeSection(), onSubmit);
    await screen.findByDisplayValue("ジャンプ");
    // The last trash icon on the page is the second action's.
    const deletes = screen.getAllByRole("button", { name: "delete" });
    fireEvent.click(deletes[deletes.length - 1]);
    expect(screen.getByText("ジャンプ")).toHaveClass("line-through");
    fireEvent.click(screen.getByRole("button", { name: "undo" }));
    expect(screen.getByDisplayValue("ジャンプ")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "delete" }).pop()!);
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledWith([expect.objectContaining({ id: "a1" })]);
    expect(onSubmit.mock.calls[0][0]).toHaveLength(1);
  });

  it("keeps a deleted count until 保存", async () => {
    const onSubmit = jest.fn();
    renderDialog(makeSection(), onSubmit);
    await screen.findByDisplayValue("ウェーブ");
    // ウェーブ's counts: 1 and 2, each with a trash icon, then the action's own.
    fireEvent.click(screen.getAllByRole("button", { name: "delete" })[1]);
    expect(screen.getByText("2")).toHaveClass("line-through");
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit.mock.calls[0][0][0].timings.map((t: { id: string }) => t.id)).toEqual(["t1"]);
  });

  it("doesn't change the section it was given when renaming", async () => {
    const section = makeSection();
    const onSubmit = jest.fn();
    renderDialog(section, onSubmit);
    fireEvent.input(await screen.findByDisplayValue("ウェーブ"), { target: { value: "ウェーブ2" } });
    expect(section.formation.dancerActions[0].name).toBe("ウェーブ");
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit.mock.calls[0][0][0].name).toBe("ウェーブ2");
  });
});
