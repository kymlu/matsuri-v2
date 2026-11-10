import classNames from "classnames";
import { colorPalette } from "../../lib/consts/colors";

type ColorSwatchGridProps = {
  value?: string,
  onChange: (color: string) => void,
  label?: string, // for screen readers
}

const isSame = (a?: string, b?: string) => a !== undefined && b !== undefined && a.toLowerCase() === b.toLowerCase();

// The colour palette as a 6-column grid. Each swatch previews text (文) in the colour that reads on it,
// and the selected one has an outline.
export default function ColorSwatchGrid({ value, onChange, label = "色" }: ColorSwatchGridProps) {
  return <div role="radiogroup" aria-label={label} className="grid grid-cols-6 gap-2 p-1 w-max">
    {
      colorPalette.gridObjectColors().map(color => {
        const isSelected = isSame(color, value);
        return <button
          key={color}
          type="button"
          role="radio"
          aria-checked={isSelected}
          aria-label={color}
          onClick={() => onChange(color)}
          style={{ backgroundColor: color, color: colorPalette.textContrast[color] }}
          className={classNames("font-semibold rounded-full size-8 min-h-8 min-w-8 max-h-8 max-w-8", {
            "ring-2 ring-primary ring-offset-2 ring-offset-surface": isSelected,
          })}>
          文
        </button>
      })
    }
  </div>
}
