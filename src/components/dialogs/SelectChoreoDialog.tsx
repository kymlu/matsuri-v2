import { useState } from "react";
import { ICON } from "../../lib/consts/consts";
import { getDate } from "../../lib/helpers/dateHelper";
import { Choreo } from "../../models/choreo";
import { Tag } from "../common/Tag";
import BaseEditDialog from "./BaseEditDialog";

type SelectChoreoDialogProps = {
  choreos: Choreo[],
  onSubmit: (choreo: Choreo) => void,
  currentChoreoId?: string,
}

export function SelectChoreoDialog({
  choreos, onSubmit, currentChoreoId
}: SelectChoreoDialogProps){
  const [selectedChoreoId, setSelectedChoreoId] = useState(currentChoreoId ?? choreos[0]);
  // todo:
  // - select a choreo
  // - on submit
  return <BaseEditDialog
    title="選択"
    onSubmit={() => onSubmit(choreos[0])}>
    <div className="max-h-[70svh] space-y-2 overflow-scroll">
      {
        choreos.map((c) => (
          <div key={c.id} className="p-2 bg-white border rounded-lg border-primary">
            <p className="text-sm font-semibold text-primary">{c.event}</p>
            <p className="font-bold">{c.name}</p>
            {
              c.lastUpdated &&
              <div>
                <p className="text-sm">{getDate(new Date(c.lastUpdated))}</p>
                {
                  c.version &&
                  <Tag text={`v${c.version}`} icon={ICON.edit} type="primary"/>
                }
              </div>
            }
          </div>
        ))
      }
    </div>
  </BaseEditDialog>
}