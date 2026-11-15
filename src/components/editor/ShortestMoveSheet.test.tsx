import { render, screen } from "@testing-library/react";
import ShortestMoveSheet, { formatMetres } from "./ShortestMoveSheet";

const base = {
  previousSectionName: "Aメロ", totalBefore: 62, totalAfter: 17, hasGain: true,
  view: "after" as const, onChangeView: jest.fn(), sameColour: true, onChangeSameColour: jest.fn(),
  showCountsOption: false, countsFollowPerson: false, onChangeCountsFollowPerson: jest.fn(),
  skippedStacked: false, onCancel: jest.fn(), onApply: jest.fn(),
};

describe("ShortestMoveSheet", () => {
  it("shows the total from the previous section and the two views", () => {
    render(<ShortestMoveSheet {...base}/>);
    expect(screen.getByText("Aメロからの移動（合計）")).toBeInTheDocument();
    expect(screen.getByText("62m")).toBeInTheDocument();
    expect(screen.getByText("17m")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "入れ替え後" })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("カウントも人と一緒に入れ替える")).toBeNull();
    expect(screen.queryByText("重なっている人は動かしません")).toBeNull();
  });

  it("switches views", () => {
    const onChangeView = jest.fn();
    render(<ShortestMoveSheet {...base} onChangeView={onChangeView}/>);
    screen.getByRole("radio", { name: "今" }).click();
    expect(onChangeView).toHaveBeenCalledWith("now");
  });

  it("shows the counts option and the stacks line only when needed", () => {
    render(<ShortestMoveSheet {...base} showCountsOption skippedStacked/>);
    expect(screen.getByText("カウントも人と一緒に入れ替える")).toBeInTheDocument();
    expect(screen.getByText("重なっている人は動かしません")).toBeInTheDocument();
  });

  it("explains and blocks applying when only crossing colours helps", () => {
    const onApply = jest.fn();
    render(<ShortestMoveSheet {...base} hasGain={false} totalAfter={62} onApply={onApply}/>);
    expect(screen.getByText("同じ色どうしでは、これ以上短くなりません")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    screen.getByText("入れ替える").click();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("shortens long section names and rounds metres", () => {
    render(<ShortestMoveSheet {...base} previousSectionName="とても長いセクションの名前"/>);
    expect(screen.getByText("とても長いセクシ…からの移動（合計）")).toBeInTheDocument();
    expect(formatMetres(4.04)).toBe("4m");
    expect(formatMetres(4.25)).toBe("4.3m");
    expect(formatMetres(17.4)).toBe("17m");
  });
});
