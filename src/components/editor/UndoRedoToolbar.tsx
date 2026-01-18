import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";

export default function UndoRedoToolbar (props: {
  undo: () => void,
  redo: () => void,
  undoCount: number,
  redoCount: number,
}) {
  return <div className="flex flex-row gap-2 p-2">
    <IconButton
      src={ICON.undoBlack}
      alt="Undo"
      size="sm"
      onClick={props.undo}
      disabled={props.undoCount === 0}
      />
    <IconButton
      src={ICON.redoBlack}
      alt="Redo"
      size="sm"
      onClick={props.redo}
      disabled={props.redoCount === 0}
      />
  </div>
}