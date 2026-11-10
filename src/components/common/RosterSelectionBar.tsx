import { Menu } from "@base-ui/react";
import classNames from "classnames";
import { RosterKind } from "../../models/roster";
import { rosterCounter } from "../../lib/helpers/rosterHelper";
import { IconLabelButton } from "../basic/Button";
import IconButton from "../basic/IconButton";
import CustomMenu from "../inputs/CustomMenu";

type RosterSelectionBarProps = {
  kind: RosterKind,
  selectedCount: number,
  hiddenCount: number, // selected but out of view because of the filter or search
  canRemoveCategories: boolean, // at least one selected name has a category
  hasCategories: boolean,
  isBusy: boolean,
  onAddCategories: () => void,
  onRemoveCategories: () => void,
  onDelete: () => void,
  lastAction?: { message: string, isError?: boolean, undo?: () => void },
}

// Replaces the add bar while selecting on the 名簿 page. Delete sits behind ⋯, away from the category buttons.
export default function RosterSelectionBar({
  kind, selectedCount, hiddenCount, canRemoveCategories, hasCategories, isBusy,
  onAddCategories, onRemoveCategories, onDelete, lastAction,
}: RosterSelectionBarProps) {
  const counter = rosterCounter(kind);
  const hasSelection = selectedCount > 0 && !isBusy;

  return <div className="px-4 pt-3 pb-5 border-t bg-surface border-line">
    <p className="font-bold">
      {
        selectedCount === 0
          ? <span className="font-normal text-muted">名前をタップして選択</span>
          : <>
            {selectedCount}{counter}を選択中
            {hiddenCount > 0 && <span className="ml-1 text-sm font-normal text-primary">（うち{hiddenCount}{counter}は非表示）</span>}
          </>
      }
    </p>
    <div className="flex gap-1.5 mt-2">
      <div className="flex-1">
        <IconLabelButton icon="add" label="区分を追加" primaryText full disabled={!hasSelection || !hasCategories} onClick={onAddCategories}/>
      </div>
      <div className="flex-1">
        <IconLabelButton icon="remove" label="区分を外す" primaryText full disabled={!hasSelection || !canRemoveCategories} onClick={onRemoveCategories}/>
      </div>
      <CustomMenu
        disabled={!hasSelection}
        trigger={<IconButton asDiv src="moreHoriz" colour="grey" size="sm" disabled={!hasSelection}/>}>
        <Menu.Item>
          <IconLabelButton icon="delete" label="名簿から削除" primaryText noBorder full alignment="left" onClick={onDelete}/>
        </Menu.Item>
      </CustomMenu>
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
