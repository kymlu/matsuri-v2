import { useEffect, useMemo, useState } from "react"
import TextInput from "../inputs/TextInput"
import BaseEditDialog from "./BaseEditDialog"
import { Dancer } from "../../models/dancer"
import { isNullOrUndefinedOrBlank, strCompare, testInvalidCharacters } from "../../lib/helpers/globalHelper"
import CustomSelect from "../inputs/CustomSelect"
import CustomDialog from "../basic/CustomDialog"
import { Choreo } from "../../models/choreo"
import { exportToPdf } from "../../lib/helpers/exportHelper"

type ExportDialogProps = {
  choreo: Choreo,
  selectedId: string,
  onClose: () => void,
}

export default function ExportDialog({
  choreo, selectedId, onClose
}: ExportDialogProps) {
  const [step, setStep] = useState<"prep" | "export">("prep");
  const [exportName, setExportName] = useState<string>("");
  const [followingId, setFollowingId] = useState<string>(selectedId);
  const [progress, setProgress] = useState<number>(0);

  const isExportNameValid = useMemo(() => {
    return !isNullOrUndefinedOrBlank(exportName) && RegExp(/[<>:"/\\|?*\u0000-\u001F]|[. ]$/g).test(exportName);
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

  useEffect(() => {
    setExportName(choreo.name)
  }, [choreo]);

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
            (progress) => {
              setProgress(progress);
            },
            onClose);
        }}
        onClose={() => {
          onClose();
          setFollowingId("");
        }}
        isActionButtonDisabled={isExportNameValid}
      >
        <div className="flex items-center gap-2">
          <TextInput
            label="ファイル名"
            rightLabel=".pdf"
            hasError={isExportNameValid}
            defaultValue={choreo.name}
            restrictFn={(s) => !testInvalidCharacters(s)}
            onContentChange={(name) => {
              setExportName(name);
            }}/>
        </div>

        {
          Object.values(choreo.dancers).length > 0 &&
          <CustomSelect
            label="中心人物"
            items={dancerList}
            defaultValue={choreo.dancers[selectedId]?.name ?? "未設定"}
            setSelectValue={(newValue) => {
              setFollowingId(newValue);
            }}
            />
        }
        
      </BaseEditDialog>
    }
    {
      step === "export" &&
      <CustomDialog title="PDF出力中">
        <b>{choreo.name}</b>のPDFを生成しています。<br></br>完了までしばらくお待ちください。<br></br>進行状況：{progress}%
      </CustomDialog>
    }
  </>
}