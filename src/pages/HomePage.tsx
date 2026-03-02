import { Dialog, Menu } from "@base-ui/react"
import CustomDialog from "../components/basic/CustomDialog"
import { ICON, LAST_UPDATED } from "../lib/consts/consts"
import { IconLabelButton } from "../components/basic/Button"
import Icon from "../components/basic/Icon"
import { readUploadedFile } from "../lib/helpers/uploadHelper"
import { useEffect, useMemo, useState } from "react"
import { deleteChoreo, getAllChoreos, saveChoreo, saveChoreos } from "../lib/dataAccess/DataController"
import { Choreo, ChoreoSchema } from "../models/choreo"
import { isNullOrUndefinedOrBlank, indexByKey, mapByKey, strCompare, strEquals } from "../lib/helpers/globalHelper"
import { downloadLogs } from "../lib/helpers/logHelper"
import { getDate } from "../lib/helpers/dateHelper"
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
import CustomMenu from "../components/inputs/CustomMenu"
import Divider from "../components/basic/Divider"
import EditNameDialog from "../components/dialogs/EditNameDialog"
import TextInput from "../components/inputs/TextInput"
import { loadAllForYear } from "../lib/dataAccess/FileAccess"
import UserNameEditDialog from "../components/dialogs/UserNameEditDialog"
import { Oval } from "react-loader-spinner"
import { colorPalette } from "../lib/consts/colors"
import EditChoreoInfoDialog from "../components/dialogs/EditChoreoInfoDialog"
import SyncChoreoDialog from "../components/dialogs/SyncChoreoDialog"

type HomePageProps = {
  eventList: string[]
  setEventList: (eventList: string[]) => void,
  goToNewChoreoPage: (eventName?: string) => void,
  goToViewPage: (choreo: Choreo) => void,
  userName: string | null,
  setUserName: (newName: string) => void,
}

type ChoreoWithStatus = Choreo & {
  status: "localOnly" | "syncRequired" | "upToDate" | "edited"
}

export default function HomePage({
  eventList, setEventList,
  goToNewChoreoPage, goToViewPage,
  userName, setUserName,
}: HomePageProps) {
  const [savedChoreos, setSavedChoreos] = useState<ChoreoWithStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [choreosFromServer, setChoreosFromServer] = useState<Record<string, Choreo>>({});

  useEffect(() => {
    loadChoreos();
  }, []);

  const loadChoreos = () => {
    setIsLoading(true);
    Promise.all([
      getAllChoreos(),
      loadAllForYear("2026")
    ]).then(([local, server]) => {
      server.push(z.parse(ChoreoSchema, SampleParade));
      server.push(z.parse(ChoreoSchema, SampleStage));
      const choreos: ChoreoWithStatus[] = [];
      const choreosFromServer: Record<string, Choreo> = {};
      const indexedLocal = indexByKey(local, "id");
      const indexedServer = indexByKey(server, "id");
      const allIds = new Set([...Object.keys(indexedLocal), ...Object.keys(indexedServer)]);
      
      allIds.forEach((id) => {
        const localChoreo = indexedLocal[id];
        const serverChoreo = indexedServer[id];
        if (!localChoreo) {
          choreos.push({...serverChoreo, status: "upToDate"});
        } else if (!serverChoreo) {
          choreos.push({...localChoreo, status: "localOnly"});
        } else if (serverChoreo.version !== localChoreo.version) {
          if (localChoreo.isDirty === true || localChoreo.isDirty === undefined) {
            choreosFromServer[serverChoreo.id] = serverChoreo;
            choreos.push({...localChoreo, status: "syncRequired"});
          } else {
            saveChoreo(serverChoreo, () => {}, false, false);
            choreos.push({...serverChoreo, status: "upToDate"});
          }
        } else {
          if (localChoreo.isDirty === true || localChoreo.isDirty === undefined) {
            choreosFromServer[serverChoreo.id] = serverChoreo;
            choreos.push({...localChoreo, status: "edited"});
          } else {
            choreos.push({...serverChoreo, status: "upToDate"});
          }
        }
      });
      setSavedChoreos(choreos);
      setChoreosFromServer(choreosFromServer);
      setIsLoading(false);
    });
  }

  useEffect(() => {
    setEventList(Array.from(
      new Set(
        savedChoreos
          .map(x => x.event)
          .filter(x => !isNullOrUndefinedOrBlank(x))
          .sort()
      )
    ));
  }, [savedChoreos]);

  const groupChoreos = (choreos: ChoreoWithStatus[]) => {
    return mapByKey(
      choreos.sort((a, b) => {
        const eventCmp = strCompare<ChoreoWithStatus>(a, b, "event");
        if (eventCmp !== 0) return eventCmp;

        const dateA = a.lastUpdated ? new Date(a.lastUpdated)?.getTime() : 0;
        const dateB = b.lastUpdated ? new Date(b.lastUpdated)?.getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;

        return strCompare<ChoreoWithStatus>(a, b, "name");
      }),
      "event"
    )
  }

  const filteredChoreos = useMemo(() => 
    groupChoreos(savedChoreos.filter(c => c.name.toLowerCase().includes(searchTerm) || c.event.toLowerCase().includes(searchTerm)))
  , [savedChoreos, searchTerm]);
  
  const [editingChoreo, setEditingChoreo] = useState<Choreo | undefined>();
  const [editChoreoInfoDialogOpen, setEditChoreoInfoDialogOpen] = useState(false);
  const editChoreoInfoDialog = Dialog.createHandle<{}>();
  const handleEditChoreoInfoDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setEditChoreoInfoDialogOpen(isOpen);
  };

  const [editingEventName, setEditingEventName] = useState<string | undefined>();
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
      name: `${choreo.name}のコピー`,
      lastUpdated: new Date().toISOString(),
    } as Choreo;
    saveChoreo(newChoreo, () => {
      setSavedChoreos(prev => [...prev, {...newChoreo, status: "localOnly"}]);
    });
  }

  return (
    <div className="bg-gray-50">
      <div className='grid py-10 px-6 h-[100svh] grid-rows-[auto,auto,auto,1fr] overflow-hide gap-2 w-full mx-auto'>
        <div className="flex items-center justify-between">
          <h1 className='text-2xl font-bold'>隊列表一覧</h1>
          <div>
            <Dialog.Root>
              <Dialog.Trigger>
                <IconButton src={ICON.info} colour="primary" noBorder asDiv/>
              </Dialog.Trigger>
              <CustomDialog title="サイト情報" hasX>
                <div className="flex flex-col justify-center gap-2 mb-2">
                  <span className="mb-2 text-center">問題がある場合は、<br/><b>ケイティー</b>まで<br/>問い合わせてください</span>
                  <IconLabelButton label="ログをダウンロード" icon={ICON.download} primary onClick={downloadLogs}/>
                  <span className="text-center text-gray-600">{LAST_UPDATED}</span>
                </div>
              </CustomDialog>
            </Dialog.Root>
            <Dialog.Root>
              <Dialog.Trigger>
                <IconButton src={ICON.personEdit} colour="primary" noBorder asDiv/>
              </Dialog.Trigger>
              <UserNameEditDialog name={userName ?? ""} onSubmit={(name) => setUserName(name)}/>
            </Dialog.Root>
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
                searchTerm={searchTerm}
                goToViewPage={goToViewPage}
                duplicateChoreo={duplicateChoreo}
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
                  setExportingChoreo(choreo);
                  setPdfExportDialogOpen(true);
                }}
                addEvent={() => {goToNewChoreoPage(eventName)}}
                editEventName={() => {
                  setEditingEventName(eventName);
                  setEventNameDialogOpen(true);
                }}
              />
            )
          }
        </div>

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
                  const existingChoreos = Object.values(savedChoreos).flat();
                  const duplicateChoreo = existingChoreos.find(c => strEquals(c.name, newChoreo.name) && strEquals(c.event, newChoreo.event));
                  if (duplicateChoreo) {
                    setDuplicateChoreoId(duplicateChoreo.id);
                    setUploadChoreoDialogOpen(true);
                    setUploadedChoreo(newChoreo);
                  } else {
                    newChoreo.id = crypto.randomUUID();
                    saveChoreo(newChoreo, () => {goToViewPage(newChoreo)});
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
            onSubmit={(name: string, event: string) => {
              if (editingChoreo) {
                saveChoreo({...editingChoreo, name, event}, () => {
                  editChoreoInfoDialog.close();
                  setEditChoreoInfoDialogOpen(false);
                  setEditingChoreo(undefined);
                  loadChoreos();
                });
              }
            }}
          />
        </Dialog.Root>
        <Dialog.Root
          handle={editEventNameDialog}
          open={editEventNameDialogOpen}
          onOpenChange={handleEventNameDialogOpen}>
            
          <EditNameDialog
            name={editingEventName}
            required={false}
            type="イベント"
            onClose={() => {setEditingEventName(undefined)}}
            onSubmit={(name) => {
              saveChoreos(
                savedChoreos.filter(c => strEquals(c.event, editingEventName ?? "")).map(c => {return {...c, event: name}}),
                () => {
                  setEventNameDialogOpen(false);
                  loadChoreos();
                }
              );
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
              selectedId=""
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
            serverChoreo={choreosFromServer[editingChoreo?.id ?? ""]}
            onClose={() => setSyncChoreoDialogOpen(false)}
            onOpenSaved={() => {
              if (editingChoreo) {
                setSyncChoreoDialogOpen(false);
                setEditingChoreo(undefined);
                goToViewPage(editingChoreo);
              }
            }}
            onDuplicate={() => {
              if(editingChoreo) {
                duplicateChoreo(editingChoreo);
                deleteChoreo(editingChoreo.id, () => {
                  goToViewPage(choreosFromServer[editingChoreo.id]);
                });
              }
            }}
            onDelete={() => {
              if (editingChoreo) {
                deleteChoreo(editingChoreo.id, () => {
                  syncChoreoDialog.close();
                  setSyncChoreoDialogOpen(false);
                  setEditingChoreo(undefined);
                  goToViewPage(choreosFromServer[editingChoreo.id]);
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
            <p>本当に<b> {editingChoreo?.name} </b>を{deleteChoreoVerb}しますか？</p>
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
                name: `${uploadedChoreo!.name} - コピー`,
                isDirty: false,
              } as Choreo;
              saveChoreo(newChoreo, () => {goToViewPage(newChoreo)});
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
              saveChoreo(newChoreo, () => {goToViewPage(newChoreo)});
              setUploadedChoreo(undefined);
              setUploadChoreoDialogOpen(false);
            }}
          />
        </Dialog.Root>
      </div>
    </div>
  )
}

type EventSectionProps = {
  eventName: string,
  choreos: ChoreoWithStatus[],
  searchTerm: string,
  addEvent: () => void,
  editEventName: () => void,
  goToViewPage: (choreo: Choreo) => void,
  duplicateChoreo: (choreo: Choreo) => void,
  editChoreoName: (choreo: Choreo) => void,
  deleteChoreo: (choreo: Choreo) => void,
  revertChoreo: (choreo: Choreo) => void,
  syncChoreo: (choreo: Choreo) => void,
  onPdfExport: (choreo: Choreo) => void,
}

function EventSection({
  eventName, choreos, searchTerm, goToViewPage, addEvent, editEventName,
  duplicateChoreo, editChoreoName, deleteChoreo, revertChoreo, syncChoreo, onPdfExport
}: EventSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const optionsDialog = Dialog.createHandle<Choreo>();
  const [optionsDialogOpen, setOptionsDialogOpen] = React.useState(false);
  const [selectedChoreo, setSelectedChoreo] = useState<ChoreoWithStatus | undefined>();

  const handleOptionsDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setOptionsDialogOpen(isOpen);
  };
  
  return <div className="space-y-2">
    <div className="flex flex-row justify-between w-full">
      <button onClick={() => setIsExpanded(prev => !prev)} className='flex flex-row items-center w-full'>
        <IconButton
          src={isExpanded ? ICON.arrowDropDown : ICON.arrowRight}
          size="sm"
          colour="primary"
          noBorder
          asDiv />
        <h2 className='text-xl font-bold text-primary'>{eventName.length === 0 ? "イベント不明" : eventName}</h2>
      </button>
      <CustomMenu trigger={
        <IconButton
          src={ICON.moreVert}
          asDiv
          noBorder
          colour="grey"
          size="sm"
        />
      }>
        <Menu.Item>
          <IconLabelButton full noBorder icon={ICON.add} label="追加" onClick={addEvent}/>
        </Menu.Item>
        <Divider compact/>
        <Menu.Item>
          <IconLabelButton full noBorder icon={ICON.edit} label="名前変更" onClick={editEventName}/>
        </Menu.Item>
        <Divider compact/>
        <Menu.Item>
          <IconLabelButton full noBorder icon={ICON.download} label="共有" onClick={() => exportEvent(choreos, eventName)}/>
        </Menu.Item>
      </CustomMenu>
    </div>
    {
      isExpanded && 
      <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
        {
          choreos.map((choreo) =>
            <React.Fragment key={choreo.id}>
              {
                (isNullOrUndefinedOrBlank(searchTerm) ||
                choreo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                choreo.event.toLowerCase().includes(searchTerm.toLowerCase())) &&
                <div
                  onClick={() => {
                    const {status, ...c} = choreo;
                    if (status === "syncRequired") {
                      syncChoreo(c);
                    } else {
                      goToViewPage(c);
                    }
                  }}
                  className="relative flex flex-col justify-between h-full p-2 transition-colors bg-white border border-gray-400 rounded-md cursor-pointer">
                  {/* Title */}
                  <div className="flex flex-row items-start justify-between gap-2">
                    <span className="text-lg font-medium text-left break-words text-wrap">
                      {choreo.name}
                    </span>
                    <div className="flex flex-row gap-2">
                      {
                        choreo.status === "syncRequired" &&
                        <div className="p-1 text-sm font-semibold text-white border rounded-md text-nowrap bg-primary border-primary">要確認</div>
                      }
                      {
                        (choreo.status === "localOnly" || choreo.status === "edited") &&
                        <div className="p-1 text-sm text-gray-600 bg-white border border-gray-600 rounded-md text-nowrap">未公開</div>
                      }
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
                      <div className="flex items-center gap-1">
                        <Icon colour="grey" size="sm" src={ICON.history}/>{getDate(new Date(choreo.lastUpdated))}
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Icon
                          src={ICON.resize}
                          colour="grey"
                          size="sm"
                        />
                        <span>幅{choreo.stageGeometry.stageWidth}m 縦{choreo.stageGeometry.stageLength}m</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Icon
                          src={ICON.group}
                          colour="grey"
                          size="sm"
                        />
                        <span>{Object.keys(choreo.dancers).length}人</span>
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
                    onClick={() => editChoreoName(selectedChoreo)}
                    full />
                </Dialog.Close>
                
                <Dialog.Close>
                  <IconLabelButton
                    icon={ICON.fileCopy}
                    label="複製"
                    asDiv
                    onClick={() => duplicateChoreo(selectedChoreo)}
                    full />
                </Dialog.Close>

                <Dialog.Close>
                  <IconLabelButton
                    icon={ICON.fileExport}
                    label="共有用エクスポート"
                    asDiv
                    onClick={() => exportChoreo(selectedChoreo)}
                    full />
                </Dialog.Close>
                
                <Dialog.Close>
                  <IconLabelButton
                    icon={ICON.pictureAsPdf}
                    label="PDFをダウンロード"
                    asDiv
                    onClick={() => onPdfExport(selectedChoreo)}
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
                        const {status, ...c} = selectedChoreo;
                        syncChoreo(c);
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
      </div>
    }
  </div>
}