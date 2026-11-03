import { Fragment, useEffect, useState } from "react"
import { getChoreoHistory, getPublicChoreoHistory } from "../../lib/helpers/apiHelper";
import { ChoreoVersion } from "../../models/choreo";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { getJpDate } from "../../lib/helpers/dateHelper";
import CustomDialog from "../basic/CustomDialog";
import { Tag } from "../common/Tag";
import Divider from "../basic/Divider";
import Icon from "../basic/Icon";

type ChoreoHistoryDialogProps = {
  teamId: string,
  choreoId: string,
  isLoggedIn: boolean,
  isEditing: boolean,
  onClose: () => void,
  onSelectVersion: (version: number) => void,
}

export function ChoreoHistoryDialog({
  teamId, choreoId, isLoggedIn, isEditing, onClose, onSelectVersion
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
    <div className="flex flex-col w-full gap-1">
      {
        history.map((h, i) => (<Fragment key={h.version} >
          {
            i === 0 && <div className="text-sm text-muted">最新版</div>
          }
          {
            i === 1 && <div className="text-sm text-muted">過去の履歴</div>
          }
          <div
            className={`flex items-center gap-3 px-3 py-1 rounded-md ${i > 0 ? "cursor-pointer hover:bg-subtle" : ""}`}
            onClick={i > 0 ? () => onSelectVersion(h.version) : undefined}>
            <Tag
              text={`v${h.version}`}
              type={i === 0 ? "filled" : "grey"}
              icon={(i === 0 && isEditing) ? "edit" : undefined}/>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="text-sm text-muted">
                {h.uploadedAt ? getJpDate(new Date(h.uploadedAt)) : ""}
              </div>
              {
                isLoggedIn &&
                <div className="text-sm">
                  {h.uploadedByName}
                </div>
              }
            </div>
            {
              i > 0 &&
              <Icon src="visibility" colour="grey" size="sm"/>
            }
          </div>
          { (i > 0  && i < history.length - 1) && <Divider compact/> }
        </Fragment>
        ))
      }
    </div>
  </CustomDialog>
}
