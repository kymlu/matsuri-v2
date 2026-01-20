import { useState } from "react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import { VerticalDivider } from "../basic/Divider";
import { colorPalette } from "../../lib/consts/colors";

export default function Toolbar () {
  const [isArrangeVisible, setIsArrangeVisible] = useState<boolean>(false);
  const [isColorVisible, setIsColorVisible] = useState<boolean>(false);
  const isSubmenuOpen = isArrangeVisible || isColorVisible;
  return <div className="flex items-center w-screen gap-2 px-2 py-4 overflow-scroll border-t-2 border-primary">
    {
      !isSubmenuOpen &&
      <>
        <IconButton src={ICON.addBlack} label="踊り子管理" alt="Add" onClick={()=>{}}/>
        <IconButton src={ICON.chevronBackwardBlack} label="前へ" alt="Add" onClick={()=>{}}/>
        <IconButton src={ICON.chevronForwardBlack} label="次へ" alt="Add" onClick={()=>{}}/>
        <IconButton src={ICON.addBlack} label="整理" alt="Add" onClick={()=>{setIsArrangeVisible(true)}}/>
        <IconButton src={ICON.colorsBlack} label="色" alt="Add" onClick={()=>{setIsColorVisible(true)}}/>
        <IconButton src={ICON.categoryBlack} label="カウント" alt="Add" onClick={()=>{}}/>
        <IconButton src={ICON.addBlack} label="踊り子管理" alt="Add" onClick={()=>{}}/>
      </>
    }
    {
      isSubmenuOpen && 
      <>
        <IconButton src={ICON.chevronBackwardBlack} label="戻る" alt="Close submenu" onClick={()=>{
          setIsArrangeVisible(false);
          setIsColorVisible(false);
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
      </>
    }
  </div>
}