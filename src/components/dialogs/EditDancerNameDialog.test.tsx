import { act, fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import { Roster } from "../../models/roster";
import EditDancerNameDialog from "./EditDancerNameDialog";

const roster: Roster = {
  categories: [{ id: "c1", name: "正規" }, { id: "c2", name: "旗士" }],
  names: [
    { id: "n1", name: "はると", categoryIds: ["c1", "c2"] },
    { id: "n2", name: "さくら", categoryIds: ["c1"] },
    { id: "n3", name: "一郎", categoryIds: [] },
    { id: "n4", name: "三郎", categoryIds: [] },
  ],
};

type Props = Partial<React.ComponentProps<typeof EditDancerNameDialog>>;

const dialog = (isOpen: boolean, props: Props) =>
  <Dialog.Root open={isOpen}>
    <EditDancerNameDialog isOpen={isOpen} name="三郎" otherNames={["三郎", "一郎"]} onSubmit={() => {}} {...props}/>
  </Dialog.Root>;

// The picker's name buttons, in the order shown.
const pickerNames = () => Array.from(document.body.querySelectorAll("button[aria-pressed]"))
  .map(b => b.firstChild?.textContent);

const input = () => screen.getByRole("textbox") as HTMLInputElement;

describe("EditDancerNameDialog", () => {
  it("shows no picker without a roster", async () => {
    render(dialog(true, {}));
    await screen.findByRole("textbox");
    expect(screen.queryByText("名簿から選ぶ")).toBeNull();
  });

  it("lists names in order, with names used by other dancers last", async () => {
    render(dialog(true, { roster }));
    await screen.findByText("名簿から選ぶ");
    // 三郎 is this dancer's own name, so only 一郎 counts as used.
    expect(pickerNames()).toEqual(["さくら", "はると", "三郎", "一郎"]);
    expect(screen.getAllByText("使用中")).toHaveLength(1);
  });

  it("fills the input when a name is tapped, and saves it only on 保存", async () => {
    const onSubmit = jest.fn();
    render(dialog(true, { roster, onSubmit }));
    fireEvent.click(await screen.findByRole("button", { name: "はると" }));
    expect(input().value).toBe("はると");
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledWith("はると");
  });

  it("filters by typed text, not by the name the dialog opened with", async () => {
    render(dialog(true, { roster }));
    await screen.findByText("名簿から選ぶ");
    expect(pickerNames()).toHaveLength(4);
    fireEvent.input(input(), { target: { value: "さ" } });
    expect(pickerNames()).toEqual(["さくら"]);
  });

  it("filters by category, and hides the filter when there are no categories", async () => {
    const { unmount } = render(dialog(true, { roster, pickerFilter: "c2" }));
    await screen.findByText("名簿から選ぶ");
    expect(pickerNames()).toEqual(["はると"]);
    unmount();

    render(dialog(true, { roster: { ...roster, categories: [] } }));
    await screen.findByText("名簿から選ぶ");
    expect(screen.queryByRole("radio", { name: "全員" })).toBeNull();
  });

  it("starts fresh when reopened after キャンセル", async () => {
    const onSubmit = jest.fn();
    const { rerender } = render(dialog(true, { roster, onSubmit }));
    fireEvent.click(await screen.findByRole("button", { name: "はると" }));
    await act(async () => { rerender(dialog(false, { roster, onSubmit })); });
    await act(async () => { rerender(dialog(true, { roster, onSubmit })); });

    expect((await screen.findByRole("textbox") as HTMLInputElement).value).toBe("三郎");
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledWith("三郎");
  });
});
