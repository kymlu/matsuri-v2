import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import { ActionManagerDialog } from "./ActionManagerDialog";
import { ChoreoSection } from "../../models/choreoSection";
import { randomUUID } from "crypto";

// jsdom has no crypto.randomUUID.
beforeAll(() => {
  if (!globalThis.crypto?.randomUUID) {
    Object.defineProperty(globalThis, "crypto", { value: { ...globalThis.crypto, randomUUID }, configurable: true });
  }
});

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

  it("shows a duplicate name under its card, on closed cards too", async () => {
    renderDialog(makeSection(), jest.fn());
    fireEvent.input(await screen.findByDisplayValue("ウェーブ"), { target: { value: "ジャンプ" } });
    expect(screen.getAllByText("アクション名が重複")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });
});

describe("ActionManagerDialog count patterns", () => {
  const addAction = async () => {
    fireEvent.click(await screen.findByRole("button", { name: /アクション追加/ }));
  };
  const countValues = () => screen.queryAllByRole("textbox")
    .filter(i => i.getAttribute("placeholder") !== "アクション名")
    .map(i => (i as HTMLInputElement).value);

  it("starts a new action with the patterns, in pairs, and no count boxes", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    const names = screen.getAllByRole("button", { name: /: / }).map(b => b.getAttribute("aria-label")!.split(":")[0]);
    expect(names).toEqual(["奇数", "偶数", "1〜4", "5〜8", "1〜8", "1〜8と"]);
    expect(screen.getByRole("button", { name: /自分で入力/ })).toBeInTheDocument();
    expect(countValues()).toEqual([]);
    expect(screen.queryByText("カウントがありません")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });

  it("fills the counts from a pattern, and the patterns go away", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    fireEvent.click(screen.getByRole("button", { name: /^奇数:/ }));
    expect(countValues()).toEqual(["1", "3", "5", "7"]);
    expect(screen.getByRole("button", { name: /^add\s*カウント$/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^偶数:/ })).not.toBeInTheDocument();
  });

  it("1〜8と uses all 16 counts", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    fireEvent.click(screen.getByRole("button", { name: /^1〜8と:/ }));
    expect(countValues()).toHaveLength(16);
    expect(screen.queryByRole("button", { name: /^add\s*カウント$/ })).not.toBeInTheDocument();
  });

  it("パターンを選び直す goes straight back to the patterns, even after edits", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    fireEvent.click(screen.getByRole("button", { name: /^奇数:/ }));
    fireEvent.input(screen.getByDisplayValue("7"), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "パターンを選び直す" }));
    expect(screen.getByRole("button", { name: /^偶数:/ })).toBeInTheDocument();
    expect(countValues()).toEqual([]);
  });

    it("自分で入力 gives two empty counts", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    fireEvent.click(screen.getByRole("button", { name: /自分で入力/ }));
    expect(countValues()).toEqual(["", ""]);
  });



  it("keeps choosing after the card is closed, and the closed card says why 保存 is off", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    fireEvent.click(screen.getByRole("button", { name: /ウェーブ/ }));
    expect(screen.getByText("アクション名が空")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /名前なし/ }));
    expect(screen.getByRole("button", { name: /^奇数:/ })).toBeInTheDocument();
    fireEvent.input(screen.getByPlaceholderText("アクション名"), { target: { value: "回転" } });
    fireEvent.click(screen.getByRole("button", { name: /ウェーブ/ }));
    expect(screen.getByText("カウントがありません")).toBeInTheDocument();
  });

  it("saves a new action made from a pattern", async () => {
    const onSubmit = jest.fn();
    renderDialog(makeSection(), onSubmit);
    await addAction();
    fireEvent.input(screen.getByPlaceholderText("アクション名"), { target: { value: "回転" } });
    fireEvent.click(screen.getByRole("button", { name: /^偶数:/ }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    const saved = onSubmit.mock.calls[0][0][2];
    expect(saved.name).toBe("回転");
    expect(saved.timings.map((t: { name: string }) => t.name)).toEqual(["2", "4", "6", "8"]);
  });

  it("never offers patterns on a saved action", async () => {
    renderDialog(makeSection(), jest.fn());
    await screen.findByDisplayValue("ウェーブ");
    expect(screen.queryByRole("button", { name: "パターンを選び直す" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^奇数:/ })).not.toBeInTheDocument();
  });
});

describe("ActionManagerDialog error timing", () => {
  const addAction = async () => {
    fireEvent.click(await screen.findByRole("button", { name: /アクション追加/ }));
  };
  const countInputs = () => screen.getAllByRole("textbox").filter(i => i.getAttribute("placeholder") !== "アクション名");
  const isAfter = (a: Element, b: Element) => !!(b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING);

  it("waits to say a new action's name is blank until the field is left blank", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    expect(screen.queryByText("アクション名が空")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
    fireEvent.blur(screen.getByPlaceholderText("アクション名"));
    expect(screen.getByText("アクション名が空")).toBeInTheDocument();
  });

  it("points out a blank name once a pattern is chosen", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    fireEvent.click(screen.getByRole("button", { name: /^奇数:/ }));
    expect(screen.getByText("アクション名が空")).toBeInTheDocument();
  });

  it("waits on blank counts after 自分で入力, and two blanks aren't duplicates", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    fireEvent.click(screen.getByRole("button", { name: /自分で入力/ }));
    expect(screen.queryByText("カウント名が空")).not.toBeInTheDocument();
    expect(screen.queryByText("カウント名が重複")).not.toBeInTheDocument();
    fireEvent.blur(countInputs()[0]);
    expect(screen.getByText("カウント名が空")).toBeInTheDocument();
  });

  it("shows duplicate counts at once, even next to a blank one", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    fireEvent.click(screen.getByRole("button", { name: /自分で入力/ }));
    fireEvent.click(screen.getByRole("button", { name: /^add\s*カウント$/ }));
    fireEvent.input(countInputs()[0], { target: { value: "1" } });
    fireEvent.input(countInputs()[1], { target: { value: "1" } });
    expect(screen.getByText("カウント名が重複")).toBeInTheDocument();
  });

  it("shows duplicates at once on a new action", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    fireEvent.input(screen.getByPlaceholderText("アクション名"), { target: { value: "ウェーブ" } });
    expect(screen.getAllByText("アクション名が重複").length).toBeGreaterThan(0);
  });

  it("shows a saved action's blank name at once, under the counts", async () => {
    renderDialog(makeSection(), jest.fn());
    fireEvent.input(await screen.findByDisplayValue("ウェーブ"), { target: { value: "" } });
    const error = screen.getByText("アクション名が空");
    expect(isAfter(error, countInputs()[countInputs().length - 1])).toBe(true);
    expect(isAfter(screen.getByRole("button", { name: /閉じる/ }), error)).toBe(true);
  });

  it("keeps a shown error after the card is closed and opened again", async () => {
    renderDialog(makeSection(), jest.fn());
    await addAction();
    fireEvent.blur(screen.getByPlaceholderText("アクション名"));
    fireEvent.click(screen.getByRole("button", { name: /ウェーブ/ }));
    fireEvent.click(screen.getByRole("button", { name: /名前なし/ }));
    expect(screen.getByText("アクション名が空")).toBeInTheDocument();
  });
});
