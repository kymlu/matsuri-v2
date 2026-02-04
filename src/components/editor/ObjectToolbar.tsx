import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";

export default function ObjectToolbar (props: {
  swapPositions: () => void,
  isSwapVisible: boolean,
  openColorMenu: () => void,
  isColorVisible: boolean,
  openRenameMenu: () => void
  isRenameVisible: boolean,
}) {
  const isToolbarVisible = props.isSwapVisible || props.isColorVisible || props.isRenameVisible;
  
  return <>
    {
      isToolbarVisible && 
      <div className="flex flex-row gap-2 p-2 w-fit">
        {
          props.isSwapVisible &&
          <IconButton
            src={ICON.swapHoriz}
            size="sm"
            onClick={props.swapPositions}
            />
        }
        {
          props.isRenameVisible &&
          <IconButton
            src={ICON.textFieldsAlt}
            size="sm"
            onClick={props.openRenameMenu}
            />
        }
        {
          props.isColorVisible &&
          <IconButton
            src={ICON.colors}
            size="sm"
            onClick={props.openColorMenu}
            />
        }
      </div>
    }
  </>
}