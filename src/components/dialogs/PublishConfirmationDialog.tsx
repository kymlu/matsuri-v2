import { PASSWORD_LENGTH } from "../../lib/consts/consts";
import { formatDateRange, getJpDate } from "../../lib/helpers/dateHelper";
import { findCurrentVersion, publishChoreo } from "../../lib/helpers/apiHelper";
import { isNullOrUndefinedOrBlank, strEquals, testAlphanumericSymbols } from "../../lib/helpers/globalHelper";
import { BasicChoreoDetails, Choreo } from "../../models/choreo";
import Divider from "../basic/Divider";
import Icon from "../basic/Icon";
import BaseEditDialog from "./BaseEditDialog";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CustomSwitch from "../inputs/CustomSwitch";
import TextInput from "../inputs/TextInput";
import { DancerCount, PropCount, StageSize } from "../common/IconInfo";

type PublishConfirmationDialogProps = {
  onClose: () => void,
  onSave: (newChoreo: Choreo) => void,
  currentVersion: BasicChoreoDetails,
  oldVersion?: BasicChoreoDetails,
  getChoreo: () => Choreo,
  teamId: string,
  svrPassword?: string
}

type Diff = {
  type: "隊列名" | "ステージ幅" | "イベント" | "日程" | "ダンサー数" | "道具数";
  oldValue: string,
  newValue: string,
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

  const changes = useMemo(() => {
    var list: Diff[] = [];
    if (isUpdate) {
      if (!strEquals(oldVersion.name, currentVersion.name)) {
        list.push({type: "隊列名", oldValue: oldVersion?.name, newValue: currentVersion.name});
      }
      if (!strEquals(oldVersion.event, currentVersion.event)) {
        list.push({type: "イベント", oldValue: oldVersion?.event ?? "", newValue: currentVersion.event ?? ""});
      }
      if (!strEquals(oldVersion.startDate, currentVersion.startDate) || !strEquals(oldVersion.endDate, currentVersion.endDate)) {
        list.push({type: "日程", oldValue: formatDateRange(oldVersion.startDate, oldVersion.endDate), newValue: formatDateRange(currentVersion.startDate, currentVersion.endDate)});
      }
      if (oldVersion.stageLength !== currentVersion.stageLength || oldVersion.stageWidth !== currentVersion.stageWidth) {
        list.push({type: "ステージ幅", oldValue: `${oldVersion.stageLength}m×${oldVersion.stageWidth}m` , newValue: `${currentVersion.stageLength}m×${currentVersion.stageWidth}m`});
      }
      if (oldVersion.dancerCount !== currentVersion.dancerCount) {
        list.push({type: "ダンサー数", oldValue: `${oldVersion.dancerCount}人`, newValue: `${currentVersion.dancerCount}人`});
      }
      if (oldVersion.propCount !== currentVersion.propCount) {
        list.push({type: "道具数", oldValue: `${oldVersion.propCount}`, newValue: `${currentVersion.propCount}`});
      }
    }
    return list;
  }, [currentVersion, oldVersion]);

  return (
    <BaseEditDialog
      title="公開確認"
      actionButtonText="公開する"
      isActionButtonDisabled={!isActionButtonEnabled}
      onSubmit={upload}
      fullWidth
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
        <div className="space-y-2 max-h-[50svh]">
          <div className="flex items-center gap-2">
            <Icon src="label" size="sm"/>
            <div>
              <div className="text-sm text-gray-600">隊列名</div>
              <b>{currentVersion.name}</b>
            </div>
          </div>
          {
            currentVersion.event &&
            <div className="flex items-center gap-2">
              <Icon src="calendarToday" size="sm"/>
              <div>
                <div className="text-sm text-gray-600">イベント情報</div>
                <b>{currentVersion.event}</b>
                <div>{formatDateRange(currentVersion.startDate, currentVersion.endDate)}</div>
              </div>
            </div>
          }
          <div className="flex gap-4">
            <StageSize stageLength={currentVersion.stageLength} stageWidth={currentVersion.stageWidth}/>
            <DancerCount dancerCount={currentVersion.dancerCount}/>
            <PropCount propCount={currentVersion.propCount}/>
          </div>
          {
            changes.length > 0 && <>
              <Divider />
              <b>変更内容</b>
              <div className="px-2">
                {
                  changes.map((c) => <React.Fragment key={c.type}>
                    <div className="text-sm text-gray-600">{c.type}</div>
                    <div><span className="text-gray-600 line-through">{c.oldValue}</span> → <span className="font-semibold">{c.newValue}</span></div>
                  </React.Fragment>)
                }
              </div>
            </>
          }
          <Divider />
          <div className="grid items-center gap-y-1 grid-cols-[auto,1fr] px-2 text-sm text-gray-600">
            <b>最終編集日時</b>
            <span className="text-right">{currentVersion.lastUpdated ? getJpDate(new Date(currentVersion.lastUpdated)) : ""}</span>
            {
              isActionButtonEnabled &&
              <>
                <b>公開バージョン</b>
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
