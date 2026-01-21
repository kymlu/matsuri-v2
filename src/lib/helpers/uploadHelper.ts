export const readUploadedFile = (file: File) => {
    const reader = new FileReader();
  
    reader.addEventListener(
      "load",
      (event) => {
        if (event.target?.result) {
          // try {
          //   const uploadResult = JSON.parse(event.target.result.toString());

          //   var missingFields: string[] = [];
          //   if (!uploadResult.festival) missingFields.push("festival");
          //   if (!uploadResult.formationSections) missingFields.push("formationSections");
          //   if (!uploadResult.participants) missingFields.push("participants");
          //   if (!uploadResult.participantPositions) missingFields.push("participantPositions");
          //   if (!uploadResult.props) missingFields.push("props");
          //   if (!uploadResult.propPositions) missingFields.push("propPositions");
          //   if (!uploadResult.arrowPositions) missingFields.push("arrowPositions");
          //   if (!uploadResult.notes) missingFields.push("notes");
          //   if (!uploadResult.placeholders) missingFields.push("placeholders");
          //   if (!uploadResult.placeholderPositions) missingFields.push("placeholderPositions");
          //   if (missingFields.length > 0) {
          //     throw new Error("Missing fields: " + missingFields.join(", "));
          //   }

          //   var invalidFormatFields: string[] = [];

          //   if(!Array.isArray(uploadResult.festival)) invalidFormatFields.push("festival");
          //   if(!Array.isArray(uploadResult.formationSections)) invalidFormatFields.push("formationSections");
          //   if(!Array.isArray(uploadResult.participants)) invalidFormatFields.push("participants");
          //   if(!Array.isArray(uploadResult.participantPositions)) invalidFormatFields.push("participantPositions");
          //   if(!Array.isArray(uploadResult.props)) invalidFormatFields.push("props");
          //   if(!Array.isArray(uploadResult.propPositions)) invalidFormatFields.push("propPositions");
          //   if(!Array.isArray(uploadResult.arrowPositions)) invalidFormatFields.push("arrowPositions");
          //   if(!Array.isArray(uploadResult.notes)) invalidFormatFields.push("notes");
          //   if(!Array.isArray(uploadResult.placeholders)) invalidFormatFields.push("placeholders");
          //   if(!Array.isArray(uploadResult.placeholderPositions)) invalidFormatFields.push("placeholderPositions");
          //   if (invalidFormatFields.length > 0) {
          //     throw new Error("Invalid format for fields: " + invalidFormatFields.join(", "));
          //   }

          //   if (uploadResult.festival.length === 0) {
          //     throw new Error("No festival found");
          //   } else if (uploadResult.festival.length > 1) {
          //     throw new Error("Multiple festivals found");
          //   }
            
          //   const festival = uploadResult.festival[0] as Festival;
          //   const formations = new Set(festival.formations.map(formation => formation.id));
          //   if (formations.size === 0) { throw new Error("No formations found"); }

          //   const formationSections = (uploadResult.formationSections as FormationSection[])
          //     .filter(section => formations.has(section.formationId));
            
          //   if (formationSections.length === 0) { throw new Error("No formation sections found"); }

          //   const fsIds = new Set(formationSections.map(section => section.id));

          //   const filteredParticipants = (uploadResult.participants as Participant[]).filter(participant => strEquals(participant.festivalId, festival.id));
          //   const filteredProps = (uploadResult.props as Prop[]).filter(prop => strEquals(prop.festivalId, festival.id));
          //   const filteredPlaceholders = (uploadResult.placeholders as ParticipantPlaceholder[]).filter(placeholder => formations.has(placeholder.formationId));

          //   const filteredParticipantPositions = (uploadResult.participantPositions as ParticipantPosition[]).filter(x => fsIds.has(x.formationSectionId));
          //   const filteredPropPositions = (uploadResult.propPositions as PropPosition[]).filter(x => fsIds.has(x.formationSectionId));
          //   const filteredNotePositions = (uploadResult.notes as NotePosition[]).filter(x => fsIds.has(x.formationSectionId));
          //   const filteredArrowPositions = (uploadResult.arrowPositions as ArrowPosition[]).filter(x => fsIds.has(x.formationSectionId));
          //   const filteredPlaceholderPositions = (uploadResult.placeholderPositions as PlaceholderPosition[]).filter(x => fsIds.has(x.formationSectionId));

          //   saveToDatabase(
          //     festival,
          //     {
          //       participants: filteredParticipants,
          //       props: filteredProps,
          //     },
          //     [
          //       {
          //         sections: formationSections,
          //         participants: filteredParticipantPositions,
          //         props: filteredPropPositions,
          //         notes: filteredNotePositions,
          //         arrows: filteredArrowPositions,
          //         placeholders: filteredPlaceholders,
          //         placeholderPositions: filteredPlaceholderPositions,
          //       }
          //     ]
          //   );

          //   const firstFormation = festival.formations[0];
          //   const firstFormationSections = formationSections.filter(section => strEquals(section.formationId, firstFormation.id));
          //   const sectionIds = new Set(firstFormationSections.map(section => section.id));
          //   setDataBeforeNavigation(
          //     festival,
          //     firstFormation,
          //     {
          //       participants: filteredParticipants,
          //       props: filteredProps,
          //     },
          //     {
          //       sections: firstFormationSections,
          //       participants: filteredParticipantPositions.filter(x => sectionIds.has(x.formationSectionId)),
          //       props: filteredPropPositions.filter(x => sectionIds.has(x.formationSectionId)),
          //       notes: filteredNotePositions.filter(x => sectionIds.has(x.formationSectionId)),
          //       arrows: filteredArrowPositions.filter(x => sectionIds.has(x.formationSectionId)),
          //       placeholders: filteredPlaceholders.filter(x => strEquals(x.formationId, firstFormation.id)),
          //       placeholderPositions: filteredPlaceholderPositions.filter(x => sectionIds.has(x.formationSectionId)),
          //     }
          //   );
          //   navigateToFormationEditor();
          // } catch (error) {
          //   console.error("Failed to upload file:", error);
          //   setErrorMessage(`アップロードされたファイルの形式が正しくありません。別のファイルをアップロードしてください。`);
          //   setHasError(true);
          //   return;
          // }
        }
      },
      false,
    );

    try {
      reader.readAsText(file);
    } catch {
      console.error("No file was read.");
    }
  }