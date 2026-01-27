import { useState } from "react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import { VerticalDivider } from "../basic/Divider";
import { colorPalette } from "../../lib/consts/colors";

type ToolbarProps = {
  onAddDancer: () => void,
  onCopyPosition?: () => void, // TODO
  onPastePosition?: () => void, // TODO
  onChangeColor?: () => void, // TODO
  onSwapPosition?: () => void, // TODO
  onSelectColor?: () => void, // TODO
  onSelectDancers?: () => void, // TODO
  onEditName?: () => void, // TODO
  onDeleteDancer?: () => void, // TODO
}

export default function Toolbar ({
  onAddDancer,
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
        <IconButton src={ICON.personBlack} label="踊り子" alt="Dancer Management" onClick={()=>{setIsDancerManagerVisible(true)}}/>
        <IconButton src={ICON.chevronBackwardBlack} label="前へ" alt="Add" onClick={()=>{}}/>
        <IconButton src={ICON.chevronForwardBlack} label="次へ" alt="Add" onClick={()=>{}}/>
        <IconButton src={ICON.addBlack} label="整理" alt="Add" onClick={()=>{setIsArrangeVisible(true)}}/>
        <IconButton src={ICON.colorsBlack} label="色" alt="Add" onClick={()=>{setIsColorVisible(true)}}/>
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
            <IconButton src={ICON.alignHorizontalLeftBlack} label="左" alt="Align Left" onClick={() => {}} />
            <IconButton src={ICON.alignHorizontalCenterBlack} label="横中" alt="Align Horizontal Center" onClick={() => {}} />
            <IconButton src={ICON.alignHorizontalRightBlack} label="右" alt="Align Right" onClick={() => {}} />
            <VerticalDivider/>
            <IconButton src={ICON.alignVerticalTopBlack} label="上" alt="Align Top" onClick={() => {}} />
            <IconButton src={ICON.alignVerticalCenterBlack} label="縦中" alt="Align Vertical Center" onClick={() => {}} />
            <IconButton src={ICON.alignVerticalBottomBlack} label="下" alt="Align Bottom" onClick={() => {}} />
            <VerticalDivider/>
            <IconButton src={ICON.verticalDistributeBlack} label="縦均" alt="Distribute Vertically" onClick={() => {}} />
            <IconButton src={ICON.horizontalDistributeBlack} label="横均" alt="Distribute Horizontally" onClick={() => {}} />
          </>
        }
        {
          isColorVisible && 
          <>
            {
              colorPalette.allColors().map((color) => 
                <button style={{"backgroundColor": color}} className="rounded-full size-8 min-h-8 min-w-8"/>
              )
            }
          </>
        }
        {
          isDancerManagerVisible &&
          <>
            <IconButton src={ICON.personAddBlack} label="追加" alt="Distribute Vertically" onClick={() => {onAddDancer()}} />
            <IconButton src={ICON.verticalDistributeBlack} label="縦均" alt="Distribute Vertically" onClick={() => {}} />
            <IconButton src={ICON.verticalDistributeBlack} label="縦均" alt="Distribute Vertically" onClick={() => {}} />
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