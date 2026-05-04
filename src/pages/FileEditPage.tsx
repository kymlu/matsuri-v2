import { useRef, useState } from "react";
import TextInput from "../components/inputs/TextInput";
import { isNullOrUndefinedOrBlank, strEquals, testInvalidCharacters } from "../lib/helpers/globalHelper";
import { Choreo, ChoreoManifest } from "../models/choreo";
import CustomAutocomplete from "../components/inputs/CustomAutocomplete";
import { FileEdits } from "./ManagerPage";
import CustomSwitch from "../components/inputs/CustomSwitch";
import Button from "../components/basic/Button";
import { Dialog } from "@base-ui/react";
import BaseEditDialog from "../components/dialogs/BaseEditDialog";
import Icon from "../components/basic/Icon";
import { ICON } from "../lib/consts/consts";
import { getDate } from "../lib/helpers/dateHelper";
import Divider from "../components/basic/Divider";
import { SelectChoreoDialog } from "../components/dialogs/SelectChoreoDialog";
import IconButton from "../components/basic/IconButton";
import { Tag } from "../components/common/Tag";
import Label from "../components/inputs/Label";

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
    setForm({
      name: choreo.name,
      eventName: choreo.event,
      isHidden: choreo.isHidden ?? false,
      choreo: undefined,
    });
    nameRef.current.changeValue(choreo.name);
    eventRef.current.changeValue(choreo.event);
    isHiddenRef.current.changeChecked(choreo.isHidden === undefined ? true : !choreo.isHidden);
  }

  const selectChoreoDialog = Dialog.createHandle<Choreo>();
  const [selectChoreoDialogOpen, setSelectChoreoDialogOpen] = useState(false);

  const handleSelectChoreoDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setSelectChoreoDialogOpen(isOpen);
  };

  const versionUp = () => {
    var local = localChoreos.find(c => strEquals(c.id, choreo.id));
    if (local) {
      setForm(prev => ({...prev, choreo: local}));
    } else {
      setSelectChoreoDialogOpen(true);
    }
  }
  
  return (
    <div className="flex flex-col h-[100svh] p-4 mx-auto space-y-1.5 bg-gray-100">
      <div className="flex flex-col space-y-1.5">
        <h2 className="text-xl font-bold">
          {choreo.name}
        </h2>
        <div className="flex flex-row justify-between">
          <div className="flex items-center gap-2 text-sm">
            {choreo.lastUpdated ? (
              <div className="flex items-center gap-1">
                <Icon colour="grey" size="sm" src={ICON.history}/>{getDate(new Date(choreo.lastUpdated))}
              </div>
            ) : (
              <div />
            )}
            {
              choreo.version > 0 &&
              <Tag text={`v${choreo.version}`} type="primary"/>
            }
            {
              choreo.version === 0 &&
              <Tag text="新" type="primary"/>
            }
          </div>
          <Dialog.Root>
            <Dialog.Trigger disabled={!hasEdits}>
              <Button compact asDiv disabled={!hasEdits}>破棄</Button>
            </Dialog.Trigger>
            <BaseEditDialog noDetachedTrigger title="確認" actionButtonText="OK" onSubmit={revert}>
              <p>変更を全て破棄しますか？</p>
              <p>この操作は取り消せません。</p>
            </BaseEditDialog>
          </Dialog.Root>
        </div>
        <span className="font-mono text-sm">ID: {choreo.id}</span>
      </div>
      <Divider/>
      <div className="space-y-3 overflow-y-scroll">
        <TextInput
          defaultValue={form.name}
          onContentChange={newValue => handleChange("name", newValue)}
          placeholder="名前を入力してください"
          required
          label="隊列名前"
          restrictFn={(s) => !testInvalidCharacters(s)}
          ref={nameRef}
          showLength
        />
        <CustomAutocomplete
          defaultValue={choreo.event}
          options={eventList}
          onContentChange={newValue => handleChange("eventName", newValue)}
          placeholder="イベント名を入力してください"
          required
          label="イベント（任意）"
          ref={eventRef}
          showLength
          // restrictFn={(s) => !testInvalidCharacters(s)} // todo: after pushing the official goen change to restrict
        />
        <CustomSwitch
          label="公開する"
          defaultChecked={!form.isHidden}
          onChange={checked => handleChange("isHidden", !checked)}
          ref={isHiddenRef}
        />
        {
          choreo.version !== 0 && !form.choreo &&
          <div className="flex-1 pt-4 justify-self-center">
            <Button onClick={() => versionUp()}>
              バージョンアップ
            </Button>
          </div>
        }
        {
          form.choreo &&
          <Label text="バージョンアップ"/>
        }
        {
          form.choreo &&
          <div className="grid grid-cols-[1fr,auto,auto] items-center w-full gap-2">
            <div className="px-2 py-1 bg-white border rounded-lg border-primary">
              <div className="flex flex-row justify-between">
                <span className="text-sm font-semibold text-primary">
                  {isNullOrUndefinedOrBlank(form.choreo.event) ? "イベント不明" : form.choreo.event}
                </span>
                {
                  form.choreo.version &&
                  <Tag compact text={`v${form.choreo.version}`} icon={ICON.edit} type="primary"/>
                }
              </div>
              <p className="font-bold text-wrap">
                {form.choreo.name}
              </p>
              {
                form.choreo.lastUpdated && 
                <div className="flex items-center text-sm">
                  <Icon src={ICON.history} size="xs" colour="grey"/>
                  {getDate(new Date(form.choreo.lastUpdated))}
                </div>
              }
            </div>
            <IconButton
              onClick={() => setSelectChoreoDialogOpen(true)}
              size="sm" noBorder colour="primary" src={ICON.replay}/>
            <IconButton
              onClick={() => {setForm(prev => ({...prev, choreo: undefined}))}}
              size="sm" noBorder colour="primary" src={ICON.delete}/>
          </div>
        }
      </div>
      <div className="flex flex-col justify-end flex-1 gap-2 pb-8">
        {
          form.choreo &&
          <div className="text-center">
            公開のバージョンが <span className="underline"><b>v{choreo.version}</b> → <b>v{choreo.version + 1}</b></span> に変更される
          </div>
        }
        <div className="flex justify-between gap-4">
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
            disabled={isNullOrUndefinedOrBlank(form.name) || isNullOrUndefinedOrBlank(form.eventName)}
          >
            <span className="font-semibold">
              保存
            </span>
          </Button>
        </div>
      </div>

      <Dialog.Root
        open={selectChoreoDialogOpen}
        onOpenChange={handleSelectChoreoDialogOpenChange}
        handle={selectChoreoDialog}>
        <SelectChoreoDialog
          title="更新ファイルを選択"
          choreos={localChoreos}
          onSubmit={(choreo) => {
            form.choreo = choreo;
            setSelectChoreoDialogOpen(false);
          }}
          currentChoreoId={form.choreo?.id}
          selectDefault
        />
      </Dialog.Root>
    </div>
  );
}