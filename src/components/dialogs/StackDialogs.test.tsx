import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import { StackOrderDialog, SwapDialog, UnstackDialog } from "./StackDialogs";

const members = [{ id: "a", label: "一郎" }, { id: "b", label: "花子" }, { id: "c", label: "月子" }];

describe("UnstackDialog", () => {
  it("すべて選択 picks everyone and ends the stack; すべて解除 clears", async () => {
    const onSubmit = jest.fn();
    render(<Dialog.Root open><UnstackDialog members={members} onSubmit={onSubmit}/></Dialog.Root>);
    fireEvent.click(await screen.findByText("すべて選択"));
    expect(screen.getAllByRole("checkbox").every(c => c.getAttribute("aria-checked") === "true")).toBe(true);
    expect(screen.getByText("重なりがなくなります。")).toBeTruthy();
    fireEvent.click(screen.getByText("外す"));
    expect(onSubmit).toHaveBeenCalledWith(["a", "b", "c"]);
  });

  it("toggles back to none", async () => {
    render(<Dialog.Root open><UnstackDialog members={members} onSubmit={() => {}}/></Dialog.Root>);
    fireEvent.click(await screen.findByText("すべて選択"));
    fireEvent.click(screen.getByText("すべて解除"));
    expect(screen.getAllByRole("checkbox").every(c => c.getAttribute("aria-checked") === "false")).toBe(true);
  });
});

describe("prop stacks say 道具, not 人", () => {
  it("UnstackDialog", async () => {
    render(<Dialog.Root open><UnstackDialog kind="props" members={members} onSubmit={() => {}}/></Dialog.Root>);
    expect(await screen.findByText("外す道具を選ぶ")).toBeTruthy();
    expect(screen.getByText("上から順。外した道具はその場に残ります。")).toBeTruthy();
  });

  it("StackOrderDialog", async () => {
    render(<Dialog.Root open><StackOrderDialog kind="props" initial={members} onSubmit={() => {}}/></Dialog.Root>);
    expect(await screen.findByText("一番下の道具の位置")).toBeTruthy();
  });
});

describe("SwapDialog", () => {
  const a = [{ id: "a", label: "一郎", color: "red" }], b = [{ id: "b", label: "花子", color: "blue" }];
  it("lists only what differs; names always go, and can't be unticked", async () => {
    const onSubmit = jest.fn();
    render(<Dialog.Root open><SwapDialog a={a} b={b} differs={{ colour: false, counts: true }} initial={{ colour: true, counts: false }} onSubmit={onSubmit}/></Dialog.Root>);
    expect(await screen.findByText("名前")).toBeTruthy();
    expect(screen.queryByText("色")).toBeNull();
    fireEvent.click(screen.getByText("名前"));
    expect(screen.getByRole("checkbox", { name: "名前" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByText("カウント"));
    fireEvent.click(screen.getByText("入れ替える"));
    expect(onSubmit).toHaveBeenCalledWith({ colour: true, counts: true });
  });
});
