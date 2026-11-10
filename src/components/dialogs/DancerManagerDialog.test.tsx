import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import { DancerManagerDialog } from "./DancerManagerDialog";

const dancers = {
  d1: { id: "d1", name: "さくら" },
  d2: { id: "d2", name: "はると" },
};

describe("DancerManagerDialog deleting", () => {
  it("keeps a deleted row until 保存, and undo brings it back", async () => {
    const onSubmit = jest.fn();
    render(<Dialog.Root open><DancerManagerDialog dancers={dancers} onSubmit={onSubmit}/></Dialog.Root>);
    const deletes = await screen.findAllByRole("button", { name: "delete" });
    fireEvent.click(deletes[0]); // さくら sorts first
    expect(screen.getByText("さくら")).toHaveClass("line-through");
    fireEvent.click(screen.getByRole("button", { name: "undo" }));
    expect(screen.queryByText("さくら")).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "delete" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledWith([{ id: "d2", name: "はると" }], ["d1"]);
  });

  it("frees a deleted dancer's name for another row", async () => {
    const onSubmit = jest.fn();
    render(<Dialog.Root open><DancerManagerDialog dancers={{ ...dancers, d3: { id: "d3", name: "さくら" } }} onSubmit={onSubmit}/></Dialog.Root>);
    expect(await screen.findByText(/次の名前が重複しています/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "delete" })[0]);
    expect(screen.queryByText(/次の名前が重複しています/)).not.toBeInTheDocument();
  });
});
