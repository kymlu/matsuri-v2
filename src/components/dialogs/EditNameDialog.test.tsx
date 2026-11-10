import { act, fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import { RosterList } from "../../models/roster";
import EditNameDialog from "./EditNameDialog";

const roster: RosterList = {
  categories: [{ id: "c1", name: "旗" }],
  names: [
    { id: "n1", name: "大旗", categoryIds: ["c1"], length: 1, width: 4, color: "#F08A00" },
    { id: "n2", name: "扇", categoryIds: [] },
  ],
};

const prop = { length: 1, width: 1, color: "#000000" };

type Props = Partial<React.ComponentProps<typeof EditNameDialog>>;

const dialog = (isOpen: boolean, props: Props) =>
  <Dialog.Root open={isOpen}>
    <EditNameDialog isOpen={isOpen} type="道具" name="3" prop={prop} roster={roster} onSubmit={() => {}} {...props}/>
  </Dialog.Root>;

const input = () => screen.getByRole("textbox") as HTMLInputElement;
const checkbox = () => screen.queryByRole("checkbox") as HTMLInputElement | null;

describe("EditNameDialog for props", () => {
  it("shows no picker for other types", async () => {
    render(dialog(true, { type: "セクション" }));
    await screen.findByRole("textbox");
    expect(screen.queryByText("名簿から選ぶ")).toBeNull();
  });

  it("doesn't mark names as used, since props often share one", async () => {
    render(dialog(true, {}));
    await screen.findByText("名簿から選ぶ");
    expect(screen.queryByText("使用中")).toBeNull();
  });

  it("offers the picked name's size and colour, ticked, and submits them", async () => {
    const onSubmit = jest.fn();
    render(dialog(true, { onSubmit }));
    fireEvent.click(await screen.findByRole("button", { name: /大旗/ }));
    expect(input().value).toBe("大旗");
    expect(checkbox()?.checked).toBe(true);
    expect(screen.getByText(/大旗」の大きさと色にする/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    // length is already 1, so only width and colour change.
    expect(onSubmit).toHaveBeenCalledWith("大旗", { width: 4, color: "#F08A00" });
  });

  it("changes only the name when the box is unticked", async () => {
    const onSubmit = jest.fn();
    render(dialog(true, { onSubmit }));
    fireEvent.click(await screen.findByRole("button", { name: /大旗/ }));
    fireEvent.click(checkbox()!);
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledWith("大旗", undefined);
  });

  it("offers nothing for a typed name, or a name without defaults", async () => {
    const onSubmit = jest.fn();
    render(dialog(true, { onSubmit }));
    fireEvent.click(await screen.findByRole("button", { name: "扇" }));
    expect(checkbox()).toBeNull();

    fireEvent.input(input(), { target: { value: "大旗" } });
    expect(checkbox()).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledWith("大旗", undefined);
  });

  it("starts fresh when reopened after キャンセル", async () => {
    const onSubmit = jest.fn();
    const { rerender } = render(dialog(true, { onSubmit }));
    fireEvent.click(await screen.findByRole("button", { name: /大旗/ }));
    await act(async () => { rerender(dialog(false, { onSubmit })); });
    await act(async () => { rerender(dialog(true, { onSubmit })); });

    expect((await screen.findByRole("textbox") as HTMLInputElement).value).toBe("3");
    expect(checkbox()).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledWith("3", undefined);
  });
});
