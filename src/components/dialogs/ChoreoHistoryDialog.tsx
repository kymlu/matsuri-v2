import { useEffect, useState } from "react"
import BaseErrorDialog from "./BaseErrorDialog"
import { getChoreoHistory, getPublicChoreoHistory } from "../../lib/helpers/apiHelper";
import { ChoreoVersion } from "../../models/choreo";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { getJpDate } from "../../lib/helpers/dateHelper";
import CustomDialog from "../basic/CustomDialog";
import { Tag } from "../common/Tag";

type ChoreoHistoryDialogProps = {
  teamId: string,
  choreoId: string,
  isLoggedIn: boolean,
  onClose: () => void
}

export function ChoreoHistoryDialog({
  teamId, choreoId, isLoggedIn, onClose
}: ChoreoHistoryDialogProps) {
  const [history, setHistory] = useState<ChoreoVersion[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      let results: ChoreoVersion[] = [];
      if (!isNullOrUndefinedOrBlank(teamId) && !isNullOrUndefinedOrBlank(choreoId)) {
        if (isLoggedIn) {
          results = await getChoreoHistory(teamId, choreoId);
        } else {
          results = await getPublicChoreoHistory(teamId, choreoId);
        }
      }
      setHistory(results.sort((a, b) => b.version - a.version));
    };

    fetchHistory();
  }, [teamId, choreoId, isLoggedIn]);

  return <CustomDialog title="公開履歴" onClose={onClose} hasX fullWidth>
    <div className="flex flex-col w-full gap-2">
      {
        history.map((h, i) => (
          <div key={h.version} className="flex items-start gap-3 p-3 border border-gray-400 rounded-lg">
            <Tag text={`v${h.version}`} type={i === 0 ? "filled" : "grey"} />
            <div className="flex flex-col flex-1 min-w-0">
              <div className="text-sm text-gray-600">
                {h.uploadedAt ? getJpDate(new Date(h.uploadedAt)) : ""}
              </div>
              {
                isLoggedIn &&
                <div className="text-sm">
                  {h.uploadedByName
                    ? `${h.uploadedByName}${h.uploadedByEmail ? `（${h.uploadedByEmail}）` : ""}`
                    : h.uploadedByEmail}
                </div>
              }
            </div>
          </div>
        ))
      }
    </div>
  </CustomDialog>
}