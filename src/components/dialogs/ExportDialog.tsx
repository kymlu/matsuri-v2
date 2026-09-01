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
}

function ExportDialog({
  choreo, selectedId, onClose, showPaths
}: ExportDialogProps) {
  const [step, setStep] = useState<"prep" | "export">("prep");
  const [exportName, setExportName] = useState<string>("");
  const [followingId, setFollowingId] = useState<string>(selectedId);
  const [showFollowingPath, setShowFollowingPath] = useState<boolean>(showPaths ?? false);
  const [includePersonalNotes, setIncludePersonalNotes] = useState<boolean>(true);
  const [exportAllDancers, setExportAllDancers] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentDancer, setCurrentDancer] = useState<{ name: string; index: number; total: number } | undefined>(undefined);

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
        followingId,
        showFollowingPath,
        includePersonalNotes,
        setProgress,
        onClose);
    }
  }, [exportAllDancers, choreo, exportName, showFollowingPath, includePersonalNotes, followingId, onClose]);

  const handleClose = useCallback(() => {
    onClose();
    setFollowingId("");
    setStep("prep");
    setShowFollowingPath(false);
    setIncludePersonalNotes(true);
    setExportAllDancers(false);
    setCurrentDancer(undefined);
  }, [onClose]);

  return <>
    {
      step === "prep" &&
      <BaseEditDialog
        title="PDFエクスポート"
        actionButtonText="エクスポート"
        onSubmit={handleSubmit}
        onClose={handleClose}
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
            Object.values(choreo.dancers).length > 0 &&
            <>
              <CustomSwitch
                label="全ダンサー分をまとめて出力"
                defaultChecked={false}
                onChange={setExportAllDancers}
              />
              <CustomSelect
                label="追跡ダンサー"
                items={dancerList}
                defaultValue={choreo.dancers[selectedId]?.name ?? "未設定"}
                disabled={exportAllDancers}
                setSelectValue={setFollowingId}
                />
            </>
          }
          {
            <CustomSwitch
              label="動線表示"
              disabled={isNullOrUndefinedOrBlank(followingId) && !exportAllDancers}
              defaultChecked={showPaths === undefined ? false : showPaths}
              onChange={setShowFollowingPath}
            />
          }
          
          <Divider/>
          
          <CustomSwitch
            label="自分用メモを含める"
            defaultChecked={true}
            onChange={setIncludePersonalNotes}
          />
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