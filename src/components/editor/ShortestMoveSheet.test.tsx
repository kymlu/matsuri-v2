import { render, screen } from "@testing-library/react";
import ShortestMoveSheet, { formatMetres } from "./ShortestMoveSheet";

const base = {
  previousSectionName: "Aメロ", totalBefore: 62, totalAfter: 17, hasGain: true,
  colours: [] as string[], excludedColours: new Set<string>(), onToggleColour: jest.fn(),
  view: "after" as const, onChangeView: jest.fn(), sameColour: true, onChangeSameColour: jest.fn(),
  colourFollowsPerson: true, onChangeColourFollowsPerson: jest.fn(),
  showCountsOption: false, countsFollowPerson: false, onChangeCountsFollowPerson: jest.fn(),
  skippedStacked: false, onCancel: jest.fn(), onApply: jest.fn(),
};

describe("ShortestMoveSheet", () => {
  it("shows the total from the previous section and the two views", () => {
    render(<ShortestMoveSheet {...base}/>);
    expect(screen.getByText("「Aメロ」からの移動（合計）")).toBeInTheDocument();
    expect(screen.getByText("62m")).toBeInTheDocument();
    expect(screen.getByText("17m")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "最短" })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("radiogroup", { name: "カウント" })).toBeNull();
    expect(screen.queryByText("重なっている人は動かしません")).toBeNull();
  });

  it("switches views", () => {
    const onChangeView = jest.fn();
    render(<ShortestMoveSheet {...base} onChangeView={onChangeView}/>);
    screen.getByRole("radio", { name: "今" }).click();
    expect(onChangeView).toHaveBeenCalledWith("now");
  });

  it("shows the counts option and the stacks line only when needed", () => {
    const onChangeCountsFollowPerson = jest.fn();
    render(<ShortestMoveSheet {...base} showCountsOption skippedStacked onChangeCountsFollowPerson={onChangeCountsFollowPerson}/>);
    const counts = screen.getByRole("radiogroup", { name: "カウント" });
    expect(screen.getByText("入れ替えたあと、どちらに合わせますか？")).toBeInTheDocument();
    expect(counts.querySelector("[aria-checked=true]")).toHaveTextContent("立ち位置");
    (counts.querySelector("[aria-checked=false]") as HTMLElement).click();
    expect(onChangeCountsFollowPerson).toHaveBeenCalledWith(true);
    expect(screen.getByText("重なっている人は動かしません")).toBeInTheDocument();
  });

  it("explains and blocks applying when only crossing colours helps", () => {
    const onApply = jest.fn();
    render(<ShortestMoveSheet {...base} hasGain={false} noGainMessage="同じ色どうしでは、これ以上短くなりません" totalAfter={62} onApply={onApply}/>);
    expect(screen.getByText("同じ色どうしでは、これ以上短くなりません")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    screen.getByText("入れ替える").click();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("offers colours as toggles when there are several", () => {
    const onToggleColour = jest.fn();
    render(<ShortestMoveSheet {...base} colours={["#e00", "#00e"]} excludedColours={new Set(["#00e"])} onToggleColour={onToggleColour}/>);
    expect(screen.getByRole("button", { name: "#e00" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "#00e" })).toHaveAttribute("aria-pressed", "false");
    screen.getByRole("button", { name: "#00e" }).click();
    expect(onToggleColour).toHaveBeenCalledWith("#00e");
  });

  it("offers the colour switch only when colours can mix", () => {
    const { unmount } = render(<ShortestMoveSheet {...base}/>);
    expect(screen.queryByRole("radiogroup", { name: "色" })).toBeNull();
    expect(screen.queryByText("入れ替えたあと、どちらに合わせますか？")).toBeNull();
    unmount();
    render(<ShortestMoveSheet {...base} sameColour={false}/>);
    expect(screen.getByRole("radiogroup", { name: "色" }).querySelector("[aria-checked=true]")).toHaveTextContent("人");
  });

  it("hides the colour row with nothing to choose", () => {
    render(<ShortestMoveSheet {...base}/>);
    expect(screen.queryByRole("group", { name: "対象の色" })).toBeNull();
  });

  it("shortens long section names and rounds metres", () => {
    render(<ShortestMoveSheet {...base} previousSectionName="とても長いセクションの名前"/>);
    expect(screen.getByText("「とても長いセクシ…」からの移動（合計）")).toBeInTheDocument();
    expect(formatMetres(4.04)).toBe("4m");
    expect(formatMetres(4.25)).toBe("4.3m");
    expect(formatMetres(17.4)).toBe("17m");
  });
});
