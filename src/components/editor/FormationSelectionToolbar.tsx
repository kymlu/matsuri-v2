import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import { ChoreoSection } from "../../models/choreoSection";
import Button from "../basic/Button";
import { useRef, useState } from "react";
import IconButton from "../basic/IconButton";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import Icon from "../basic/Icon";
import { Dialog, DrawerPreview as Drawer } from "@base-ui/react";

type FormationSelectionToolbarProps = {
  currentSectionId: string,
  sections: ChoreoSection[],
  showAddButton?: boolean,
  onClickAddButton?: (id: string) => void,
  onChangeSection: (section: ChoreoSection) => void,
  onOpenSectionMenu?: () => void,
  onReorder?: (newSectionOrder: ChoreoSection[]) => void,
}

export default function FormationSelectionToolbar({
  currentSectionId, sections, showAddButton, onClickAddButton, 
  onChangeSection, onOpenSectionMenu, onReorder
}: FormationSelectionToolbarProps) {

  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
        delay: 100,
        tolerance: 50,
      },
    })
  );

  return <div className="grid grid-cols-[auto,1fr,auto] w-full max-w-full gap-2 p-2 overflow-scroll max-w-screen">
    <Drawer.Root
      swipeDirection="down"
      modal
    >
      <Drawer.Trigger>
        <IconButton
          src="menu"
          size="sm"
          asDiv
          colour="grey"
        />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Viewport className="fixed bottom-0 flex flex-col w-full pointer-events-none group">
          <div className="z-40 fixed w-[100svw] h-[100svh] top-0 bg-black/30 transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-data-[starting-style]:opacity-0 group-data-[ending-style]:opacity-0"/>
          <Drawer.Popup className="relative flex w-full min-h-0 flex-col overflow-visible rounded-t-2xl bg-gray-50 text-gray-900 touch-none shadow-[0_-16px_48px_rgb(0_0_0/0.12),0_6px_18px_rgb(0_0_0/0.06)] [--bleed:0rem] z-50 pointer-events-auto overscroll-contain transition-[transform,translate] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] [transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-[var(--bleed)] after:bg-gray-50 after:content-[''] outline-none data-[swiping]:select-none data-[starting-style]:translate-y-[calc(100%-var(--bleed))] data-[ending-style]:translate-y-[calc(100%-var(--bleed))] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]">
            <div className="flex-shrink-0 pt-6 pb-4 touch-none">
              <div className="w-1/3 h-1 mx-auto rounded-full bg-primary cursor-grab"/>
            </div>
            <Drawer.Content className="h-full px-4 pb-8">
              <div className="flex items-center self-end justify-between w-full mb-2">
                <span className="h-8 text-base font-bold truncate">
                  セクション選択
                </span>
                <Drawer.Close>
                  <Icon
                    size="sm"
                    src="clear"
                  />
                </Drawer.Close>
              </div>
              <div className="flex flex-col gap-2 overflow-auto h-max max-h-[50svh]">
                {
                  sections.map(s =>
                    <Dialog.Close key={s.id}>
                      <FormationSectionItem
                        section={s}
                        onChangeSection={() => onChangeSection(s)}
                        isSelected={strEquals(currentSectionId, s.id)}
                        asDiv
                        full
                      />
                    </Dialog.Close>
                  )
                }
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
    <div className="flex gap-2 overflow-scroll">
      <DndContext
        sensors={sensors}
        modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
        onDragMove={(event) => {
          if (!isDragging) {
            setIsDragging(true);
          }
        }}
        onDragEnd={(event) => {
          if (!isDragging) return;

          const { active, over } = event;

          if (onReorder && over && active.id !== over.id) {
            const oldIndex = sections.findIndex((item) => strEquals(item.id, active.id.toString()));
            const newIndex = sections.findIndex((item) => strEquals(item.id, over.id.toString()));
            onReorder(arrayMove(sections, oldIndex, newIndex));
          }
          setIsDragging(false);
        }}
      >
        <SortableContext
          disabled={!showAddButton}
          items={sections}>
          {
            sections.map((section, i) => 
              <FormationSectionItem
                key={section.id}
                section={section}
                isSelected={strEquals(currentSectionId, section.id)}
                onChangeSection={onChangeSection}
                onOpenSectionMenu={onOpenSectionMenu}
                />
            )
          }
        </SortableContext>
      </DndContext>
    </div>
    {
      showAddButton &&
      <IconButton
        size="sm"
        src="add"
        colour="grey"
        onClick={() => {onClickAddButton?.(crypto.randomUUID())}}
      />
    }
  </div>
}

function FormationSectionItem (props: {
  section: ChoreoSection,
  isSelected: boolean,
  onChangeSection: (section: ChoreoSection) => void,
  onOpenSectionMenu?: () => void,
  asDiv?: boolean,
  full?: boolean,
}) {
  var {section, isSelected, onChangeSection, onOpenSectionMenu, asDiv, full} = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: section.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const ref = useRef<HTMLButtonElement | null>(null);

  return <div style={style} ref={setNodeRef} {...attributes} {...listeners}>
    <Button
      primary={isSelected}
      fontSize="text-base"
      buttonref={ref}
      onClick={() => {
        if (!isSelected) {
          ref?.current?.scrollIntoView({"behavior": "smooth", "inline": "center"})
          onChangeSection(section);
        } else {
          onOpenSectionMenu?.();
        }
      }}
      asDiv={asDiv}
      full={full}
      >
      <div className={"flex flex-row items-center w-full h-6 gap-1 min-w-24 " + (full ? "justify-between" : "gap-2 justify-center")}>
        <span className={"truncate" + (isSelected ? " font-semibold" : " font-medium")}>
          {section.name}
        </span>
        {
          (!isNullOrUndefinedOrBlank(section.note) ||
          section.formation.dancerActions.length > 0 ||
          (onOpenSectionMenu && isSelected)) && 
          <div className="flex items-center">
            {
              !isNullOrUndefinedOrBlank(section.note) && 
              <Icon colour={ isSelected? "white" : "black" } src="speakerNotes" size="xs"/>
            }
            {
              section.formation.dancerActions.length > 0 && 
              <Icon colour={ isSelected? "white" : "black" } src="123" size="sm"/>
            }
            {
              onOpenSectionMenu && isSelected && 
              <Icon colour={ isSelected? "white" : "black" } src="arrowDropDown" size="sm"/>
            }
          </div>
        }
      </div>
    </Button>
  </div>
}