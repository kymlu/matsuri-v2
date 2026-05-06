import { useEffect, useMemo, useRef, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank, testInvalidCharacters } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import { Choreo, EventDetails } from "../../models/choreo";
import CustomAutocomplete from "../inputs/CustomAutocomplete";
import DateInput from "../inputs/DateInput";
import { EventListItem } from "../../pages/NewChoreoPage";
import { LONG_NAME_LENGTH } from "../../lib/consts/consts";

type EditChoreoInfoDialogProps = {
  choreo?: Choreo,
  eventList: EventDetails[],
  onClose?: () => void,
  onSubmit: (name: string, event: string, startDate?: string, endDate?: string) => void,
}

export default function EditChoreoInfoDialog({
  choreo, eventList, onClose, onSubmit
}: EditChoreoInfoDialogProps) {
  const [name, setName] = useState("");
  const [event, setEvent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const eventNames = useMemo(() => eventList.map(item => JSON.stringify(item)), [eventList]);

  useEffect(() => {
    setName(choreo?.name ?? "");
    setEvent(choreo?.event ?? "");
    setStartDate(choreo?.startDate ?? "");
    setEndDate(choreo?.endDate ?? "");
  }, [choreo]);
  
  const startDateRef = useRef<any>(null);
  const endDateRef = useRef<any>(null);

  const hasEventName = !isNullOrUndefinedOrBlank(event.trim());

  const hasDateError = (!isNullOrUndefinedOrBlank(startDate) &&
    !isNullOrUndefinedOrBlank(endDate) &&
    new Date(startDate) > new Date(endDate)) || 
    (
      isNullOrUndefinedOrBlank(startDate) &&
      !isNullOrUndefinedOrBlank(endDate)
    );

  return <BaseEditDialog
    title="隊列情報変更"
    onClose={onClose}
    onSubmit={() => {
      onSubmit(
        name.trim(),
        event.trim(),
        hasEventName ? startDate : undefined,
        hasEventName ? endDate : undefined)
    }}
    isActionButtonDisabled={isNullOrUndefinedOrBlank(name.trim()) || hasDateError}
    >
    <div className="w-[100svw] max-w-full md:w-full">
      <TextInput
        label="名前"
        required
        defaultValue={choreo?.name ?? ""}
        onContentChange={ (newName) => { setName(newName) }}
        restrictFn={(s) => !testInvalidCharacters(s)}
        showLength
        maxLength={LONG_NAME_LENGTH}
        />

      <CustomAutocomplete
        defaultValue={choreo?.event ?? ""}
        options={eventNames}
        onContentChange={newValue => setEvent(newValue)} // TODO: sort by desc event date
        placeholder="イベント名を入力してください"
        label="イベント（任意）"
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
          setStartAndEndDate={(start, end) => {
            setStartDate(start);
            startDateRef?.current?.changeValue(start);
            setEndDate(end);
            endDateRef?.current?.changeValue(end);
          }}/>}
        maxLength={LONG_NAME_LENGTH}
      />
      {
        <div className={"flex gap-2 " + (hasEventName ? "" : "opacity-0 select-none pointer-events-none")}>
          <DateInput
            label="開始日"
            ref={startDateRef}
            onDateChange={newValue => setStartDate(newValue)}
            defaultValue={startDate ?? undefined}
            hasError={hasDateError}
            disabled={!hasEventName}
          />
          <DateInput
            label="最終日（任意）"
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