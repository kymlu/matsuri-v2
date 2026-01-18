import { useState } from "react";
import NumberInput from "../components/inputs/NumberInput";
import { ActionButton } from "../components/basic/Button";
import TextInput from "../components/inputs/TextInput";
import CustomSelect from "../components/inputs/CustomSelect";
import { isNullOrUndefinedOrBlank } from "../lib/helpers/globalHelpers";
import { Choreo, StageType } from "../models/choreo";

interface FormationForm {
  name: string;
  eventName: string;
  stageType: StageType;
  stageWidth: number;
  stageLength: number;
  dancerCount: number;
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
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleChange = (field: keyof FormationForm, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    console.log("Submitting form:", form);
    var choreo: Choreo = {
      id: crypto.randomUUID(),
      name: form.name,
      event: form.eventName,
      stageType: form.stageType,
      width: form.stageWidth,
      length: form.stageLength,
      margins: {
        topMargin: 2,
        bottomMargin: 2,
        leftMargin: 2,
        rightMargin: 2
      },
      dancers: {},
      props: {},
      sections: [{
        id: crypto.randomUUID(),
        name: "隊列1",
        order: 1,
        formation: {
          dancerActions: [],
          dancerPositions: {},
          propPositions: {}
        }}],
    };
    console.log("Creating new choreo:", choreo);
    props.goToEditPage(choreo);
  };

  const stepTitles: Record<number, string> = {
    1: "隊列基本情報",
    2: "舞台情報",
    3: "踊り子情報",
  };

  const stageTypes: Record<StageType, string> = {
    "parade": "パレード",
    "stage": "ステージ",
  };

  return (
    <div className="flex flex-col h-screen max-w-md p-4 mx-auto space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-semibold">
          {stepTitles[step] || ""}
        </h2>
      </div>
      <div className="flex-1">
        {step === 1 && (
          <div className="space-y-4">
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
          <div className="space-y-8">
            <CustomSelect
              items={stageTypes}
              defaultValue={stageTypes[form.stageType]}
              setValue={(newValue) => {handleChange("stageType", newValue)}}
              label="舞台類分"
            />
            <div className="flex gap-4">
              <NumberInput
                name="幅"
                default={form.stageWidth}
                min={3}
                max={500}
                step={1}
                buttonStep={1}
                onChange={(newValue) => {handleChange("stageWidth", Number(newValue))}}
                label="幅 (m)"
              />
              <NumberInput
                name="縦"
                default={form.stageLength}
                min={3}
                max={500}
                step={1}
                buttonStep={1}
                onChange={(newValue) => {handleChange("stageLength", Number(newValue))}}
                label="縦 (m)"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <NumberInput
              default={form.dancerCount}
              min={1}
              max={150}
              step={1}
              buttonStep={1}
              onChange={(newValue) => {handleChange("dancerCount", Number(newValue))}}
              label="踊り子数"
            />
          </div>
        )}
      </div>


      <div className="flex justify-between gap-4 mt-6">
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