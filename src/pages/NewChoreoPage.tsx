import { useState } from "react";
import NumberInput from "../components/inputs/NumberInput";
import { ActionButton } from "../components/basic/Button";
import TextInput from "../components/inputs/TextInput";
import CustomSelect from "../components/inputs/CustomSelect";
import { isNullOrUndefinedOrBlank } from "../lib/helpers/globalHelper";
import { Choreo, StageType } from "../models/choreo";
import { Dancer, DancerPosition } from "../models/dancer";
import { colorPalette } from "../lib/consts/colors";
import { MAX_STAGE_DIMENSION, MAX_STAGE_MARGIN, MIN_STAGE_DIMENSION, MIN_STAGE_MARGIN } from "../lib/consts/consts";
import { saveChoreo } from "../lib/dataAccess/DataController";
import GridPreview from "../components/grid/GridPreview";

interface FormationForm {
  name: string;
  eventName: string;
  stageType: StageType;
  stageWidth: number;
  stageLength: number;
  dancerCount: number;
  xMargin: number;
  yMargin: number;
}

export function NewChoreoPage(props: {
  goToHomePage: () => void,
  goToEditPage: (choreo: Choreo) => void,
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormationForm>({
    name: "",
    eventName: "",
    stageType: "stage",
    stageWidth: 10,
    stageLength: 10,
    dancerCount: 5,
    xMargin: 2,
    yMargin: 2,
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleChange = (field: keyof FormationForm, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    console.log("Submitting form:", form);
    var sectionId = crypto.randomUUID();
    var dancers: Record<string, Dancer> = {};
    var dancerPositions: Record<string, DancerPosition> = {};
    for (var i = 0; i < form.dancerCount; i++) {
      var id = crypto.randomUUID();
      dancers[id] = {
        id: id,
        name: i.toString(),
      }
      dancerPositions[id] = {
        sectionId: sectionId,
        dancerId: id,
        x: i % (form.stageWidth + 1),
        y: Math.floor(i / (form.stageWidth + 1)),
        color: colorPalette.rainbow.blue[0],
        rotation: 0,
      }
    }
    var choreo: Choreo = {
      id: crypto.randomUUID(),
      name: form.name,
      event: form.eventName,
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
      sections: [{
        id: sectionId,
        name: "隊列1",
        order: 1,
        formation: {
          dancerActions: [],
          dancerPositions: dancerPositions,
          propPositions: {}
        }}],
    };
    console.log("Creating new choreo:", choreo);
    saveChoreo(choreo, () => {
      props.goToEditPage(choreo);
    });
  };

  const stepTitles: Record<number, string> = {
    1: "隊列基本情報",
    2: "舞台情報",
    3: "ダンサー情報",
  };

  const stageTypes: Record<StageType, string> = {
    "parade": "パレード",
    "stage": "ステージ",
  };

  return (
    <div className="flex flex-col h-screen p-4 mx-auto space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-semibold">
          {stepTitles[step] || ""}
        </h2>
      </div>
      <div className="flex-1">
        {step === 1 && (
          <div className="flex flex-col h-full pt-10 pb-20 justify-evenly">
            <TextInput
              default={form.name}
              onContentChange={newValue => handleChange("name", newValue)}
              placeholder="名前を入力してください"
              label="隊列名前"
            />
            <TextInput
              default={form.eventName}
              onContentChange={newValue => handleChange("eventName", newValue)}
              placeholder="イベント名を入力してください"
              label="イベント（任意）"
            />
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
              <CustomSelect
                items={stageTypes}
                defaultValue={stageTypes[form.stageType]}
                setValue={(newValue) => {handleChange("stageType", newValue)}}
                label="舞台類分"
              />
              <div className="grid grid-cols-2 gap-4 md:flex md:flex-col">
                <NumberInput
                  name="幅"
                  default={form.stageWidth}
                  min={MIN_STAGE_DIMENSION}
                  max={MAX_STAGE_DIMENSION}
                  step={1}
                  buttonStep={1}
                  onChange={(newValue) => {handleChange("stageWidth", Number(newValue))}}
                  label="幅 (m)"
                />
                <NumberInput
                  name="縦"
                  default={form.stageLength}
                  min={MIN_STAGE_DIMENSION}
                  max={MAX_STAGE_DIMENSION}
                  step={1}
                  buttonStep={1}
                  onChange={(newValue) => {handleChange("stageLength", Number(newValue))}}
                  label="縦 (m)"
                />
                <NumberInput
                  name="xMargin"
                  default={form.xMargin}
                  min={MIN_STAGE_MARGIN}
                  max={MAX_STAGE_MARGIN}
                  step={1}
                  buttonStep={1}
                  onChange={(newValue) => {handleChange("xMargin", Number(newValue))}}
                  label="左右余白 (m)"
                />
                <NumberInput
                  name="yMargin"
                  default={form.yMargin}
                  min={MIN_STAGE_MARGIN}
                  max={MAX_STAGE_MARGIN}
                  step={1}
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
              default={form.dancerCount}
              min={1}
              max={150}
              step={1}
              buttonStep={1}
              onChange={(newValue) => {handleChange("dancerCount", Number(newValue))}}
              label="ダンサー数"
            />
          </div>
        )}
      </div>

      <div className="flex justify-between gap-4 pt-6 pb-16">
        {step === 1 && (
          <ActionButton
          full
            onClick={props.goToHomePage}
          >
            戻る
          </ActionButton>
        )}
        {step > 1 && (
          <ActionButton
            full
            onClick={prevStep}
          >
            戻る
          </ActionButton>
        )}
        {step < 3 && (
          <ActionButton
            primary
            full
            onClick={nextStep}
            disabled={step === 1 && isNullOrUndefinedOrBlank(form.name)}
          >
            次へ
          </ActionButton>
        )}
        {step === 3 && (
          <ActionButton
            primary
            full
            onClick={handleSubmit}
          >
            隊列作成開始
          </ActionButton>
        )}
      </div>
    </div>
  );
}