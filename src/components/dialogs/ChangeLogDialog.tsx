import { Select } from "@base-ui/react";
import { useMemo, useState } from "react";
import { Choreo, StageGeometry } from "../../models/choreo";
import { Dancer } from "../../models/dancer";
import { ActionLine, ChangeLog, DancerSectionChanges, ListChanges } from "../../lib/helpers/changeLogHelper";
import { formatDateRange } from "../../lib/helpers/dateHelper";
import { strCompare } from "../../lib/helpers/globalHelper";
import BaseErrorDialog from "./BaseErrorDialog";
import Icon from "../basic/Icon";
import Divider from "../basic/Divider";
import { Tag } from "../common/Tag";
import { DancerPositionText } from "../editor/PositionHint";

const OVERALL = "";
const COLLAPSED_LINE_COUNT = 5;
const OBSTACLE_FIELD_NAMES = { position: "位置", size: "サイズ", rotation: "向き" };

type ChangeLogDialogProps = {
  log: ChangeLog,
  fromVersion: number,
  choreo: Choreo,
  publishedAt?: string,
  initialSelection: string,
  onClose: () => void,
}

export default function ChangeLogDialog({
  log, fromVersion, choreo, publishedAt, initialSelection, onClose
}: ChangeLogDialogProps) {
  const [selection, setSelection] = useState<string>(initialSelection);
  const sectionNames = useMemo(() => Object.fromEntries(choreo.sections.map(x => [x.id, x.name])), [choreo.sections]);
  const entry = log.dancers[selection];
  // Positions are shown relative to the stage centre, so old ones need the old stage size.
  const oldGeometry = log.overall.stage?.[0] ?? choreo.stageGeometry;

  return (
    <BaseErrorDialog title="前回からの変更" fullWidth onClose={onClose}>
      <div className="space-y-2">
        <p className="text-sm text-muted">
          v{fromVersion} → v{choreo.version}{publishedAt ? `・${formatDateRange(publishedAt, undefined, false)}更新` : ""}
        </p>
        <DancerSelect log={log} dancers={choreo.dancers} value={selection} onChange={setSelection}/>
        {
          selection === OVERALL &&
          <>
            <OverallChanges log={log} sectionNames={sectionNames}/>
            <p className="text-sm text-muted">名前を選ぶと、その人の変更を確認できます。</p>
          </>
        }
        {
          entry?.kind === "new" &&
          <p>新しく追加されました。</p>
        }
        {
          entry?.kind === "changed" &&
          entry.sections.map(section =>
            <DancerSection
              key={section.sectionId}
              section={section}
              choreo={choreo}
              oldGeometry={oldGeometry}
              sectionNames={sectionNames}/>
          )
        }
        <Divider compact/>
        <p className="flex items-center gap-1 text-sm text-muted">
          閉じた後も<Icon src="releaseAlert" colour="primary" size="xs"/>から確認できます。
        </p>
      </div>
    </BaseErrorDialog>
  );
}

type DancerSelectProps = {
  log: ChangeLog,
  dancers: Record<string, Dancer>,
  value: string,
  onChange: (id: string) => void,
}

// Like CustomSelect, but with change markers and unchanged dancers disabled.
function DancerSelect({ log, dancers, value, onChange }: DancerSelectProps) {
  const [changed, unchanged] = useMemo(() => {
    const sorted = Object.values(dancers).sort((a, b) => strCompare<Dancer>(a, b, "name"));
    return [sorted.filter(x => log.dancers[x.id]), sorted.filter(x => !log.dancers[x.id])];
  }, [dancers, log]);
  const labels = useMemo(() => ({
    [OVERALL]: "全体",
    ...Object.fromEntries(Object.values(dancers).map(x => [x.id, x.name])),
  }), [dancers]);

  return (
    <Select.Root value={value} items={labels} onValueChange={(newValue) => onChange(newValue ?? OVERALL)}>
      <Select.Trigger className="flex flex-row items-center justify-between w-full h-10 p-3 text-lg border rounded-md cursor-pointer bg-surface border-line data-[popup-open]:border-primary">
        <Select.Value/>
        <Select.Icon className="flex align-middle">
          <Icon size="sm" src="expandMore"/>
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={4} side="bottom" className="z-50 border rounded-md select-none bg-surface border-primary">
          <Select.Popup>
            <div className="flex flex-col gap-1 p-2 max-h-[40svh] overflow-y-auto">
              <Select.Item value={OVERALL} className="flex p-2 cursor-pointer data-[highlighted]:bg-subtle">
                全体
              </Select.Item>
              {
                changed.map(dancer =>
                  <Select.Item key={dancer.id} value={dancer.id} className="flex items-center justify-between gap-2 p-2 cursor-pointer data-[highlighted]:bg-subtle">
                    {dancer.name}
                    {
                      log.dancers[dancer.id].kind === "new" ?
                      <Tag compact type="primary" text="新規"/> :
                      <span className="rounded-full size-2 bg-primary"/>
                    }
                  </Select.Item>
                )
              }
              {
                unchanged.length > 0 && changed.length > 0 &&
                <Divider compact/>
              }
              {
                unchanged.map(dancer =>
                  <Select.Item key={dancer.id} value={dancer.id} disabled className="flex items-center justify-between gap-2 p-2 text-muted opacity-60">
                    {dancer.name}
                    <span className="text-xs">変更なし</span>
                  </Select.Item>
                )
              }
            </div>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

type DancerSectionProps = {
  section: DancerSectionChanges,
  choreo: Choreo,
  oldGeometry: StageGeometry,
  sectionNames: Record<string, string>,
}

function DancerSection({ section, choreo, oldGeometry, sectionNames }: DancerSectionProps) {
  const { position, counts, pathChanged } = section;
  const index = choreo.sections.findIndex(x => x.id === section.sectionId);
  const nextSectionName = choreo.sections[index + 1]?.name;

  return (
    <div>
      <div className="flex items-center gap-1 font-semibold">
        {sectionNames[section.sectionId]}
        {section.oldSectionName && <span className="font-normal text-muted">（旧：{section.oldSectionName}）</span>}
        {section.isNew && <Tag compact type="primary" text="新規"/>}
      </div>
      <ul className="pl-5 text-sm list-disc">
        {
          position &&
          <li>
            <div className="flex flex-wrap items-center gap-1">
              位置：
              <DancerPositionText position={position.to} geometry={choreo.stageGeometry} bold={false}/>
              {
                // Not "old → new": the position text already uses ← and → for left and right.
                position.from &&
                <div className="flex items-center text-muted">
                  （前回：
                  <DancerPositionText position={position.from} geometry={oldGeometry} bold={false}/>
                  ）
                </div>
              }
            </div>
          </li>
        }
        {
          counts.map((count, i) =>
            <li key={i}>
              {count.actionName}：{section.isNew ? countNames(count.to) : `${countNames(count.from)} → ${countNames(count.to)}`}
            </li>
          )
        }
        {
          pathChanged && nextSectionName &&
          <li>{nextSectionName}への移動経路を変更</li>
        }
      </ul>
    </div>
  );
}

const countNames = (names: string[]) => names.length > 0 ? names.join("、") : "なし";

type OverallChangesProps = {
  log: ChangeLog,
  sectionNames: Record<string, string>,
}

function OverallChanges({ log, sectionNames }: OverallChangesProps) {
  const { event, stage, sections, memos, dancers, actions, props, obstacles } = log.overall;
  const sectionList = (ids: string[]) => ids.map(id => sectionNames[id]).join("、");

  const groups: [string, string[]][] = [
    ["イベント", [
      ...(event.name ? [`イベント名：${event.name[0]} → ${event.name[1]}`] : []),
      ...(event.dates ? [`日程：${event.dates.map(x => formatDateRange(x.startDate, x.endDate)).join(" → ")}`] : []),
    ]],
    ["ステージ", stage ? [`サイズ：${stage.map(x => `縦${x.stageLength}m × 幅${x.stageWidth}m`).join(" → ")}`] : []],
    ["セクション", [
      ...listChangeLines(sections),
      ...(sections.reordered ? ["並び順を変更"] : []),
    ]],
    ["メモ", memos.map(id => `${sectionNames[id]}のメモを変更`)],
    ["ダンサー", listChangeLines(dancers)],
    ["振り", actions.map(x => actionLine(x, sectionNames))],
    ["道具", [
      ...listChangeLines(props),
      ...props.lines.map(x => `「${x.name}」：${[
        x.moved.length > 0 ? `${sectionList(x.moved)}で移動` : "",
        x.nowInUse.length > 0 ? `${sectionList(x.nowInUse)}で使用中に` : "",
        x.nowUnused.length > 0 ? `${sectionList(x.nowUnused)}で未使用に` : "",
      ].filter(Boolean).join("・")}`),
    ]],
    ["障害物", [
      ...listChangeLines(obstacles),
      ...obstacles.lines.map(x => `「${x.name}」：${x.fields.map(field => OBSTACLE_FIELD_NAMES[field]).join("・")}を変更`),
    ]],
  ];

  return <>
    {
      groups.filter(([, lines]) => lines.length > 0).map(([title, lines]) =>
        <div key={title}>
          <div className="font-semibold">{title}</div>
          <CollapsibleList lines={lines}/>
        </div>
      )
    }
  </>;
}

function listChangeLines(changes: ListChanges) {
  return [
    ...changes.added.map(name => `「${name}」を追加`),
    ...changes.removed.map(name => `「${name}」を削除`),
    ...changes.renamed.map(([oldName, name]) => `「${oldName}」→「${name}」`),
  ];
}

function actionLine({ sectionId, actionName, countName, change, oldName }: ActionLine, sectionNames: Record<string, string>) {
  const section = sectionNames[sectionId];
  if (countName === undefined) {
    return change === "renamed" ?
      `${section}『${oldName}』→『${actionName}』` :
      `${section}『${actionName}』を${change === "added" ? "追加" : "削除"}`;
  }
  return change === "added" ? `${section}『${actionName}』に『${countName}』を追加` :
    change === "removed" ? `${section}『${actionName}』の『${countName}』を削除` :
    `${section}『${actionName}』の『${oldName}』→『${countName}』`;
}

// Collapses only when that hides at least 2 lines, so there's never a 「他1件」.
function CollapsibleList({ lines }: { lines: string[] }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const canCollapse = lines.length > COLLAPSED_LINE_COUNT + 1;
  const shownLines = canCollapse && !isExpanded ? lines.slice(0, COLLAPSED_LINE_COUNT) : lines;

  return <>
    <ul className="pl-5 text-sm list-disc">
      {shownLines.map((line, i) => <li key={i}>{line}</li>)}
    </ul>
    {
      canCollapse &&
      <button className="flex items-center ml-5 text-sm text-primary" onClick={() => setIsExpanded(prev => !prev)}>
        {isExpanded ? "閉じる" : `他${lines.length - COLLAPSED_LINE_COUNT}件`}
        <Icon src={isExpanded ? "expandLess" : "expandMore"} colour="primary" size="xs"/>
      </button>
    }
  </>;
}
