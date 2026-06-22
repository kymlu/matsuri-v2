import { ICON } from "../../lib/consts/consts";
import { formatDateRange, getJpDate } from "../../lib/helpers/dateHelper";
import { findCurrentVersion, publishChoreo } from "../../lib/helpers/apiHelper";
import { strEquals, testAlphanumeric } from "../../lib/helpers/globalHelper";
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
  icon?: string;
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
            hasPassword ? password : undefined
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
      icon: ICON.label,
      new: currentVersion.name,
      old: oldVersion?.name,
    });
    if (currentVersion.event || oldVersion?.event) {
      rowList.push({
        icon: ICON.calendarToday,
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
          icon: ICON.resize,
          new: `${currentVersion.stageLength}m×${currentVersion.stageWidth}m`,
          old: oldVersion ? `${oldVersion.stageLength}m×${oldVersion.stageWidth}m` : undefined,
        },
        {
          icon: ICON.group,
          new: `${currentVersion.dancerCount}人`,
          old: oldVersion ? `${oldVersion.dancerCount}人` : undefined,
        },
        {
          icon: ICON.flag,
          new: `${currentVersion.propCount}`,
          old: oldVersion ? `${oldVersion.propCount}` : undefined,
        },
        {
          icon: ICON.history,
          new: currentVersion.lastUpdated ? getJpDate(new Date(currentVersion.lastUpdated)) : "",
          old: oldVersion?.lastUpdated ? getJpDate(new Date(oldVersion.lastUpdated)) : undefined,
        },
      ]
    ];
    return rowList;
  }, [currentVersion, oldVersion])

  return (
    <BaseEditDialog
      title="公開確認"
      actionButtonText="公開する"
      isActionButtonDisabled={isProcessing}
      onSubmit={upload}
      onClose={() => {
        onClose();
        setIsProcessing(false);
        setError("none");
      }}
    >
      <div className={`flex flex-col gap-2 ${isUpdate ? "w-[70svw]" : ""}`}>
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
            {isUpdate && (
              <tr>
                <td className="py-0.5 pr-2 w-4" />
                <td className="py-0.5 pr-2 line-through text-gray-400">
                  v{oldVersion.version}
                </td>
                <td className="py-0.5 font-semibold">
                  v{oldVersion.version!! + 1}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <CustomSwitch
          label="パスワード"
          defaultChecked={hasPassword}
          onChange={(checked) => setHasPassword(checked)}/>
        <TextInput
          defaultValue={password}
          disabled={!hasPassword}
          restrictFn={(s) => testAlphanumeric(s)}
          onContentChange={(newContent) => setPassword(newContent)}/>
        <Divider />
        <span>
          {isUpdate ? "新バージョンをアップロードしますか？" : "新しいファイルとしてアップロードしますか？"}
        </span>
        {
          !currentVersion.isDirty &&
          <span className="w-full font-semibold text-center text-gray-600">
            編集はありません
          </span>
        }
        {
          isProcessing &&
          <span className="w-full font-semibold text-center text-primary">
            処理中...
          </span>
        }
        {
          error === "error" && 
          <span className="w-full font-semibold text-center text-primary">
            処理中にエラーが発生しました
          </span>
        }
        {
          error === "versionError" && 
          <span className="w-full font-semibold text-center text-primary">
            他のユーザーによって更新されました。ホームに戻って最新バージョンをご確認ください。
          </span>
        }
      </div>
    </BaseEditDialog>
  );
}
