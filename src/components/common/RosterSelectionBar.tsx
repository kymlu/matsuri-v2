import { Menu } from "@base-ui/react";
import classNames from "classnames";
import { RosterKind } from "../../models/roster";
import { rosterCounter } from "../../lib/helpers/rosterHelper";
import Icon from "../basic/Icon";
import CustomMenu from "../inputs/CustomMenu";

type RosterSelectionBarProps = {
  kind: RosterKind,
  selectedCount: number,
  hiddenCount: number, // selected but out of view because of the filter or search
  canRemoveCategories: boolean, // at least one selected name has a category
  hasCategories: boolean,
  canClearLook: boolean, // props: at least one selected name has a default size or colour
  isBusy: boolean,
  onAddCategories: () => void,
  onRemoveCategories: () => void,
  onSetSize: () => void,
  onSetColor: () => void,
  onClearLook: () => void,
  onDelete: () => void,
  lastAction?: { message: string, isError?: boolean, undo?: () => void },
}

type BarMenuItem = { icon: React.ComponentProps<typeof Icon>["src"], label: string, disabled?: boolean, onClick: () => void };

// Replaces the add bar while selecting on the 名簿 page. Actions are grouped by what they change,
// 区分 and (props only) 大きさ・色, each opening a menu; delete sits apart at the end.
export default function RosterSelectionBar({
  kind, selectedCount, hiddenCount, canRemoveCategories, hasCategories, canClearLook, isBusy,
  onAddCategories, onRemoveCategories, onSetSize, onSetColor, onClearLook, onDelete, lastAction,
}: RosterSelectionBarProps) {
  const counter = rosterCounter(kind);
  const hasSelection = selectedCount > 0 && !isBusy;

  return <div className="px-4 pt-3 pb-5 border-t bg-surface border-line">
    <p className="font-bold">
      {
        selectedCount === 0
          ? <span className="font-normal text-muted">{kind === "prop" ? "道具名" : "名前"}をタップして選択</span>
          : <>
            {selectedCount}{counter}を選択中
            {hiddenCount > 0 && <span className="ml-1 text-sm font-normal text-primary">（うち{hiddenCount}{counter}は非表示）</span>}
          </>
      }
    </p>
    <div className="flex gap-1.5 mt-2">
      <BarMenu icon="sell" label="区分" disabled={!hasSelection} items={[
        { icon: "add", label: "区分を追加…", disabled: !hasCategories, onClick: onAddCategories },
        { icon: "remove", label: "区分を外す…", disabled: !canRemoveCategories, onClick: onRemoveCategories },
      ]}/>
      {
        kind === "prop" &&
        <BarMenu icon="colors" label="大きさ・色" disabled={!hasSelection} items={[
          { icon: "resize", label: "大きさを設定…", onClick: onSetSize },
          { icon: "colors", label: "色を設定…", onClick: onSetColor },
          { icon: "clear", label: "大きさと色を消す", disabled: !canClearLook, onClick: onClearLook },
        ]}/>
      }
      <button
        type="button"
        aria-label="名簿から削除"
        disabled={!hasSelection}
        onClick={onDelete}
        className="flex items-center justify-center px-2.5 border rounded-md shrink-0 border-line bg-surface disabled:opacity-50 lg:enabled:hover:bg-subtle">
        <Icon src="delete" size="sm" colour="grey"/>
      </button>
    </div>
    <p aria-live="polite" className={classNames("mt-1.5 text-sm min-h-5", lastAction?.isError ? "font-semibold text-primary" : "text-muted")}>
      {lastAction?.message}
      {
        lastAction?.undo &&
        <button type="button" onClick={lastAction.undo} disabled={isBusy} className="ml-2 font-semibold text-primary">元に戻す</button>
      }
    </p>
  </div>
}

// A button that opens a short menu of actions. Items that can't be used stay listed, greyed.
function BarMenu({ icon, label, disabled, items }: { icon: BarMenuItem["icon"], label: string, disabled: boolean, items: BarMenuItem[] }) {
  return <div className="flex-1">
    <CustomMenu
      full
      position="top"
      disabled={disabled}
      trigger={
        // Tighter than IconLabelButton, so 大きさ・色 stays on one line beside 区分 and delete on a phone.
        <div className={classNames("flex items-center justify-center w-full gap-1 py-1.5 pl-2 pr-1 font-semibold border rounded-md whitespace-nowrap border-primary text-primary bg-surface", {
          "opacity-50 cursor-default": disabled,
          "lg:hover:bg-subtle": !disabled,
        })}>
          <Icon src={icon} size="sm" colour="primary"/>
          {label}
          <Icon src="arrowDropDown" size="sm" colour="primary"/>
        </div>
      }>
      {
        items.map(item =>
          <Menu.Item
            key={item.label}
            disabled={item.disabled}
            onClick={item.disabled ? undefined : item.onClick}
            className={classNames("flex items-center gap-2 px-3 py-1.5 font-semibold rounded-md text-primary whitespace-nowrap", {
              "opacity-50 cursor-default": item.disabled,
              "cursor-pointer lg:hover:bg-subtle data-[highlighted]:bg-subtle": !item.disabled,
            })}>
            <Icon src={item.icon} size="sm" colour="primary"/>
            {item.label}
          </Menu.Item>
        )
      }
    </CustomMenu>
  </div>;
}
