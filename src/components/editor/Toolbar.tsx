import { useEffect, useState } from "react";
import IconButton from "../basic/IconButton";
import { VerticalDivider } from "../basic/Divider";
import { Distribution, HorizontalAlignment, Rearrangement, VerticalAlignment } from "../../models/alignment";

type ToolbarProps = {
  // add
  onAddDancer: () => void;
  isAddingDancer: boolean;
  onAddProp: () => void;
  isAddingProp: boolean;
  onAddObstacle: () => void;
  isAddingObstacle: boolean;

  // selection / attributes
  showSelectDancer: boolean;
  onSelectColor: () => void;
  onSelectType: (selectDancers: boolean, selectProps: boolean) => void;
  showSelectDancersButton: boolean;
  showSelectPropsButton: boolean;
  showSelectAllButton: boolean;
  onDeselect: () => void;

  // colour
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
  onRearrange: (rearrangement: Rearrangement) => void;
  onVerticalAlign: (alignment: VerticalAlignment) => void;
  onHorizontalAlign: (alignment: HorizontalAlignment) => void;
  showDistribute: boolean;
  onDistribute: (distribution: Distribution) => void;

  // rename
  showRenameDancer: boolean;
  onRenameDancer: () => void;
  showRenameProp: boolean;
  onRenameProp: () => void;
  showRenameObstacle: boolean;
  onRenameObstacle: () => void;

  // delete
  showDeleteObjects: boolean;
  onDeleteObjects: () => void;

  // actions
  onOpenActionManager: () => void;
  onAssignActions: () => void;
  isAssigningActionsEnabled: boolean;
  isAssigningActions: boolean;

  // obstacles
  showDuplicateObstacle: boolean;
  onDuplicateObstacle: () => void;
  showLockObstacle: boolean;
  onToggleObstacleLock: () => void;
  areObstaclesLocked: boolean;

  // props
  onToggleResizePropsLock: () => void;
  isResizePropsLocked: boolean;
  showLockResizeProps: boolean;
};

export default function Toolbar({
  onAddDancer,
  isAddingDancer,
  onAddProp,
  isAddingProp,
  onAddObstacle,
  isAddingObstacle,

  showSelectDancer,
  onSelectColor,
  onSelectType,
  showSelectDancersButton,
  showSelectPropsButton,
  showSelectAllButton,
  onDeselect,

  showChangeColour,
  onChangeColor,

  showCopyPosition,
  onCopyPosition,
  showPastePosition,
  onPastePosition,
  showSwapPosition,
  onSwapPosition,

  showArrange,
  onRearrange,
  onVerticalAlign,
  onHorizontalAlign,
  showDistribute,
  onDistribute,

  showRenameDancer,
  onRenameDancer,
  showRenameProp,
  onRenameProp,
  showRenameObstacle,
  onRenameObstacle,

  showDeleteObjects,
  onDeleteObjects,

  onOpenActionManager,
  onAssignActions,
  isAssigningActionsEnabled,
  isAssigningActions,

  showDuplicateObstacle,
  onDuplicateObstacle,
  showLockObstacle,
  onToggleObstacleLock,
  areObstaclesLocked,

  onToggleResizePropsLock,
  isResizePropsLocked,
  showLockResizeProps,
}: ToolbarProps) {
  const [isAddManagerVisible, setIsAddManagerVisible] = useState<boolean>(false);
  const [isArrangeVisible, setIsArrangeVisible] = useState<boolean>(false);
  const [isActionManagerVisible, setIsActionManagerVisible] = useState<boolean>(false);

  const isSubmenuOpen = isAddManagerVisible || isArrangeVisible || isActionManagerVisible;
  const areSelectionActionsActivated = showRenameDancer || showArrange || showDeleteObjects;
  const showResizeLock = !areSelectionActionsActivated || showLockResizeProps;

  useEffect(() => {
    if (!showArrange && isArrangeVisible) {
      setIsArrangeVisible(false);
    }
  }, [showArrange]);

   useEffect(() => {
    if (areSelectionActionsActivated && isAddManagerVisible) {
      setIsAddManagerVisible(false);
    }
   }, [areSelectionActionsActivated]);

  return <div className="z-10 flex items-center w-screen gap-2 px-4 pt-4 pb-8 overflow-y-auto bg-white border-t-2 border-gray-400">
    {
      !isSubmenuOpen &&
      <>
        {
          !areSelectionActionsActivated && <>
            <IconButton src="add" label="追加" onClick={()=>{setIsAddManagerVisible(true)}}/>
            <IconButton src="123" label="カウント" onClick={()=>{setIsActionManagerVisible(true)}}/>
          </>
        }
        {
          areSelectionActionsActivated && 
          <>
            <IconButton src="deselect" label="選択解除" onClick={() => {onDeselect()}} />
            <VerticalDivider/>
          </>
        }
        {showRenameDancer && <IconButton src="textFieldsAlt" label="名前変更" onClick={() => {onRenameDancer()}} />}
        {showRenameProp && <IconButton src="textFieldsAlt" label="名前変更" onClick={() => {onRenameProp()}} />}
        {showRenameObstacle && <IconButton src="textFieldsAlt" label="名前変更" onClick={() => {onRenameObstacle()}} />}
        {showArrange && <IconButton src="straighten" label="整理" onClick={()=>{setIsArrangeVisible(true)}}/>}
        {showChangeColour && <IconButton src="colors" label="色" onClick={() => {onChangeColor()}} />}
        {showCopyPosition && <IconButton src="contentCopy" label="位置コピー" onClick={() => {onCopyPosition()}} />}
        {showPastePosition && <IconButton src="contentPaste" label="位置ペースト" onClick={() => {onPastePosition()}} />}
        {showSwapPosition && <IconButton src="swapHoriz" label="位置交換" onClick={() => {onSwapPosition()}} />}
        {showDuplicateObstacle && <IconButton src="contentCopy" label="複製" onClick={() => {onDuplicateObstacle()}} />}
        {showDeleteObjects && <IconButton src="delete" label="削除" onClick={()=>{onDeleteObjects()}}/>}
        {showSelectDancer && showSelectDancersButton && <IconButton src="select" subIconSrc="colors" label="同色選択" onClick={() => {onSelectColor()}} />}
        {showSelectDancersButton && <IconButton src="select" subIconSrc="person" label="全員選択" onClick={() => {onSelectType(true,  false)}} />}
        {showSelectPropsButton && <IconButton src="select" subIconSrc="flag" label="道具選択" onClick={() => {onSelectType(false, true)}} />}
        {showSelectAllButton && <IconButton src="selectAll" label="全部選択" onClick={() => {onSelectType(true, true)}} />}
        {
          showResizeLock && 
          <IconButton src={isResizePropsLocked ? "lockOpenRight" : "lock"} label="道具リサイズ" onClick={() => onToggleResizePropsLock()}/>
        }
        {
          !areSelectionActionsActivated && <>
            {showLockObstacle && <IconButton src={areObstaclesLocked ? "lockOpenRight" : "lock"} label={ areObstaclesLocked ? "障害物解除" : "障害物固定"} onClick={() => onToggleObstacleLock()} />}
          </>
        }
      </>
    }
    {
      isSubmenuOpen && 
      <>
        <IconButton disabled={isAssigningActions || isAddingDancer || isAddingProp || isAddingObstacle} src="chevronBackward" label="戻る" onClick={()=>{
          setIsArrangeVisible(false);
          setIsAddManagerVisible(false);
          setIsActionManagerVisible(false);
        }}/>
        <VerticalDivider/>
        {
          isAddManagerVisible && 
          <>
            <IconButton
              src={isAddingDancer ? "clear" : "person"}
              disabled={isAddingProp || isAddingObstacle}
              label="ダンサー"
              onClick={() => {onAddDancer()}} />
            <IconButton
              src={isAddingProp ? "clear" : "flag"}
              disabled={isAddingDancer || isAddingObstacle}
              label="道具"
              onClick={() => {onAddProp()}} />
            <IconButton
              src={isAddingObstacle ? "clear" : "emergencyHome"}
              disabled={isAddingDancer || isAddingProp}
              label="障害物"
              onClick={() => {onAddObstacle()}} />
          </>
        }
        {
          isArrangeVisible && 
          <>
            <IconButton imgSrc={"moveToFront"} label="最前面へ" onClick={() => {onRearrange("toFront")}} />
            <IconButton imgSrc={"moveForward"} label="前面へ" onClick={() => {onRearrange("forward")}} />
            <IconButton imgSrc={"moveBackward"} label="背面へ" onClick={() => {onRearrange("backward")}} />
            <IconButton imgSrc={"moveToBack"} label="最背面へ" onClick={() => {onRearrange("toBack")}} />
            <VerticalDivider/>
            <IconButton src="alignHorizontalLeft" label="左" onClick={() => {onHorizontalAlign("left")}} />
            <IconButton src="alignHorizontalCenter" label="横中" onClick={() => {onHorizontalAlign("centre")}} />
            <IconButton src="alignHorizontalRight" label="右" onClick={() => {onHorizontalAlign("right")}} />
            <VerticalDivider/>
            <IconButton src="alignVerticalTop" label="上" onClick={() => {onVerticalAlign("top")}} />
            <IconButton src="alignVerticalCenter" label="縦中" onClick={() => {onVerticalAlign("centre")}} />
            <IconButton src="alignVerticalBottom" label="下" onClick={() => {onVerticalAlign("bottom")}} />
            {
              showDistribute && <>
                <VerticalDivider/>
                <IconButton src="verticalDistribute" label="縦均" onClick={() => {onDistribute("y")}} />
                <IconButton src="horizontalDistribute" label="横均" onClick={() => {onDistribute("x")}} />
              </>
            }
          </>
        }
        {
          isActionManagerVisible &&
          <>
            <IconButton
              disabled={isAssigningActions}
              src="category"
              label="管理" // todo: show how many actions?
              onClick={() => {onOpenActionManager()}} />
            <IconButton
              disabled={!isAssigningActionsEnabled}
              src={isAssigningActions ? "clear" : "category"}
              label="割当"
              onClick={() => {onAssignActions()}} />
          </>
        }
      </>
    }
  </div>
}