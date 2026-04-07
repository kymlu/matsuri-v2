import { useEffect, useMemo, useState } from "react";
import { loadChoreoManifest } from "../lib/dataAccess/FileAccess";
import { indexByKey, isNullOrUndefinedOrBlank, mapByKey, strCompare, strEquals } from "../lib/helpers/globalHelper";
import { Choreo, ChoreoManifest } from "../models/choreo";
import { colorPalette } from "../lib/consts/colors";
import TextInput from "../components/inputs/TextInput";
import { ICON } from "../lib/consts/consts";
import Button, { IconLabelButton } from "../components/basic/Button";
import ExpandableSection from "../components/basic/ExpandableSection";
import React from "react";
import Icon from "../components/basic/Icon";
import { getDate } from "../lib/helpers/dateHelper";
import { Oval } from "react-loader-spinner";
import { FileEditPage } from "./FileEditPage";
import { getAllChoreos } from "../lib/dataAccess/DataController";
import BaseEditDialog from "../components/dialogs/BaseEditDialog";
import { Dialog } from "@base-ui/react";
import IconButton from "../components/basic/IconButton";
import EditNameDialog from "../components/dialogs/EditNameDialog";

export interface FileEdits {
  id: string,
  name?: string,
  eventName?: string,
  isHidden?: boolean,
  choreo?: Choreo,
}

type ManagerPageProps = {
  exit: () => void,
}

export function ManagerPage({
  exit
}: ManagerPageProps) {
  const [allChoreos, setAllChoreos] = useState<ChoreoManifest[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedChoreo, setSelectedChoreo] = useState<ChoreoManifest | undefined>(); 
  const [editsList, setEditsList] = useState<Record<string, FileEdits>>({});
  const [localChoreos, setLocalChoreos] = useState<Choreo[]>([]);

  useEffect(() => {
    getAllChoreos().then((choreos) => setLocalChoreos(choreos));
  }, []);
  
  useEffect(() => {
    setIsLoading(true);
    loadChoreoManifest().then(results => {
      setAllChoreos(results);
      setIsLoading(false);
    });
  }, []);

  const originalChoreos = useMemo(() => indexByKey(allChoreos, "id"), [allChoreos]);
  
  const groupChoreos = (choreos: ChoreoManifest[]) => {
    return mapByKey(
      choreos.sort((a, b) => {
        const eventCmp = strCompare<ChoreoManifest>(a, b, "event");
        if (eventCmp !== 0) return eventCmp;
        if (a.isHidden !== b.isHidden) {
          if (a.isHidden) return 1;
          return -1;
        }
        return strCompare<ChoreoManifest>(a, b, "name");
      }),
      "event"
    )
  }

  const choreosWithEdits = useMemo(() => 
    allChoreos.map(x => {
      const edit = editsList[x.id];
      if (edit) {
        return {
          id: x.id,
          name: edit.name ?? x.name,
          event: edit.eventName ?? x.event,
          isHidden: edit.isHidden === undefined ? x.isHidden : edit.isHidden,
          lastUpdated: x.lastUpdated,
          version: x.version,
        } as ChoreoManifest
      } else {
        return x;
      }
    })
  , [allChoreos, editsList]);

  const filteredChoreos = useMemo(() => 
    groupChoreos(choreosWithEdits.filter(c => c.name.toLowerCase().includes(searchTerm) || c.event.toLowerCase().includes(searchTerm)))
  , [searchTerm, choreosWithEdits]);

  const allEvents = useMemo(() => 
    Array.from(new Set([
      ...allChoreos.map(x => x.event),
      ...Object.values(editsList).map(x => x.eventName),
    ].filter(x => x !== undefined))).sort()
  , [allChoreos, editsList]);

  const editEventName = (name: string, choreos: ChoreoManifest[]) => {
    if (strEquals(name, choreos[0].event)) return;

    var newEdits = {...editsList}; 
    choreos.forEach(c => {
      const edits = newEdits[c.id] ?? {id: c.id} as FileEdits;
      if (strEquals(originalChoreos[c.id].event, name)) {
        edits.eventName = undefined;
      } else {
        edits.eventName = name;
      }
      if (
        edits.choreo === undefined && edits.eventName === undefined &&
        edits.isHidden === undefined && edits.name === undefined) {
        var {[c.id]: _, ...rest} = newEdits;
        newEdits = rest;
      } else {
        newEdits[c.id] = edits;
      }
    });
    setEditsList(newEdits);
  }

  return (
    <div className="bg-gray-50">
      {
        selectedChoreo === undefined &&
        <div className='py-10 px-6 h-[100svh] overflow-hide space-y-2 w-full mx-auto'>
          <div className="flex items-center justify-between">
            <h1 className='text-2xl font-bold'>管理モード</h1>
            <Dialog.Root>
              <Dialog.Trigger>
                <IconLabelButton asDiv icon={ICON.arrowLeftAlt} label="ホームに戻る"/>
              </Dialog.Trigger>
              <BaseEditDialog title="確認" onSubmit={exit} actionButtonText="OK">
                本当にホームに戻りますか？全ての変更が破棄されます。
              </BaseEditDialog>
            </Dialog.Root>
          </div>
          {
            Object.keys(editsList).length > 0 &&
            <div className="flex items-center justify-between p-2 border-2 rounded-lg border-primary">
              <div>You have changes.</div>
              <Dialog.Root>
                <Dialog.Trigger>
                  <Button asDiv>確認</Button>
                </Dialog.Trigger>
                <BaseEditDialog title="確認" onSubmit={() => {/** TODO */}} actionButtonText="OK">
                  A summary of edits
                </BaseEditDialog>
              </Dialog.Root>
            </div>
          }
          <div className="flex gap-2 mb-2">
            <IconLabelButton
              full
              primary
              label="追加"
              icon={ICON.add}
              onClick={() => {}}
              />
          </div>
          <TextInput
            defaultValue={searchTerm}
            placeholder="隊列表、イベントを探す"
            onContentChange={(newSearchTerm) => setSearchTerm(newSearchTerm)}
            search
            maxLength={100}
            clearable/>
          <div className="h-full space-y-4 overflow-scroll">
            {
              !isLoading && filteredChoreos.size === 0 &&
              <div className="mt-4 text-center">隊列表はありません</div>
            }
            {
              isLoading &&
              <Oval
                wrapperClass="mt-4 justify-self-center"
                color={colorPalette.primary}
                secondaryColor={colorPalette.rainbow.red[2]}/>
            }
            {
              !isLoading &&
              Array.from(filteredChoreos).map(([eventName, choreos]) =>
                <EventSection
                  key={eventName}
                  eventName={eventName}
                  choreos={choreos}
                  originalChoreos={originalChoreos}
                  edits={editsList}
                  searchTerm={searchTerm}
                  selectChoreo={setSelectedChoreo}
                  editEventName={(newName) => editEventName(newName, choreos)}
                />
              )
            }
          </div>
        </div>
      }
      {
        selectedChoreo &&
        <FileEditPage
          choreo={selectedChoreo}
          edits={editsList[selectedChoreo.id]}
          eventList={allEvents}
          addEdits={(id, edits) => {
            if (edits) {
              setEditsList(prev => ({
                ...prev,
                [id]: edits
              }))
            } else {
              setEditsList(prev => {
                const { [id]: _, ...rest } = prev;
                return rest;
              })
            }
          }}
          exitPage={() => setSelectedChoreo(undefined)}
          localChoreos={localChoreos}
        />
      }
    </div>
  )
}

type EventSectionProps = {
  eventName: string,
  choreos: ChoreoManifest[],
  originalChoreos: Record<string, ChoreoManifest>
  edits: Record<string, FileEdits>
  searchTerm: string,
  selectChoreo: (choreo: ChoreoManifest) => void,
  editEventName: (newName: string) => void,
}

function EventSection({
  eventName, choreos, originalChoreos, edits, searchTerm, selectChoreo, editEventName
}: EventSectionProps) {
  const editNameDialog = Dialog.createHandle<Choreo>();
  const [editNameDialogOpen, setEditNameDialogOpen] = React.useState(false);

  const handleEditNameDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setEditNameDialogOpen(isOpen);
  };

  return <div>
    <Dialog.Root
      open={editNameDialogOpen}
      onOpenChange={handleEditNameDialogOpenChange}
      handle={editNameDialog}>
      <EditNameDialog
        type="イベント"
        required
        name={eventName}
        onSubmit={(newName) => {
          editEventName(newName);
          setEditNameDialogOpen(false);
        }}
      />
    </Dialog.Root>
    <ExpandableSection
      title={eventName.length === 0 ? "イベント不明" : eventName}
      rightButton={
        <IconButton
          asDiv src={ICON.edit}
          size="sm" colour="grey"
          noBorder onClick={() => setEditNameDialogOpen(true)}/>
      }
    >
      <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
        {
          choreos.map((choreo) =>
            <React.Fragment key={choreo.id}>
              {
                (isNullOrUndefinedOrBlank(searchTerm) ||
                choreo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                choreo.event.toLowerCase().includes(searchTerm.toLowerCase())) &&
                <ChoreoItem
                  choreo={choreo}
                  edits={edits[choreo.id]}
                  selectChoreo={() => selectChoreo(originalChoreos[choreo.id])}/>
              }
            </React.Fragment>
          )
        }
      </div>
    </ExpandableSection>
  </div>
}

type ChoreoItemProps = {
  choreo: ChoreoManifest,
  edits?: FileEdits
  selectChoreo: () => void,
}

function ChoreoItem ({
  choreo, edits, selectChoreo
}: ChoreoItemProps) {
  const status = edits?.choreo ? "versionUp" :
    (edits?.eventName || edits?.name || edits?.isHidden !== undefined) ? "edited" :
    "none";
    
  return (
    <div
      onClick={selectChoreo}
      className={"flex flex-col justify-between h-full p-2 transition-colors rounded-md cursor-pointer " +
        (choreo.isHidden ? "bg-gray-200 " : "bg-white ") +
        (edits ? "border-2 border-primary" : "border border-gray-400")}>
      {/* Title */}
      <div className="relative flex flex-row items-start justify-between gap-2">
        <div className={"flex items-center gap-1 text-lg text-left break-words text-wrap " + (edits?.name ? "text-primary font-bold" : "font-medium text-black")}>
          {choreo.name}
          {
            choreo.isHidden &&
            <Icon src={ICON.globeOff} size="xs" colour={edits?.isHidden ? "primary" : "grey"}/>
          }
        </div>
        <div className="flex flex-row items-center gap-2">
          {
            status === "none" &&
            <div className="px-1 h-6 text-sm font-semibold flex items-center gap-0.5 border rounded-md text-primary border-primary text-nowrap">
              {
                choreo.version &&
                <span>v{choreo.version}</span>
              }
            </div>
          }
          {
            status === "edited" &&
            <div className="px-1 h-6 text-sm font-semibold flex items-center gap-0.5 border rounded-md text-primary border-primary text-nowrap">
              {
                choreo.version &&
                <span>v{choreo.version}</span>
              }
              <Icon size="xs" colour="primary" src={ICON.edit}/>
            </div>
          }
          {
            status === "versionUp" &&
            <div className="px-1 h-6 text-sm font-semibold flex items-center gap-0.5 border rounded-md text-primary border-primary text-nowrap">
              {
                choreo.version &&
                <span>v{choreo.version}→v{choreo.version + 1}</span>
              }
            </div>
          }
          <div className="px-1 h-6 text-sm font-semibold flex items-center gap-0.5 border rounded-md text-primary border-primary text-nowrap">
            新
          </div>
        </div>
      </div>
      {/* Meta row */}
      <div className="items-center justify-between text-sm text-gray-500 md:flex">
        {choreo.lastUpdated ? (
          <div className="flex items-center gap-1">
            <Icon colour="grey" size="sm" src={ICON.history}/>{getDate(new Date(choreo.lastUpdated))}
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}