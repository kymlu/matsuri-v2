import { useEffect, useMemo, useRef, useState } from "react";
import NumberInput from "../components/inputs/NumberInput";
import TextInput from "../components/inputs/TextInput";
import { isNullOrUndefinedOrBlank, testInvalidCharacters } from "../lib/helpers/globalHelper";
import { Choreo, EventDetails, StageType } from "../models/choreo";
import { Dancer, DancerPosition } from "../models/dancer";
import { colorPalette } from "../lib/consts/colors";
import { LONG_NAME_LENGTH, MAX_STAGE_DIMENSION, MAX_STAGE_MARGIN, MIN_STAGE_DIMENSION, MIN_STAGE_MARGIN } from "../lib/consts/consts";
import { saveChoreo } from "../lib/dataAccess/DataController";
import GridPreview from "../components/grid/GridPreview";
import Button from "../components/basic/Button";
import CustomAutocomplete from "../components/inputs/CustomAutocomplete";
import DateInput from "../components/inputs/DateInput";
import { Autocomplete } from "@base-ui/react";
import { formatDateRange } from "../lib/helpers/dateHelper";

interface FormationForm {
  name: string;
  eventName: string;
  startDate: string;
  endDate: string;
  stageType: StageType;
  stageWidth: number;
  stageLength: number;
  dancerCount: number;
  xMargin: number;
  yMargin: number;
}

type NewChoreoPageProps = {
  goToHomePage: () => void,
  goToEditPage: (choreo: Choreo) => void,
  eventList: EventDetails[],
  eventName?: string,
  startDate?: string,
  endDate?: string,
}

export function NewChoreoPage({
  goToEditPage, goToHomePage, eventList, eventName, startDate, endDate
}: NewChoreoPageProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormationForm>({
    name: "",
    eventName: "",
    startDate: "",
    endDate: "",
    stageType: "stage",
    stageWidth: 10,
    stageLength: 10,
    dancerCount: 10,
    xMargin: 2,
    yMargin: 2,
  });

  const hasDateError = (!isNullOrUndefinedOrBlank(form.startDate) &&
    !isNullOrUndefinedOrBlank(form.endDate) &&
    new Date(form.startDate) > new Date(form.endDate)) || 
    (
      isNullOrUndefinedOrBlank(form.startDate) &&
      !isNullOrUndefinedOrBlank(form.endDate)
    );

  const eventNames = useMemo(() => eventList.map(item => JSON.stringify(item)), [eventList]);
  const startDateRef = useRef<any>(null);
  const endDateRef = useRef<any>(null);

  // todo: fix to incorporate dates
  useEffect(() => {
    setForm(prev => ({...prev, eventName: eventName ?? ""}));
  }, [eventName]);

  const hasEventName = !isNullOrUndefinedOrBlank(form.eventName.trim());

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleChange = (field: keyof FormationForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    var sectionId = crypto.randomUUID();
    var dancers: Record<string, Dancer> = {};
    var dancerPositions: Record<string, DancerPosition> = {};
    for (var i = 0; i < form.dancerCount; i++) {
      var id = crypto.randomUUID();
      dancers[id] = {
        id: id,
        name: (i + 1).toString(),
      }
      dancerPositions[id] = {
        sectionId: sectionId,
        dancerId: id,
        x: i % (form.stageWidth + 1),
        y: Math.floor(i / (form.stageWidth + 1)),
        color: colorPalette.rainbow.blue[0],
        type: "dancer",
        rotation: 0,
      }
    }
    var choreo: Choreo = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      event: form.eventName.trim(),
      startDate: hasEventName ? form.startDate : undefined,
      endDate: hasEventName ? form.endDate : undefined,
      stageType: form.stageType,
      stageGeometry: {
        stageLength: form.stageLength,
        stageWidth: form.stageWidth,
        margin: {
          topMargin: form.yMargin,
          bottomMargin: form.yMargin,
          leftMargin: form.xMargin,
          rightMargin: form.xMargin,
        },
        yAxis: form.stageType === "parade" ? "bottom-up" : "top-down",
      },
      dancers: dancers,
      props: {},
      obstacles: {},
      sections: [{
        id: sectionId,
        name: "セクション1",
        order: 1,
        formation: {
          dancerActions: [],
          dancerPositions: dancerPositions,
          propPositions: {}
        }}],
    };
    console.log("Creating new choreo:", choreo);
    saveChoreo(choreo, () => {
      goToEditPage(choreo);
    }, true);
  };

  const stepTitles: Record<number, string> = {
    1: "隊列基本情報",
    2: "舞台情報",
    3: "ダンサー情報",
  };
  
  return (
    <div className="flex flex-col h-[100svh] p-4 mx-auto space-y-2 bg-gray-100">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold">
          {stepTitles[step] || ""}
        </h2>
      </div>
      <div className="flex-1">
        {step === 1 && (
          <div className="flex flex-col h-full pt-10 pb-20 justify-evenly">
            <div>
              <TextInput
                defaultValue={form.name}
                onContentChange={newValue => handleChange("name", newValue)}
                placeholder="名前を入力してください"
                label="隊列名前"
                restrictFn={(s) => !testInvalidCharacters(s)}
                showLength
                maxLength={LONG_NAME_LENGTH}
              />
            </div>
            <div>
              <CustomAutocomplete
                defaultValue={form.eventName}
                options={eventNames} // TODO: sort by desc event dates
                onContentChange={newValue => handleChange("eventName", newValue)}
                placeholder="イベント名を入力してください"
                label="イベント（任意）"
                clearable
                // restrictFn={(s) => !testInvalidCharacters(s)} // todo: after pushing the official goen change to restrict
                showLength
                itemToStringValueFunc={(item) => {
                  try {
                    const eventDetails = JSON.parse(item) as EventDetails;
                    return eventDetails.event ?? "";
                  } catch {
                    return item;
                  }
                }}
                listItemFormat={(item) => <EventListItem
                  item={item}
                  setStartAndEndDate={(event, start, end) => {
                    setForm(prev => ({...prev, eventName: event, startDate: start, endDate: end}));
                    startDateRef?.current?.changeValue(start);
                    endDateRef?.current?.changeValue(end);
                  }}
                  />}
                maxLength={LONG_NAME_LENGTH}
              />
            </div>
            {
              <div className={"flex gap-2 " + (hasEventName ? "" : "opacity-0 select-none pointer-events-none")}>
                <DateInput
                  label="開始日"
                  ref={startDateRef}
                  onDateChange={newValue => handleChange("startDate", newValue)}
                  defaultValue={form.startDate ?? undefined}
                  hasError={hasDateError}
                  disabled={!hasEventName}
                />
                <DateInput
                  label="最終日（任意）"
                  ref={endDateRef}
                  onDateChange={newValue => handleChange("endDate", newValue)}
                  defaultValue={form.endDate ?? undefined}
                  hasError={hasDateError}
                  disabled={!hasEventName}
                />
              </div>
            }
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col h-full gap-2 md:flex-row">
            <GridPreview
              stageWidth={form.stageWidth}
              stageLength={form.stageLength}
              stageType={form.stageType}
              xMargin={form.xMargin}
              yMargin={form.yMargin}
            />
            <div className="md:w-1/3">
              <div className="grid grid-cols-2 gap-2 md:flex md:flex-col">
                <Button
                  full
                  primary={form.stageType === 'parade'}
                  onClick={() => handleChange("stageType", "parade")}
                >
                  パレード
                </Button>
                <Button
                  full
                  primary={form.stageType === 'stage'}
                  onClick={() => handleChange("stageType", "stage")}
                >
                  ステージ
                </Button>
                <NumberInput
                  name="幅"
                  defaultValue={form.stageWidth}
                  min={MIN_STAGE_DIMENSION}
                  max={MAX_STAGE_DIMENSION}
                  baseStep={1}
                  buttonStep={1}
                  onChange={(newValue) => {handleChange("stageWidth", Number(newValue))}}
                  label="幅 (m)"
                />
                <NumberInput
                  name="縦"
                  defaultValue={form.stageLength}
                  min={MIN_STAGE_DIMENSION}
                  max={MAX_STAGE_DIMENSION}
                  baseStep={1}
                  buttonStep={1}
                  onChange={(newValue) => {handleChange("stageLength", Number(newValue))}}
                  label="縦 (m)"
                />
                <NumberInput
                  name="xMargin"
                  defaultValue={form.xMargin}
                  min={MIN_STAGE_MARGIN}
                  max={MAX_STAGE_MARGIN}
                  baseStep={1}
                  buttonStep={1}
                  onChange={(newValue) => {handleChange("xMargin", Number(newValue))}}
                  label="左右余白 (m)"
                />
                <NumberInput
                  name="yMargin"
                  defaultValue={form.yMargin}
                  min={MIN_STAGE_MARGIN}
                  max={MAX_STAGE_MARGIN}
                  baseStep={1}
                  buttonStep={1}
                  onChange={(newValue) => {handleChange("yMargin", Number(newValue))}}
                  label="上下余白 (m)"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex items-center justify-center h-full">
            <NumberInput
              defaultValue={form.dancerCount}
              min={1}
              max={150}
              baseStep={1}
              buttonStep={1}
              onChange={(newValue) => {handleChange("dancerCount", Number(newValue))}}
              label="ダンサー数"
            />
          </div>
        )}
      </div>

      <div className="flex justify-between gap-4 pb-8">
        { <Button
            full
            onClick={step === 1 ? goToHomePage : prevStep}
          >
            <span className="font-semibold">
              戻る
            </span>
          </Button>
        }
        {step < 3 && (
          <Button
            primary
            full
            onClick={nextStep}
            disabled={step === 1 &&(isNullOrUndefinedOrBlank(form.name.trim()) || (hasEventName && hasDateError))}
          >
          <span className="font-semibold">
            次へ
          </span>
          </Button>
        )}
        {step === 3 && (
          <Button
            primary
            full
            onClick={handleSubmit}
          >
          <span className="font-semibold">
            隊列作成開始
          </span>
          </Button>
        )}
      </div>
    </div>
  );
}

type EventListItemProps = {
  item: string,
  setStartAndEndDate: (event: string, startDate: string, endDate: string) => void,
}

export function EventListItem ({
  item, setStartAndEndDate
}: EventListItemProps) {
  const eventDetails = useMemo(() => {
    return JSON.parse(item) as EventDetails
  }, [item]);
  
  return <Autocomplete.Item
    value={item}
    onClick={() => {
      setStartAndEndDate(eventDetails.event ?? "", eventDetails.startDate ?? "", eventDetails.endDate ?? "")
    }}
    className="flex cursor-default items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-md data-[highlighted]:before:bg-primary data-[highlighted]:before:text-white">
    <span>{eventDetails.event}</span>
    {
      (eventDetails.startDate || eventDetails.endDate) &&
      <span className="text-xs font-bold">
        {formatDateRange(eventDetails.startDate, eventDetails.endDate)}
      </span>
    }
  </Autocomplete.Item>
}