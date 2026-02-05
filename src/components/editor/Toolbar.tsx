import { useState } from "react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import { VerticalDivider } from "../basic/Divider";
import { Distribution, HorizontalAlignment, VerticalAlignment } from "../../models/alignment";

type ToolbarProps = {
  onAddDancer: () => void,
  isAddingDancer: boolean,
  showCopyPosition: boolean,
  onCopyPosition: () => void,
  showPastePosition: boolean,
  onPastePosition: () => void,
  showSelectDancer: boolean,
  onSelectColor: () => void,
  onSelectType: () => void,
  showDancerColor: boolean,
  onChangeColor: () => void,
  showArrange: boolean,
  onVerticalAlign: (alignment: VerticalAlignment) => void,
  onHorizontalAlign: (alignment: HorizontalAlignment) => void,
  onDistribute: (distribution: Distribution) => void,
  showSwapPosition: boolean,
  onSwapPosition: () => void,
  onEditName?: () => void, // TODO
  showDeleteDancer: boolean,
  onDeleteDancer: () => void,
  onOpenActionManager: () => void,
  onAssignActions: () => void,
  isAssigningActionsEnabled: boolean,
  isAssigningActions: boolean,
}

export default function Toolbar ({
  onAddDancer,
  isAddingDancer,
  showDancerColor,
  showSelectDancer,
  onChangeColor,
  onSelectColor,
  onSelectType,
  showCopyPosition,
  onCopyPosition,
  showPastePosition,
  onPastePosition,
  onVerticalAlign,
  onHorizontalAlign,
  onDistribute,
  showArrange,
  showDeleteDancer,
  onDeleteDancer,
  showSwapPosition,
  onSwapPosition,
  onOpenActionManager,
  onAssignActions,
  isAssigningActionsEnabled,
  isAssigningActions,
}: ToolbarProps) {
  const [isArrangeVisible, setIsArrangeVisible] = useState<boolean>(false);
  const [isColorVisible, setIsColorVisible] = useState<boolean>(false);
  const [isDancerManagerVisible, setIsDancerManagerVisible] = useState<boolean>(false);
  const [isActionManagerVisible, setIsActionManagerVisible] = useState<boolean>(false);
  const [isPropManagerVisible, setIsPropManagerVisible] = useState<boolean>(false);

  const isSubmenuOpen = isArrangeVisible || isColorVisible || isDancerManagerVisible || isActionManagerVisible || isPropManagerVisible;
  
  return <div className="flex items-center w-screen gap-2 px-4 pt-4 pb-8 overflow-scroll border-t-2 border-primary">
    {
      !isSubmenuOpen &&
      <>
        <IconButton src={ICON.person} label="ダンサー" onClick={()=>{setIsDancerManagerVisible(true)}}/>
        <IconButton src={ICON.straighten} disabled={showArrange} label="整理" onClick={()=>{setIsArrangeVisible(true)}}/>
        <IconButton src={ICON.category} label="カウント" onClick={()=>{setIsActionManagerVisible(true)}}/>
        {/* <IconButton src={ICON.flagBlack} label="道具" alt="Props" onClick={()=>{setIsPropManagerVisible(true)}}/> */}
      </>
    }
    {
      isSubmenuOpen && 
      <>
        <IconButton disabled={isAssigningActions || isAddingDancer} src={ICON.chevronBackward} label="戻る" onClick={()=>{
          setIsArrangeVisible(false);
          setIsColorVisible(false);
          setIsActionManagerVisible(false);
          setIsDancerManagerVisible(false);
          setIsPropManagerVisible(false);
        }}/>
        <VerticalDivider/>
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
            <VerticalDivider/>
            <IconButton src={ICON.verticalDistribute} label="縦均" onClick={() => {onDistribute("y")}} />
            <IconButton src={ICON.horizontalDistribute} label="横均" onClick={() => {onDistribute("x")}} />
          </>
        }
        {
          isDancerManagerVisible &&
          <>
            <IconButton src={isAddingDancer ? ICON.clear : ICON.person} label="追加" onClick={() => {onAddDancer()}} />
            <IconButton disabled={!showDancerColor || isAddingDancer} src={ICON.colors} label="色" onClick={() => {onChangeColor()}} />
            <IconButton disabled={isAddingDancer} src={ICON.selectAll} label="全選択" onClick={() => {onSelectType()}} />
            <IconButton disabled={!showSelectDancer} src={ICON.selectAll} label="色選択" onClick={() => {onSelectColor()}} />
            <IconButton src={ICON.contentCopy} disabled={!showCopyPosition || isAddingDancer} label="コピー" onClick={() => {onCopyPosition()}} />
            <IconButton src={ICON.contentPaste} disabled={!showPastePosition || isAddingDancer} label="ペースト" onClick={() => {onPastePosition()}} />
            <IconButton src={ICON.swapHoriz} disabled={!showSwapPosition || isAddingDancer} label="位置交換" onClick={() => {onSwapPosition()}} />
            <IconButton src={ICON.delete} disabled={!showDeleteDancer || isAddingDancer} label="削除" onClick={() => {onDeleteDancer()}} />
          </>
        }
        {
          isPropManagerVisible &&
          <>
            <IconButton src={ICON.verticalDistribute} label="Add prop etc" onClick={() => {}} />
            <IconButton src={ICON.verticalDistribute} label="縦均" onClick={() => {}} />
            <IconButton src={ICON.verticalDistribute} label="縦均" onClick={() => {}} />
          </>
        }
        {
          isActionManagerVisible &&
          <>
            <IconButton
              disabled={isAssigningActions}
              src={ICON.category}
              label="管理"
              onClick={() => {onOpenActionManager()}} />
            <IconButton
              disabled={!isAssigningActionsEnabled}
              src={isAssigningActions ? ICON.clear : ICON.category}
              label="割り当て"
              onClick={() => {onAssignActions()}} />
          </>
        }
      </>
    }
  </div>
}