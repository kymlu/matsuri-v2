import { useEffect, useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import { colorPalette } from "../../lib/consts/colors";
import { strEquals } from "../../lib/helpers/globalHelper";
import { ActionButton } from "../basic/Button";

type colourMode = "all" | "current" | "currentAndAfter";

export default function EditDancerColourDialog(props: {
  dancerIds: string[],
  colours: string[],
  onSubmit: (colour: string, mode: colourMode) => void,
}) {
  const [selectedColour, setSelectedColour] = useState("");
  const [mode, setMode] = useState<colourMode>("current");

  useEffect(() => {
    if (props.colours.length !== 1)
    setSelectedColour(props.colours.length === 1 ? props.colours[0] : "");
  }, [props.colours, props.dancerIds]);

  return <BaseEditDialog
    title="踊り子色変更"
    onSubmit={() => { props.onSubmit(selectedColour, mode) }}
    >
      <div className="flex gap-2 mb-2">
        <ActionButton
          primary={mode == "current"}
          onClick={() => setMode("current")}>
          現在
        </ActionButton>
        <ActionButton
          primary={mode == "currentAndAfter"}
          onClick={() => setMode("currentAndAfter")}>
          以後
        </ActionButton>
        <ActionButton
          primary={mode == "all"}
          onClick={() => setMode("all")}>
          すべて
        </ActionButton>
      </div>
      <div className="grid grid-cols-6 gap-2">
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