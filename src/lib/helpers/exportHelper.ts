import jsPDF, { GState } from "jspdf";
import { Choreo } from "../../models/choreo";
import { colorPalette } from "../consts/colors";
import { getDefaultFileName, getSafeFileName, isNullOrUndefined, isNullOrUndefinedOrBlank, roundToTenth, strEquals } from "./globalHelper";
import { stageMetersToPx } from "./editorCalculationHelper";
import { BaseModel, Coordinates } from "../../models/base";
import JSZip from "jszip";
import { Obstacle } from "../../models/prop";
import { PDF_METER_PX, STRIPES_PER_METRE } from "../consts/consts";

const README_TEXT =
  "このZIPには本アプリ用のデータが含まれています。\n" +
  "ZIPファイル、または中の .mtr ファイルを本アプリで読み込んでください。\n\n" +
  "複数 .mtr ファイルが存在する場合、manifest.txtでどのファイルがどの隊列表がわかります。" +
  "一部のアプリでは .mtr ファイルを送信できない場合があります。\n" +
  "その場合は、このZIPファイルをそのまま共有してください。";

const ZIP_OPTIONS = {
  type: "blob" as const,
  compression: "DEFLATE" as const,
  compressionOptions: { level: 6 },
};

async function downloadZip(zip: JSZip, fileName: string) {
  const fullFileName = `${getSafeFileName(fileName)}.zip`

  const blob = await zip.generateAsync(ZIP_OPTIONS);
  const url = URL.createObjectURL(blob);
  
  const file = new File ([blob], fullFileName, {
    type: "application/zip"
  });
  const dataToShare = {"files": [file]};
  if (navigator.canShare?.(dataToShare)) {
    try {
      await navigator.share(dataToShare);
      return;
    } catch (e: any) {
      console.log("Navigator share failed:", e);
      if (e?.name === "AbortError") {
        return;
      }
    }
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = fullFileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportChoreo(choreo: Choreo) {
  const zip = new JSZip();

  const fileName = getDefaultFileName(choreo);  
  zip.file(
    `${choreo.id}.mtr`,
    JSON.stringify(choreo)
  );
  zip.file("README.txt", README_TEXT);

  await downloadZip(zip, fileName);
}

export async function exportEvent(
  choreoList: Choreo[],
  eventName = "隊列表"
) {
  const zip = new JSZip();
  var list: BaseModel[] = [];

  choreoList.forEach(choreo => {
    zip.file(
      `${choreo.id}.mtr`,
      JSON.stringify(choreo)
    );
    list.push({id: choreo.id, name: choreo.name});
  });

  zip.file("README.txt", README_TEXT);
  zip.file("manifest.txt", JSON.stringify(list, undefined, 2));

  await downloadZip(zip, isNullOrUndefinedOrBlank(eventName) ? "隊列表" : eventName);
}

export async function exportToPdf (
  choreo: Choreo,
  fileName: string,
  followingId: string,
  showFollowingPath: boolean = false,
  updateProgress: (progress: number) => void,
  onComplete: () => void,
) {
  const titleBuffer = PDF_METER_PX * 1.5;
  const pageMargin = PDF_METER_PX * 0.5;
  const memoBuffer = PDF_METER_PX * 6;
  const memoWidth = PDF_METER_PX * 5;

  const stage = choreo.stageGeometry;
  
  // sizes in meters
  const sideMarginM = stage.margin.leftMargin;
  const topMarginM = stage.margin.topMargin;
  const totalWidthM = stage.stageWidth + sideMarginM * 2;
  const totalLengthM = stage.stageLength + topMarginM * 2;
  
  // stage-only dimensions
  const stageWidthPx = stage.stageWidth * PDF_METER_PX;
  const stageHeightPx = stage.stageLength * PDF_METER_PX;
    
  // total area (stage + out of bounds) dimensions
  const diagramWidthPx = totalWidthM * PDF_METER_PX;
  const diagramHeightPx = totalLengthM * PDF_METER_PX;

  // stage borders
  const stageLeftPx = sideMarginM * PDF_METER_PX + pageMargin;
  const stageRightPx = stageLeftPx + stageWidthPx;
  const stageTopPx = topMarginM * PDF_METER_PX;
  const stageBottomPx = stageTopPx + stageHeightPx;

  // x of the center
  const centerX = stageLeftPx + stageWidthPx / 2;

  // offset by 0.5m if the grid totalWidthM is uneven
  const isOddTotal = totalWidthM % 2 === 1;
  const gridOffsetMeters = isOddTotal ? 0.5 : 0;
  const gridOffsetPx = gridOffsetMeters * PDF_METER_PX;

  const followingDancer = choreo.dancers[followingId];
  var memoLeft = diagramWidthPx + pageMargin * 2;

  // formations longer than 20m will print in increments
  var visualDiagramHeightPx = diagramHeightPx;
  var startingPoints: number[] = [];
  var sectionDeltas: number[] = [];
  if (stage.yAxis === "bottom-up" && stage.stageLength > 20) {
    choreo.sections.forEach((s) => {
      var yValues = Object.values(s.formation.dancerPositions).map(p => p.y );
      var propYValues = Object.values(s.formation.propPositions).map(p => p.y); // to do: consider the length of the prop?
      var min = Math.min(...yValues.map(y => y - 2), ...propYValues.map(y => y - 2));
      var max = Math.max(...yValues.map(y => y + 2), ...propYValues.map(y => y + 2));
      var delta = Math.ceil(max - min);
      startingPoints.push(Math.ceil(max));
      sectionDeltas.push(delta)
    });

    visualDiagramHeightPx = Math.max(...sectionDeltas, 8) * PDF_METER_PX;
  }

  // only add memo space if there are notes, actions, or there is a dancer being followed 
  const fileWidth = diagramWidthPx + pageMargin + (
    followingDancer || choreo.sections.some(x => !isNullOrUndefinedOrBlank(x.note) || x.formation.dancerActions.length > 0) ?
    memoBuffer : pageMargin);
  const fileHeight = visualDiagramHeightPx + titleBuffer + pageMargin;
  
  // create pdf and set settings
  const pdf = new jsPDF({
    orientation: fileWidth > fileHeight ? "landscape" : "portrait",
    unit: "px",
    format: [fileWidth, fileHeight]});
  
  var context = pdf.context2d;
  context.font = "NotoSansJP";

  pdf.setLanguage("ja");

  const get_text_file = async (weight: "Regular" | "Bold") => {
    const res = await fetch(`${process.env.PUBLIC_URL}/fonts/NotoSansJP-${weight}.txt`); 
    // check for errors
    if (!res.ok) {
      throw res;
    }
    return res.text();
  }; 

  const boldFont = "NotoSansJPBold";
  const font = "NotoSansJPRegular";

  pdf.addFileToVFS("NotoSansJpBold.ttf", await get_text_file("Bold"));
  pdf.addFont("NotoSansJpBold.ttf", boldFont, "normal");
  pdf.addFileToVFS("NotoSansJPRegular.ttf", await get_text_file("Regular"));
  pdf.addFont("NotoSansJPRegular.ttf", font, "normal");
  pdf.setFont(boldFont);

  updateProgress(Math.round((1 / (choreo.sections.length + 1)) * 100));
  console.log("Exporting to PDF: ", fileName);

  for (let i = 0; i < choreo.sections.length; i++) {
    const section = choreo.sections[i];
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
    console.log("Exporting", section.name);

    const startingPoint: number | null = startingPoints[i] ? (startingPoints[i] + (visualDiagramHeightPx/PDF_METER_PX - sectionDeltas[i])) : null;
    const startingPointDelta = startingPoint ? Math.max(stageHeightPx - (startingPoint * PDF_METER_PX), -PDF_METER_PX) + topMarginM * PDF_METER_PX : 0;

    // draw out of bounds
    pdf.setFillColor(colorPalette.offWhite);
    pdf.roundedRect(pageMargin, 0 + titleBuffer, diagramWidthPx, visualDiagramHeightPx, 5, 5, "F");

    // draw in bounds area
    pdf.setFillColor(colorPalette.white);
    pdf.rect(stageLeftPx, (startingPoint ? 0 : stageTopPx) + titleBuffer, stageWidthPx, (startingPoint ? visualDiagramHeightPx : stageHeightPx), "F");

    // Vertical grid lines (across full area)
    for (let m = 0; m < totalWidthM - gridOffsetMeters; m++) {
      const x = m * PDF_METER_PX + gridOffsetPx;

      if (x === 0) continue;
    
      const distFromCenter = Math.abs(
        x - centerX - pageMargin
      ) / PDF_METER_PX;
    
      const isMajor = Math.round(distFromCenter) % 2 === 0;

      drawLine(pdf, colorPalette.lightGrey, 0.6, isMajor ? [4, 6] : [10, 6], x + pageMargin, 0 + titleBuffer, x + pageMargin, visualDiagramHeightPx + titleBuffer);
    }

    // Horizontal grid lines + right labels
    for (let m = 0; m <= totalLengthM; m++) {
      const y = m * PDF_METER_PX;
      const isMajor = m % 2 === 0;

      if (m > 0 && m < totalLengthM && y < visualDiagramHeightPx) {
        drawLine(pdf, colorPalette.lightGrey, 0.6, isMajor ? [10, 6] : [4, 6], pageMargin, y + titleBuffer, diagramWidthPx + pageMargin, y + titleBuffer);
      }

      // Right-side meter labels
      // if stage, 0 at top of stage
      // if parade, 0 at bottom of stage

      const txtY = y + 3 + titleBuffer - startingPointDelta;
      if (txtY >= stageTopPx && y <= stageBottomPx && txtY <= (visualDiagramHeightPx + titleBuffer)) {
        const meterFromTop =
          stage.yAxis === "top-down" ? 
          (y - stageTopPx) / PDF_METER_PX :
          (stageBottomPx - y) / PDF_METER_PX;
        
        
        if (meterFromTop >= 0) {
          pdf.setFontSize(12);
          pdf.setTextColor(colorPalette.black);
          pdf.text(`${meterFromTop}m`, stageRightPx + 8, txtY);
        }
      }
    }

    // Center line
    drawLine(pdf, colorPalette.midGrey, 1, [10, 6], centerX, titleBuffer, centerX, visualDiagramHeightPx + titleBuffer);


    // centre triangle
    pdf.setLineDashPattern([], 0);
    pdf.setLineWidth(0);
    pdf.setDrawColor(colorPalette.grey);
    pdf.setFillColor(colorPalette.grey);
    if (isNullOrUndefined(startingPoint)) {
      pdf.triangle(
        centerX, stageTopPx - PDF_METER_PX * 0.2 + titleBuffer,
        centerX - PDF_METER_PX * 0.7, stageTopPx - PDF_METER_PX * 1.2 + titleBuffer,
        centerX + PDF_METER_PX * 0.7, stageTopPx - PDF_METER_PX * 1.2 + titleBuffer,
        "FD"
      );
      pdf.setTextColor("white");
      pdf.text("前", centerX, stageTopPx + PDF_METER_PX * 0.85, {maxWidth: PDF_METER_PX * 1.4, align: "center"});
    } else {
      pdf.triangle(
        centerX, titleBuffer + PDF_METER_PX * 0.9,
        centerX - PDF_METER_PX * 0.7, titleBuffer,
        centerX + PDF_METER_PX * 0.7, titleBuffer,
        "FD"
      );
      pdf.setTextColor("white");
      pdf.text("前", centerX, titleBuffer + PDF_METER_PX * 0.5, {maxWidth: PDF_METER_PX * 1.4, align: "center"});
    }

    pdf.setLineDashPattern([], 0);
    pdf.setFontSize(8);

    // Draw obstacles
    if (choreo.obstacles) {
      Object.values(choreo.obstacles).forEach(obstacle => {
        context.save();
        const positionInPx = stageMetersToPx({x: obstacle.x, y: obstacle.y}, stage, PDF_METER_PX, obstacle.length);
        const obstacleX = positionInPx.x + pageMargin;
        const obstacleY = positionInPx.y + titleBuffer - startingPointDelta;

        const obstacleWidth  = PDF_METER_PX * obstacle.width;
        const obstacleHeight = PDF_METER_PX * obstacle.length;

        const angle = ((obstacle.rotation ?? 0) * Math.PI) / 180;

        // Move origin to the item's top-left
        context.translate(obstacleX, obstacleY);

        // Rotate around that point
        context.rotate(angle);

        // Draw the item relative to its own top-left
        context.strokeStyle = obstacle.color;
        context.lineWidth = 1;
        context.strokeRect(0, 0, obstacleWidth, obstacleHeight);

        const stripes = getStripeLines(obstacle);
        stripes.forEach(({x1, y1, x2, y2}) => {
          context.moveTo(x1, y1);
          context.lineTo(x2, y2);
          context.stroke();
        })
        
        context.fillStyle = colorPalette.black;
        var textDimension = pdf.getTextDimensions(obstacle.name, {maxWidth: obstacleWidth});
        context.fillText(obstacle.name,
          obstacleWidth/2 - textDimension.w/2,
          obstacleHeight/2 + (textDimension.h/3),
          obstacleWidth);

        context.restore();
      });
    }

    // Top numbering relative to center
    for (let m = 1; m < totalWidthM; m++) {
      const x = m * PDF_METER_PX + gridOffsetPx - pageMargin;
    
      const isCenter = x === centerX;
      if (
        x >= stageLeftPx &&
        x <= stageRightPx &&
        !isCenter
      ) {
        const meterFromCenter = Math.abs(x - centerX) / PDF_METER_PX;

        if (meterFromCenter % 2 !== 0) continue;
    
        const radius = PDF_METER_PX * 0.3;
        const cx = x;
        const cy = stageTopPx - PDF_METER_PX * (startingPoint ? 1.5 : 1);

        pdf.setFontSize(8);
        pdf.setFillColor(colorPalette.primary);
        pdf.setDrawColor(colorPalette.primary);
        pdf.setTextColor(colorPalette.white);
        pdf.circle(cx, cy + titleBuffer, radius, "F");
        pdf.text(`${meterFromCenter}`, cx, cy - 3 + titleBuffer, {align: "center", baseline: "top", maxWidth: PDF_METER_PX});
      }
    }

    if (startingPoint) {
      pdf.setFillColor(colorPalette.white);
      pdf.rect(0, 0, fileWidth, titleBuffer, "F");
      pdf.rect(0, fileHeight - pageMargin, fileWidth, pageMargin, "F");
    }
    // draw section title 
    pdf.setTextColor(colorPalette.black);
    pdf.setFontSize(16);
    pdf.text(section.name, centerX, PDF_METER_PX, {maxWidth: diagramWidthPx, align: "center"});

    // main stage border
    pdf.setDrawColor(colorPalette.grey);
    pdf.setLineWidth(1);
    pdf.rect(stageLeftPx, (startingPoints[i] ? 0 : stageTopPx) + titleBuffer, stageWidthPx, startingPoints[i] ? visualDiagramHeightPx : stageHeightPx)

    pdf.setFontSize(8);

    // Draw props
    Object.values(section.formation.propPositions).forEach(p => {
      var prop = choreo.props[p.propId];
      if (prop) {
        context.save();
        const positionInPx = stageMetersToPx(p, stage, PDF_METER_PX, prop.length);
        const propX = positionInPx.x + pageMargin;
        const propY = positionInPx.y + titleBuffer - startingPointDelta;

        const propWidth  = PDF_METER_PX * prop.width;
        const propHeight = PDF_METER_PX * prop.length;

        const angle = ((p.rotation ?? 0) * Math.PI) / 180;

        context.save();

        // Move origin to the item's top-left
        context.translate(propX, propY);

        // Rotate around that point
        context.rotate(angle);

        // Draw the item relative to its own top-left
        context.fillStyle = prop.color;
        context.fillRect(0, 0, propWidth, propHeight);
        
        context.fillStyle = colorPalette.getTextColor(prop.color);
        var textDimension = pdf.getTextDimensions(prop?.name ?? "", {maxWidth: propWidth});
        context.fillText(prop?.name ?? "",
          propWidth/2 - textDimension.w/2,
          propHeight/2 + (textDimension.h/3),
          propWidth);

        context.restore();
      }
    });

    // Get actions by dancer
    var actionsByDancer = Object.keys(choreo.dancers).reduce((acc, item) => {
      acc[item] = [];
      return acc;
    }, {} as Record<string, (number | undefined)[]>);

    section.formation.dancerActions.forEach((action, i) => {
      action.timings.forEach((t, tIndex) => {
        t.dancerIds.forEach(d => {
          actionsByDancer[d][i] = tIndex;
        })
      })
    });

    // Draw participants
    Object.values(section.formation.dancerPositions).forEach(p => {
      var dancer = choreo.dancers[p.dancerId];
      if (dancer) {
        const isFollowing = strEquals(followingId, dancer.id);
        const hasActions = actionsByDancer[p.dancerId]?.length > 0;
  
        const positionInPx = stageMetersToPx(p, stage, PDF_METER_PX);
        const x =  positionInPx.x + pageMargin;
        const y = positionInPx.y - startingPointDelta;
        
        if (isFollowing) {
          pdf.setLineWidth(2);
          pdf.setDrawColor(colorPalette.primary);
          pdf.setFillColor(colorPalette.white);
          pdf.circle(x, y + titleBuffer, PDF_METER_PX * 0.38, "FD");
        } else if (hasActions) {
          pdf.setFillColor(colorPalette.white);
          pdf.setDrawColor(colorPalette.white);
          pdf.setLineWidth(1.7);
          pdf.circle(x, y + titleBuffer, PDF_METER_PX * 0.38, "FD");

          context.lineWidth = 2;
          section.formation.dancerActions.forEach((_, i) => {
            if (actionsByDancer[p.dancerId][i] !== undefined) {
              const [start, end] = getSectionRadians(section.formation.dancerActions.length, i);
              context.strokeStyle = colorPalette.actionOutlineColours[actionsByDancer[p.dancerId][i] as number];
              context.beginPath();
              context.arc(x, y + titleBuffer, PDF_METER_PX * 0.38, start, end, false);
              context.stroke();
            }
          })
        }

        pdf.setLineWidth(0.8);
        pdf.setDrawColor(p.color);
        pdf.setFillColor(p.color);
        pdf.circle(x, y + titleBuffer, PDF_METER_PX * (isFollowing || hasActions ? 0.27 : 0.4), "FD");
  
        pdf.setTextColor(colorPalette.getTextColor(p.color));
        var displayName = dancer.name ?? "";
        var textHeight = pdf.getTextDimensions(displayName, {maxWidth: PDF_METER_PX}).h;
        pdf.text(displayName, x, y - textHeight/2 + titleBuffer, {align: "center", baseline: "top", maxWidth: PDF_METER_PX});
      }
    });

    var memoY = PDF_METER_PX;

    if (followingDancer) {
      var nextPosition = choreo.sections[i + 1]?.formation?.dancerPositions[followingDancer.id];

      if (showFollowingPath) {
        var currentPosition = section.formation.dancerPositions[followingDancer.id];
        if (currentPosition && nextPosition &&
          (currentPosition.x !== nextPosition.x || currentPosition.y !== nextPosition.y)) {
            const currentPx = stageMetersToPx(currentPosition, stage, PDF_METER_PX);
            const currentX =  currentPx.x + pageMargin;
            const currentY = currentPx.y - startingPointDelta + titleBuffer;
            const nextPx = stageMetersToPx(nextPosition, stage, PDF_METER_PX);
            const nextX =  nextPx.x + pageMargin;
            const nextY = nextPx.y - startingPointDelta + titleBuffer;
            
            pdf.saveGraphicsState();
            const gState = new GState({ opacity: 0.5 });
            pdf.setGState(gState);

            pdf.setLineWidth(0.8);
            pdf.setDrawColor(nextPosition.color);
            pdf.setFillColor(nextPosition.color);

            pdf.circle(nextX, nextY, PDF_METER_PX * 0.4, "FD");
            drawLine(pdf, colorPalette.primary, 1, [1, 1], currentX, currentY, nextX, nextY);
            
            pdf.restoreGraphicsState();
        }
      }

      pdf.setTextColor(colorPalette.black);
      pdf.setFontSize(12);
      
      var position = section.formation.dancerPositions[followingDancer.id];
      var displayX = "";
      var xFromCenter = stage.stageWidth / 2 - position.x;
      if (xFromCenter === 0) {
        displayX = "↔︎0";
      } else if (xFromCenter > 0) {
        displayX = "←" + roundToTenth(Math.abs(xFromCenter));
      } else {
        displayX = "→" + roundToTenth(Math.abs(xFromCenter));
      }
  
      var displayY = roundToTenth(position.y);

      pdf.setFontSize(14);
      pdf.text(followingDancer.name, memoLeft, memoY, {maxWidth: memoWidth});

      const dancerNameHeight = pdf.getTextDimensions(followingDancer.name, {maxWidth: memoWidth}).h;
      memoY += dancerNameHeight > 20 ? dancerNameHeight / 2 + 5 : 5;
      drawLine(pdf, colorPalette.primary, 0.8, [], memoLeft, memoY, memoLeft + memoWidth, memoY);

      memoY += 5;

      // current position
      pdf.setDrawColor(colorPalette.lightGrey);
      pdf.setLineWidth(1);
      pdf.roundedRect(memoLeft, memoY, memoWidth, 30, 5, 5, "S");
      
      memoY += 10;
      
      pdf.setFontSize(8);
      pdf.setFont(font);
      pdf.setTextColor(colorPalette.grey);
      pdf.text("現在の位置", memoLeft + memoWidth/2, memoY, {maxWidth: memoWidth, align: "center"});
      memoY += 13.5;
      
      pdf.setFontSize(14);
      pdf.setFont(boldFont);
      pdf.setTextColor(colorPalette.black);
      const currentPositionText = `${displayY}m/${displayX}m`;
      pdf.text(currentPositionText, memoLeft + memoWidth/2 + 4, memoY, {maxWidth: memoWidth, align: "center"});
      memoY += 10.5;
      
      const delta: Coordinates | null = nextPosition ? {
        x: roundToTenth(nextPosition.x) - roundToTenth(position.x),
        y: roundToTenth(nextPosition.y) - roundToTenth(position.y),
      } : null;
  
      if (delta) {
        pdf.setDrawColor(colorPalette.lightGrey);
        pdf.setLineWidth(1);
        pdf.roundedRect(memoLeft, memoY, memoWidth, 30, 5, 5, "S");
        
        memoY += 10;
        
        pdf.setFontSize(8);
        pdf.setFont(font);
        pdf.setTextColor(colorPalette.grey);
        pdf.text("次への移動", memoLeft + memoWidth/2, memoY, {maxWidth: memoWidth, align: "center"});
        memoY += 13.5;
        
        pdf.setFontSize(14);
        pdf.setFont(boldFont);
        pdf.setTextColor(colorPalette.black);

        if (delta.x === 0 && delta.y === 0) {
          pdf.text("なし", memoLeft + memoWidth/2, memoY, {maxWidth: memoWidth, align: "center"});
          memoY += 10.5;
        } else {
          var xMovement: string | null = null;
          var yMovement: string | null = null;
      
          if (delta.y > 0) {
            yMovement = (stage.yAxis === "bottom-up" ? "↑" : "↓") + roundToTenth(delta.y) + "m"
          } else if (delta.y < 0) {
            yMovement = (stage.yAxis === "bottom-up" ? "↓" : "↑") + roundToTenth(Math.abs(delta.y)) + "m"
          }
      
          if (delta.x > 0) {
            xMovement = `→${roundToTenth(delta.x)}m`;
          } else if (delta.x < 0) {
            xMovement = `←${roundToTenth(Math.abs(delta.x))}m`;
          }
  
          const deltaText = `${[yMovement, xMovement].filter(x => x !== null).join("/")}`;
          pdf.text(deltaText, memoLeft + memoWidth/2 + 2, memoY, {maxWidth: memoWidth, align: "center"});
          memoY += 10.5;
        }
      }

      if (section.formation.dancerActions.length > 0) {
        section.formation.dancerActions.forEach((action, i) => {
          pdf.setTextColor(colorPalette.black);
          var assignedTiming = actionsByDancer[followingId][i] !== undefined ? 
            action.timings[actionsByDancer[followingId][i]].name : undefined;

          pdf.setDrawColor(colorPalette.actionOutlineColours[actionsByDancer[followingId][i] as number] ?? colorPalette.lightGrey);
          pdf.setLineWidth(1);
          pdf.roundedRect(memoLeft, memoY, memoWidth, 15, 5, 5, "S");
          
          memoY += 10;
          pdf.setFontSize(8);
          pdf.setFont(font);
          pdf.text(action.name, memoLeft + 5, memoY, {maxWidth: memoWidth});

          pdf.setFontSize(14);
          pdf.setFont(boldFont);

          memoY += 1.5;
          pdf.text(assignedTiming ?? "---", memoLeft + memoWidth - 5, memoY, {maxWidth: memoWidth, align: "right"});

          memoY += 7;
        });
        memoY += 2;
      } else {
        memoY += 1;
      }
    }

    pdf.setTextColor(colorPalette.black);
    pdf.setFontSize(10);
    // write note
    if (section.note) {
      pdf.setFont(font);
      if (memoY > (PDF_METER_PX)) {
        drawLine(pdf, colorPalette.lightGrey, 1, [], memoLeft, memoY, memoLeft + memoWidth, memoY);
        memoY += 14;
      }

      pdf.text(section.note, memoLeft, memoY, {maxWidth: (memoWidth)});
      memoY += pdf.getTextDimensions(section.note, {maxWidth: memoWidth}).h;
    }

    if (section.formation.dancerActions.length > 0) {
      if (memoY > (PDF_METER_PX)) {
        drawLine(pdf, colorPalette.lightGrey, 1, [], memoLeft, memoY, memoLeft + memoWidth, memoY);
        memoY += 14;
      }

      pdf.setFontSize(10);
      pdf.setFont(boldFont);
      pdf.text("カウント凡例", memoLeft, memoY);
      memoY += 14;
      section.formation.dancerActions.forEach((action, i) => {
        pdf.setLineWidth(1);
        pdf.setDrawColor(colorPalette.black);
        pdf.circle(memoLeft + 4, memoY - 3, 3.5, "S");

        const [start, end] = getSectionRadians(section.formation.dancerActions.length, i);

        context.fillStyle = colorPalette.black;
        context.beginPath();
        context.arc(memoLeft + 4, memoY - 3, 3.5, start, end, false);
        context.lineTo(memoLeft + 4, memoY - 3);
        context.fill();

        pdf.setFontSize(8);
        pdf.setFont(font);
        pdf.setTextColor(colorPalette.grey);

        var actionNameDimensions = pdf.getTextDimensions(action.name, {maxWidth: memoWidth/2 - 12});
        pdf.text(action.name, memoLeft + 11, memoY - 1 - (actionNameDimensions.h > 8 ? 3 : 0), {maxWidth: memoWidth/2 - 12});
        var timingX = 0;
        action.timings.forEach((timing, i) => {
          pdf.setFontSize(10);
          pdf.setFont(boldFont);
          pdf.setTextColor(colorPalette.getTextColor(colorPalette.actionOutlineColours[i % 16]));
          pdf.setFillColor(colorPalette.actionOutlineColours[i % 16]);
          var w = pdf.getTextWidth(timing.name);

          if ((timingX + w) > memoWidth / 2) {
            timingX = 0;
            memoY += 11;
          }

          pdf.roundedRect(memoLeft + memoWidth/2 + timingX, memoY - 8, w + 4, 10, 2, 2, "F");
          pdf.text(timing.name, memoLeft + memoWidth/2 + timingX + 2, memoY);
          timingX += w + 4 + 1;
        });
        memoY += 13;
      });
    }

    pdf.setFont(boldFont);

    // have a semi-transparent layer for the numberings in case there is overlap with items that are out of bounds
    pdf.saveGraphicsState();
    const gState = new GState({ opacity: 0.5 });
    pdf.setGState(gState);
    // Horizontal grid lines + right labels
    for (let m = 0; m <= totalLengthM; m++) {
      const y = m * PDF_METER_PX;
      // Right-side meter labels
      // if stage, 0 at top of stage
      // if parade, 0 at bottom of stage

      const txtY = y + 3 + titleBuffer - startingPointDelta;
      if (txtY >= stageTopPx && y <= stageBottomPx && txtY <= (visualDiagramHeightPx + titleBuffer)) {
        const meterFromTop =
          stage.yAxis === "top-down" ? 
          (y - stageTopPx) / PDF_METER_PX :
          (stageBottomPx - y) / PDF_METER_PX;
        
        
        if (meterFromTop >= 0) {
          pdf.setFontSize(12);
          pdf.setLineWidth(0.2);
          pdf.setDrawColor(colorPalette.white);
          pdf.setTextColor(colorPalette.black);
          pdf.text(`${meterFromTop}m`, stageRightPx + 8, txtY, {renderingMode: "fillThenStroke"});
        }
      }
    }
    pdf.restoreGraphicsState();

    // Top numbering relative to center
    for (let m = 1; m < totalWidthM; m++) {
      const x = m * PDF_METER_PX + gridOffsetPx - pageMargin;
    
      const isCenter = x === centerX;
      if (
        x >= stageLeftPx &&
        x <= stageRightPx &&
        !isCenter
      ) {
        const meterFromCenter = Math.abs(x - centerX) / PDF_METER_PX;

        if (meterFromCenter % 2 !== 0) continue;
    
        const radius = PDF_METER_PX * 0.3;
        const cx = x;
        const cy = stageTopPx - PDF_METER_PX * (startingPoint ? 1.5 : 1);

        pdf.setFontSize(8);
        pdf.setFillColor(colorPalette.primary);
        pdf.setDrawColor(colorPalette.primary);
        pdf.setTextColor(colorPalette.white);
        pdf.saveGraphicsState();
        const gState = new GState({ opacity: 0.5 });
        pdf.setGState(gState);
        pdf.circle(cx, cy + titleBuffer, radius, "F");
        pdf.restoreGraphicsState();
        pdf.text(`${meterFromCenter}`, cx, cy - 3 + titleBuffer, {align: "center", baseline: "top", maxWidth: PDF_METER_PX});
      }
    }

    updateProgress(Math.round(((i + 2) / (choreo.sections.length + 1)) * 100));

    if (i < choreo.sections.length - 1) {
      pdf.addPage();
    }
  }

  var blob = pdf.output("blob");
  
  const fullFileName = `${getSafeFileName(fileName)}.pdf`

  const url = URL.createObjectURL(blob);
  
  const file = new File ([blob], fullFileName, {
    type: "application/pdf"
  });
  const dataToShare = {"files": [file]};
  if (navigator.canShare?.(dataToShare)) {
    try {
      await navigator.share(dataToShare);
      onComplete();
      return;
    } catch (e: any) {
      console.log("Navigator share failed:", e);
      if (e?.name === "AbortError") {
        onComplete();
        return;
      }
    }
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = fullFileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  onComplete();
}

function drawLine(
  pdf: jsPDF,
  colour: string,
  lineWidth: number,
  lineDashPattern: number[],
  x1: number, y1: number,
  x2: number, y2: number
) {
  pdf.setDrawColor(colour);
  pdf.setLineWidth(lineWidth);
  pdf.setLineDashPattern(lineDashPattern, 0);
  pdf.line(x1, y1, x2, y2);
}

function clipLine(x0: number, y0: number, dx: number, dy: number, width: number, height: number) {
  const points = [];
  let t, x, y;

  // x = 0
  t = (0 - x0) / dx;
  y = y0 + t * dy;
  if (y >= 0 && y <= height) points.push({ x: 0, y });

  // x = width
  t = (width - x0) / dx;
  y = y0 + t * dy;
  if (y >= 0 && y <= height) points.push({ x: width, y });

  // y = 0
  t = (0 - y0) / dy;
  x = x0 + t * dx;
  if (x >= 0 && x <= width) points.push({ x, y: 0 });

  // y = height
  t = (height - y0) / dy;
  x = x0 + t * dx;
  if (x >= 0 && x <= width) points.push({ x, y: height });

  return points.length === 2 ? points : null;
}


function getStripeLines(obstacle: Obstacle): {x1: number, y1: number, x2: number, y2: number}[] {
  const width = obstacle.width * PDF_METER_PX;
  const height = obstacle.length * PDF_METER_PX;
  const spacing = PDF_METER_PX / STRIPES_PER_METRE;

  const dx = width;
  const dy = -height;
  const length = Math.hypot(dx, dy);

  const nx = dy / length;
  const ny = -dx / length;

  const diagLength = Math.hypot(width, height);
  const maxOffset = Math.ceil(diagLength / spacing);

  // Generate lines
  const lines = [...Array.from({ length: maxOffset * 2 + 1 })
    .map((_, i) => {
      const offset = (i - maxOffset) * spacing;
      const x0 = nx * offset;
      const y0 = height + ny * offset;

      const clipped = clipLine(x0, y0, dx, dy, width, height);
      if (!clipped) return null;

      return {
        x1: clipped[0].x,
        y1: clipped[0].y,
        x2: clipped[1].x,
        y2: clipped[1].y,
      };
    })
    .filter(Boolean)];

  // Add the extra diagonal across corners
  lines.push({ x1: 0, y1: height, x2: width, y2: 0 });
  return lines.filter(x => x !== null);
}

function getSectionRadians(sections: number, index: number): [number, number] {
  const sectionSize = (2 * Math.PI) / sections;
  const start = sectionSize * index - Math.PI * ([2, 4].includes(sections) ? 1 : sections === 3 ? 7/6 : 4.5/5);
  const end = start + sectionSize;
  return [start, end];
}