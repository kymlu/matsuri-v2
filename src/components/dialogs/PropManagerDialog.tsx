import React, { useEffect, useMemo, useState } from "react";
import { Prop } from "../../models/prop";
import BaseEditDialog from "./BaseEditDialog";
import { strCompare, strEquals } from "../../lib/helpers/globalHelper";
import TextInput from "../inputs/TextInput";
import IconButton from "../basic/IconButton";
import { ICON, MAX_PROP_DIMENSION, MIN_PROP_DIMENSION, MIN_STAGE_DIMENSION } from "../../lib/consts/consts";
import NumberInput from "../inputs/NumberInput";

type PropManagerDialogProps = {
  props: Record<string, Prop>,
  onSubmit: (props: Prop[], deletedPropIds: string[]) => void,
}

export function PropManagerDialog({
  props, onSubmit
}: PropManagerDialogProps) {

  const [propList, setPropList] = useState<Prop[]>([]);
  const [propNames, setPropNames] = useState<Record<string, number>>({});
  const [deletedPropIds, setDeletedPropIds] = useState<string[]>([]);

  useEffect(() => {
    setPropList([...Object.values(props)].sort((a, b) => {
      return strCompare<Prop>(a, b, "name");
    }))
  }, [props]);

  useEffect(() => {
    if (propList.length === 0) return;
    
    const names = propList.map(x => x.name);
    const nameSet = new Set(names);
    
    setPropNames(Array.from(nameSet).reduce((acc, item) => {
      acc[item] = propList.filter(x => strEquals(x.name, item)).length;
      return acc;}
    , {} as Record<string, number>));
  }, [propList]);

  const namesWithDuplicates = useMemo(() => {
    return Object.entries(propNames).filter(([, count]) => count > 1).map(([name, ]) => name);
  }, [propNames]);

  return <BaseEditDialog
      title="ダンサー管理"
      full
      isActionButtonDisabled={propNames[""] === null || propNames[""] > 0}
      actionButtonText="保存"
      onSubmit={() => {onSubmit(propList, deletedPropIds)}}>
      <div className="max-h-full grid grid-rows-[1fr,auto]">
        <div className="justify-center max-h-full overflow-scroll grid grid-cols-[1fr,1fr,1fr,auto] gap-2">
          {
            propList.map((prop, i) => 
              <React.Fragment key={prop.id}>
                <TextInput
                  label="道具名"
                  required
                  defaultValue={prop.name}
                  hasError={propNames[prop.name] > 1}
                  onContentChange={(newName) => {
                    setPropList(prev => {
                      prev[i].name = newName;
                      return [...prev];
                    });
                  }}
                />
                <NumberInput
                  label="幅"
                  defaultValue={prop.width}
                  min={MIN_PROP_DIMENSION}
                  max={MAX_PROP_DIMENSION}
                  baseStep={0.1}
                  buttonStep={0.5}
                  onChange={(number) => {
                    setPropList(prev => {
                      prev[i].width = number ?? MIN_PROP_DIMENSION;
                      return [...prev];
                    })
                  }}
                />
                <NumberInput
                  label="縦"
                  defaultValue={prop.length}
                  min={MIN_PROP_DIMENSION}
                  max={MAX_PROP_DIMENSION}
                  baseStep={0.1}
                  buttonStep={0.5}
                  onChange={(number) => {
                    setPropList(prev => {
                      prev[i].length = number ?? MIN_PROP_DIMENSION;
                      return [...prev];
                    })
                  }}
                />
                <IconButton
                  noBorder
                  size="sm"
                  src={ICON.delete}
                  onClick={() => {
                    setDeletedPropIds(prev => [...prev, prop.id]);
                    setPropList(prev => prev.filter(x => !strEquals(x.id, prop.id)));
                  }}
                  />
              </React.Fragment>
            )
          }
        </div>
        {
          namesWithDuplicates.length > 0 && <div className="font-bold text-center text-wrap text-primary">
            次の名前が重複しています：{(namesWithDuplicates.join("、"))}
          </div>
        }
      </div>
    </BaseEditDialog>
}