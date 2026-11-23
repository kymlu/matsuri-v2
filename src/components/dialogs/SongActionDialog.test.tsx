import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import SongActionDialog from "./SongActionDialog";
import * as api from "../../lib/helpers/apiHelper";

const dialog = (props: Partial<React.ComponentProps<typeof SongActionDialog>> = {}) =>
  <Dialog.Root open>
    <SongActionDialog teamId="t" sectionId="sec" otherNames={["タワー"]} onSaved={() => {}} {...props}/>
  </Dialog.Root>;

describe("SongActionDialog", () => {
  afterEach(() => jest.restoreAllMocks());

  it("starts a new 振り at the count patterns, and saves the picked counts", async () => {
    const save = jest.spyOn(api, "saveSongAction").mockImplementation(() => Promise.resolve());
    render(dialog());
    fireEvent.input(await screen.findByPlaceholderText("振り名"), { target: { value: "回転" } });
    fireEvent.click(screen.getByRole("button", { name: /奇数/ }));
    expect(screen.getByText("パターンを選び直す")).toBeInTheDocument();
    fireEvent.click(screen.getByText("追加"));
    expect(save).toHaveBeenCalledWith("t", "sec", undefined, "回転", ["1", "3", "5", "7"], expect.any(Function), expect.any(Function));
  });

  it("won't save a name already in the section", async () => {
    render(dialog());
    fireEvent.input(await screen.findByPlaceholderText("振り名"), { target: { value: "タワー" } });
    fireEvent.click(screen.getByRole("button", { name: /偶数/ }));
    expect(screen.getByText("振り名が重複")).toBeInTheDocument();
    expect(screen.getByText("追加").closest("button")).toBeDisabled();
  });

  it("edits an existing 振り without patterns, and removes counts with ✕", async () => {
    const save = jest.spyOn(api, "saveSongAction").mockImplementation(() => Promise.resolve());
    render(dialog({ action: { id: "a1", name: "回転", counts: ["1", "3", "5"] } }));
    await screen.findByText("振りを編集");
    expect(screen.queryByText("パターンを選び直す")).toBeNull();
    fireEvent.click(screen.getAllByLabelText("カウントを削除")[1]);
    fireEvent.click(screen.getByText("保存"));
    expect(save).toHaveBeenCalledWith("t", "sec", "a1", "回転", ["1", "5"], expect.any(Function), expect.any(Function));
  });

  it("asks before deleting, in the same dialog", async () => {
    const remove = jest.spyOn(api, "removeSongAction").mockImplementation(() => Promise.resolve());
    render(dialog({ action: { id: "a1", name: "回転", counts: ["1"] } }));
    fireEvent.click(await screen.findByText("振りを削除"));
    expect(screen.getByText("「回転」を削除しますか？")).toBeInTheDocument();
    fireEvent.click(screen.getByText("削除"));
    expect(remove).toHaveBeenCalledWith("t", "a1", expect.any(Function), expect.any(Function));
  });
});
