import { Dialog, Menu } from "@base-ui/react"
import CustomDialog from "../components/basic/CustomDialog"
import { ICON, LONG_NAME_LENGTH, SAMPLE_PARADE_ID, SAMPLE_STAGE_ID, SEARCH_NAME_LENGTH } from "../lib/consts/consts"
import { IconLabelButton } from "../components/basic/Button"
import Icon from "../components/basic/Icon"
import { readUploadedFile } from "../lib/helpers/uploadHelper"
import { useCallback, useEffect, useMemo, useState } from "react"
import { deleteChoreo, getAllChoreos, saveChoreo, saveChoreos } from "../lib/dataAccess/DataController"
import { BasicChoreoDetails, Choreo, ChoreoSchema, EventDetails, getBasicChoreoDetails } from "../models/choreo"
import { isNullOrUndefinedOrBlank, indexByKey, strCompare, strEquals, stringifyEvent, removeKey } from "../lib/helpers/globalHelper"
import { formatDateRange, getDate } from "../lib/helpers/dateHelper"
import IconButton from "../components/basic/IconButton"
import SampleStage from "../lib/samples/SampleStageFormation.json"
import SampleParade from "../lib/samples/SampleParadeFormation.json"
import z from "zod"
import { exportEvent, exportChoreo } from "../lib/helpers/exportHelper"
import BaseEditDialog from "../components/dialogs/BaseEditDialog"
import ConfirmUploadDialog from "../components/dialogs/ConfirmUploadDialog"
import BaseErrorDialog from "../components/dialogs/BaseErrorDialog"
import ExportDialog from "../components/dialogs/ExportDialog"
import React from "react"
import Divider from "../components/basic/Divider"
import TextInput from "../components/inputs/TextInput"
import UserNameEditDialog from "../components/dialogs/UserNameEditDialog"
import { Oval } from "react-loader-spinner"
import { colorPalette } from "../lib/consts/colors"
import EditChoreoInfoDialog from "../components/dialogs/EditChoreoInfoDialog"
import SyncChoreoDialog from "../components/dialogs/SyncChoreoDialog"
import ExpandableSection from "../components/basic/ExpandableSection"
import AbsentDancersWarningDialog from "../components/dialogs/AbsentDancersWarningDialog"
import BeginnersDialog from "../components/dialogs/BeginnersDialog"
import EditEventInfoDialog from "../components/dialogs/EditEventInfoDialog"
import SiteInfoDialog from "../components/dialogs/SiteInfoDialog"
import { ChoreoStatusTag } from "../components/common/Tag"
import { getChoreoFile, getChoreoSummary, logoutUserFromTeam } from "../lib/helpers/apiHelper"
import LoginDialog from "../components/dialogs/LoginDialog"
import { Team } from "../models/team"
import CustomMenu from "../components/inputs/CustomMenu"
import ChoreoPasswordEntryDialog from "../components/dialogs/ChoreoPasswordEntryDialog"

type HomePageProps = {
  buildInfo?: string,
  eventList: EventDetails[],
  setEventList: (eventList: EventDetails[]) => void,
  goToNewChoreoPage: (eventDetails?: EventDetails) => void,
  goToViewPage: (choreo: Choreo, status: ChoreoStatus, serverChoreo?: BasicChoreoDetails) => void,
  savedDancerName: string | null,
  setSavedDancerName: (newName: string) => void,
  dancerNamesByEvent: Record<string, Record<string, string[]>>,
  setDancerNamesByEvent: (groupedNames: Record<string, Record<string, string[]>>) => void,
  isLoggedIn: boolean,
  setIsLoggedIn: (value: boolean) => void,
  team?: Team,
}

export type ChoreoStatus = "localOnly" | "syncRequired" | "upToDate" | "edited";
type ChoreoWithStatus = BasicChoreoDetails & {
  status: ChoreoStatus,
  isDirty?: boolean,
}

export default function HomePage({
  buildInfo, eventList, setEventList,
  goToNewChoreoPage, goToViewPage,
  savedDancerName, setSavedDancerName,
  dancerNamesByEvent, setDancerNamesByEvent,
  isLoggedIn, setIsLoggedIn,
  team
}: HomePageProps) {
  const [savedChoreos, setSavedChoreos] = useState<ChoreoWithStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // const [choreosFromServer, setChoreosFromServer] = useState<Record<string, Choreo>>({});
  const [serverChoreoDetails, setServerChoreoDetails] = useState<Record<string, BasicChoreoDetails>>({});
  const [localChoreos, setLocalChoreos] = useState<Record<string, Choreo>>({});

  const getChoreoFromServer = async (
    id: string
  ): Promise<Choreo | undefined> => {
    try {
      if (team?.id) {
        console.log(`Getting choreo from server with id ${id}`);
        return await getChoreoFile(team?.id, id, serverChoreoDetails[id].version ?? 0);
      } else {
        return undefined
      }
    } catch (e: any) {
      console.error("Failed to load choreo with id", id);
      return undefined;
    }
  };

  const getChoreo = async (
    id: string
  ): Promise<Choreo | undefined> => {
    const local = localChoreos[id];

    if (local) {
      console.log(`Getting local choreo with ${id}`);
      if (local.teamId === undefined && team?.id) {
        local.teamId = team.id;
      }
      return local;
    }

    if (strEquals(id, SAMPLE_PARADE_ID)) {
      console.log("using sample parade");
      return SampleParade as Choreo;
    } else if (strEquals(id, SAMPLE_STAGE_ID)) {
      console.log("using sample stage");
      return SampleStage as Choreo;
    }

    return await getChoreoFromServer(id);
  };

  useEffect(() => {
    console.log("build", buildInfo)
    loadChoreos();
  }, []);

  const loadChoreos = () => {
    setIsLoading(true);
    Promise.all([
      getAllChoreos(team?.id),
      getChoreoSummary(team?.id)
    ]).then(([local, server]) => {
      server.push(getBasicChoreoDetails(z.parse(ChoreoSchema, SampleParade)));
      server.push(getBasicChoreoDetails(z.parse(ChoreoSchema, SampleStage)));
      const choreos: ChoreoWithStatus[] = [];
      let indexedLocal = indexByKey(local, "id");
      const indexedServer = indexByKey(server, "id");
      const allIds = new Set([...Object.keys(indexedLocal), ...Object.keys(indexedServer)]);
      
      allIds.forEach((id) => {
        const localChoreo = indexedLocal[id];
        const serverChoreo = indexedServer[id];
        if (!localChoreo) {
          choreos.push({...serverChoreo, status: "upToDate"});
        } else {
          const localChoreoDetails = getBasicChoreoDetails(localChoreo);
          if (!serverChoreo) {
            choreos.push({...localChoreoDetails, status: "localOnly"});
          } else if (serverChoreo.version !== localChoreo.version) {
            if (localChoreo.isDirty === true || localChoreo.isDirty === undefined) {
              choreos.push({...localChoreoDetails, status: "syncRequired"});
            } else {
              choreos.push({...serverChoreo, status: "upToDate"});
              indexedLocal = {...removeKey(indexedLocal, id)};
              deleteChoreo(id, () => {});
            }
          } else {
            if (localChoreo.isDirty === true || localChoreo.isDirty === undefined) {
              choreos.push({...localChoreoDetails, status: "edited"});
            } else {
              choreos.push({...serverChoreo, status: "upToDate"});
              indexedLocal = {...removeKey(indexedLocal, id)};
              deleteChoreo(id, () => {});
            }
          }
        }
      });
      // setDancerNamesByEvent(
      //   choreos.reduce((acc, item) => {
      //     const names = Object.values(item.dancers).map(d => d.name);
      //     const stringifiedEvent = stringifyEvent(item);
      //     return {
      //       ...acc,
      //       [stringifiedEvent]: {
      //         ...(acc[stringifiedEvent] ?? {}),
      //         [item.id]: names,
      //       },
      //     };
      //   }, {} as Record<string, Record<string, string[]>>)
      // );
      setSavedChoreos(choreos);
      setServerChoreoDetails(indexedServer);
      setLocalChoreos(indexedLocal);
      setIsLoading(false);
    }, () => {
      setIsLoading(false);
      // TODO: Implement error dialog
    });
  }

  const onSelectChoreo = useCallback((choreo: Choreo, choreoStatus: ChoreoStatus) => {
    goToViewPage(choreo, choreoStatus, serverChoreoDetails[choreo.id]);
  }, [serverChoreoDetails]);

  useEffect(() => {
    setEventList(
      Array.from(new Set(savedChoreos.map(x => stringifyEvent(x))))
        .map(x => JSON.parse(x) as EventDetails)
        .filter(x => !isNullOrUndefinedOrBlank(x.event))
        .sort((a, b) => {
          const eventCmp = strCompare<EventDetails>(a, b, "event");
          if (eventCmp !== 0) return eventCmp;
          const aHasDate = !isNullOrUndefinedOrBlank(a.startDate) || !isNullOrUndefinedOrBlank(a.endDate);
          const bHasDate = !isNullOrUndefinedOrBlank(b.startDate) || !isNullOrUndefinedOrBlank(b.endDate);

          if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;

          const dateA = isNullOrUndefinedOrBlank(a.endDate) ? (isNullOrUndefinedOrBlank(a.startDate) ? null : new Date(a.startDate!!)) : new Date(a.endDate!!);
          const dateB = isNullOrUndefinedOrBlank(b.endDate) ? (isNullOrUndefinedOrBlank(b.startDate) ? null : new Date(b.startDate!!)) : new Date(b.endDate!!);
          const dateCmp = (dateA?.getTime() ?? 0) - (dateB?.getTime() ?? 0);
          return -dateCmp;
        })
    );
  }, [savedChoreos]);

  const groupChoreos = (choreos: ChoreoWithStatus[]) => {
    const byEvent = choreos.sort((a, b) => {
      const aHasStart = !isNullOrUndefinedOrBlank(a.startDate);
      const bHasStart = !isNullOrUndefinedOrBlank(b.startDate);
      const aHasEnd = !isNullOrUndefinedOrBlank(a.endDate);
      const bHasEnd = !isNullOrUndefinedOrBlank(b.endDate);
      const aHasAny = aHasStart || aHasEnd;
      const bHasAny = bHasStart || bHasEnd;

      // No dates at all go last
      if (aHasAny !== bHasAny) return aHasAny ? -1 : 1;

      if (aHasAny && bHasAny) {
        // No start date goes before those with a start date
        if (aHasStart !== bHasStart) return aHasStart ? 1 : -1;

        // Both have start dates, compare them
        if (aHasStart && bHasStart) {
          const startCmp = new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime();
          if (startCmp !== 0) return -startCmp;
        }

        // No end date goes before those with an end date
        if (aHasEnd !== bHasEnd) return aHasEnd ? 1 : -1;

        // Both have end dates, compare them
        if (aHasEnd && bHasEnd) {
          const endCmp = new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime();
          if (endCmp !== 0) return -endCmp;
        }
      }

      const eventCmp = strCompare<ChoreoWithStatus>(a, b, "event");
      if (eventCmp !== 0) return eventCmp;

      const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      if (dateA !== dateB) return dateB - dateA;

      return strCompare<ChoreoWithStatus>(a, b, "name");
    }).reduce((acc, item) => {
      const key = stringifyEvent(item);
      if (!acc.has(key)) acc.set(key, []);
      acc.get(key)!.push(item);
      return acc;
    }, new Map<string, ChoreoWithStatus[]>());

    return Array.from(byEvent.entries()).reduce((acc, [key, items]) => {
      const parsed = JSON.parse(key) as EventDetails;
      const year = parsed.startDate
        ? `${new Date(parsed.startDate).getFullYear().toString()}年`
        : "日程不明";

      if (!acc.has(year)) acc.set(year, new Map());
      acc.get(year)!.set(key, items);
      return acc;
    }, new Map<string, Map<string, ChoreoWithStatus[]>>());
  }

  const filteredChoreos = useMemo(() => 
    groupChoreos(savedChoreos.filter(c => c.name.toLowerCase().includes(searchTerm) || c.event?.toLowerCase().includes(searchTerm)))
  , [savedChoreos, searchTerm]);

  const [editingChoreo, setEditingChoreo] = useState<ChoreoWithStatus | undefined>();
  const [editChoreoInfoDialogOpen, setEditChoreoInfoDialogOpen] = useState(false);
  const editChoreoInfoDialog = Dialog.createHandle<{}>();
  const handleEditChoreoInfoDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setEditChoreoInfoDialogOpen(isOpen);
  };

  const [editingEventName, setEditingEventName] = useState<string | undefined>();
  const [editingEventNameIds, setEditingEventNameIds] = useState<string[] | undefined>();
  const [editEventNameDialogOpen, setEventNameDialogOpen] = useState(false);
  const editEventNameDialog = Dialog.createHandle<{}>();
  const handleEventNameDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setEventNameDialogOpen(isOpen);
  }

  const [deleteChoreoVerb, setDeleteChoreoVerb] = useState<"削除"| "破棄">("削除");
  const [deleteChoreoDialogOpen, setDeleteChoreoDialogOpen] = useState(false);
  const deleteChoreoDialog = Dialog.createHandle<{}>();
  const handleDeleteChoreoDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setDeleteChoreoDialogOpen(isOpen);
  };

  const [syncChoreoDialogOpen, setSyncChoreoDialogOpen] = useState(false);
  const syncChoreoDialog = Dialog.createHandle<{}>();
  const handleSyncChoreoDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setSyncChoreoDialogOpen(isOpen);
  };

  const [uploadErrorMessage, setUploadErrorMessage] = useState<string>("");
  const [uploadFailedDialogOpen, setUploadFailedDialogOpen] = useState(false);
  const uploadFailedDialog = Dialog.createHandle<{}>();
  const handleUploadFailedDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setUploadFailedDialogOpen(isOpen);
  };
  
  const [uploadSucceededDialogOpen, setUploadSucceededDialogOpen] = useState(false);
  const uploadSucceededDialog = Dialog.createHandle<{}>();
  const handleUploadSucceededDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setUploadSucceededDialogOpen(isOpen);
  };

  const [exportingChoreo, setExportingChoreo] = useState<Choreo | undefined>();
  const [pdfExportDialogOpen, setPdfExportDialogOpen] = useState(false);
  const pdfExportDialog = Dialog.createHandle<{}>();
  const handlePdfExportDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setPdfExportDialogOpen(isOpen);
  };

  const [uploadedChoreo, setUploadedChoreo] = useState<Choreo | undefined>();
  const [duplicateChoreoId, setDuplicateChoreoId] = useState<string | undefined>();
  const [uploadChoreoDialogOpen, setUploadChoreoDialogOpen] = useState(false);
  const uploadChoreoDialog = Dialog.createHandle<{}>();
  const handleUploadChoreoDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setUploadChoreoDialogOpen(isOpen);
  };

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const loginDialog = Dialog.createHandle<{}>();
  const handleLoginDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setLoginDialogOpen(isOpen);
  };

  const triggerUpload = () => {
    const uploadFileElement = document.getElementById("uploadFileInput");
    if (uploadFileElement){
      uploadFileElement.click();
    }
  }

  const duplicateChoreo = (choreo: Choreo) => {
    const newChoreo = {
      ...choreo,
      id: crypto.randomUUID(),
      name: `${choreo.name}のコピー`.slice(0, LONG_NAME_LENGTH),
      lastUpdated: new Date().toISOString(),
      version: undefined
    } as Choreo;
    saveChoreo(newChoreo, () => {
      setLocalChoreos(prev => ({...prev, [newChoreo.id]: newChoreo}))
      var newChoreos = [...savedChoreos, {...getBasicChoreoDetails(newChoreo), status: "localOnly" as ChoreoStatus}];

      // setDancerNamesByEvent(
      //   newChoreos.reduce((acc, item) => {
      //     const names = Object.values(item.dancers).map(d => d.name);
      //     const stringifiedEvent = stringifyEvent(item);
      //     return {
      //       ...acc,
      //       [stringifiedEvent]: {
      //         ...(acc[stringifiedEvent] ?? {}),
      //         [item.id]: names,
      //       },
      //     };
      //   }, {} as Record<string, Record<string, string[]>>)
      // );
      setSavedChoreos(newChoreos);
    });
  }

  return (
    <div className="bg-gray-50">
      <div className='grid py-10 px-6 h-[100svh] grid-rows-[auto,auto,auto,auto,1fr] overflow-hide w-full mx-auto'>
        <div className="text-sm text-primary">
          {
            team &&
            <>
              <b>{team.name}</b><span>の</span>
            </>
          }
        </div>
        <div className="flex items-center justify-between pb-1">
          <h1 className='text-2xl font-bold text-nowrap'>隊列表一覧</h1>
          <div className="flex items-center ">
            <Dialog.Root>
              <Dialog.Trigger>
                <IconButton src={ICON.info} colour="primary" noBorder asDiv/>
              </Dialog.Trigger>
              <SiteInfoDialog buildInfo={buildInfo}/>
            </Dialog.Root>
            <Dialog.Root>
              <Dialog.Trigger>
                <IconButton src={ICON.personEdit} colour="primary" noBorder asDiv/>
              </Dialog.Trigger>
              <UserNameEditDialog name={savedDancerName ?? ""} onSubmit={(name) => setSavedDancerName(name)}/>
            </Dialog.Root>
            {
              !isLoggedIn && team?.id &&
              <IconButton src={ICON.login} colour="grey" noBorder onClick={() => setLoginDialogOpen(true)}/>
            }
            {
              isLoggedIn && team?.id &&
              <CustomMenu
                trigger={
                  <IconButton asDiv src={ICON.verifiedUser} colour="primary" noBorder/>
                }>
                <div className="space-y-2">
                  <Menu.Item>
                    <IconLabelButton full noBorder icon={ICON.password} label="パスワード変更" onClick={()=>{}}/>
                  </Menu.Item>
                  <Divider compact/>
                  <Menu.Item>
                    <IconLabelButton
                      full noBorder
                      icon={ICON.logout}
                      label="ログアウト"
                      onClick={()=>{
                        logoutUserFromTeam(() => {
                          // todo: add isprocessingflag to prevent double tap
                          // todo: on fail, show failed dialog
                          setIsLoggedIn(false);
                        });
                      }}/>
                  </Menu.Item>
                </div>
              </CustomMenu>
            }
          </div>
        </div>
        <div className="flex gap-2 mb-2">
          <IconLabelButton
            full
            primary
            label="新規作成"
            icon={ICON.add}
            onClick={() => goToNewChoreoPage()}
            />
          <IconLabelButton
            full
            label="アップロード"
            icon={ICON.upload}
            onClick={triggerUpload}
            />
        </div>
        <div className="flex items-center gap-2">
          <TextInput
            defaultValue={searchTerm}
            placeholder="隊列表、イベントを探す"
            onContentChange={(newSearchTerm) => setSearchTerm(newSearchTerm)}
            search
            maxLength={SEARCH_NAME_LENGTH}
            clearable/>
        </div>
        <div className="h-full space-y-2 overflow-scroll">
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
            Array.from(filteredChoreos).map(([year, events], yearIndex) =>
              <React.Fragment key={year}>
                <ExpandableSection title={year} level={1} defaultExpanded={!isNullOrUndefinedOrBlank(searchTerm) || yearIndex === 0}>
                  {
                    Array.from(events).map(([eventDetails, choreos], choreoIndex) =>
                    <React.Fragment key={eventDetails}>
                      <EventSection
                        key={eventDetails}
                        eventInfo={eventDetails}
                        dancerNamesByFormation={dancerNamesByEvent[eventDetails]}
                        choreos={choreos}
                        searchTerm={searchTerm}
                        onSelectChoreo={(id, status) => {
                          getChoreo(id).then(c => {
                            if (c) {
                              onSelectChoreo(c, status);
                            }
                          });
                        }}
                        duplicateChoreo={choreo => {
                          getChoreo(choreo.id).then(c => {
                            if (c) {
                              duplicateChoreo(c);
                            }
                          });
                        }}
                        editChoreoName={(choreo) => {
                          setEditingChoreo(choreo);
                          setEditChoreoInfoDialogOpen(true);
                        }}
                        deleteChoreo={(choreo) => {
                          setDeleteChoreoVerb("削除");
                          setEditingChoreo(choreo);
                          setDeleteChoreoDialogOpen(true);
                        }}
                        revertChoreo={(choreo) => {
                          setDeleteChoreoVerb("破棄");
                          setEditingChoreo(choreo);
                          setDeleteChoreoDialogOpen(true);
                        }}
                        syncChoreo={(choreo) => {
                          setEditingChoreo(choreo);
                          setSyncChoreoDialogOpen(true);
                        }}
                        onPdfExport={(choreo) => {
                          getChoreo(choreo.id).then(c => {
                            if (c) {
                              setExportingChoreo(c);
                              setPdfExportDialogOpen(true);
                            }
                          })
                        }}
                        onExport={(id) => {
                          getChoreo(id).then((choreo) => {
                            if (choreo) {
                              exportChoreo(choreo);
                            }
                          })
                        }}
                        onExportEvent={() => {
                          Promise.all(choreos.map((c) => getChoreo(c.id))).then((choreos) => {
                            exportEvent(
                              choreos.filter(c => !!c), 
                              (JSON.parse(eventDetails) as EventDetails)?.event
                            );
                          });
                        }}
                        addEvent={() => {
                          goToNewChoreoPage(JSON.parse(eventDetails) as EventDetails);
                        }}
                        editEventName={() => {
                          setEditingEventName(eventDetails);
                          setEditingEventNameIds(choreos.map(x => x.id));
                          setEventNameDialogOpen(true);
                        }}
                        isExpandedByDefault={!isNullOrUndefinedOrBlank(searchTerm) || (yearIndex === 0 && choreoIndex === 0)}
                        isLoggedIn={isLoggedIn}
                        teamId={team?.id}
                      />
                      {
                        choreoIndex < events.size - 1 &&
                        <Divider compact/>
                      }
                    </React.Fragment>
                    )
                  }
                </ExpandableSection>
              </React.Fragment>
            )
          }
        </div>

        <Dialog.Root>
          <Dialog.Trigger>
            <div className="z-20 fixed flex items-center p-1.5 bg-white border-2 rounded-full bottom-12 right-8 size-10 border-primary">
              <img className="" src={`${process.env.PUBLIC_URL}/img/beginner.svg`}/>
            </div>
          </Dialog.Trigger>
          <BeginnersDialog/>
        </Dialog.Root>

        <input
          className='hidden'
          type="file"
          id="uploadFileInput"
          accept=".mtr, application/zip"
          onChange={(event) => {
            if (!event.target.files || event.target.files.length === 0) {
              console.log("No files were selected to upload.");              
            } else {
              var file = event.target.files?.[0];
              readUploadedFile(
                file,
                (newChoreo: Choreo) => {
                  newChoreo.teamId = team?.id;
                  const existingChoreos = Object.values(savedChoreos).flat();
                  const duplicateChoreo = existingChoreos.find(c => strEquals(c.name, newChoreo.name) && strEquals(c.event, newChoreo.event));
                  if (duplicateChoreo) {
                    setDuplicateChoreoId(duplicateChoreo.id);
                    setUploadChoreoDialogOpen(true);
                    setUploadedChoreo(newChoreo);
                  } else {
                    newChoreo.id = crypto.randomUUID();
                    saveChoreo(newChoreo, () => {onSelectChoreo(newChoreo, "localOnly")});
                  }
                },
                (newChoreos: Choreo[], errorMessage?: string) => {
                  if (newChoreos.length > 0) {
                    saveChoreos(
                      [...newChoreos.map((c) => ({...c, id: crypto.randomUUID()}))],
                      () => {
                        loadChoreos();
                        if (errorMessage) {
                          setUploadErrorMessage(errorMessage);
                          setUploadFailedDialogOpen(true);
                        } else {
                          setUploadSucceededDialogOpen(true);
                        }
                      }
                    );
                  } else {
                    setUploadErrorMessage(errorMessage ?? "アップロードできませんでした。");
                    setUploadFailedDialogOpen(true);
                  }
                  event.target.value = "";
                },
                (e) => {
                  setUploadErrorMessage(e);
                  setUploadFailedDialogOpen(true);
                  event.target.value = "";
                }
              );
            }
          }}/>
        <Dialog.Root
          handle={editChoreoInfoDialog}
          open={editChoreoInfoDialogOpen}
          onOpenChange={handleEditChoreoInfoDialogOpen}>
          <EditChoreoInfoDialog
            choreo={editingChoreo}
            eventList={eventList}
            onClose={() => {setEditingChoreo(undefined)}}
            onSubmit={(name: string, event: string, startDate?: string, endDate?: string) => {
              if (editingChoreo) {
                getChoreo(editingChoreo.id).then(choreo => {
                  if (choreo) {
                    saveChoreo({...choreo, name, event, startDate, endDate}, () => {
                      editChoreoInfoDialog.close();
                      setEditChoreoInfoDialogOpen(false);
                      setEditingChoreo(undefined);
                      loadChoreos();
                    });
                  }
                });
              }
            }}
          />
        </Dialog.Root>
        <Dialog.Root
          handle={editEventNameDialog}
          open={editEventNameDialogOpen}
          onOpenChange={handleEventNameDialogOpen}>
            
          <EditEventInfoDialog
            eventInfo={JSON.parse(editingEventName ?? "{}") as EventDetails}
            eventList={eventList}
            onClose={() => {setEditingEventName(undefined)}}
            onSubmit={(name, startDate, endDate) => {
              // get choreos either local or server
              if (editingEventNameIds) {
                Promise.all(editingEventNameIds.map((id) => getChoreo(id))).then((choreos) => {
                  saveChoreos(
                    choreos.filter(c => !!c).map(c => {return {
                      ...c,
                      event: name,
                      startDate: startDate,
                      endDate: endDate
                    }}), 
                    () => {
                      setEventNameDialogOpen(false);
                      loadChoreos();
                    }
                  );
                });
              }
            }}/>
        </Dialog.Root>
        <Dialog.Root
          handle={pdfExportDialog}
          open={pdfExportDialogOpen}
          onOpenChange={handlePdfExportDialogOpen}>
            
          {
            exportingChoreo &&
            <ExportDialog
              choreo={exportingChoreo!}
              selectedId={Object.values(exportingChoreo.dancers).find(d => strEquals(d.name, savedDancerName))?.id ?? ""}
              onClose={() => {
                setPdfExportDialogOpen(false);
                setExportingChoreo(undefined);
              }}
            />
          }
        </Dialog.Root>
        <Dialog.Root
          handle={syncChoreoDialog}
          open={syncChoreoDialogOpen}
          onOpenChange={handleSyncChoreoDialogOpen}>
          <SyncChoreoDialog
            savedChoreo={editingChoreo}
            serverChoreo={serverChoreoDetails[editingChoreo?.id ?? ""]}
            onClose={() => setSyncChoreoDialogOpen(false)}
            onOpenSaved={() => {
              if (editingChoreo) {
                getChoreo(editingChoreo.id).then((choreo) => {
                  if (choreo) {
                    setSyncChoreoDialogOpen(false);
                    onSelectChoreo(choreo, "edited");
                    setEditingChoreo(undefined);
                  }
                });
              }
            }}
            onDuplicate={() => {
              if (editingChoreo) {
                getChoreo(editingChoreo.id).then((choreo) => {
                  if (choreo) {
                    duplicateChoreo(choreo);
                    deleteChoreo(editingChoreo.id, async () => {
                      await getChoreoFromServer(editingChoreo.id).then((choreo) => {
                        if (choreo) onSelectChoreo(choreo, "localOnly");
                      });
                    });
                  }
                });
              }
            }}
            onDelete={() => {
              if (editingChoreo) {
                deleteChoreo(editingChoreo.id, async () => {
                  syncChoreoDialog.close();
                  setSyncChoreoDialogOpen(false);
                  setEditingChoreo(undefined);
                  await getChoreoFromServer(editingChoreo.id).then((choreo) => {
                    if (choreo) onSelectChoreo(choreo, "upToDate");
                  });
                });
              }
            }}
          />
        </Dialog.Root>
        <Dialog.Root
          handle={deleteChoreoDialog}
          open={deleteChoreoDialogOpen}
          onOpenChange={handleDeleteChoreoDialogOpen}>
            
          <BaseEditDialog
            title={`${deleteChoreoVerb}確認`}
            actionButtonText="OK"
            onSubmit={() => {
              if (editingChoreo) {
                deleteChoreo(editingChoreo.id, () => {
                  deleteChoreoDialog.close();
                  setDeleteChoreoDialogOpen(false);
                  setEditingChoreo(undefined);
                  loadChoreos();
                });
              }
            }}>
            <p className="max-w-full w-max">本当に<b> {editingChoreo?.name} </b>を{deleteChoreoVerb}しますか？</p>
            <p>この操作は取り消せません。</p>
          </BaseEditDialog>
        </Dialog.Root>
        <Dialog.Root
          handle={uploadFailedDialog}
          open={uploadFailedDialogOpen}
          onOpenChange={handleUploadFailedDialogOpen}>
            
          <BaseErrorDialog
            title="アップロード失敗"
            onClose={() => {setUploadFailedDialogOpen(false)}}>
            <p className="break-words whitespace-pre-line text-wrap">{uploadErrorMessage}</p>
            <p>別のファイルをお試しください。</p>
          </BaseErrorDialog>
        </Dialog.Root>
        <Dialog.Root
          handle={uploadSucceededDialog}
          open={uploadSucceededDialogOpen}
          onOpenChange={handleUploadSucceededDialogOpen}>
            
          <BaseErrorDialog
            title="アップロード成功"
            onClose={() => {setUploadSucceededDialogOpen(false)}}>
            <p>全てのファイルをアップロードできました。</p>
          </BaseErrorDialog>
        </Dialog.Root>
        <Dialog.Root
          handle={uploadChoreoDialog}
          open={uploadChoreoDialogOpen}
          onOpenChange={handleUploadChoreoDialogOpen}
        >
          <ConfirmUploadDialog
            choreoName={uploadedChoreo?.name}
            event={uploadedChoreo?.event}
            onCancel={() => {
              setUploadChoreoDialogOpen(false);
              setUploadedChoreo(undefined);
            }}
            onCopy={() => {
              const newChoreo = {
                ...uploadedChoreo!,
                id: crypto.randomUUID(),
                name: `${uploadedChoreo!.name}のコピー`,
                isDirty: false,
              } as Choreo;
              saveChoreo(newChoreo, () => {onSelectChoreo(newChoreo, "localOnly")});
              setUploadedChoreo(undefined);
              setUploadChoreoDialogOpen(false);
            }}
            onOverwrite={() => {
              setUploadChoreoDialogOpen(false);
              const newChoreo = {
                ...uploadedChoreo!,
                id: duplicateChoreoId ?? crypto.randomUUID(),
                isDirty: true,
              } as Choreo;
              saveChoreo(newChoreo, () => {onSelectChoreo(newChoreo, "localOnly")});
              setUploadedChoreo(undefined);
              setUploadChoreoDialogOpen(false);
            }}
          />
        </Dialog.Root>
        <Dialog.Root
          handle={loginDialog}
          open={loginDialogOpen}
          onOpenChange={handleLoginDialogOpen}>
          <LoginDialog
            onLogin={() => setIsLoggedIn(true)}
            onClose={() => {
              setLoginDialogOpen(false);
            }}
            teamId={team?.id ?? ""}/>
        </Dialog.Root>
      </div>
    </div>
  )
}

type EventSectionProps = {
  eventInfo: string,
  choreos: ChoreoWithStatus[],
  searchTerm: string,
  dancerNamesByFormation?: Record<string, string[]>,
  addEvent: () => void,
  editEventName: () => void,
  onSelectChoreo: (id: string, status: ChoreoStatus) => void,
  duplicateChoreo: (choreo: ChoreoWithStatus) => void,
  editChoreoName: (choreo: ChoreoWithStatus) => void,
  deleteChoreo: (choreo: ChoreoWithStatus) => void,
  revertChoreo: (choreo: ChoreoWithStatus) => void,
  syncChoreo: (choreo: ChoreoWithStatus) => void,
  onPdfExport: (choreo: ChoreoWithStatus) => void,
  onExport: (id: string) => void,
  onExportEvent: () => void,
  isExpandedByDefault?: boolean,
  isLoggedIn: boolean,
  teamId?: string,
}

function EventSection({
  eventInfo, dancerNamesByFormation, choreos, searchTerm, onSelectChoreo, addEvent, editEventName,
  duplicateChoreo, editChoreoName, deleteChoreo, revertChoreo, syncChoreo,
  onPdfExport, onExport, onExportEvent, isExpandedByDefault, isLoggedIn, teamId
}: EventSectionProps) {
  const optionsDialog = Dialog.createHandle<ChoreoWithStatus>();
  const [optionsDialogOpen, setOptionsDialogOpen] = React.useState(false);
  const [selectedChoreo, setSelectedChoreo] = useState<ChoreoWithStatus | undefined>();
  const [postPasswordAction, setPostPasswordAction] = useState<"none" | "open" | "rename" | "duplicate" | "export" | "pdf">("none");
  const dancerWarningDialog = Dialog.createHandle<Choreo>();
  const [dancerWarningDialogOpen, setDancerWarningDialogOpen] = React.useState(false);
  const choreoPasswordEntryDialog = Dialog.createHandle<Choreo>();
  const [choreoPasswordEntryDialogOpen, setChoreoPasswordEntryDialogOpen] = React.useState(false);

  const event = JSON.parse(eventInfo) as EventDetails;

  const missingNames = useMemo(() => {
    if (dancerNamesByFormation) {
      var allNames = new Set(Object.values(dancerNamesByFormation ?? {}).flat());
      var returnVal = Object.entries(dancerNamesByFormation).reduce((acc, [id, names]) => {
        return {
          ...acc,
          [id]: allNames.difference(new Set(names)),
        }
      }, {} as Record<string, Set<string>>);
      return returnVal;
    } else {
      return {}
    }
  }, [dancerNamesByFormation]);

  const handleOptionsDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setOptionsDialogOpen(isOpen);
  };
  const handleDancerWarningDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setDancerWarningDialogOpen(isOpen);
  };
  const handleChoreoPasswordEntryDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setChoreoPasswordEntryDialogOpen(isOpen);
  };
  
  return <ExpandableSection
    defaultExpanded={isExpandedByDefault ?? true}
    level={2}
    title={
      <div className="text-left">
        <div>
          {event.event?.length === 0 ? "イベント不明" : event.event}
        </div>
        {
          (event.startDate || event.endDate) && (event.event?.length ?? 0) > 0 &&
          <div className="text-sm font-bold text-gray-600">
            {formatDateRange(event.startDate, event.endDate, false)}
          </div>
        }
      </div>
    }
    menuContents={ // todo: add a feature to see the upload history
      <>
        <Menu.Item>
          <IconLabelButton full noBorder icon={ICON.add} label="追加" onClick={addEvent}/>
        </Menu.Item>
        <Divider compact/>
        <Menu.Item>
          <IconLabelButton full noBorder icon={ICON.edit} label="情報変更" onClick={editEventName}/>
        </Menu.Item>
        <Divider compact/>
        <Menu.Item>
          <IconLabelButton full noBorder icon={ICON.download} label="共有" onClick={() => onExportEvent()}/>
        </Menu.Item>
      </>
    }
  >
    <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
      {
        choreos.map((choreo) =>
          <React.Fragment key={choreo.id}>
            {
              (isNullOrUndefinedOrBlank(searchTerm) ||
              choreo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              choreo.event?.toLowerCase().includes(searchTerm.toLowerCase())) &&
              <div
                onClick={() => {
                  if (choreo.status === "syncRequired") {
                    syncChoreo(choreo);
                  } else {
                    if (choreo.hasPassword && !isLoggedIn) {
                      setSelectedChoreo(choreo);
                      setPostPasswordAction("open");
                      setChoreoPasswordEntryDialogOpen(true);
                    } else {
                      onSelectChoreo(choreo.id, choreo.status);
                    }
                  }
                }}
                className="flex flex-col justify-between h-full p-2 mx-[11px] transition-colors bg-white border border-gray-400 rounded-md cursor-pointer">
                {/* Title */}
                <div className="relative flex flex-row items-start justify-between gap-2">
                  <span className="flex items-center gap-0.5 font-medium text-left break-words text-wrap">
                    {choreo.hasPassword ? <Icon src={isLoggedIn ? ICON.lockOpen : ICON.lock} colour="primary" size="xs"/> : <></>}
                    <span>{choreo.name}</span>
                  </span>
                  <div className="flex flex-row items-center gap-2">
                    {
                      event.event && event.event.length > 0 && missingNames[choreo.id]?.size > 0 &&
                      <Dialog.Trigger handle={dancerWarningDialog} onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChoreo(choreo);
                        setDancerWarningDialogOpen(true);
                      }}>
                        <IconButton asDiv noBorder size="sm" src={ICON.personAlert} colour="primary"/>
                      </Dialog.Trigger>
                    }
                    <ChoreoStatusTag choreoStatus={choreo.status} version={choreo.version}/>
                    <Dialog.Trigger id={choreo.id} payload={choreo} handle={optionsDialog} onClick={(e) => {
                      e.stopPropagation();
                      setSelectedChoreo(choreo);
                      setOptionsDialogOpen(true);
                    }}>
                      <IconButton
                        src={ICON.moreVert}
                        colour="grey"
                        size="sm"
                        noBorder
                        asDiv
                      />
                    </Dialog.Trigger>
                  </div>
                </div>
                {/* Meta row */}
                <div className="items-center justify-between text-sm text-gray-500 md:flex">
                  {choreo.lastUpdated ? (
                    <div className="flex items-center gap-0.5">
                      <Icon
                        colour="grey"
                        size="xs"
                        src={ICON.history}/>
                      {getDate(new Date(choreo.lastUpdated))}
                    </div>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      <Icon
                        src={ICON.resize}
                        colour="grey"
                        size="xs"
                      />
                      <span>縦{choreo.stageLength}m 幅{choreo.stageWidth}m</span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <Icon
                        src={ICON.group}
                        colour="grey"
                        size="xs"
                      />
                      <span>{choreo.dancerCount}人</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </React.Fragment>
        )
      }
      <Dialog.Root
        open={optionsDialogOpen}
        onOpenChange={handleOptionsDialogOpenChange}
        handle={optionsDialog}>
        {
          selectedChoreo &&
          <CustomDialog hasX title={selectedChoreo.name}>
            <div className="flex flex-col gap-2">
              <Dialog.Close>
                <IconLabelButton
                  icon={ICON.edit}
                  label="隊列情報変更"
                  asDiv
                  onClick={() => {
                    if (!isLoggedIn && selectedChoreo.hasPassword) {
                      setPostPasswordAction("rename");
                      setChoreoPasswordEntryDialogOpen(true);
                    } else {
                      editChoreoName(selectedChoreo);
                    }
                  }}
                  full />
              </Dialog.Close>
              
              <Dialog.Close>
                <IconLabelButton
                  icon={ICON.fileCopy}
                  label="複製"
                  asDiv
                  onClick={() => {
                    if (!isLoggedIn && selectedChoreo.hasPassword) {
                      setPostPasswordAction("duplicate");
                      setChoreoPasswordEntryDialogOpen(true);
                    } else {
                      duplicateChoreo(selectedChoreo);
                    }
                  }}
                  full />
              </Dialog.Close>

              <Dialog.Close>
                <IconLabelButton
                  icon={ICON.fileExport}
                  label="共有用エクスポート"
                  asDiv
                  onClick={() => {
                    if (!isLoggedIn && selectedChoreo.hasPassword) {
                      setPostPasswordAction("export");
                      setChoreoPasswordEntryDialogOpen(true);
                    } else {
                      onExport(selectedChoreo.id);
                    }
                  }}
                  full />
              </Dialog.Close>
              
              <Dialog.Close>
                <IconLabelButton
                  icon={ICON.pictureAsPdf}
                  label="PDFをダウンロード"
                  asDiv
                  onClick={() => {
                    if (!isLoggedIn && selectedChoreo.hasPassword) {
                      setPostPasswordAction("pdf");
                      setChoreoPasswordEntryDialogOpen(true);
                    } else {
                      onPdfExport(selectedChoreo);
                    }
                  }}
                  full />
              </Dialog.Close>
              {
                selectedChoreo.status === "localOnly" &&
                <Dialog.Close>
                  <IconLabelButton
                    primaryText
                    icon={ICON.delete}
                    label="削除"
                    asDiv
                    onClick={() => deleteChoreo(selectedChoreo)}
                    full />
                </Dialog.Close>
              }

              {
                selectedChoreo.status === "syncRequired" &&
                <Dialog.Close>
                  <IconLabelButton
                    primaryText
                    icon={ICON.warning}
                    label="確認"
                    asDiv
                    onClick={() => {
                      syncChoreo(selectedChoreo);
                    }}
                    full />
                </Dialog.Close>
              }

              {
                selectedChoreo.status === "edited" &&
                <Dialog.Close>
                  <IconLabelButton
                    primaryText
                    icon={ICON.restorePage}
                    label="変更を破棄"
                    asDiv
                    onClick={() => revertChoreo(selectedChoreo)}
                    full />
                </Dialog.Close>
              }
            </div>
          </CustomDialog>
        }
      </Dialog.Root>
      {/* <Dialog.Root
        open={dancerWarningDialogOpen}
        onOpenChange={handleDancerWarningDialogOpenChange}
        handle={dancerWarningDialog}>
        <AbsentDancersWarningDialog
          choreoName={selectedChoreo?.name}
          eventName={selectedChoreo?.event}
          dancerNames={selectedChoreo ? Array.from(missingNames[selectedChoreo.id]): []}
        />
      </Dialog.Root> */}
      <Dialog.Root
        open={choreoPasswordEntryDialogOpen}
        onOpenChange={handleChoreoPasswordEntryDialogOpenChange}
        handle={choreoPasswordEntryDialog}>
        <ChoreoPasswordEntryDialog
          choreoId={selectedChoreo?.id}
          choreoName={selectedChoreo?.name}
          teamId={teamId!}
          onSuccess={() => {
              if (selectedChoreo) {
                switch (postPasswordAction) {
                  case "open":
                    onSelectChoreo(selectedChoreo.id, selectedChoreo.status);
                    break;
                  case "duplicate":
                    duplicateChoreo(selectedChoreo);
                    break;
                  case "export":
                    onExport(selectedChoreo.id);
                    break;
                  case "rename":
                    editChoreoName(selectedChoreo);
                    break;
                  case "pdf":
                    onPdfExport(selectedChoreo);
                    break;
                
                  default:
                    break;
                }
                if (postPasswordAction === "open") {
                } else if (postPasswordAction === "duplicate") {
                  duplicateChoreo(selectedChoreo);
                }
              }
            }
          }
          onClose={() => {
            setPostPasswordAction("none");
            setChoreoPasswordEntryDialogOpen(false);
          }}
        />
      </Dialog.Root>
    </div>
  </ExpandableSection>
}