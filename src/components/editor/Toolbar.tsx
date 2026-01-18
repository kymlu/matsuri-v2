import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";

export default function Toolbar () {
  return <div className=" flex gap-2  w-screen overflow-scroll py-4 px-2 border-t-2 border-primary">
    <IconButton src={ICON.addBlack} alt="Add" onClick={()=>{}}/>
    <IconButton src={ICON.chevronBackwardBlack} label="前へ" alt="Add" onClick={()=>{}}/>
    <IconButton src={ICON.chevronForwardBlack} label="次へ" alt="Add" onClick={()=>{}}/>
    <IconButton src={ICON.addBlack} alt="Add" onClick={()=>{}}/>
    <IconButton src={ICON.addBlack} alt="Add" onClick={()=>{}}/>
    <IconButton src={ICON.addBlack} alt="Add" onClick={()=>{}}/>
    <IconButton src={ICON.addBlack} alt="Add" onClick={()=>{}}/>
  </div>
}