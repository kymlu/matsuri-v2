import { Select } from "@base-ui/react";
import { Fragment, useMemo, useState } from "react";
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
    <BaseErrorDialog
      title="前回からの変更"
      fullWidth
      onClose={onClose}
      header={
        <div className="pb-2 space-y-2 border-b border-line">
          <div className="flex items-center gap-1 text-sm text-muted">
            <Tag compact type="primary" text={`v${fromVersion}`}/>
            <Icon src="arrowRightAlt" colour="grey" size="xs"/>
            <Tag compact type="filled" text={`v${choreo.version}`}/>
            {publishedAt && `・${formatDateRange(publishedAt, undefined, false)}更新`}
          </div>
          <DancerSelect log={log} dancers={choreo.dancers} value={selection} onChange={setSelection}/>
          {
            selection === OVERALL &&
            <p className="text-sm text-muted">名前を選ぶと、その人の変更を確認できます。</p>
          }
        </div>
      }
      footerNote={
        <p className="flex items-center gap-1 pt-2 text-sm border-t text-muted border-line">
          閉じた後も<Icon src="releaseAlert" colour="primary" size="xs"/>から確認できます。
        </p>
      }>
      <div className="py-2 space-y-2">
        {
          selection === OVERALL &&
          <OverallChanges log={log} sectionNames={sectionNames}/>
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

  const rows = (list: ChangeRow[]) => list.length > 0 && <ChangeRows rows={list}/>;

  const groups: [string, React.ReactNode][] = [
    ["イベント", rows([
      ...(event.name ? [{ label: "イベント名", text: `${event.name[0]} → ${event.name[1]}` }] : []),
      ...(event.dates ? [{ label: "日程", text: event.dates.map(x => formatDateRange(x.startDate, x.endDate)).join(" → ") }] : []),
    ])],
    ["ステージ", rows(stage ? [{ label: "サイズ", text: stage.map(x => `縦${x.stageLength}m × 幅${x.stageWidth}m`).join(" → ") }] : [])],
    ["セクション", rows([
      ...listChangeRows(sections),
      ...(sections.reordered ? [{ label: "並び順", text: "変更あり" }] : []),
    ])],
    ["メモ", rows(memos.length > 0 ? [{ label: "変更", text: sectionList(memos) }] : [])],
    ["ダンサー", rows(listChangeRows(dancers))],
    ["振り", actions.length > 0 && <ActionChanges lines={actions} sectionNames={sectionNames}/>],
    ["道具", rows([
      ...listChangeRows(props),
      ...props.lines.map(x => ({ text: `「${x.name}」：${[
        x.moved.length > 0 ? `${sectionList(x.moved)}で移動` : "",
        x.nowInUse.length > 0 ? `${sectionList(x.nowInUse)}で使用中に` : "",
        x.nowUnused.length > 0 ? `${sectionList(x.nowUnused)}で未使用に` : "",
      ].filter(Boolean).join("・")}` })),
    ])],
    ["障害物", rows([
      ...listChangeRows(obstacles),
      ...obstacles.lines.map(x => ({ text: `「${x.name}」：${x.fields.map(field => OBSTACLE_FIELD_NAMES[field]).join("・")}を変更` })),
    ])],
  ];

  return <>
    {
      groups.filter(([, content]) => content).map(([title, content]) =>
        <div key={title}>
          <div className="font-semibold">{title}</div>
          {content}
        </div>
      )
    }
  </>;
}

// A row without a label spans the full width, for lines about one named item.
type ChangeRow = { label?: string, text: string };

function ChangeRows({ rows, nested }: { rows: ChangeRow[], nested?: boolean }) {
  return <div className={"grid grid-cols-[4.5em,1fr] gap-x-2 text-sm break-keep " + (nested ? "pl-6" : "pl-2")}>
    {
      rows.map((row, i) => row.label === undefined ?
        <span key={i} className="col-span-2">{row.text}</span> :
        <Fragment key={i}>
          <span className="text-muted text-nowrap">{row.label}</span>
          <span>{row.text}</span>
        </Fragment>
      )
    }
  </div>;
}

// Names side by side in 「」, and one rename per row so the arrows don't run together.
function listChangeRows(changes: ListChanges): ChangeRow[] {
  const names = (list: string[]) => list.map(name => `「${name}」`).join("");
  return [
    ...(changes.added.length > 0 ? [{ label: "追加", text: names(changes.added) }] : []),
    ...(changes.removed.length > 0 ? [{ label: "削除", text: names(changes.removed) }] : []),
    ...changes.renamed.map(([oldName, name], i) => ({ label: i === 0 ? "名前変更" : "", text: `「${oldName}」→「${name}」` })),
  ];
}

function toListChanges(lines: ActionLine[], getName: (line: ActionLine) => string): ListChanges {
  return {
    added: lines.filter(x => x.change === "added").map(getName),
    removed: lines.filter(x => x.change === "removed").map(getName),
    renamed: lines.filter(x => x.change === "renamed").map(x => [x.oldName!!, getName(x)]),
  };
}

// Grouped by section, then the section's actions, then each action's counts.
function ActionChanges({ lines, sectionNames }: { lines: ActionLine[], sectionNames: Record<string, string> }) {
  const sectionIds = Array.from(new Set(lines.map(x => x.sectionId)));

  return <>
    {
      sectionIds.map(sectionId => {
        const sectionLines = lines.filter(x => x.sectionId === sectionId);
        const countLines = sectionLines.filter(x => x.countName !== undefined);
        const actionNames = Array.from(new Set(countLines.map(x => x.actionName)));
        return <div key={sectionId}>
          <div className="pl-2 text-sm font-semibold">{sectionNames[sectionId]}</div>
          <ChangeRows rows={listChangeRows(toListChanges(sectionLines.filter(x => x.countName === undefined), x => x.actionName))}/>
          {
            actionNames.map(actionName =>
              <Fragment key={actionName}>
                <ChangeRows rows={[{ text: `「${actionName}」のカウント` }]}/>
                <ChangeRows nested rows={listChangeRows(toListChanges(countLines.filter(x => x.actionName === actionName), x => x.countName!!))}/>
              </Fragment>
            )
          }
        </div>;
      })
    }
  </>;
}
