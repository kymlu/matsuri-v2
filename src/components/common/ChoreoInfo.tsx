import { formatDateRange } from "../../lib/helpers/dateHelper"
import Icon from "../basic/Icon"

type ChoreoInfoProps = {
  name: string,
  event?: string,
  startDate?: string,
  endDate?: string,
}

export default function ChoreoInfo({
  name, event, startDate, endDate
}: ChoreoInfoProps) {
  return <>
    <div className="flex gap-2 mb-2">
      <div>
        <Icon src="label" size="sm"/>
      </div>
      <div>
        <div className="text-sm text-gray-600">隊列名</div>
        <b>{name}</b>
      </div>
    </div>
    {
      event &&
      <div className="flex gap-2 mb-2">
        <div>
          <Icon src="calendarToday" size="sm"/>
        </div>
        <div>
          <div className="text-sm text-gray-600">イベント情報</div>
          <b>{event}</b>
          <div className="text-sm">{formatDateRange(startDate, endDate)}</div>
        </div>
      </div>
    }
  </>
}