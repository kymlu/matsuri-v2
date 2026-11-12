import { fireEvent, render, screen, within } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import FindObjectsDialog from "./FindObjectsDialog";

const dancers = [{ id: "d1", name: "花子" }, { id: "d2", name: "一郎" }, { id: "d3", name: "花子" }];
const props = [{ id: "p1", name: "大旗" }];

const dialog = (overrides: Partial<React.ComponentProps<typeof FindObjectsDialog>> = {}) =>
  <Dialog.Root open>
    <FindObjectsDialog dancers={dancers} props={props} initialDancerIds={[]} initialPropIds={[]} onConfirm={() => {}} {...overrides}/>
  </Dialog.Root>;

const confirmButton = () => screen.getByText("選択する").closest("button") as HTMLButtonElement;

describe("FindObjectsDialog", () => {
  it("lists dancers and props in their own sections, numbering duplicate names", async () => {
    render(dialog());
    await screen.findByRole("region", { name: "ダンサー" });
    expect(screen.getByRole("region", { name: "道具" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "花子(1)" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "花子(2)" })).toBeTruthy();
  });

  it("starts with the stage selection ticked", async () => {
    render(dialog({ initialDancerIds: ["d2"], initialPropIds: ["p1"] }));
    expect((await screen.findByRole("checkbox", { name: "一郎" })).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("checkbox", { name: "大旗" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("2件選択中")).toBeTruthy();
  });

  it("is disabled until something is ticked", async () => {
    render(dialog());
    await screen.findByText("選ぶものをタップ");
    expect(confirmButton().disabled).toBe(true);
  });

  it("keeps ticks hidden by the search and confirms dancers and props", async () => {
    const onConfirm = jest.fn();
    render(dialog({ onConfirm }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "大旗" }));
    fireEvent.input(screen.getByRole("textbox"), { target: { value: "一" } });
    expect(screen.queryByRole("checkbox", { name: "大旗" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "一郎" }));
    expect(screen.getByText("2件選択中")).toBeTruthy();
    fireEvent.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith(["d2"], ["p1"]);
  });

  it("ticks and unticks every row shown with すべて", async () => {
    const onConfirm = jest.fn();
    render(dialog({ onConfirm }));
    fireEvent.input(await screen.findByRole("textbox"), { target: { value: "花" } });
    const dancerGroup = screen.getByRole("region", { name: "ダンサー" });
    fireEvent.click(within(dancerGroup).getByText("すべて選択"));
    expect(screen.getByText("2件選択中")).toBeTruthy();
    expect(within(dancerGroup).getByText("すべて解除")).toBeTruthy();
    fireEvent.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith(["d1", "d3"], []);
  });

  it("says when nothing matches", async () => {
    render(dialog());
    fireEvent.input(await screen.findByRole("textbox"), { target: { value: "さくら" } });
    expect(screen.getByText("「さくら」は見つかりませんでした")).toBeTruthy();
  });
});
