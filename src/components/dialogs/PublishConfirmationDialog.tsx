import { ICON } from "../../lib/consts/consts";
import { formatDateRange, getJpDate } from "../../lib/helpers/dateHelper";
import { uploadChoreo } from "../../lib/helpers/apiHelper";
import { strEquals } from "../../lib/helpers/globalHelper";
import { BasicChoreoDetails, Choreo } from "../../models/choreo";
import Divider from "../basic/Divider";
import Icon from "../basic/Icon";
import BaseEditDialog from "./BaseEditDialog";
import { useCallback, useMemo, useState } from "react";

type PublishConfirmationDialogProps = {
  onClose: () => void,
  onSave: () => void,
  currentVersion: BasicChoreoDetails,
  oldVersion?: BasicChoreoDetails,
  getChoreo: () => Choreo,
}

type Row = {
  icon?: string;
  old?: string;
  new: string;
}

export default function PublishConfirmationDialog({
  onClose, onSave, currentVersion, oldVersion, getChoreo,
}: PublishConfirmationDialogProps) {
  const [error, setError] = useState<"none" | "error">("none");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const upload = useCallback(() => {
    if (!isProcessing) {
      setIsProcessing(true);
      try {
        uploadChoreo(
          getChoreo(),
          () => {
            onSave();
            setError("none");
          },
          (status) => {
            setError("error");
            setIsProcessing(false);
          }
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
  }, [uploadChoreo]);

  const isUpdate = !!oldVersion;

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
    }
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
                    !isUpdate &&
                    <td
                      colSpan={!hasChange ? 2 : 1}
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
        <Divider />
        <span>
          {isUpdate ? "新バージョンをアップロードしますか？" : "新しいファイルとしてアップロードしますか？"}
        </span>
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
      </div>
    </BaseEditDialog>
  );
}
