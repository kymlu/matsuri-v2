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
    fireEvent.click(await screen.findByRole("button", { name: /ジャンプ/ }));
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(screen.getByText("ジャンプ")).toHaveClass("line-through");
    fireEvent.click(screen.getByRole("button", { name: "undo" }));
    expect(screen.getByDisplayValue("ジャンプ")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledWith([expect.objectContaining({ id: "a1" })]);
    expect(onSubmit.mock.calls[0][0]).toHaveLength(1);
  });

  it("keeps a deleted count until 保存", async () => {
    const onSubmit = jest.fn();
    renderDialog(makeSection(), onSubmit);
    await screen.findByDisplayValue("ウェーブ");
    fireEvent.click(screen.getAllByRole("button", { name: "カウントを削除" })[1]);
    expect(screen.getByText("2")).toHaveClass("line-through");
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit.mock.calls[0][0][0].timings.map((t: { id: string }) => t.id)).toEqual(["t1"]);
  });

  it("opens one action at a time, starting with the first", async () => {
    renderDialog(makeSection(), jest.fn());
    await screen.findByDisplayValue("ウェーブ");
    expect(screen.queryByDisplayValue("ジャンプ")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ジャンプ/ }));
    expect(screen.getByDisplayValue("ジャンプ")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("ウェーブ")).not.toBeInTheDocument();
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
