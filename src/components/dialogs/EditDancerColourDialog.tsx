import { useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import { colorPalette } from "../../lib/consts/colors";
import { strEquals } from "../../lib/helpers/globalHelper";
import { ActionButton } from "../basic/Button";

export type colourMode = "all" | "current" | "currentAndAfter";

export default function EditDancerColourDialog(props: {
  propOnly: boolean,
  onSubmit: (colour: string, mode: colourMode) => void,
}) {
  const {propOnly, onSubmit} = props;
  const [selectedColour, setSelectedColour] = useState("");
  const [mode, setMode] = useState<colourMode>("current");

  return <BaseEditDialog
    title="色"
    onSubmit={() => { onSubmit(selectedColour, mode) }}
    >
      {
        !propOnly &&
        <div>
          ダンサーの色変更範囲
          <div className="flex flex-col gap-2 mb-2 md:flex-row">
            <ActionButton
              primary={mode === "current"}
              onClick={() => setMode("current")}>
              現在
            </ActionButton>
            <ActionButton
              primary={mode === "currentAndAfter"}
              onClick={() => setMode("currentAndAfter")}>
              以後
            </ActionButton>
            <ActionButton
              primary={mode === "all"}
              onClick={() => setMode("all")}>
              すべて
            </ActionButton>
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
                (strEquals(color, selectedColour) ? "border-2 border-primary" : "")
              }/>
          )
        }
      </div>
  </BaseEditDialog>
}