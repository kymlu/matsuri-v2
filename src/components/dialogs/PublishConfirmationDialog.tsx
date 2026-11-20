import { PASSWORD_LENGTH } from "../../lib/consts/consts";
import { formatDateRange, getDate } from "../../lib/helpers/dateHelper";
import { findCurrentVersion, publishChoreo } from "../../lib/helpers/apiHelper";
import { isNullOrUndefinedOrBlank, strEquals, testAlphanumericSymbols } from "../../lib/helpers/globalHelper";
import { BasicChoreoDetails, Choreo } from "../../models/choreo";
import BaseEditDialog from "./BaseEditDialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomSwitch from "../inputs/CustomSwitch";
import TextInput from "../inputs/TextInput";
import { Tag } from "../common/Tag";

type PublishConfirmationDialogProps = {
  onClose: () => void,
  onSave: (newChoreo: Choreo) => void,
  currentVersion: BasicChoreoDetails,
  oldVersion?: BasicChoreoDetails,
  getChoreo: () => Choreo,
  teamId: string,
  svrPassword?: string
}

export default function PublishConfirmationDialog({
  onClose, onSave, currentVersion, oldVersion, getChoreo, teamId, svrPassword
}: PublishConfirmationDialogProps) {
  const [error, setError] = useState<"none" | "error" | "versionError">("none");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasPassword, setHasPassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  // TODO: fetch password hash
  // to test: not checked -> null
  // to test: checked -> no value -> null
  // to test: checked -> value
  
  const isUpdate = !!oldVersion;

  useEffect(() => {
    if (svrPassword) {
      setPassword(svrPassword);
      setHasPassword(true);
    } else {
      setPassword("");
      setHasPassword(false);
    }
  }, [svrPassword]);

  const upload = useCallback(async () => {
    if (!isProcessing) {
      setIsProcessing(true);
      setError("none");
      try {
        if (oldVersion) {
          const serverVersion = await findCurrentVersion(teamId, currentVersion.id);
          if (serverVersion.version !== (oldVersion?.version ?? 0)) {
            setError("versionError");
            setIsProcessing(false);
            return;
          }
        }
        let choreo = {...getChoreo()};
        choreo.isDirty = undefined;
        publishChoreo(
          teamId,
          choreo,
          !isUpdate,
          (newChoreo: Choreo) => {
            onSave(newChoreo);
            setError("none");
          },
          (status) => {
            setError("error");
            setIsProcessing(false);
          },
          (hasPassword && !isNullOrUndefinedOrBlank(password)) ? password : undefined
        );
      } catch (e: any) {
        setError("error");
        if (e instanceof Error) {
          console.error(e.message);
        } else {
          console.error("An error has occurred", e);
        }
        setIsProcessing(false);
      }
    }
  }, [publishChoreo, teamId, hasPassword, password, onSave, onClose, isUpdate, oldVersion?.version]);


  const isActionButtonEnabled = useMemo(() => {
    const newPassword = hasPassword && !isNullOrUndefinedOrBlank(password) ? password : "";
    return !isUpdate || !!currentVersion.isDirty || !strEquals(newPassword, svrPassword ?? "");
  }, [isUpdate, currentVersion.isDirty, hasPassword, password, svrPassword]);

  return (
    <BaseEditDialog
      title="公開確認"
      actionButtonText="公開する"
      isActionButtonDisabled={!isActionButtonEnabled}
      onSubmit={upload}
      onClose={() => {
        onClose();
        setIsProcessing(false);
        setError("none");
        if (svrPassword) {
          setPassword(svrPassword);
          setHasPassword(true);
        } else {
          setPassword("");
          setHasPassword(false);
        }
      }}
    >
      <div className="space-y-3">
        <div className="flex flex-col">
          <span className="font-bold break-all">{currentVersion.name}</span>
          <span className="text-sm text-muted">
            {isNullOrUndefinedOrBlank(currentVersion.event) ? "イベント不明" : currentVersion.event}
            （{formatDateRange(currentVersion.startDate, currentVersion.endDate)}）
          </span>
        </div>
        {
          isActionButtonEnabled ?
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {isUpdate && <><Tag compact type="primary" text={`v${oldVersion.version ?? 0}`}/><span className="text-muted">→</span></>}
            <Tag compact type="filled" text={`v${(oldVersion?.version ?? 0) + 1}`}/>
            {currentVersion.lastUpdated && <span className="text-sm text-muted">最終編集 {getDate(new Date(currentVersion.lastUpdated))}</span>}
          </div> :
          <p className="font-semibold text-primary">編集はありません</p>
        }
        <div className="border-t border-line"/>
        <div>
          <CustomSwitch
            label="パスワード"
            hint="ログインしていない人が見るときに必要"
            defaultChecked={hasPassword}
            onChange={(checked) => setHasPassword(checked)}/>
          {
            hasPassword &&
            <TextInput
              showLength
              defaultValue={password}
              maxLength={PASSWORD_LENGTH}
              restrictFn={(s) => testAlphanumericSymbols(s)}
              onContentChange={(newContent) => setPassword(newContent)}/>
          }
        </div>
        {
          isProcessing &&
          <p className="w-full font-semibold text-center text-primary">
            処理中…
          </p>
        }
        {
          error === "error" && 
          <p className="w-full font-semibold text-center text-primary">
            処理中に問題が発生しました
          </p>
        }
        {
          error === "versionError" && 
          <p className="w-full font-semibold text-center text-primary">
            他のユーザーによって更新されました。ホームに戻って最新バージョンをご確認ください。
          </p>
        }
      </div>
    </BaseEditDialog>
  );
}
