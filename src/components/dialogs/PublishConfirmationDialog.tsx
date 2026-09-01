import { PASSWORD_LENGTH } from "../../lib/consts/consts";
import { getJpDate } from "../../lib/helpers/dateHelper";
import { findCurrentVersion, publishChoreo } from "../../lib/helpers/apiHelper";
import { isNullOrUndefinedOrBlank, strEquals, testAlphanumericSymbols } from "../../lib/helpers/globalHelper";
import { BasicChoreoDetails, Choreo } from "../../models/choreo";
import Divider from "../basic/Divider";
import BaseEditDialog from "./BaseEditDialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomSwitch from "../inputs/CustomSwitch";
import TextInput from "../inputs/TextInput";
import { DancerCount, PropCount, StageSize } from "../common/IconInfo";
import ChoreoInfo from "../common/ChoreoInfo";

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


  const isActionButtonEnabled = useMemo(()=> {
    return currentVersion.isDirty ||
      !strEquals(svrPassword, password) ||
      hasPassword !== !isNullOrUndefinedOrBlank(svrPassword);
  }, [currentVersion.isDirty]);

  return (
    <BaseEditDialog
      title="公開確認"
      actionButtonText="公開する"
      isActionButtonDisabled={!isActionButtonEnabled}
      onSubmit={upload}
      full
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
      <div className="space-y-2">
        <div className="space-y-2 overflow-y-auto">
          <ChoreoInfo
            name={currentVersion.name}
            event={currentVersion.event}
            startDate={currentVersion.startDate}
            endDate={currentVersion.endDate}/>
          <div className="flex gap-4">
            <StageSize stageLength={currentVersion.stageLength} stageWidth={currentVersion.stageWidth}/>
            <DancerCount dancerCount={currentVersion.dancerCount}/>
            <PropCount propCount={currentVersion.propCount}/>
          </div>
          <Divider />
          <div className="grid items-center gap-y-1 grid-cols-[auto,1fr] px-2 text-sm text-muted">
            <b>最終編集日時</b>
            <span className="text-right">{currentVersion.lastUpdated ? getJpDate(new Date(currentVersion.lastUpdated)) : ""}</span>
            {
              isActionButtonEnabled &&
              <>
                <b>新しい公開バージョン</b>
                <span className="text-right">{(oldVersion?.version ?? 0) + 1}</span>
              </>
            }
            {
              !isActionButtonEnabled &&
              <span className="col-span-2 font-semibold text-center text-primary">編集はありません。</span>
            }
          </div>
          <Divider />
          <CustomSwitch
            label="パスワード"
            defaultChecked={hasPassword}
            onChange={(checked) => setHasPassword(checked)}/>
          <TextInput
            showLength
            defaultValue={password}
            disabled={!hasPassword}
            maxLength={PASSWORD_LENGTH}
            restrictFn={(s) => testAlphanumericSymbols(s)}
            onContentChange={(newContent) => setPassword(newContent)}/>
          <span className="text-sm text-muted">
            ログインしていないユーザーがこの隊列表を閲覧する際にパスワードの入力が必要になります。
          </span>
        </div>
        {
          isProcessing &&
          <p className="w-full font-semibold text-center text-primary">
            処理中...
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
