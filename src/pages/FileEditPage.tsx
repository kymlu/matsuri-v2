import { useRef, useState } from "react";
import TextInput from "../components/inputs/TextInput";
import { strEquals, testInvalidCharacters } from "../lib/helpers/globalHelper";
import { Choreo, ChoreoManifest } from "../models/choreo";
import CustomAutocomplete from "../components/inputs/CustomAutocomplete";
import { FileEdits } from "./ManagerPage";
import CustomSwitch from "../components/inputs/CustomSwitch";
import Button from "../components/basic/Button";
import { Dialog } from "@base-ui/react";
import BaseEditDialog from "../components/dialogs/BaseEditDialog";

interface FileEditForm {
  name: string,
  eventName: string,
  isHidden: boolean,
  choreo?: Choreo,
}

type FileEditPageProps = {
  choreo: ChoreoManifest,
  edits?: FileEdits,
  eventList: string[],
  addEdits: (id: string, edits?: FileEdits) => void,
  exitPage: () => void,
  localChoreos: Choreo[],
}

export function FileEditPage({
  choreo, edits, eventList, addEdits, exitPage, localChoreos,
}: FileEditPageProps) {
  const [form, setForm] = useState<FileEditForm>({
    name: edits?.name ?? choreo.name,
    eventName: edits?.eventName ?? choreo.event,
    isHidden: edits?.isHidden ?? choreo.isHidden ?? false,
    choreo: edits?.choreo,
  });

  const handleChange = (field: keyof FileEditForm, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const nameRef = useRef<any>(null);
  const eventRef = useRef<any>(null);
  const isHiddenRef = useRef<any>(null);

  const handleSubmit = () => {
    console.log("Saving edits on id:", choreo.id, {
      name: strEquals(choreo.name, form.name) ? "unchanged" : "updated",
      eventName: strEquals(choreo.event, form.eventName) ? "unchanged" : "updated",
      isHidden: choreo.isHidden === form.isHidden ? "unchanged" : "updated",
      choreo: form.choreo || edits?.choreo ? "updated" : "unchanged",
    });

    var newEdits: FileEdits = {
      id: choreo.id,
      name: strEquals(choreo.name, form.name) ? undefined : form.name,
      eventName: strEquals(choreo.event, form.eventName) ? undefined : form.eventName,
      choreo: form.choreo ?? edits?.choreo,
      isHidden: (choreo.isHidden === form.isHidden || (choreo.isHidden === undefined && form.isHidden === false)) ? undefined : form.isHidden,
    };
    var hasEdits =
      newEdits.name !== undefined ||
      newEdits.eventName !== undefined ||
      newEdits.choreo !== undefined ||
      newEdits.isHidden !== undefined;
      
    addEdits(choreo.id, hasEdits ? newEdits : undefined);
    exitPage();
  };

  const hasEdits = form.choreo || !strEquals(form.name, choreo.name) || !strEquals(form.eventName, choreo.event) || form.isHidden !== (choreo.isHidden ?? false)

  const revert = () => {
    setForm(prev => ({
      ...prev,
      name: choreo.name,
      eventName: choreo.event,
      isHidden: choreo.isHidden ?? false,
    }));
    nameRef.current.changeValue(choreo.name);
    eventRef.current.changeValue(choreo.event);
    isHiddenRef.current.changeChecked(choreo.isHidden === undefined ? true : !choreo.isHidden);
  }
  
  return (
    <div className="flex flex-col h-[100svh] p-4 mx-auto space-y-2 bg-gray-100">
      <div className="flex justify-between">
        <h2 className="mb-2 text-xl font-bold">
          {choreo.name}
        </h2>
        
      </div>
      <span className="text-sm">ID: {choreo.id}</span>
      <div className="flex justify-between h-12 pt-4">
        <span className="text-lg font-bold">メタデータ</span>
        {
          hasEdits &&
          <Dialog.Root>
            <Dialog.Trigger>
              <Button compact asDiv>破棄</Button>
            </Dialog.Trigger>
            <BaseEditDialog noDetachedTrigger title="確認" actionButtonText="OK" onSubmit={revert}>
              <p>変更を全て破棄しますか？</p>
              <p>この操作は取り消せません。</p>
            </BaseEditDialog>
          </Dialog.Root>
        }
      </div>
      <div className="space-y-4">
        <TextInput
          defaultValue={form.name}
          onContentChange={newValue => handleChange("name", newValue)}
          placeholder="名前を入力してください"
          required
          label="隊列名前"
          restrictFn={(s) => !testInvalidCharacters(s)}
          ref={nameRef}
        />
        <CustomAutocomplete
          defaultValue={form.eventName}
          options={eventList}
          onContentChange={newValue => handleChange("eventName", newValue)}
          placeholder="イベント名を入力してください"
          required
          label="イベント（任意）"
          ref={eventRef}
          // restrictFn={(s) => !testInvalidCharacters(s)} // todo: after pushing the official goen change to restrict
        />
        <CustomSwitch
          label="公開する"
          defaultChecked={!form.isHidden}
          onChange={checked => handleChange("isHidden", !checked)}
          ref={isHiddenRef}
        />
      </div>

      <div className="flex justify-between pt-4">
        <span className="text-lg font-bold">バージョンアップ</span>
      </div>
      <div className="flex-1">
        <Button>Add a version</Button>
        {
          form.choreo &&
          <div>
            このバージョンで、公開のバージョンが <b>v{choreo.version}</b> → <b>v{choreo.version + 1}</b> に変更される
          </div>
        }
      </div>
      
      <div className="flex justify-between gap-4 pb-8">
        <Button
          full
          onClick={exitPage}
        >
          <span className="font-semibold">
            キャンセル
          </span>
          </Button>
        <Button
          primary
          full
          onClick={handleSubmit}
        >
          <span className="font-semibold">
            保存
          </span>
        </Button>
      </div>
    </div>
  );
}