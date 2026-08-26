import React, { useEffect, useRef, useState } from "react";
import { Prop } from "../../models/prop";
import BaseEditDialog from "./BaseEditDialog";
import { isNullOrUndefinedOrBlank, strCompare, strEquals } from "../../lib/helpers/globalHelper";
import TextInput from "../inputs/TextInput";
import IconButton from "../basic/IconButton";
import { MAX_PROP_DIMENSION, MIN_PROP_DIMENSION, SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import NumberInput from "../inputs/NumberInput";
import CustomMenu from "../inputs/CustomMenu";
import { colorPalette } from "../../lib/consts/colors";

type PropManagerDialogProps = {
  props: Record<string, Prop>,
  // if provided, only these props are shown/editable, otherwise every prop in `props` is shown
  visiblePropIds?: string[],
  showDelete?: boolean,
  title?: string,
  onSubmit: (props: Prop[], deletedPropIds: string[]) => void,
}

type NumberInputHandle = {
  changeValue: (newValue: number) => void,
}

export function PropManagerDialog({
  props, visiblePropIds, showDelete = true, title = "道具管理", onSubmit
}: PropManagerDialogProps) {

  const [propList, setPropList] = useState<Prop[]>([]);
  const [deletedPropIds, setDeletedPropIds] = useState<string[]>([]);

  const lengthInputRefs = useRef<Map<string, NumberInputHandle | null>>(new Map());
  const widthInputRefs = useRef<Map<string, NumberInputHandle | null>>(new Map());

  const resetPropList = () => {
    setPropList(
      Object.values(props)
        .filter(p => !visiblePropIds || visiblePropIds.includes(p.id))
        .sort((a, b) => strCompare<Prop>(a, b, "name"))
    );
  };

  useEffect(() => {
    resetPropList();
  }, [props, visiblePropIds]);

  return <BaseEditDialog
      title={title}
      full
      isActionButtonDisabled={propList.some(p => isNullOrUndefinedOrBlank(p.name.trim()))}
      actionButtonText="保存"
      onClose={() => {
        setDeletedPropIds([]);
        resetPropList();
      }}
      onSubmit={() => {
        const trimmedProps: Prop[] = propList.map(x => ({...x, name: x.name.trim()}))
        onSubmit(trimmedProps, deletedPropIds);
      }}>
      <div className="max-h-full grid grid-rows-[1fr,auto]">
        <div className="justify-center max-h-full overflow-auto grid grid-cols-[1fr,auto] gap-2">
          {
            propList.map((prop, i) =>
              <React.Fragment key={prop.id}>
                <div className="py-2 border-b border-gray-200 md:grid md:grid-cols-[3fr,2fr] md:gap-3 md:border-0 md:py-1">
                  <div className="flex items-center gap-2">
                    <CustomMenu
                      trigger={
                        <div
                          className="rounded-full size-7 min-h-7 min-w-7 max-h-7 max-w-7"
                          style={{backgroundColor: prop.color}}/>
                    }>
                      <div className="grid grid-cols-6 gap-2">
                        {
                          colorPalette.gridObjectColors().map((color) =>
                            <button
                              key={color}
                              onClick={() => {
                                setPropList(prev => prev.map((p, index) => index === i ? { ...p, color } : p));
                              }}
                              style={{"backgroundColor": color, "color": colorPalette.textContrast[color]}}
                              className={"font-semibold rounded-full size-8 min-h-8 min-w-8 max-h-8 max-w-8 " +
                                (strEquals(color, prop.color) ? "border border-primary" : "")
                              }>文</button>
                          )
                        }
                      </div>
                    </CustomMenu>
                    <TextInput
                      label="道具名"
                      required
                      defaultValue={prop.name}
                      onContentChange={(newName) => {
                        setPropList(prev => prev.map((p, index) => index === i ? { ...p, name: newName } : p));
                      }}
                      maxLength={SHORT_NAME_LENGTH}
                    />
                  </div>
                  <div className="flex gap-2 mt-1 md:mt-0">
                    <NumberInput
                      label="縦"
                      compact
                      ref={(r) => {lengthInputRefs.current.set(prop.id, r);}}
                      defaultValue={prop.length}
                      min={MIN_PROP_DIMENSION}
                      max={MAX_PROP_DIMENSION}
                      baseStep={0.1}
                      buttonStep={0.5}
                      onChange={(number) => {
                        setPropList(prev => prev.map((p, index) => index === i ? { ...p, length: number ?? MIN_PROP_DIMENSION } : p));
                      }}
                    />
                    <NumberInput
                      label="幅"
                      compact
                      ref={(r) => {widthInputRefs.current.set(prop.id, r);}}
                      defaultValue={prop.width}
                      min={MIN_PROP_DIMENSION}
                      max={MAX_PROP_DIMENSION}
                      baseStep={0.1}
                      buttonStep={0.5}
                      onChange={(number) => {
                        setPropList(prev => prev.map((p, index) => index === i ? { ...p, width: number ?? MIN_PROP_DIMENSION } : p));
                      }}
                    />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {
                  propList.length > 1 &&
                  <IconButton
                    noBorder
                    size="sm"
                    colour="primary"
                    src="fileCopy"
                    onClick={() => {
                      setPropList(prev => prev.map(p => strEquals(p.id, prop.id) ? p : { ...p, length: prop.length, width: prop.width }));
                      propList.forEach(p => {
                        if (strEquals(p.id, prop.id)) return;
                        lengthInputRefs.current.get(p.id)?.changeValue(prop.length);
                        widthInputRefs.current.get(p.id)?.changeValue(prop.width);
                      });
                    }}
                    />
                }
                {
                  showDelete &&
                  <IconButton
                    noBorder
                    size="sm"
                    colour="primary"
                    src="delete"
                    onClick={() => {
                      setDeletedPropIds(prev => [...prev, prop.id]);
                      setPropList(prev => prev.filter(x => !strEquals(x.id, prop.id)));
                    }}
                    />
                }
              </div>
              </React.Fragment>
            )
          }
        </div>
      </div>
    </BaseEditDialog>
}