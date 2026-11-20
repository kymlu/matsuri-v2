import { StageGeometry } from "../../models/choreo";
import { ChoreoSection } from "../../models/choreoSection";
import { Dancer, DancerPosition } from "../../models/dancer";
import { DancerAction, DancerActionTiming } from "../../models/dancerAction";
import PositionHint from "./PositionHint";
import SectionSummaryList from "./SectionSummaryList";
import IconButton from "../basic/IconButton";
import Icon from "../basic/Icon";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import Divider from "../basic/Divider";
import Button from "../basic/Button";
import React, { memo, ReactNode, useState } from "react";
import BottomDrawer from "../basic/BottomDrawer";
import LongTextInput from "../inputs/LongTextInput";

type ViewerSidebarMode = "detail" | "list";

type ViewerSidebarProps = {
  note?: string;
  personalNote?: string;
  onPersonalNoteChange?: (newNote: string) => void; // personal notes are hidden without it
  sectionId: string;
  sections: ChoreoSection[];
  onChangeSection: (section: ChoreoSection) => void;
  dancer: Dancer;
  position: DancerPosition;
  nextPosition?: DancerPosition;
  stackNote?: string;
  stackMoveNote?: string;
  // Where the dancer is in a stack in a given section (〇〇の上 / 〇〇の下), for まとめ.
  stackLine?: (section: ChoreoSection) => string | undefined;
  selectedTiming?: string;
  onSelectTiming: (timing?: DancerActionTiming) => void;
  // すべて: every count of one action on the stage at once.
  shownActionId?: string;
  onShowAction: (action?: DancerAction) => void;
  actions?: DancerAction[];
  geometry: StageGeometry;
  isPositionHintShown: boolean;
  deselectPosition: () => void;
  formationSelectionToolbar: ReactNode,
  onChangeHeight: (height: number) => void,
};

function ViewerSidebar({
  note,
  personalNote,
  onPersonalNoteChange,
  sectionId,
  sections,
  onChangeSection,
  dancer,
  position,
  nextPosition,
  stackNote,
  stackMoveNote,
  stackLine,
  selectedTiming,
  onSelectTiming,
  shownActionId,
  onShowAction,
  actions,
  geometry,
  isPositionHintShown,
  deselectPosition,
  formationSelectionToolbar,
  onChangeHeight,
}: ViewerSidebarProps) {
  const [mode, setMode] = useState<ViewerSidebarMode>("detail");
  const [isPersonalNoteInfoShown, setIsPersonalNoteInfoShown] = useState(false);
  // Opened by tapping 自分用メモを書く; closes again when the section changes.
  const [isPersonalNoteOpen, setIsPersonalNoteOpen] = useState(false);
  const [noteSectionId, setNoteSectionId] = useState(sectionId);
  if (noteSectionId !== sectionId) {
    setNoteSectionId(sectionId);
    setIsPersonalNoteOpen(false);
  }
  const hasActions = !!actions && actions.length > 0;
  const hasNote = !isNullOrUndefinedOrBlank(note);
  const isPersonalNoteShown = isPersonalNoteOpen || !isNullOrUndefinedOrBlank(personalNote);
  const isListMode = isPositionHintShown && mode === "list";

  return <BottomDrawer
    header={
      <div className="flex items-center self-end justify-between w-full h-8 mb-2">
        <span className="text-base font-bold truncate">
          {isPositionHintShown ? dancer.name : "詳細"}
        </span>
        {
          (isPositionHintShown || selectedTiming || shownActionId) && <IconButton
            size="sm"
            src={isPositionHintShown ? "personCancel" : "clear"}
            noBorder
            onClick={() => {
              if (isPositionHintShown) {
                deselectPosition();
                setMode("detail");
              } else if (selectedTiming) {
                onSelectTiming();
              } else if (shownActionId) {
                onShowAction();
              }
            }}
          />
        }
      </div>
    }
    footer={
      <>
      <Divider medium/>
        {
          (!isPositionHintShown || mode === "detail") &&
          formationSelectionToolbar
        }
        {
          isPositionHintShown &&
          <div className="flex w-full gap-1 px-2 pt-1">
            <Button full compact primary={mode === "detail"} onClick={() => setMode("detail")}>
              詳細
            </Button>
            <Button full compact primary={mode === "list"} onClick={() => setMode("list")}>
              まとめ
            </Button>
          </div>
        }
      </>
    }
    onChangeHeight={(height) => onChangeHeight(height)}>
    <>
      {
        isListMode &&
        <SectionSummaryList
          dancer={dancer}
          sections={sections}
          currentSectionId={sectionId}
          geometry={geometry}
          onChangeSection={onChangeSection}
          stackLine={stackLine}
        />
      }
      {
        !isListMode &&
        <>
          {
            isPositionHintShown &&
            <PositionHint
              dancer={dancer}
              position={position}
              nextPosition={nextPosition}
              stackNote={stackNote}
              stackMoveNote={stackMoveNote}
              actions={actions}
              geometry={geometry}
            />
          }
          {
            hasActions && !isPositionHintShown &&
            <div className="grid grid-cols-[2fr,5fr] items-start gap-2">
              {
                actions.map(action =>
                  <React.Fragment key={action.id}>
                    <span className="mt-1.5">
                      {action.name}
                    </span>
                    {/* Timings joined into one strip. The 1px gap shows the background as divider lines, so wrapped rows stay tidy. */}
                    <div className="flex flex-wrap gap-px overflow-hidden border rounded-md w-fit max-w-full bg-line border-line [&>button]:flex-1 [&>button]:rounded-none">
                      <Button
                        noBorder
                        disabled={action.timings.every(t => t.dancerIds.length === 0)}
                        primary={strEquals(shownActionId, action.id)}
                        compact
                        onClick={() => onShowAction(strEquals(shownActionId, action.id) ? undefined : action)}
                        >
                        <div className="px-1 py-1 mx-auto text-center min-w-6 w-max">
                          すべて
                        </div>
                      </Button>
                      {
                        action.timings.map(timing =>
                          <Button
                            noBorder
                            key={timing.id}
                            disabled={timing.dancerIds.length === 0}
                            primary={strEquals(selectedTiming, timing.id)}
                            compact
                            onClick={() => onSelectTiming(strEquals(selectedTiming, timing.id) ? undefined : timing)}
                            >
                            {/* Centred even when the button stretches to fill a wrapped row */}
                            <div className="px-1 py-1 mx-auto text-center min-w-6 w-max">
                              {timing.name}
                            </div>
                          </Button>
                        )
                      }
                    </div>
                  </React.Fragment>
                )
              }
            </div>
          }
          {
            hasNote &&
            <>
              {(isPositionHintShown || hasActions) && <Divider/>}
              <div className="flex items-center gap-1 mb-1">
                <Icon src="globe" size="xs" colour="grey"/>
                <span className="text-sm text-muted">公開メモ</span>
              </div>
              <p className="break-words whitespace-pre-line text-wrap">
                {note}
              </p>
            </>
          }
          {
            onPersonalNoteChange &&
            <>
              {(isPositionHintShown || hasActions || hasNote) && <Divider/>}
              {
                !isPersonalNoteShown &&
                <button className="flex items-center gap-1 py-1 text-sm text-primary" onClick={() => setIsPersonalNoteOpen(true)}>
                  <Icon src="add" size="xs" colour="primary"/>
                  自分用メモを書く
                </button>
              }
              {
                isPersonalNoteShown &&
                <>
                  <div className="flex items-center gap-1 mb-1">
                    <Icon src="lock" size="xs" colour="grey"/>
                    <span className="text-sm text-muted">自分用メモ</span>
                    <div className="flex items-center gap-1 ml-auto text-xs text-faint">
                      <span>この端末にのみ保存。</span>
                      <button
                        className="flex items-center"
                        aria-label="詳細"
                        aria-expanded={isPersonalNoteInfoShown}
                        onClick={() => setIsPersonalNoteInfoShown(prev => !prev)}>
                        <Icon src="info" size="2xs" colour={isPersonalNoteInfoShown ? "primary" : "grey"}/>
                      </button>
                    </div>
                  </div>
                  <div className="pb-2 text-xs text-faint">
                    {
                      isPersonalNoteInfoShown &&
                      <div>アプリ内ブラウザやシークレットモードでは消える場合があります。</div>
                    }
                  </div>
                  <div className="pb-2">
                    <LongTextInput
                      key={sectionId}
                      name="自分用メモ"
                      defaultValue={personalNote ?? ""}
                      onContentChange={onPersonalNoteChange}
                      placeholder="自分用メモを追加…"
                      maxRows={2}
                      autoFocus={isPersonalNoteOpen}/>
                  </div>
                </>
              }
            </>
          }
        </>
      }
    </>
  </BottomDrawer>
}

export default memo(ViewerSidebar);
