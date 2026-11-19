import { StageType } from "../../models/choreo";
import BottomDrawer, { BottomDrawerClose } from "../basic/BottomDrawer";
import Button from "../basic/Button";
import Icon from "../basic/Icon";
import StageSizeInputs, { StageSize, StageSizeField } from "../common/StageSizeInputs";

type StageSizeSheetProps = {
  stageType: StageType,
  size: StageSize,
  onChange: (field: StageSizeField, value: number) => void,
  warning?: string,
  onCancel: () => void,
  onSave: () => void,
  onHeightChange?: (height: number) => void,
}

export default function StageSizeSheet({ stageType, size, onChange, warning, onCancel, onSave, onHeightChange }: StageSizeSheetProps) {
  return <BottomDrawer
    label="舞台サイズ"
    layerClassName="z-20"
    onClose={onCancel}
    swipeToClose={false}
    sizeToContent
    lowestSnapPoint="78px"
    defaultSnapPoint={1}
    popupClassName="max-h-[calc(100svh-8rem)]"
    onVisibleHeightChange={onHeightChange}
    header={
      <div className="flex items-center w-full max-w-lg gap-3 mx-auto mb-2">
        <h2 className="text-base font-bold">舞台サイズ</h2>
        <span className="ml-auto text-sm text-muted">{stageType === "parade" ? "パレード" : "ステージ"}（変更不可）</span>
      </div>
    }
    footer={
      <div className="flex flex-col w-full max-w-lg gap-2 px-4 pt-3 mx-auto border-t border-line">
        {
          warning &&
          <p className="flex items-start gap-1 text-sm text-primary">
            <Icon src="warning" colour="primary" size="xs"/>
            {warning}
          </p>
        }
        <div className="grid w-full grid-flow-col gap-2 auto-cols-fr">
          <BottomDrawerClose className="w-full">
            <Button asDiv full><span className="font-semibold text-nowrap">キャンセル</span></Button>
          </BottomDrawerClose>
          <Button full primary onClick={onSave}>
            <span className="font-semibold text-nowrap">保存</span>
          </Button>
        </div>
      </div>
    }>
    <div className="w-full max-w-lg py-1 mx-auto">
      <StageSizeInputs stageType={stageType} size={size} onChange={onChange}/>
    </div>
  </BottomDrawer>;
}
