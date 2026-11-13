import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import { UnstackDialog } from "./StackDialogs";

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
