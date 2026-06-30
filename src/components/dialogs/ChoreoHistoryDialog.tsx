import { useEffect, useState } from "react"
import BaseErrorDialog from "./BaseErrorDialog"
import { getChoreoHistory, getPublicChoreoHistory } from "../../lib/helpers/apiHelper";
import { ChoreoVersion } from "../../models/choreo";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { getJpDate } from "../../lib/helpers/dateHelper";

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

  return <BaseErrorDialog title="公開履歴" onClose={onClose}>
    <table>
      <th>
        <td>バージョン</td>
        <td>日付</td>
        <td>対応者</td>
      </th>
      <tbody>
        {
          history.map(h => <>
            <td>{h.version}</td>
            <td>{h.uploadedAt ? getJpDate(new Date(h.uploadedAt)) : ""}</td>
            <td>{isLoggedIn ? "非公開" : (h.uploadedByName ? `${h.uploadedByName}${h.uploadedByEmail ? `（｀${h.uploadedByEmail}）`: ""}` : h.uploadedByEmail)}</td>
          </>)
        }
      </tbody>
    </table>
  </BaseErrorDialog>
}