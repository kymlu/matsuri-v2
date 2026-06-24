import IconButton from "../basic/IconButton";

type UndoRedoToolbarProps = {
  undo: () => void;
  redo: () => void;
  undoCount: number;
  redoCount: number;
};

export default function UndoRedoToolbar({
  undo,
  redo,
  undoCount,
  redoCount,
}: UndoRedoToolbarProps) {
  return <div className="flex flex-row gap-2 p-2 w-fit">
    <IconButton
      src="undo"
      size="sm"
      onClick={undo}
      disabled={undoCount === 0}
      />
    <IconButton
      src="redo"
      size="sm"
      onClick={redo}
      disabled={redoCount === 0}
      />
  </div>
}