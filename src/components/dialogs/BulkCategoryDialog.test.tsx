import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import { RosterList } from "../../models/roster";
import BulkCategoryDialog from "./BulkCategoryDialog";
import { updateRosterLinks } from "../../lib/helpers/apiHelper";

jest.mock("../../lib/helpers/apiHelper", () => ({ updateRosterLinks: jest.fn() }));
const mockUpdateRosterLinks = updateRosterLinks as jest.Mock;

const list: RosterList = {
  categories: [{ id: "c1", name: "正規" }, { id: "c2", name: "旗士" }],
  names: [
    { id: "a", name: "あおい", categoryIds: ["c1"] },
    { id: "s", name: "さくら", categoryIds: ["c1", "c2"] },
  ],
};

const renderDialog = (mode: "add" | "remove") => render(
  <Dialog.Root open>
    <BulkCategoryDialog teamId="t" kind="dancer" list={list} selectedIds={new Set(["a", "s"])} mode={mode} onApplied={() => {}}/>
  </Dialog.Root>);

describe("BulkCategoryDialog", () => {
  beforeEach(() => mockUpdateRosterLinks.mockReset());

  it("can't add a category everyone selected already has", async () => {
    renderDialog("add");
    expect(await screen.findByRole("button", { name: /正規/ })).toBeDisabled();
    expect(screen.getByText("2名とも追加済み")).toBeInTheDocument();
    expect(screen.getByText("1名にあり")).toBeInTheDocument();
  });

  it("sends every selected name with the chosen category", async () => {
    renderDialog("add");
    expect(await screen.findByRole("button", { name: "2名に追加" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /旗士/ }));
    fireEvent.click(screen.getByRole("button", { name: "2名に追加" }));
    expect(mockUpdateRosterLinks).toHaveBeenCalledWith("t", [["a", "c2"], ["s", "c2"]], [], expect.any(Function), expect.any(Function));
  });

  it("starts with nothing ticked when removing, and removes what's chosen", async () => {
    renderDialog("remove");
    const seiki = await screen.findByRole("button", { name: /正規/ });
    expect(seiki).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "2名から外す" })).toBeDisabled();
    fireEvent.click(seiki);
    fireEvent.click(screen.getByRole("button", { name: "2名から外す" }));
    expect(mockUpdateRosterLinks).toHaveBeenCalledWith("t", [], [["a", "c1"], ["s", "c1"]], expect.any(Function), expect.any(Function));
  });
});
