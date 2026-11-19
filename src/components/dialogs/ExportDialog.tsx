import { memo, useCallback, useEffect, useMemo, useState } from "react"
import TextInput from "../inputs/TextInput"
import BaseEditDialog from "./BaseEditDialog"
import { Dancer } from "../../models/dancer"
import { getDefaultFileName, isNullOrUndefinedOrBlank, strCompare, testInvalidCharacters } from "../../lib/helpers/globalHelper"
import CustomSelect from "../inputs/CustomSelect"
import CustomDialog from "../basic/CustomDialog"
import { Choreo } from "../../models/choreo"
import { exportAllDancersToPdf, exportToPdf } from "../../lib/helpers/exportHelper"
import CustomSwitch from "../inputs/CustomSwitch"
import { EXPORT_NAME_LENGTH } from "../../lib/consts/consts"
import Divider from "../basic/Divider"

type ExportDialogProps = {
  choreo: Choreo,
  selectedId: string,
  onClose: () => void,
  showPaths?: boolean,
  canIncludePersonalNotes?: boolean,
}

const ALL = "all";

function ExportDialog({
  choreo, selectedId, onClose, showPaths, canIncludePersonalNotes = true
}: ExportDialogProps) {
  const [step, setStep] = useState<"prep" | "export">("prep");
  const [exportName, setExportName] = useState<string>("");
  const [highlight, setHighlight] = useState<string>(selectedId); // "", ALL or a dancer id
  const [showFollowingPath, setShowFollowingPath] = useState<boolean>(showPaths ?? false);
  const [includePersonalNotes, setIncludePersonalNotes] = useState<boolean>(canIncludePersonalNotes);
  const [progress, setProgress] = useState<number>(0);
  const [currentDancer, setCurrentDancer] = useState<{ name: string; index: number; total: number } | undefined>(undefined);

  const isExportNameValid = useMemo(() => {
    return !isNullOrUndefinedOrBlank(exportName.trim()) && RegExp(/[<>:"/\\|?*]|[. ]$/g).test(exportName.trim());
  }, [exportName]);

  const dancerCount = Object.keys(choreo.dancers).length;
  const exportAllDancers = highlight === ALL;
  const dancerList = useMemo(() => {
    const record: Record<string, string> = {};
    record[""] = "なし";
    record[ALL] = "全員（1人ずつ）";
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

  const handleSubmit = useCallback(async () => {
    setStep("export");
    if (exportAllDancers) {
      await exportAllDancersToPdf(choreo,
        exportName,
        showFollowingPath,
        includePersonalNotes,
        setProgress,
        setCurrentDancer,
        onClose);
    } else {
      await exportToPdf(choreo,
        exportName,
        highlight,
        highlight !== "" && showFollowingPath,
        includePersonalNotes,
        setProgress,
        onClose);
    }
  }, [exportAllDancers, choreo, exportName, showFollowingPath, includePersonalNotes, highlight, onClose]);

  return <>
    {
      step === "prep" &&
      <BaseEditDialog
        title="PDFエクスポート"
        actionButtonText="エクスポート"
        onSubmit={handleSubmit}
        onClose={onClose}
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
              onContentChange={setExportName}
              showLength
              />
          </div>

          <Divider/>

          {
            dancerCount > 0 &&
            <>
              <CustomSelect
                label="強調するダンサー"
                items={dancerList}
                defaultValue={dancerList[selectedId] ?? dancerList[""]}
                setSelectValue={setHighlight}
                />
              {
                exportAllDancers &&
                <p className="mt-1 text-xs text-muted">ダンサーごとのページを1つのPDFにまとめます（{dancerCount}人分）</p>
              }
              {
                highlight !== "" &&
                <CustomSwitch
                  label="動線を表示"
                  defaultChecked={showFollowingPath}
                  onChange={setShowFollowingPath}
                />
              }
            </>
          }
          {
            canIncludePersonalNotes &&
            <>
              <Divider/>
              <CustomSwitch
                label="自分用メモを含める"
                defaultChecked={true}
                onChange={setIncludePersonalNotes}
              />
            </>
          }
        </div>
      </BaseEditDialog>
    }
    {
      step === "export" &&
      <CustomDialog title="PDF生成中">
        <p className="max-w-full w-max">
          <b>{choreo.name}</b>のPDFを生成しています。<br/>
          完了までしばらくお待ちください。<br/>
          {
            exportAllDancers && currentDancer &&
            <><b>{currentDancer.name}</b>さん（{currentDancer.index}/{currentDancer.total}人）<br/></>
          }
          進行状況：{progress}%
        </p>
      </CustomDialog>
    }
  </>
}

export default memo(ExportDialog);