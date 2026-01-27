import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";

export default function ObjectToolbar (props: {
  swapPositions: () => void,
  isSwapVisible: boolean,
  openArrangeMenu: () => void,
  isArrangeVisible: boolean,
  openColorMenu: () => void,
  isColorVisible: boolean,
  openRenameMenu: () => void
  isRenameVisible: boolean,
}) {
  const isToolbarVisible = props.isArrangeVisible || props.isSwapVisible || props.isColorVisible || props.isRenameVisible;
  
  return <>
    { isToolbarVisible && 
      <div className="flex flex-row gap-2 p-2 w-fit">
        {
          props.isSwapVisible &&
          <IconButton
            src={ICON.switchAccessShortcut}
            alt="Swap positions"
            size="sm"
            onClick={props.swapPositions}
            />
        }
        {
          props.isArrangeVisible &&
          <IconButton
            src={ICON.horizontalDistributeBlack}
            alt="Arrange"
            size="sm"
            onClick={props.openArrangeMenu}
          />
        }
        {
          props.isRenameVisible &&
          <IconButton
            src={ICON.textFieldsAltBlack}
            alt="Color"
            size="sm"
            onClick={props.openRenameMenu}
            />
        }
        {
          props.isColorVisible &&
          <IconButton
            src={ICON.colorsBlack}
            alt="Color"
            size="sm"
            onClick={props.openColorMenu}
            />
        }
      </div>
    }
  </>
}