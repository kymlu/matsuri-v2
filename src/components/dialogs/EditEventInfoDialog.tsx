import { useEffect, useMemo, useRef, useState } from "react";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import { EventDetails } from "../../models/choreo";
import CustomAutocomplete from "../inputs/CustomAutocomplete";
import DateInput from "../inputs/DateInput";
import { EventListItem } from "../../pages/NewChoreoPage";
import { LONG_NAME_LENGTH } from "../../lib/consts/consts";

type EditEventInfoDialogProps = {
  eventInfo?: EventDetails,
  eventList: EventDetails[],
  onClose?: () => void,
  onSubmit: (event: string, startDate?: string, endDate?: string) => void,
}

export default function EditEventInfoDialog({
  eventInfo, eventList, onClose, onSubmit
}: EditEventInfoDialogProps) {
  const [event, setEvent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const eventNames = useMemo(() => eventList.map(item => JSON.stringify(item)), [eventList]);

  useEffect(() => {
    setEvent(eventInfo?.event ?? "");
    setStartDate(eventInfo?.startDate ?? "");
    setEndDate(eventInfo?.endDate ?? "");
  }, [eventInfo]);
  
  const startDateRef = useRef<any>(null);
  const endDateRef = useRef<any>(null);

  const hasEventName = !isNullOrUndefinedOrBlank(event.trim());

  const hasDateError = (!isNullOrUndefinedOrBlank(startDate) &&
    !isNullOrUndefinedOrBlank(endDate) &&
    new Date(startDate) >= new Date(endDate)) || 
    (
      isNullOrUndefinedOrBlank(startDate) &&
      !isNullOrUndefinedOrBlank(endDate)
    );

  return <BaseEditDialog
    title="イベント情報変更"
    onClose={onClose}
    onSubmit={() => {
      onSubmit(
        event.trim(),
        hasEventName ? startDate : undefined,
        (hasEventName && new Date(startDate).getTime() !== new Date(endDate).getTime()) ? endDate : undefined)
    }}
    isActionButtonDisabled={hasEventName && hasDateError}
    >
    <div className="w-[100svw] max-w-full md:w-full">
      <CustomAutocomplete
        defaultValue={eventInfo?.event ?? ""}
        options={eventNames}
        onContentChange={newValue => setEvent(newValue)} // TODO: sort by desc event date
        placeholder="イベント名を入力してください"
        label="イベント"
        clearable
        showLength
        itemToStringValueFunc={(item) => {
          try {
            const eventDetails = JSON.parse(item) as EventDetails;
            return eventDetails.event ?? "";
          } catch {
            return item;
          }
        }}
        // restrictFn={(s) => !testInvalidCharacters(s)} // todo: after pushing the official goen change to restrict
        listItemFormat={(item) => <EventListItem
          item={item}
          setStartAndEndDate={(event, start, end) => {
            setEvent(event);
            setStartDate(start);
            startDateRef?.current?.changeValue(start);
            setEndDate(end);
            endDateRef?.current?.changeValue(end);
          }}/>}
        maxLength={LONG_NAME_LENGTH}
      />
      {
        <div className={"grid grid-rows-2 md:grid-rows-1 md:grid-cols-2 gap-2 w-full max-w-full " + (hasEventName ? "" : "opacity-50 select-none pointer-events-none")}>
          <DateInput
            label="開始日"
            ref={startDateRef}
            onDateChange={newValue => setStartDate(newValue)}
            defaultValue={startDate ?? undefined}
            hasError={hasDateError}
            disabled={!hasEventName}
          />
          <DateInput
            label="終了日（任意）"
            ref={endDateRef}
            onDateChange={newValue => setEndDate(newValue)}
            defaultValue={endDate ?? undefined}
            hasError={hasDateError}
            disabled={!hasEventName}
          />
        </div>
      }
    </div>
  </BaseEditDialog>
}