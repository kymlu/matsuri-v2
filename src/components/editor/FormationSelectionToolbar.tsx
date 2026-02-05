import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import { ChoreoSection } from "../../models/choreoSection";
import Button from "../basic/Button";
import { useState } from "react";
import IconButton from "../basic/IconButton";
import { ICON } from "../../lib/consts/consts";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import Icon from "../basic/Icon";

export default function FormationSelectionToolbar(props: {
  currentSectionId: string,
  sections: ChoreoSection[],
  showAddButton?: boolean,
  onClickAddButton?: (id: string, newName: string) => void,
  onClickSection: (section: ChoreoSection) => void,
  onReorder?: (newSectionOrder: ChoreoSection[]) => void,
}) {

  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 100,
        tolerance: 50,
      },
    })
)

  return <div className="flex w-screen gap-2 p-2 overflow-scroll max-w-screen">
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

        if (props.onReorder && over && active.id !== over.id) {
          const oldIndex = props.sections.findIndex((item) => strEquals(item.id, active.id.toString()));
          const newIndex = props.sections.findIndex((item) => strEquals(item.id, over.id.toString()));
          props.onReorder(arrayMove(props.sections, oldIndex, newIndex));
        }
        setIsDragging(false);
      }}
    >
      <SortableContext
        disabled={!props.showAddButton}
        items={props.sections}>
        {
          props.sections.map((section, i) => 
            <FormationSectionItem
              key={section.id}
              section={section}
              isSelected={strEquals(props.currentSectionId, section.id)}
              onClickSection={props.onClickSection}
              />
          )
        }
      </SortableContext>
    </DndContext>
    {
      props.showAddButton &&
      <IconButton
        size="sm"
        src={ICON.add}
        onClick={() => {props.onClickAddButton?.(crypto.randomUUID(), "セクション" + (props.sections.length + 1))}}
      />
    }
  </div>
}

function FormationSectionItem (props: {
  section: ChoreoSection,
  isSelected: boolean,
  onClickSection: (section: ChoreoSection) => void,
}) {
  var {section, isSelected, onClickSection} = props;

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

  return <div style={style} ref={setNodeRef} {...attributes} {...listeners}>
    <Button
      compact
      primary={isSelected}
      fontSize="text-base"
      onClick={() => {
        if (!isSelected) {
          onClickSection(section)
        }
      }}>
      <div className="flex flex-row items-center justify-center gap-1 min-w-24 w-max">
        <span className="truncate">
          {section.name}
        </span>
        {
          !isNullOrUndefinedOrBlank(section.note) && 
          <Icon colour={ isSelected? "white" : "black" } src={ICON.speakerNotes} size="xs"/>
        }
      </div>
    </Button>
  </div>
}