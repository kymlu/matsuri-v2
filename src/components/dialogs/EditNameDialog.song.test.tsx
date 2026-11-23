import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import EditNameDialog from "./EditNameDialog";
import { RosterSong } from "../../models/song";

const song: RosterSong = {
  id: "s1",
  name: "演舞",
  sections: [
    { id: "x1", name: "OP", actions: [] },
    { id: "x2", name: "Bメロ", actions: [{ id: "a1", name: "肩車", counts: ["5", "7"] }] },
    { id: "x3", name: "サビ", actions: [{ id: "a2", name: "回転", counts: ["1", "2", "3", "4", "5", "6", "7", "8"] }] },
  ],
};

type Props = Partial<React.ComponentProps<typeof EditNameDialog>>;

const dialog = (props: Props) =>
  <Dialog.Root open>
    <EditNameDialog isOpen type="セクション" name="Bメロ" song={song} usedNames={["OP"]} offerSongActions onSubmit={() => {}} {...props}/>
  </Dialog.Root>;

describe("EditNameDialog with the 隊列表's song", () => {
  it("offers the song section's 振り, ticked, one line each with shortened counts", async () => {
    const onSubmit = jest.fn();
    render(dialog({ onSubmit }));
    const checkbox = await screen.findByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(screen.getByText("「Bメロ」の振りとカウントも追加")).toBeInTheDocument();
    expect(screen.getByText(/^肩車\s5・7$/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("保存"));
    expect(onSubmit).toHaveBeenCalledWith("Bメロ", undefined, song.sections[1]);
  });

  it("adds no 振り when unticked", async () => {
    const onSubmit = jest.fn();
    render(dialog({ onSubmit }));
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByText("保存"));
    expect(onSubmit).toHaveBeenCalledWith("Bメロ", undefined);
  });

  it("follows the name, and hides for names that aren't in the song or have no 振り", async () => {
    render(dialog({}));
    const input = await screen.findByRole("combobox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "サビ" } });
    expect(await screen.findByText(/^回転\s1・2・…・8$/)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "ソロ" } });
    expect(screen.queryByRole("checkbox")).toBeNull();
    fireEvent.change(input, { target: { value: "OP" } });
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("doesn't offer 振り when renaming", async () => {
    render(dialog({ offerSongActions: false }));
    await screen.findByRole("combobox");
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});
