import { useEffect, useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import { colorPalette } from "../../lib/consts/colors";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import Button from "../basic/Button";

export type colourMode = "all" | "current" | "currentAndAfter";

type EditDancerColourDialogProps = {
  selectedObjectColour: string | undefined,
  propOnly: boolean,
  onSubmit: (colour: string, mode: colourMode) => void,
}

export default function EditDancerColourDialog({
  selectedObjectColour, propOnly, onSubmit
}: EditDancerColourDialogProps) {
  const [selectedColour, setSelectedColour] = useState("");
  const [mode, setMode] = useState<colourMode>("current");

  useEffect(() => {
    setSelectedColour(selectedObjectColour ?? "");
  }, [selectedObjectColour]);

  return <BaseEditDialog
    title="色"
    isActionButtonDisabled={isNullOrUndefinedOrBlank(selectedColour)}
    onClose={() => setSelectedColour(selectedObjectColour ?? "")}
    onSubmit={() => { onSubmit(selectedColour, mode) }}
    >
      {
        !propOnly &&
        <div>
          ダンサーの色変更範囲
          <div className="flex flex-col gap-2 mb-2 md:flex-row">
            <Button
              primary={mode === "current"}
              onClick={() => setMode("current")}>
              <span className="font-semibold">
                現在
              </span>
            </Button>
            <Button
              primary={mode === "currentAndAfter"}
              onClick={() => setMode("currentAndAfter")}>
              <span className="font-semibold">
                以後
              </span>
            </Button>
            <Button
              primary={mode === "all"}
              onClick={() => setMode("all")}>
              <span className="font-semibold">
                すべて
              </span>
            </Button>
          </div>
        </div>
      }
      <div className="grid grid-cols-6 gap-2 w-max">
        {
          colorPalette.allColors().map((color) => 
            <button
              key={color}
              onClick={() => {setSelectedColour(color)}}
              style={{"backgroundColor": color}}
              className={"rounded-full size-8 min-h-8 min-w-8 max-h-8 max-w-8 " + 
                (strEquals(color, selectedColour) ? "border-4 border-primary" : "")
              }/>
          )
        }
      </div>
  </BaseEditDialog>
}