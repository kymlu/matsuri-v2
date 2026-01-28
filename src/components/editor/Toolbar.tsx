import { useState } from "react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import { VerticalDivider } from "../basic/Divider";
import { Distribution, HorizontalAlignment, VerticalAlignment } from "../../models/alignment";

type ToolbarProps = {
  onAddDancer: () => void,
  showCopyPosition?: boolean,
  onCopyPosition?: () => void,
  showPastePosition?: boolean,
  onPastePosition?: () => void,
  showSelectDancer?: boolean,
  onSelectColor?: () => void,
  onSelectType?: () => void,
  showDancerColor?: boolean,
  onChangeColor?: () => void,
  onVerticalAlign?: (alignment: VerticalAlignment) => void,
  onHorizontalAlign?: (alignment: HorizontalAlignment) => void,
  onDistribute?: (distribution: Distribution) => void,
  onSwapPosition?: () => void, // TODO
  onEditName?: () => void, // TODO
  onDeleteDancer?: () => void, // TODO
}

export default function Toolbar ({
  onAddDancer,
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
}: ToolbarProps) {
  const [isArrangeVisible, setIsArrangeVisible] = useState<boolean>(false);
  const [isColorVisible, setIsColorVisible] = useState<boolean>(false);
  const [isDancerManagerVisible, setIsDancerManagerVisible] = useState<boolean>(false);
  const [isActionManagerVisible, setIsActionManagerVisible] = useState<boolean>(false);
  const [isPropManagerVisible, setIsPropManagerVisible] = useState<boolean>(false);

  const isSubmenuOpen = isArrangeVisible || isColorVisible || isDancerManagerVisible || isActionManagerVisible || isPropManagerVisible;
  
  return <div className="flex items-center w-screen gap-2 px-2 py-4 overflow-scroll border-t-2 border-primary">
    {
      !isSubmenuOpen &&
      <>
        <IconButton src={ICON.personBlack} label="ダンサー" alt="Dancer Management" onClick={()=>{setIsDancerManagerVisible(true)}}/>
        <IconButton src={ICON.straightenBlack} label="整理" alt="Add" onClick={()=>{setIsArrangeVisible(true)}}/>
        <IconButton src={ICON.categoryBlack} label="カウント" alt="Add" onClick={()=>{setIsActionManagerVisible(true)}}/>
        <IconButton src={ICON.flagBlack} label="道具" alt="Props" onClick={()=>{setIsPropManagerVisible(true)}}/>
      </>
    }
    {
      isSubmenuOpen && 
      <>
        <IconButton src={ICON.chevronBackwardBlack} label="戻る" alt="Close submenu" onClick={()=>{
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
            <IconButton src={ICON.alignHorizontalLeftBlack} label="左" alt="Align Left" onClick={() => {onHorizontalAlign?.("left")}} />
            <IconButton src={ICON.alignHorizontalCenterBlack} label="横中" alt="Align Horizontal Center" onClick={() => {onHorizontalAlign?.("centre")}} />
            <IconButton src={ICON.alignHorizontalRightBlack} label="右" alt="Align Right" onClick={() => {onHorizontalAlign?.("right")}} />
            <VerticalDivider/>
            <IconButton src={ICON.alignVerticalTopBlack} label="上" alt="Align Top" onClick={() => {onVerticalAlign?.("top")}} />
            <IconButton src={ICON.alignVerticalCenterBlack} label="縦中" alt="Align Vertical Center" onClick={() => {onVerticalAlign?.("centre")}} />
            <IconButton src={ICON.alignVerticalBottomBlack} label="下" alt="Align Bottom" onClick={() => {onVerticalAlign?.("bottom")}} />
            <VerticalDivider/>
            <IconButton src={ICON.verticalDistributeBlack} label="縦均" alt="Distribute Vertically" onClick={() => {onDistribute?.("y")}} />
            <IconButton src={ICON.horizontalDistributeBlack} label="横均" alt="Distribute Horizontally" onClick={() => {onDistribute?.("x")}} />
          </>
        }
        {
          isDancerManagerVisible &&
          <>
            <IconButton src={ICON.personAddBlack} label="追加" alt="Add dancer" onClick={() => {onAddDancer()}} />
            <IconButton disabled={!showDancerColor} src={ICON.colorsBlack} label="色" alt="Change colours" onClick={() => {onChangeColor?.()}} />
            <IconButton src={ICON.selectAllBlack} label="全選択" alt="Select all" onClick={() => {onSelectType?.()}} />
            <IconButton disabled={!showSelectDancer} src={ICON.selectAllBlack} label="色選択" alt="Select colour" onClick={() => {onSelectColor?.()}} />
            <IconButton src={ICON.contentCopyBlack} disabled={!showCopyPosition} label="コピー" alt="Copy" onClick={() => {onCopyPosition?.()}} />
            <IconButton src={ICON.contentPasteBlack} disabled={!showPastePosition} label="ペースト" alt="Paste" onClick={() => {onPastePosition?.()}} />
          </>
        }
        {
          isPropManagerVisible &&
          <>
            <IconButton src={ICON.verticalDistributeBlack} label="Add prop etc" alt="Distribute Vertically" onClick={() => {}} />
            <IconButton src={ICON.verticalDistributeBlack} label="縦均" alt="Distribute Vertically" onClick={() => {}} />
            <IconButton src={ICON.verticalDistributeBlack} label="縦均" alt="Distribute Vertically" onClick={() => {}} />
          </>
        }
        {
          isActionManagerVisible &&
          <>
            <IconButton src={ICON.verticalDistributeBlack} label="Actions etc" alt="Distribute Vertically" onClick={() => {}} />
            <IconButton src={ICON.verticalDistributeBlack} label="縦均" alt="Distribute Vertically" onClick={() => {}} />
            <IconButton src={ICON.verticalDistributeBlack} label="縦均" alt="Distribute Vertically" onClick={() => {}} />
          </>
        }
      </>
    }
  </div>
}