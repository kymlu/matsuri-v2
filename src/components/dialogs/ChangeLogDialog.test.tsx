import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import { Choreo } from "../../models/choreo";
import { ChangeLog } from "../../lib/helpers/changeLogHelper";
import ChangeLogDialog from "./ChangeLogDialog";

const geometry = {
  stageWidth: 10,
  stageLength: 8,
  margin: { topMargin: 1, leftMargin: 1, rightMargin: 1, bottomMargin: 1 },
  yAxis: "top-down" as const,
};

const position = (x: number, y: number) => ({ dancerId: "d1", x, y, sectionId: "s1", type: "dancer" as const, color: "#000000" });

const choreo: Choreo = {
  id: "c1",
  name: "隊列",
  event: "祭り",
  version: 8,
  lastUpdated: "2026-10-28T10:00:00Z",
  stageType: "stage",
  stageGeometry: geometry,
  sections: ["サビ1", "大サビ", "間奏"].map((name, i) => ({
    id: `s${i + 1}`,
    name,
    formation: { dancerPositions: {}, dancerActions: [], propPositions: {} },
  })),
  dancers: {
    d1: { id: "d1", name: "さくら" },
    d2: { id: "d2", name: "ゆい" },
    d3: { id: "d3", name: "かな" },
  },
  props: {},
};

const emptyChanges = { added: [], removed: [], renamed: [] };

function makeLog(overall: Partial<ChangeLog["overall"]> = {}): ChangeLog {
  return {
    overall: {
      event: {},
      sections: { ...emptyChanges, reordered: false },
      memos: [],
      dancers: emptyChanges,
      actions: [],
      props: { ...emptyChanges, lines: [] },
      obstacles: { ...emptyChanges, lines: [] },
      ...overall,
    },
    dancers: {
      d1: {
        kind: "changed",
        sections: [
          {
            sectionId: "s1",
            isNew: false,
            position: { from: position(4, 1), to: position(3.5, 1.25) },
            counts: [{ actionName: "振りA", from: ["1回目"], to: ["1回目", "2回目"] }],
            pathChanged: true,
          },
          { sectionId: "s2", oldSectionName: "サビ2", isNew: false, counts: [{ actionName: "振りB", from: [], to: ["1回目"] }], pathChanged: false },
          { sectionId: "s3", isNew: true, position: { to: position(5, 2) }, counts: [{ actionName: "振りC", from: [], to: ["2回目"] }], pathChanged: false },
        ],
      },
      d2: { kind: "new" },
    },
  };
}

const positionLines = () => screen.getAllByRole("listitem")
  .map(x => x.textContent ?? "")
  .filter(text => text.startsWith("位置："));

function renderDialog(initialSelection: string, log = makeLog(), currentChoreo = choreo) {
  return render(
    <Dialog.Root open>
      <ChangeLogDialog log={log} fromVersion={5} choreo={currentChoreo} initialSelection={initialSelection} onClose={() => {}}/>
    </Dialog.Root>
  );
}

describe("ChangeLogDialog", () => {
  it("shows the versions, update date and footer", () => {
    renderDialog("");
    expect(screen.getByText("前回からの変更")).toBeInTheDocument();
    expect(screen.getByText("v5 → v8・10月28日更新")).toBeInTheDocument();
    expect(screen.getByText(/閉じた後も/)).toBeInTheDocument();
  });

  describe("per dancer", () => {
    it("lists changes by section with the old and new positions", () => {
      renderDialog("d1");
      expect(screen.getByText("サビ1")).toBeInTheDocument();
      // On a 10m stage, x 4 is 1m left of centre and x 3.5 is 1.5m left; y 1.25 shows as 1.3m.
      expect(positionLines()[0]).toBe("位置：1.3m/←1.5m（前回：1m/←1m）");
      expect(screen.getByText("振りA：1回目 → 1回目、2回目")).toBeInTheDocument();
      expect(screen.getByText("大サビへの移動経路を変更")).toBeInTheDocument();
    });

    it("shows a renamed section's old name and なし for no count", () => {
      renderDialog("d1");
      expect(screen.getByText("（旧：サビ2）")).toBeInTheDocument();
      expect(screen.getByText("振りB：なし → 1回目")).toBeInTheDocument();
    });

    it("shows a new section with its position and counts only", () => {
      renderDialog("d1");
      expect(screen.getByText("新規")).toBeInTheDocument();
      expect(positionLines()[1]).toMatch(/^位置：2m\/↔\uFE0E?0m$/u);
      expect(screen.getByText("振りC：2回目")).toBeInTheDocument();
    });

    it("shows the old position against the old stage size", () => {
      const wider = { ...geometry, stageWidth: 12 };
      renderDialog("d1", makeLog({ stage: [geometry, wider] }), { ...choreo, stageGeometry: wider });
      // x 4 is 1m left of centre on the old 10m stage (it would be 2m on the new 12m one).
      expect(positionLines()[0]).toMatch(/（前回：1m\/←1m）$/);
    });

    it("shows only a message for a new dancer", () => {
      renderDialog("d2");
      expect(screen.getByText("新しく追加されました。")).toBeInTheDocument();
      expect(screen.queryByText("名前を選ぶと、その人の変更を確認できます。")).not.toBeInTheDocument();
    });
  });

  describe("全体", () => {
    it("shows each group with its lines and the hint", () => {
      renderDialog("", makeLog({
        event: { name: ["祭り", "秋祭り"], dates: [{}, { startDate: "2026-11-02" }] },
        stage: [geometry, { ...geometry, stageWidth: 12 }],
        sections: { added: ["間奏"], removed: ["Aメロ"], renamed: [["サビ2", "大サビ"]], reordered: true },
        memos: ["s1"],
        dancers: { added: ["ゆい"], removed: [], renamed: [["さくら", "さくら（A）"]] },
        actions: [
          { sectionId: "s1", actionName: "振りA", countName: "3回目", change: "added" },
          { sectionId: "s1", actionName: "振りA", countName: "1回目", change: "removed" },
          { sectionId: "s1", actionName: "振りA", countName: "最初", change: "renamed", oldName: "1回目" },
          { sectionId: "s2", actionName: "振りB", change: "added" },
          { sectionId: "s2", actionName: "振りC", change: "removed" },
          { sectionId: "s2", actionName: "振りD", change: "renamed", oldName: "振りE" },
        ],
        props: {
          added: ["旗"], removed: [], renamed: [],
          lines: [{ name: "旗", moved: ["s1", "s2"], nowInUse: ["s3"], nowUnused: [] }, { name: "扇", moved: [], nowInUse: [], nowUnused: ["s1"] }],
        },
        obstacles: { added: [], removed: [], renamed: [["段差", "スロープ"]], lines: [{ name: "花道", fields: ["position", "size"] }] },
      }));

      [
        "イベント名：祭り → 秋祭り",
        "日程：日程未定 → 2026年11月2日",
        "サイズ：縦8m × 幅10m → 縦8m × 幅12m",
        "「間奏」を追加", "「Aメロ」を削除", "「サビ2」→「大サビ」", "並び順を変更",
        "サビ1のメモを変更",
        "「ゆい」を追加", "「さくら」→「さくら（A）」",
        "サビ1『振りA』に『3回目』を追加",
        "サビ1『振りA』の『1回目』を削除",
        "サビ1『振りA』の『1回目』→『最初』",
        "大サビ『振りB』を追加",
        "大サビ『振りC』を削除",
        "大サビ『振りE』→『振りD』",
        "「旗」を追加",
        "「旗」：サビ1、大サビで移動・間奏で使用中に",
        "「扇」：サビ1で未使用に",
        "「段差」→「スロープ」",
        "「花道」：位置・サイズを変更",
        "名前を選ぶと、その人の変更を確認できます。",
      ].forEach(text => expect(screen.getByText(text)).toBeInTheDocument());
    });

    it("hides empty groups", () => {
      renderDialog("", makeLog({ memos: ["s1"] }));
      expect(screen.getByText("メモ")).toBeInTheDocument();
      expect(screen.queryByText("イベント")).not.toBeInTheDocument();
      expect(screen.queryByText("道具")).not.toBeInTheDocument();
    });

    it("shows up to 6 lines in full", () => {
      renderDialog("", makeLog({ dancers: { added: ["1", "2", "3", "4", "5", "6"], removed: [], renamed: [] } }));
      expect(screen.getByText("「6」を追加")).toBeInTheDocument();
      expect(screen.queryByText(/他\d+件/)).not.toBeInTheDocument();
    });

    it("collapses more than 6 lines and expands in place", () => {
      renderDialog("", makeLog({ dancers: { added: ["1", "2", "3", "4", "5", "6", "7", "8"], removed: [], renamed: [] } }));
      expect(screen.getByText("「5」を追加")).toBeInTheDocument();
      expect(screen.queryByText("「6」を追加")).not.toBeInTheDocument();

      fireEvent.click(screen.getByText("他3件"));
      expect(screen.getByText("「8」を追加")).toBeInTheDocument();

      fireEvent.click(screen.getByText("閉じる"));
      expect(screen.queryByText("「8」を追加")).not.toBeInTheDocument();
    });
  });
});
