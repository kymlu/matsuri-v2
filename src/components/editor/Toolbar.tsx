import { useEffect, useState } from "react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import { VerticalDivider } from "../basic/Divider";
import { Distribution, HorizontalAlignment, VerticalAlignment } from "../../models/alignment";

type ToolbarProps = {
  // add
  onAddDancer: () => void;
  isAddingDancer: boolean;
  onAddProp: () => void;
  isAddingProp: boolean;

  // selection / attributes
  showSelectDancer: boolean;
  onSelectColor: () => void;
  onSelectType: () => void;
  showChangeColour: boolean;
  onChangeColor: () => void;

  // copy / paste / swap
  showCopyPosition: boolean;
  onCopyPosition: () => void;
  showPastePosition: boolean;
  onPastePosition: () => void;
  showSwapPosition: boolean;
  onSwapPosition: () => void;

  // arrange
  showArrange: boolean;
  onVerticalAlign: (alignment: VerticalAlignment) => void;
  onHorizontalAlign: (alignment: HorizontalAlignment) => void;
  showDistribute: boolean;
  onDistribute: (distribution: Distribution) => void;

  // rename
  showRenameDancer: boolean;
  onRenameDancer: () => void;
  showRenameProp: boolean;
  onRenameProp: () => void;

  // delete
  showDeleteObjects: boolean;
  onDeleteObjects: () => void;

  // actions
  onOpenActionManager: () => void;
  onAssignActions: () => void;
  isAssigningActionsEnabled: boolean;
  isAssigningActions: boolean;

  // section
  onRenameSection: () => void;
  onAddNoteToSection: () => void;
  canDeleteSection: boolean;
  onDeleteSection: () => void;
  onDuplicateSection: () => void;
};

export default function Toolbar({
  onAddDancer,
  isAddingDancer,
  onAddProp,
  isAddingProp,

  showSelectDancer,
  onSelectColor,
  onSelectType,
  showChangeColour,
  onChangeColor,

  showCopyPosition,
  onCopyPosition,
  showPastePosition,
  onPastePosition,
  showSwapPosition,
  onSwapPosition,

  showArrange,
  onVerticalAlign,
  onHorizontalAlign,
  showDistribute,
  onDistribute,

  showRenameDancer,
  onRenameDancer,
  showRenameProp,
  onRenameProp,

  showDeleteObjects,
  onDeleteObjects,

  onOpenActionManager,
  onAssignActions,
  isAssigningActionsEnabled,
  isAssigningActions,

  onRenameSection,
  onAddNoteToSection,
  canDeleteSection,
  onDeleteSection,
  onDuplicateSection,
}: ToolbarProps) {
  const [isAddManagerVisible, setIsAddManagerVisible] = useState<boolean>(false);
  const [isArrangeVisible, setIsArrangeVisible] = useState<boolean>(false);
  const [isActionManagerVisible, setIsActionManagerVisible] = useState<boolean>(false);
  const [isSectionManagerVisible, setIsSectionManagerVisible] = useState<boolean>(false);

  const isSubmenuOpen = isAddManagerVisible || isArrangeVisible || isActionManagerVisible || isSectionManagerVisible;
  const areSelectionActionsActivated = showRenameDancer || showArrange || showDeleteObjects;

  useEffect(() => {
    if (showArrange && isArrangeVisible) {
      setIsArrangeVisible(false);
    }
  }, [showArrange]);

   useEffect(() => {
    if (areSelectionActionsActivated && isAddManagerVisible) {
      setIsAddManagerVisible(false);
    }
   }, [areSelectionActionsActivated]);

  return <div className="flex items-center w-screen gap-2 px-4 pt-4 pb-8 overflow-scroll border-t-2 border-primary">
    {
      !isSubmenuOpen &&
      <>
        {
          !areSelectionActionsActivated && <>
            <IconButton src={ICON.add} label="追加" onClick={()=>{setIsAddManagerVisible(true)}}/>
            <IconButton src={ICON.gridOn} label="セクション" onClick={()=>{setIsSectionManagerVisible(true)}}/>
            <IconButton src={ICON[123]} label="カウント" onClick={()=>{setIsActionManagerVisible(true)}}/>
          </>
        }
        {showRenameDancer && <IconButton src={ICON.textFieldsAlt} label="名前変更" onClick={() => {onRenameDancer()}} />}
        {showRenameProp && <IconButton src={ICON.textFieldsAlt} label="名前変更" onClick={() => {onRenameProp()}} />}
        {showArrange && <IconButton src={ICON.straighten} label="整理" onClick={()=>{setIsArrangeVisible(true)}}/>}
        {showChangeColour && <IconButton src={ICON.colors} label="色" onClick={() => {onChangeColor()}} />}
        {showCopyPosition && <IconButton src={ICON.contentCopy} label="コピー" onClick={() => {onCopyPosition()}} />}
        {showPastePosition && <IconButton src={ICON.contentPaste} label="ペースト" onClick={() => {onPastePosition()}} />}
        {showSwapPosition && <IconButton src={ICON.swapHoriz} label="位置交換" onClick={() => {onSwapPosition()}} />}
        {showDeleteObjects && <IconButton src={ICON.delete} label="削除" onClick={()=>{onDeleteObjects()}}/>}
        <IconButton src={ICON.selectAll} label="全員選択" onClick={() => {onSelectType()}} />
        {showSelectDancer && <IconButton src={ICON.selectAll} label="同色選択" onClick={() => {onSelectColor()}} />}
      </>
    }
    {
      isSubmenuOpen && 
      <>
        <IconButton disabled={isAssigningActions || isAddingDancer || isAddingProp} src={ICON.chevronBackward} label="戻る" onClick={()=>{
          setIsArrangeVisible(false);
          setIsAddManagerVisible(false);
          setIsActionManagerVisible(false);
          setIsSectionManagerVisible(false);
        }}/>
        <VerticalDivider/>
        {
          isAddManagerVisible && 
          <>
            <IconButton
              src={isAddingDancer ? ICON.clear : ICON.person}
              disabled={isAddingProp}
              label="ダンサー"
              onClick={() => {onAddDancer()}} />
            <IconButton
              src={isAddingProp ? ICON.clear : ICON.flag}
              disabled={isAddingDancer}
              label="道具"
              onClick={() => {onAddProp()}} />
          </>
        }
        {
          isArrangeVisible && 
          <>
            <IconButton src={ICON.alignHorizontalLeft} label="左" onClick={() => {onHorizontalAlign("left")}} />
            <IconButton src={ICON.alignHorizontalCenter} label="横中" onClick={() => {onHorizontalAlign("centre")}} />
            <IconButton src={ICON.alignHorizontalRight} label="右" onClick={() => {onHorizontalAlign("right")}} />
            <VerticalDivider/>
            <IconButton src={ICON.alignVerticalTop} label="上" onClick={() => {onVerticalAlign("top")}} />
            <IconButton src={ICON.alignVerticalCenter} label="縦中" onClick={() => {onVerticalAlign("centre")}} />
            <IconButton src={ICON.alignVerticalBottom} label="下" onClick={() => {onVerticalAlign("bottom")}} />
            {
              showDistribute && <>
                <VerticalDivider/>
                <IconButton src={ICON.verticalDistribute} label="縦均" onClick={() => {onDistribute("y")}} />
                <IconButton src={ICON.horizontalDistribute} label="横均" onClick={() => {onDistribute("x")}} />
              </>
            }
          </>
        }
        {
          isSectionManagerVisible &&
          <>
            <IconButton
              src={ICON.textFieldsAlt}
              label="名前変更"
              onClick={() => {onRenameSection()}} />
            <IconButton
              src={ICON.speakerNotes}
              label="メモ"
              onClick={() => {onAddNoteToSection()}} />
            <IconButton
              src={ICON.contentCopy}
              label="複製"
              onClick={() => {onDuplicateSection()}} />
            {
              canDeleteSection &&
              <IconButton
                src={ICON.delete}
                onClick={() => {onDeleteSection()}}
                label="削除" />
            }
          </>
        }
        {
          isActionManagerVisible &&
          <>
            <IconButton
              disabled={isAssigningActions}
              src={ICON.category}
              label="管理" // todo: show how many actions?
              onClick={() => {onOpenActionManager()}} />
            <IconButton
              disabled={!isAssigningActionsEnabled}
              src={isAssigningActions ? ICON.clear : ICON.category}
              label="割当"
              onClick={() => {onAssignActions()}} />
          </>
        }
      </>
    }
  </div>
}