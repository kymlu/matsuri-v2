import { useEffect, useMemo, useRef, useState } from "react";
import NumberInput from "../components/inputs/NumberInput";
import TextInput from "../components/inputs/TextInput";
import { isNullOrUndefinedOrBlank, testInvalidCharacters } from "../lib/helpers/globalHelper";
import { Choreo, EventDetails, StageType } from "../models/choreo";
import { colorPalette } from "../lib/consts/colors";
import { DEFAULT_PROP_LENGTH, DEFAULT_PROP_WIDTH, LONG_NAME_LENGTH, MAX_STAGE_DIMENSION, MAX_STAGE_MARGIN, MIN_STAGE_DIMENSION, MIN_STAGE_MARGIN } from "../lib/consts/consts";
import { saveChoreo } from "../lib/dataAccess/DataController";
import GridPreview from "../components/grid/GridPreview";
import Button from "../components/basic/Button";
import CustomAutocomplete from "../components/inputs/CustomAutocomplete";
import DateInput from "../components/inputs/DateInput";
import { Autocomplete } from "@base-ui/react";
import { formatDateRange } from "../lib/helpers/dateHelper";
import { Dialog } from "@base-ui/react";
import { Roster } from "../models/roster";
import { getRoster } from "../lib/helpers/apiHelper";
import { buildStartingLayout, StartingProp } from "../lib/helpers/startingLayoutHelper";
import StartingCastStep, { RosterLoadState } from "../components/common/StartingCastStep";
import BaseEditDialog from "../components/dialogs/BaseEditDialog";

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
  selectedEvent?: EventDetails,
  teamId?: string,
  canUseRoster?: boolean, // logged in as an editor or admin
}

export function NewChoreoPage({
  goToEditPage, goToHomePage, eventList, selectedEvent, teamId, canUseRoster = false,
}: NewChoreoPageProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormationForm>({
    name: "",
    eventName: selectedEvent?.event ?? "",
    startDate: selectedEvent?.startDate ?? "",
    endDate: selectedEvent?.endDate ?? "",
    stageType: "stage",
    stageWidth: 10,
    stageLength: 10,
    dancerCount: 10,
    xMargin: 2,
    yMargin: 2,
  });

  // Step 3: the starting cast. Dancers picked from the 名簿 (in pick order), unnamed dancers, and props.
  const [roster, setRoster] = useState<Roster>();
  const [rosterState, setRosterState] = useState<RosterLoadState>("off");
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [unnamedCount, setUnnamedCount] = useState(form.dancerCount);
  const [hasChangedUnnamed, setHasChangedUnnamed] = useState(false);
  const [propCounts, setPropCounts] = useState<[string, number][]>([]);
  const [sectionId] = useState(() => crypto.randomUUID());
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);

  // The 名簿 loads when step 3 first opens, so steps 1 and 2 don't wait for it.
  const loadRoster = () => {
    if (!teamId) {
      return;
    }
    setRosterState("loading");
    getRoster(teamId)
      .then(result => {
        setRoster(result);
        setRosterState("loaded");
        // With a 名簿, nobody is added unless asked for.
        if (!hasChangedUnnamed) {
          setUnnamedCount(0);
        }
      })
      .catch(e => {
        console.error((e as Error)?.message);
        setRosterState("failed");
      });
  };

  useEffect(() => {
    if (step === 3 && canUseRoster && rosterState === "off") {
      loadRoster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canUseRoster]);

  const layout = useMemo(() => {
    const dancerNames = new Map(roster?.dancers.names.map(n => [n.id, n.name]) ?? []);
    const propNames = new Map(roster?.props.names.map(n => [n.id, n]) ?? []);
    const props: StartingProp[] = propCounts.flatMap(([id, count]) => {
      const name = propNames.get(id);
      return name ? Array.from({ length: count }, () => ({
        name: name.name,
        width: name.width ?? DEFAULT_PROP_WIDTH,
        length: name.length ?? DEFAULT_PROP_LENGTH,
        color: name.color ?? colorPalette.rainbow.blue[0],
      })) : [];
    });
    return buildStartingLayout(
      pickedIds.map(id => dancerNames.get(id)).filter((n): n is string => n !== undefined),
      rosterState === "loaded" ? unnamedCount : Math.max(unnamedCount, 1),
      props,
      { stageWidth: form.stageWidth, stageLength: form.stageLength },
      sectionId);
  }, [roster, pickedIds, unnamedCount, propCounts, rosterState, form.stageWidth, form.stageLength, sectionId]);

  const dancerTotal = Object.keys(layout.dancers).length;
  const propTotal = Object.keys(layout.props).length;

  // Anything typed or picked that 戻る on step 1 would throw away.
  const hasInput = form.name.trim() !== "" || (form.eventName.trim() !== "" && form.eventName !== (selectedEvent?.event ?? "")) ||
    pickedIds.length > 0 || propCounts.length > 0;

  const hasDateError = (!isNullOrUndefinedOrBlank(form.startDate) &&
    !isNullOrUndefinedOrBlank(form.endDate) &&
    new Date(form.startDate) >= new Date(form.endDate)) || 
    (
      isNullOrUndefinedOrBlank(form.startDate) &&
      !isNullOrUndefinedOrBlank(form.endDate)
    );

  const eventNames = useMemo(() => eventList.map(item => JSON.stringify(item)), [eventList]);
  const startDateRef = useRef<any>(null);
  const endDateRef = useRef<any>(null);

  useEffect(() => {
    startDateRef?.current?.changeValue(selectedEvent?.startDate);
    endDateRef?.current?.changeValue(selectedEvent?.endDate);
  }, [selectedEvent]);

  const hasEventName = !isNullOrUndefinedOrBlank(form.eventName.trim());

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleChange = (field: keyof FormationForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Exactly what the preview shows.
    const { dancers, dancerPositions, props, propPositions } = layout;
    const choreo: Choreo = {
      id: crypto.randomUUID(),
      teamId: teamId,
      name: form.name.trim(),
      event: form.eventName.trim(),
      startDate: hasEventName ? form.startDate : undefined,
      endDate: (hasEventName && new Date(form.startDate).getTime() !== new Date(form.endDate).getTime()) ? form.endDate : undefined,
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
      props: props,
      obstacles: {},
      sections: [{
        id: sectionId,
        name: "セクション1",
        order: 1,
        formation: {
          dancerActions: [],
          dancerPositions: dancerPositions,
          propPositions: propPositions
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
    3: "ダンサー・道具",
  };
  
  return (
    <div className="flex flex-col h-[100svh] p-4 mx-auto space-y-2 bg-app">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold">
          {stepTitles[step] || ""}
        </h2>
      </div>
      <div className={step === 3 ? "flex-1 min-h-0" : "flex-1 overflow-auto"}>
        {step === 1 && (
          <div className="flex flex-col h-full pt-10 pb-20 justify-evenly">
            <TextInput
              defaultValue={form.name}
              onContentChange={newValue => handleChange("name", newValue)}
              placeholder="名前を入力してください"
              label="隊列名"
              restrictFn={(s) => !testInvalidCharacters(s)}
              showLength
              maxLength={LONG_NAME_LENGTH}
            />
            <CustomAutocomplete
              defaultValue={form.eventName}
              options={eventNames}
              onContentChange={newValue => handleChange("eventName", newValue)}
              placeholder="イベント名を入力してください"
              label="イベント"
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
            {
              <div className={"grid grid-cols-2 gap-2 w-full max-w-full " + (hasEventName ? "" : "opacity-50 select-none pointer-events-none")}>
                <DateInput
                  label="開始日"
                  ref={startDateRef}
                  onDateChange={newValue => handleChange("startDate", newValue)}
                  defaultValue={form.startDate}
                  hasError={hasDateError}
                  disabled={!hasEventName}
                />
                <DateInput
                  label="終了日（任意）"
                  ref={endDateRef}
                  onDateChange={newValue => handleChange("endDate", newValue)}
                  defaultValue={form.endDate}
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

        {
          step === 3 && (
          <StartingCastStep
            stage={{ stageWidth: form.stageWidth, stageLength: form.stageLength, xMargin: form.xMargin, yMargin: form.yMargin, stageType: form.stageType }}
            layout={layout}
            rosterState={rosterState}
            dancerList={roster?.dancers}
            propList={roster?.props}
            onRetry={loadRoster}
            pickedIds={pickedIds}
            onPickedIdsChange={setPickedIds}
            unnamedCount={unnamedCount}
            onUnnamedCountChange={(count) => {
              setUnnamedCount(count);
              setHasChangedUnnamed(true);
            }}
            propCounts={propCounts}
            onPropCountsChange={setPropCounts}/>
        )}
      </div>

      {
        // Only with a 名簿: without one there's just the dancer count, so a total would repeat it.
        step === 3 && rosterState === "loaded" &&
        <p className="text-sm text-center text-muted">
          {
            dancerTotal === 0
              ? <span className="font-semibold text-primary">ダンサーを1名以上追加してください</span>
              : `合計${dancerTotal}名${propTotal > 0 ? `・道具${propTotal}件` : ""}`
          }
        </p>
      }

      <div className="flex justify-between h-10 gap-4 mb-8">
        { <Button
            full
            onClick={step === 1 ? (hasInput ? () => setIsConfirmingLeave(true) : goToHomePage) : prevStep}
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
            disabled={dancerTotal === 0}
            onClick={handleSubmit}
          >
          <span className="font-semibold">
            隊列作成開始
          </span>
          </Button>
        )}
      </div>
      <Dialog.Root open={isConfirmingLeave} onOpenChange={setIsConfirmingLeave}>
        {
          isConfirmingLeave &&
          <BaseEditDialog title="戻りますか？" actionButtonText="戻る" onSubmit={goToHomePage}>
            <p className="text-muted">入力した内容はすべて失われます。</p>
          </BaseEditDialog>
        }
      </Dialog.Root>
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
    className="cursor-default items-center py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-md data-[highlighted]:before:bg-primary data-[highlighted]:before:text-white">
    <span className="font-medium">{eventDetails.event}</span>
    <br/>
    {
      (eventDetails.startDate || eventDetails.endDate) &&
      <span className="text-xs opacity-85">
        {formatDateRange(eventDetails.startDate, eventDetails.endDate)}
      </span>
    }
  </Autocomplete.Item>
}