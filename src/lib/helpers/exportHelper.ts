import jsPDF from "jspdf";
import { Choreo } from "../../models/choreo";
import { colorPalette } from "../consts/colors";
import { isNullOrUndefinedOrBlank, roundToTenth, strEquals } from "./globalHelper";
import { stageMetersToPx } from "./editorCalculationHelper";
import { Coordinates } from "../../models/base";

export function exportToMtr (
  choreo: Choreo,
  filename?: string,
) {
  const blob = new Blob([JSON.stringify(choreo)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = (filename ?? choreo.name) + ".mtr";

  link.click();

  URL.revokeObjectURL(url);
}

export async function exportToPdf (
  choreo: Choreo,
  fileName: string,
  followingId: string,
  updateProgress: (progress: number) => void,
  onComplete: () => void,
) {
  const gridSizePx = 20;

  const titleBuffer = gridSizePx * 1.5;
  const memoBuffer = gridSizePx * 6;

  const stage = choreo.stageGeometry;
  
  // sizes in meters
  const sideMarginM = stage.margin.leftMargin;
  const topMarginM = stage.margin.topMargin;
  const totalWidthM = stage.stageWidth + sideMarginM * 2;
  const totalLengthM = stage.stageLength + topMarginM * 2;
  
  // stage-only dimensions
  const stageWidthPx = stage.stageWidth * gridSizePx;
  const stageHeightPx = stage.stageLength * gridSizePx;
    
  // total area (stage + out of bounds) dimensions
  const totalWidthPx = totalWidthM * gridSizePx;
  const totalHeightPx = totalLengthM * gridSizePx;

  // stage borders
  const stageLeftPx = sideMarginM * gridSizePx;
  const stageRightPx = stageLeftPx + stageWidthPx;
  const stageTopPx = topMarginM * gridSizePx;
  const stageBottomPx = stageTopPx + stageHeightPx;

  // x of the center
  const centerX = stageLeftPx + stageWidthPx / 2;

  // offset by 0.5m if the grid totalWidthM is uneven
  const isOddTotal = totalWidthM % 2 === 1;
  const gridOffsetMeters = isOddTotal ? 0.5 : 0;
  const gridOffsetPx = gridOffsetMeters * gridSizePx;

  const followingDancer = choreo.dancers[followingId];

  // only add memo space if there are notes or there is a dancer being followed 
  const fileWidth = totalWidthPx + (
    followingDancer || choreo.sections.some(x => !isNullOrUndefinedOrBlank(x.note)) ?
    memoBuffer : 0);
  const fileHeight = totalHeightPx + titleBuffer;
  
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

    // draw section title 
    pdf.setTextColor(colorPalette.black);
    pdf.setFontSize(16);
    pdf.text(section.name, centerX, gridSizePx, {maxWidth: totalWidthPx, align: "center"});

    // draw out of bounds
    pdf.setFillColor(colorPalette.offWhite);
    pdf.rect(0, 0 + titleBuffer, totalWidthPx, totalHeightPx, "F");

    // draw in bounds area
    pdf.setFillColor(colorPalette.white);
    pdf.rect(stageLeftPx, stageTopPx + titleBuffer, stageWidthPx, stageHeightPx, "F");

    // Vertical grid lines (across full area)
    for (let m = 0; m <= totalWidthM - gridOffsetMeters; m++) {
      const x = m * gridSizePx + gridOffsetPx;
    
      const distFromCenter = Math.abs(
        x - centerX
      ) / gridSizePx;
    
      const isMajor = Math.round(distFromCenter) % 2 === 0;

      drawLine(pdf, colorPalette.lightGrey, 0.6, isMajor ? [10, 6] : [4, 6], x, 0 + titleBuffer, x, totalHeightPx + titleBuffer);
    }

    // Horizontal grid lines + right labels
    for (let m = 0; m <= totalLengthM; m++) {
      const y = m * gridSizePx;
      const isMajor = m % 2 === 0;

      drawLine(pdf, colorPalette.lightGrey, 0.6, isMajor ? [10, 6] : [4, 6], 0, y + titleBuffer, totalWidthPx, y + titleBuffer);

      // Right-side meter labels
      // if stage, 0 at top of stage
      // if parade, 0 at bottom of stage
      if (y >= stageTopPx && y <= stageBottomPx) {
        const meterFromTop =
          stage.yAxis === "top-down" ? 
          (y - stageTopPx) / gridSizePx :
          (stageBottomPx - y) / gridSizePx;

        pdf.setFontSize(12);
        pdf.setTextColor(colorPalette.black);
        pdf.text(`${meterFromTop}m`, stageRightPx + 8, y + 3 + titleBuffer);
      }

      // centre triangle
      pdf.setLineDashPattern([], 0);
      pdf.setLineWidth(0);
      pdf.setDrawColor(colorPalette.primary);
      pdf.setFillColor(colorPalette.primary);
      pdf.triangle(
        centerX, stageTopPx - gridSizePx * 0.5 + titleBuffer,
        centerX - gridSizePx * 0.75, stageTopPx - gridSizePx * 1.5 + titleBuffer,
        centerX + gridSizePx * 0.75, stageTopPx - gridSizePx * 1.5 + titleBuffer,
        "FD"
      )

      // main stage border
      pdf.setDrawColor(colorPalette.primary);
      pdf.setLineWidth(1.25);
      pdf.rect(stageLeftPx, stageTopPx + titleBuffer, stageWidthPx, stageHeightPx)

      // Center line
      drawLine(pdf, colorPalette.primary, 1.25, [10, 6], centerX, 0 + titleBuffer, centerX, totalHeightPx + titleBuffer);
        
      for (let m = 0; m <= totalWidthM; m++) {
        const x = m * gridSizePx + gridOffsetPx;
      
        const isCenter = x === centerX;
        // Top numbering relative to center (stage only)
        if (
          x >= stageLeftPx &&
          x <= stageRightPx &&
          !isCenter
        ) {
          const meterFromCenter =
          Math.abs(x - centerX) / gridSizePx;
  
          if (meterFromCenter % 2 !== 0) continue;
      
          const radius = gridSizePx * 0.3;
          const cx = x;
          const cy = stageTopPx - 20;

          pdf.setFontSize(8);
          pdf.setFillColor(colorPalette.primary);
          pdf.setDrawColor(colorPalette.primary);
          pdf.setTextColor(colorPalette.white);
          pdf.circle(cx, cy + titleBuffer, radius, "F");
          pdf.text(`${meterFromCenter}`, cx, cy - 3 + titleBuffer, {align: "center", baseline: "top", maxWidth: gridSizePx});
        }
      }
    }

    pdf.setLineDashPattern([], 0);

    // Draw props
    Object.values(section.formation.propPositions).forEach(p => {
      var prop = choreo.props[p.propId];
      if (prop) {
        context.save();
        const positionInPx = stageMetersToPx(p, stage, gridSizePx, prop.length);
        const propX = positionInPx.x;
        const propY = positionInPx.y + titleBuffer;

        const propWidth  = gridSizePx * prop.width;
        const propHeight = gridSizePx * prop.length;

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

    // Draw participants
    Object.values(section.formation.dancerPositions).forEach(p => {
      var dancer = choreo.dancers[p.dancerId];
      if (dancer) {
        const isFollowing = strEquals(followingId, dancer.id);
        
        if (isFollowing) {
          pdf.setLineWidth(2);
          pdf.setDrawColor(colorPalette.primary);
        } else {
          pdf.setLineWidth(0.8);
          pdf.setDrawColor(p.color);
        }
  
        const positionInPx = stageMetersToPx(p, stage, gridSizePx);
        const x =  positionInPx.x;
        const y = positionInPx.y

        pdf.setFillColor(p.color);
        pdf.circle(x, y + titleBuffer, gridSizePx * 0.4, "FD");
  
        pdf.setTextColor(colorPalette.getTextColor(p.color));
        var displayName = dancer.name ?? "";
        var textHeight = pdf.getTextDimensions(displayName, {maxWidth: gridSizePx}).h;
        pdf.text(displayName, x, y - textHeight/2 + titleBuffer, {align: "center", baseline: "top", maxWidth: gridSizePx});
      }
    });

    pdf.setTextColor(colorPalette.black);
    pdf.setFontSize(12);

    var memoY = gridSizePx * 2;

    if (followingDancer) {
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
  
      var displayY = position.y;

      pdf.setFontSize(14);
      pdf.text(followingDancer.name, totalWidthPx + 5, memoY, {maxWidth: memoBuffer - 10});
      memoY += pdf.getTextDimensions(followingDancer.name, {maxWidth: memoBuffer - 10}).h * 1.25;
      
      pdf.setFontSize(12);
      memoY += pdf.getTextDimensions("O", {maxWidth: memoBuffer - 10}).h * 1.25;
      
      pdf.text("現在の位置", totalWidthPx + 5, memoY, {maxWidth: memoBuffer - 10});
      memoY += pdf.getTextDimensions("現在の位置", {maxWidth: memoBuffer - 10}).h * 1.25;
      
      pdf.setFont(font);
      const currentPositionText = `${displayY}m/${displayX}m`;
      pdf.text(currentPositionText, totalWidthPx + 5, memoY, {maxWidth: memoBuffer - 10});
      memoY += pdf.getTextDimensions(currentPositionText, {maxWidth: memoBuffer - 10}).h * 1.25;
      memoY += pdf.getTextDimensions("O", {maxWidth: memoBuffer - 10}).h * 1.25;

      var nextPosition = choreo.sections[i + 1]?.formation?.dancerPositions[followingDancer.id];
      
      const delta: Coordinates | null = nextPosition ? {
        x: nextPosition.x - position.x,
        y: nextPosition.y - position.y,
      } : null;
  
      if (delta) {
        pdf.setFont(boldFont);
        pdf.text("次への移動", totalWidthPx + 5, memoY, {maxWidth: memoBuffer - 10});
        memoY += pdf.getTextDimensions("次への移動", {maxWidth: memoBuffer - 10}).h * 1.25;
        pdf.setFont(font);
        if (delta.x === 0 && delta.y === 0) {
          pdf.text("なし", totalWidthPx + 5, memoY, {maxWidth: memoBuffer - 10});
          memoY += pdf.getTextDimensions("なし", {maxWidth: memoBuffer - 10}).h * 1.25;
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
          pdf.text(deltaText, totalWidthPx + 5, memoY, {maxWidth: memoBuffer - 10});
          memoY += pdf.getTextDimensions(deltaText, {maxWidth: memoBuffer - 10}).h * 1.25;
        }
        memoY += pdf.getTextDimensions("O", {maxWidth: memoBuffer - 10}).h * 1.25;
      }

      if (section.formation.dancerActions.length > 0) {
        section.formation.dancerActions.forEach((action) => {
          var assignedTiming = action.timings.find(t => t.dancerIds.includes(followingDancer.id));
          pdf.setFont(boldFont);
          pdf.text(action.name, totalWidthPx + 5, memoY, {maxWidth: (memoBuffer - 10) / 2});
          pdf.setFont(font);
          memoY += pdf.getTextDimensions(action.name, {maxWidth: memoBuffer - 10}).h * 1.25;
          pdf.text(`${assignedTiming?.name ?? "---"}`, totalWidthPx + 5, memoY, {maxWidth: (memoBuffer - 10) / 2});
          memoY += pdf.getTextDimensions(`${assignedTiming?.name ?? "---"}`, {maxWidth: memoBuffer - 10}).h * 1.25;
        });

        memoY += pdf.getTextDimensions("O", {maxWidth: memoBuffer - 10}).h * 1.25;
      }
    }

    // write note
    if (section.note) {
      pdf.setFont(font);
      if (memoY > (gridSizePx * 2)) {
        pdf.text("- - - - -", totalWidthPx + 5, memoY, {maxWidth: (memoBuffer - 10)});
        memoY += pdf.getTextDimensions("- - - - -", {maxWidth: memoBuffer - 10}).h * 1.25;
        memoY += pdf.getTextDimensions("O", {maxWidth: memoBuffer - 10}).h * 1.25;
      }

      pdf.text(section.note, totalWidthPx + 5, memoY, {maxWidth: (memoBuffer - 10)});
    }
    pdf.setFont(boldFont);

    updateProgress(Math.round(((i + 1) / choreo.sections.length) * 100));

    if (i < choreo.sections.length - 1) {
      console.log("add page")
      pdf.addPage();
    }
  }

  pdf.save(`${fileName}.pdf`);

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