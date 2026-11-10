import { useEffect, useMemo, useState } from "react";
import { Dancer } from "../../models/dancer";
import BaseEditDialog from "./BaseEditDialog";
import { strCompare, strEquals } from "../../lib/helpers/globalHelper";
import TextInput from "../inputs/TextInput";
import IconButton from "../basic/IconButton";
import { SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import CustomAutocomplete from "../inputs/CustomAutocomplete";
import { RosterList } from "../../models/roster";
import { sortRosterNames } from "../../lib/helpers/rosterHelper";

type DancerManagerDialogProps = {
  dancers: Record<string, Dancer>,
  onSubmit: (dancers: Dancer[], deletedDancerIds: string[]) => void,
  roster?: RosterList, // 名簿 dancer names to suggest on each row, when there are any
}

export function DancerManagerDialog({
  dancers, onSubmit, roster
}: DancerManagerDialogProps) {

  const [dancerList, setDancerList] = useState<Dancer[]>([]);
  const [dancerNames, setDancerNames] = useState<Record<string, number>>({});
  const [deletedDancerIds, setDeletedDancerIds] = useState<string[]>([]);

  useEffect(() => {
    setDancerList([...Object.values(dancers)].sort((a, b) => {
      return strCompare<Dancer>(a, b, "name");
    }))
  }, [dancers]);

  useEffect(() => {
    if (dancerList.length === 0) return;
    
    const names = dancerList.map(x => x.name.trim());
    const nameSet = new Set(names);
    setDancerNames(Array.from(nameSet).reduce((acc, item) => {
      acc[item] = dancerList.filter(x => strEquals(x.name.trim(), item)).length;
      return acc;}
    , {} as Record<string, number>));
  }, [dancerList]);

  const namesWithDuplicates = useMemo(() => {
    return Object.entries(dancerNames).filter(([, count]) => count > 1).map(([name, ]) => name);
  }, [dancerNames]);

  // Names not yet used in this dialog come first, so picking one moves it down for the other rows.
  const rosterOptions = useMemo(() => {
    if (!roster || roster.names.length === 0) {
      return undefined;
    }
    const names = sortRosterNames(roster.names).map(n => n.name);
    return [...names.filter(n => !dancerNames[n]), ...names.filter(n => dancerNames[n])];
  }, [roster, dancerNames]);

  const categoryNamesByName = useMemo(() => {
    const categoryNames = new Map(roster?.categories.map(c => [c.id, c.name]));
    return new Map(roster?.names.map(n => [n.name, n.categoryIds.map(id => categoryNames.get(id)).join("・")]));
  }, [roster]);

  return <BaseEditDialog
      title="ダンサー管理"
      full
      isActionButtonDisabled={dancerNames[""] === null || dancerNames[""] > 0}
      actionButtonText="保存"
      onClose={() => {
        setDancerList([...Object.values(dancers)].sort((a, b) => {
          return strCompare<Dancer>(a, b, "name");
        }));
      }}
      onSubmit={() => {
        const trimmedDancers: Dancer[] = dancerList.map(x => ({id: x.id, name: x.name.trim()} as Dancer));
        onSubmit(trimmedDancers, deletedDancerIds);
      }}>
      <div className="max-h-full grid grid-rows-[1fr,auto]">
        <div className="justify-center max-h-full space-y-2 overflow-auto md:flex md:flex-wrap md:gap-4">
          {
            dancerList.map((dancer, i) => 
              <div className="flex flex-row items-center gap-1" key={dancer.id}>
                {
                  rosterOptions
                    ? <CustomAutocomplete
                        label="ダンサー名"
                        required
                        defaultValue={dancer.name}
                        hasError={dancerNames[dancer.name.trim()] > 1}
                        options={rosterOptions}
                        itemSuffix={(item) => <span className="text-xs opacity-75">{categoryNamesByName.get(item)}</span>}
                        onContentChange={(newName) => {
                          setDancerList(prev => prev.map((d, index) => index === i ? { ...d, name: newName } : d));
                        }}
                        maxLength={SHORT_NAME_LENGTH}
                      />
                    : <TextInput
                        label="ダンサー名"
                        required
                        defaultValue={dancer.name}
                        hasError={dancerNames[dancer.name.trim()] > 1}
                        onContentChange={(newName) => {
                          setDancerList(prev => prev.map((d, index) => index === i ? { ...d, name: newName } : d));
                        }}
                        maxLength={SHORT_NAME_LENGTH}
                      />
                }
                <div className="px-2 pt-4">
                  <IconButton
                    noBorder
                    size="sm"
                    colour="primary"
                    src="delete"
                    onClick={() => {
                      setDeletedDancerIds(prev => [...prev, dancer.id]);
                      setDancerList(prev => prev.filter(x => !strEquals(x.id, dancer.id)));
                    }}
                    />
                </div>
              </div>
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