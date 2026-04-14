import { useState } from "react";
import { ICON } from "../../lib/consts/consts";
import { getDate } from "../../lib/helpers/dateHelper";
import { Choreo } from "../../models/choreo";
import { Tag } from "../common/Tag";
import BaseEditDialog from "./BaseEditDialog";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";

type SelectChoreoDialogProps = {
  choreos: Choreo[],
  onSubmit: (choreo: Choreo) => void,
  currentChoreoId?: string,
}

export function SelectChoreoDialog({
  choreos, onSubmit, currentChoreoId
}: SelectChoreoDialogProps){
  const [selectedChoreoId, setSelectedChoreoId] = useState(currentChoreoId ?? choreos[0].id);
  return <BaseEditDialog
    title="選択"
    full
    onClose={() => setSelectedChoreoId(currentChoreoId ?? choreos[0].id)}
    onSubmit={() => onSubmit(choreos.find(c => strEquals(c.id, selectedChoreoId))!!)}>
    <div className="space-y-2 overflow-scroll">
      {
        choreos.map((c) => (
          <button
            key={c.id}
            className={"text-start w-full p-2 bg-white border rounded-lg " + (strEquals(c.id, selectedChoreoId) ? "bg-primary/15 " : "border-gray-400 ")}
            onClick={() => setSelectedChoreoId(c.id)}
            >
            <div className="flex justify-between">
              <p className="text-sm font-semibold text-primary">{isNullOrUndefinedOrBlank(c.event) ? "イベント不明" : c.event}</p>
              {
                c.version &&
                <Tag compact text={`v${c.version}`} icon={ICON.edit} type="primary"/>
              }
            </div>
            <p className="font-bold">{c.name}</p>
            {
              c.lastUpdated &&
              <p className="text-sm">{getDate(new Date(c.lastUpdated))}</p>
            }
          </button>
        ))
      }
    </div>
  </BaseEditDialog>
}