import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import { RosterList } from "../../models/roster";
import BulkPropLookDialog from "./BulkPropLookDialog";
import { updateRosterDefaults } from "../../lib/helpers/apiHelper";
import { colorPalette } from "../../lib/consts/colors";

jest.mock("../../lib/helpers/apiHelper", () => ({ updateRosterDefaults: jest.fn() }));
const mockUpdateRosterDefaults = updateRosterDefaults as jest.Mock;

const list: RosterList = {
  categories: [],
  names: [
    { id: "a", name: "大旗", categoryIds: [], length: 1, width: 4, color: "#F08A00" },
    { id: "b", name: "中旗", categoryIds: [], length: 1, width: 4 },
    { id: "c", name: "扇", categoryIds: [] },
  ],
};

const renderDialog = (field: "size" | "color", ids: string[]) => render(
  <Dialog.Root open>
    <BulkPropLookDialog teamId="t" list={list} selectedIds={new Set(ids)} field={field} onApplied={() => {}}/>
  </Dialog.Root>);

describe("BulkPropLookDialog", () => {
  beforeEach(() => mockUpdateRosterDefaults.mockReset());

  it("starts from the size they share and sends only the size", async () => {
    renderDialog("size", ["a", "b"]);
    fireEvent.click(await screen.findByRole("button", { name: "2件に設定" }));
    expect(mockUpdateRosterDefaults).toHaveBeenCalledWith("t",
      [{ id: "a", length: 1, width: 4 }, { id: "b", length: 1, width: 4 }], expect.any(Function), expect.any(Function));
  });

  it("says when the colours differ, and waits for one to be picked", async () => {
    renderDialog("color", ["a", "b"]);
    expect(await screen.findByText(/今はばらばらです/)).toBeInTheDocument();
    const apply = screen.getByRole("button", { name: "2件に設定" });
    expect(apply).toBeDisabled();
    const color = colorPalette.gridObjectColors()[0];
    fireEvent.click(screen.getByRole("radio", { name: color }));
    fireEvent.click(apply);
    expect(mockUpdateRosterDefaults).toHaveBeenCalledWith("t",
      [{ id: "a", color }, { id: "b", color }], expect.any(Function), expect.any(Function));
  });

  it("says formations aren't changed", async () => {
    renderDialog("size", ["c"]);
    expect(await screen.findByText(/隊列表の道具は変わりません/)).toBeInTheDocument();
  });
});
