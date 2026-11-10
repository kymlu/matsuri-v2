import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "@base-ui/react";
import { RosterList } from "../../models/roster";
import { PropManagerDialog } from "./PropManagerDialog";

const roster: RosterList = {
  categories: [],
  names: [{ id: "n1", name: "特大旗", categoryIds: [], length: 1, width: 9, color: "#F08A00" }],
};

const props = { p1: { id: "p1", name: "3", length: 1, width: 4, color: "#000000" } };

const renderDialog = (onSubmit: jest.Mock) => render(
  <Dialog.Root open>
    <PropManagerDialog props={props} roster={roster} onSubmit={onSubmit}/>
  </Dialog.Root>);

describe("PropManagerDialog with 名簿", () => {
  it("gives a row the picked name's size and colour", async () => {
    const onSubmit = jest.fn();
    renderDialog(onSubmit);
    const name = await screen.findByRole("combobox");
    userEvent.clear(name);
    userEvent.type(name, "特");
    userEvent.click(await screen.findByRole("option", { name: /特大旗/ }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledWith([{ ...props.p1, name: "特大旗", width: 9, color: "#F08A00" }], []);
  });

  it("changes only the name when it's typed", async () => {
    const onSubmit = jest.fn();
    renderDialog(onSubmit);
    const name = await screen.findByRole("combobox");
    fireEvent.change(name, { target: { value: "特大旗" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledWith([{ ...props.p1, name: "特大旗" }], []);
  });
});

describe("PropManagerDialog deleting", () => {
  const two = {
    p1: { id: "p1", name: "大旗", length: 1, width: 4, color: "#000000" },
    p2: { id: "p2", name: "扇", length: 1, width: 1, color: "#000000" },
  };

  it("keeps a deleted row until 保存, and undo brings it back", async () => {
    const onSubmit = jest.fn();
    render(<Dialog.Root open><PropManagerDialog props={two} onSubmit={onSubmit}/></Dialog.Root>);
    const deletes = await screen.findAllByRole("button", { name: "delete" });
    fireEvent.click(deletes[0]); // 扇 sorts first
    expect(screen.getByText("扇")).toHaveClass("line-through");
    fireEvent.click(screen.getByRole("button", { name: "undo" }));
    expect(screen.queryByText("扇")).not.toBeInTheDocument(); // back to an editable field
    fireEvent.click(screen.getAllByRole("button", { name: "delete" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledWith([two.p2], ["p1"]);
  });
});

