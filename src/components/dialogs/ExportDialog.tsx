import { useEffect, useMemo, useState } from "react"
import TextInput from "../inputs/TextInput"
import BaseEditDialog from "./BaseEditDialog"
import { Dancer } from "../../models/dancer"
import { getDefaultFileName, isNullOrUndefinedOrBlank, strCompare, testInvalidCharacters } from "../../lib/helpers/globalHelper"
import CustomSelect from "../inputs/CustomSelect"
import CustomDialog from "../basic/CustomDialog"
import { Choreo } from "../../models/choreo"
import { exportToPdf } from "../../lib/helpers/exportHelper"
import CustomSwitch from "../inputs/CustomSwitch"
import { EXPORT_NAME_LENGTH } from "../../lib/consts/consts"

type ExportDialogProps = {
  choreo: Choreo,
  selectedId: string,
  onClose: () => void,
  showPaths?: boolean,
}

export default function ExportDialog({
  choreo, selectedId, onClose, showPaths
}: ExportDialogProps) {
  const [step, setStep] = useState<"prep" | "export">("prep");
  const [exportName, setExportName] = useState<string>("");
  const [followingId, setFollowingId] = useState<string>(selectedId);
  const [showFollowingPath, setShowFollowingPath] = useState<boolean>(showPaths ?? false);
  const [includePersonalNotes, setIncludePersonalNotes] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  const isExportNameValid = useMemo(() => {
    return !isNullOrUndefinedOrBlank(exportName.trim()) && RegExp(/[<>:"/\\|?*]|[. ]$/g).test(exportName.trim());
  }, [exportName]);

  const dancerList = useMemo(() => {
    const record: Record<string, string> = {};
    record[""] = "未設定"
    Object.values(choreo.dancers)
      .sort((a, b) => strCompare<Dancer>(a, b, "name"))
      .forEach((dancer) => {
        record[dancer.id] = dancer.name;
      });
    return record;
  }, [choreo]);

  const defaultName = useMemo(() => {
    return getDefaultFileName(choreo);
  }, [choreo]);

  useEffect(() => {
    setExportName(defaultName);
  }, [defaultName]);

  return <>
    {
      step === "prep" &&
      <BaseEditDialog
        title="PDFエクスポート"
        actionButtonText="エクスポート"
        onSubmit={async () => {
          setStep("export");
          await exportToPdf(choreo,
            exportName,
            followingId,
            showFollowingPath,
            includePersonalNotes,
            (progress) => {
              setProgress(progress);
            },
            onClose);
        }}
        onClose={() => {
          onClose();
          setFollowingId("");
          setStep("prep");
          setShowFollowingPath(false);
          setIncludePersonalNotes(true);
        }}
        isActionButtonDisabled={isExportNameValid}
      >
        <div className="max-w-full w-[100svw] md:w-max">
          <div className="flex items-center gap-2">
            <TextInput
              label="ファイル名"
              required
              rightLabel=".pdf"
              maxLength={EXPORT_NAME_LENGTH}
              hasError={isExportNameValid}
              defaultValue={defaultName}
              restrictFn={(s) => !testInvalidCharacters(s)}
              onContentChange={(name) => {
                setExportName(name);
              }}
              showLength
              />
          </div>

          {
            Object.values(choreo.dancers).length > 0 &&
            <CustomSelect
              label="追跡ダンサー"
              items={dancerList}
              defaultValue={choreo.dancers[selectedId]?.name ?? "未設定"}
              setSelectValue={(newValue) => {
                setFollowingId(newValue);
              }}
              />
          }
          {
            <CustomSwitch
              label="動線表示"
              disabled={isNullOrUndefinedOrBlank(followingId)}
              defaultChecked={showPaths === undefined ? false : showPaths}
              onChange={(checked) => setShowFollowingPath(checked)}
            />
          }
          <CustomSwitch
            label="自分用メモを含める"
            defaultChecked={true}
            onChange={(checked) => setIncludePersonalNotes(checked)}
          />
        </div>
      </BaseEditDialog>
    }
    {
      step === "export" &&
      <CustomDialog title="PDF生成中">
        <p className="max-w-full w-max">
          <b>{choreo.name}</b>のPDFを生成しています。<br/>完了までしばらくお待ちください。<br/>進行状況：{progress}%
        </p>
      </CustomDialog>
    }
  </>
}