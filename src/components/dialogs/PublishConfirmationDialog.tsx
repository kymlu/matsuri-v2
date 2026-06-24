import { ICON, PASSWORD_LENGTH } from "../../lib/consts/consts";
import { formatDateRange, getJpDate } from "../../lib/helpers/dateHelper";
import { findCurrentVersion, publishChoreo } from "../../lib/helpers/apiHelper";
import { isNullOrUndefinedOrBlank, strEquals, testAlphanumeric } from "../../lib/helpers/globalHelper";
import { BasicChoreoDetails, Choreo } from "../../models/choreo";
import Divider from "../basic/Divider";
import Icon from "../basic/Icon";
import BaseEditDialog from "./BaseEditDialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomSwitch from "../inputs/CustomSwitch";
import TextInput from "../inputs/TextInput";

type PublishConfirmationDialogProps = {
  onClose: () => void,
  onSave: (newChoreo: Choreo) => void,
  currentVersion: BasicChoreoDetails,
  oldVersion?: BasicChoreoDetails,
  getChoreo: () => Choreo,
  teamId: string,
  svrPassword?: string
}

type Row = {
  icon?: keyof typeof ICON;
  old?: string;
  new: string;
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
        const serverVersion = await findCurrentVersion(teamId, currentVersion.id);
        if (serverVersion.version !== (oldVersion?.version ?? 0)) {
          setError("versionError");
          setIsProcessing(false);
        } else {
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
        }
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

  const rows = useMemo(() => {
    var rowList: Row[] = [];
    rowList.push({
      icon: "label",
      new: currentVersion.name,
      old: oldVersion?.name,
    });
    if (currentVersion.event || oldVersion?.event) {
      rowList.push({
        icon: "calendarToday",
        new: `${currentVersion.event}`,
        old: oldVersion ? `${oldVersion.event}` : undefined,
      });
      
      if (currentVersion.startDate || currentVersion.endDate || oldVersion?.startDate || oldVersion?.endDate) {
        rowList.push({
          new: formatDateRange(currentVersion.startDate, currentVersion.endDate),
          old: oldVersion ? formatDateRange(oldVersion.startDate, oldVersion.endDate) : undefined,
        });
      }
    }
    rowList = [...rowList, ...[
        {
          icon: "resize",
          new: `${currentVersion.stageLength}m×${currentVersion.stageWidth}m`,
          old: oldVersion ? `${oldVersion.stageLength}m×${oldVersion.stageWidth}m` : undefined,
        } as Row,
        {
          icon: "group",
          new: `${currentVersion.dancerCount}人`,
          old: oldVersion ? `${oldVersion.dancerCount}人` : undefined,
        } as Row,
        {
          icon: "flag",
          new: `${currentVersion.propCount}`,
          old: oldVersion ? `${oldVersion.propCount}` : undefined,
        } as Row,
      ]
    ];
    return rowList;
  }, [currentVersion, oldVersion]);

  const hasChanges = useMemo(()=> {
    return currentVersion.isDirty || !strEquals(svrPassword, password) || hasPassword !== !isNullOrUndefinedOrBlank(svrPassword);
  }, [currentVersion.isDirty]);

  return (
    <BaseEditDialog
      title="公開確認"
      actionButtonText="公開する"
      isActionButtonDisabled={!hasChanges}
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
      <div className={`space-y-2 ${isUpdate ? "w-[70svw]" : ""}`}>
        <div className="space-y-2 max-h-[50svh]">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row, i) => {
                const hasChange = isUpdate && row.old !== undefined && !strEquals(row.old, row.new);
                return (
                  <tr key={i}>
                    <td className="w-4 pt-2 pr-2 text-gray-400 align-middle">
                      {row.icon && <Icon src={row.icon} colour="grey" size="sm" />}
                    </td>
                    {
                      isUpdate && (
                        <td
                          className={`py-0.5 pr-2 align-middle ${hasChange ? "line-through text-gray-400" : ""}`}>
                          {row.old}
                        </td>
                      )
                    }
                    {
                      (!isUpdate || hasChange) &&
                      <td
                        colSpan={isUpdate ? 1 : 2}
                        className={`py-0.5 align-middle ${hasChange ? "font-semibold" : ""}`}>
                        {row.new}
                      </td>
                    }
                  </tr>
                );
              })}
            </tbody>
          </table>
          <CustomSwitch
            label="パスワード（英数字のみ）"
            defaultChecked={hasPassword}
            onChange={(checked) => setHasPassword(checked)}/>
          <TextInput
            showLength
            defaultValue={password}
            disabled={!hasPassword}
            maxLength={PASSWORD_LENGTH}
            restrictFn={(s) => testAlphanumeric(s)}
            onContentChange={(newContent) => setPassword(newContent)}/>
        </div>
        <Divider />
        <p>最終編集日時：{currentVersion.lastUpdated ? getJpDate(new Date(currentVersion.lastUpdated)) : ""}</p>
        {
          !hasChanges &&
          <p className="w-full font-semibold text-center text-primary">
            編集はありません。
          </p>
        }
        { hasChanges && isUpdate &&
          <p>公開バージョン：{oldVersion.version!! + 1}</p>
        }
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
