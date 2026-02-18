import jsPDF from "jspdf";
import { Choreo } from "../../models/choreo";
import { colorPalette } from "../consts/colors";
import { getSafeFileName, isNullOrUndefinedOrBlank, roundToTenth, strEquals } from "./globalHelper";
import { stageMetersToPx } from "./editorCalculationHelper";
import { Coordinates } from "../../models/base";
import JSZip from "jszip";

const README_TEXT =
  "このZIPには本アプリ用のデータが含まれています。\n" +
  "ZIPファイル、または中の .mtr ファイルを本アプリで読み込んでください。\n\n" +
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
      if (e?.name === "AbortError" || e?.name === "NotAllowedError") {
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

  zip.file(
    `${getSafeFileName(choreo.name)}.mtr`,
    JSON.stringify(choreo)
  );
  zip.file("README.txt", README_TEXT);

  await downloadZip(zip, choreo.name);
}

export async function exportEvent(
  choreoList: Choreo[],
  eventName = "隊列表"
) {
  const zip = new JSZip();

  choreoList.forEach(choreo => {
    zip.file(
      `${getSafeFileName(choreo.name)}.mtr`,
      JSON.stringify(choreo)
    );
  });

  zip.file("README.txt", README_TEXT);

  await downloadZip(zip, isNullOrUndefinedOrBlank(eventName) ? "隊列表" : eventName);
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
  const pageMargin = gridSizePx * 0.5;
  const memoBuffer = gridSizePx * 6;
  const memoWidth = gridSizePx * 5;

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
  const diagramWidthPx = totalWidthM * gridSizePx;
  const diagramHeightPx = totalLengthM * gridSizePx;

  // stage borders
  const stageLeftPx = sideMarginM * gridSizePx + pageMargin;
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
  var memoLeft = diagramWidthPx + pageMargin * 2;

  // only add memo space if there are notes or there is a dancer being followed 
  const fileWidth = diagramWidthPx + pageMargin + (
    followingDancer || choreo.sections.some(x => !isNullOrUndefinedOrBlank(x.note)) ?
    memoBuffer : pageMargin);
  const fileHeight = diagramHeightPx + titleBuffer + pageMargin;
  
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

    // draw section title 
    pdf.setTextColor(colorPalette.black);
    pdf.setFontSize(16);
    pdf.text(section.name, centerX, gridSizePx, {maxWidth: diagramWidthPx, align: "center"});

    // draw out of bounds
    pdf.setFillColor(colorPalette.offWhite);
    pdf.roundedRect(pageMargin, 0 + titleBuffer, diagramWidthPx, diagramHeightPx, 5, 5, "F");

    // draw in bounds area
    pdf.setFillColor(colorPalette.white);
    pdf.rect(stageLeftPx, stageTopPx + titleBuffer, stageWidthPx, stageHeightPx, "F");

    // Vertical grid lines (across full area)
    for (let m = 1; m < totalWidthM - gridOffsetMeters; m++) {
      const x = m * gridSizePx + gridOffsetPx;
    
      const distFromCenter = Math.abs(
        x - centerX
      ) / gridSizePx;
    
      const isMajor = Math.round(distFromCenter) % 2 === 0;

      drawLine(pdf, colorPalette.lightGrey, 0.6, isMajor ? [10, 6] : [4, 6], x + pageMargin, 0 + titleBuffer, x + pageMargin, diagramHeightPx + titleBuffer);
    }

    // Horizontal grid lines + right labels
    for (let m = 0; m <= totalLengthM; m++) {
      const y = m * gridSizePx;
      const isMajor = m % 2 === 0;

      if (m > 0 && m < totalLengthM) {
        drawLine(pdf, colorPalette.lightGrey, 0.6, isMajor ? [10, 6] : [4, 6], pageMargin, y + titleBuffer, diagramWidthPx + pageMargin, y + titleBuffer);
      }

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
        centerX, stageTopPx - gridSizePx * 0.3 + titleBuffer,
        centerX - gridSizePx * 0.5, stageTopPx - gridSizePx * 1.2 + titleBuffer,
        centerX + gridSizePx * 0.5, stageTopPx - gridSizePx * 1.2 + titleBuffer,
        "FD"
      )

      // main stage border
      pdf.setDrawColor(colorPalette.primary);
      pdf.setLineWidth(1.25);
      pdf.rect(stageLeftPx, stageTopPx + titleBuffer, stageWidthPx, stageHeightPx)

      // Center line
      drawLine(pdf, colorPalette.primary, 1.25, [10, 6], centerX, 0 + titleBuffer, centerX, diagramHeightPx + titleBuffer);
        
      for (let m = 1; m < totalWidthM; m++) {
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
    pdf.setFontSize(8);

    // Draw props
    Object.values(section.formation.propPositions).forEach(p => {
      var prop = choreo.props[p.propId];
      if (prop) {
        context.save();
        const positionInPx = stageMetersToPx(p, stage, gridSizePx, prop.length);
        const propX = positionInPx.x + pageMargin;
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
  
        const positionInPx = stageMetersToPx(p, stage, gridSizePx);
        const x =  positionInPx.x + pageMargin;
        const y = positionInPx.y
        
        if (isFollowing) {
          pdf.setLineWidth(1.5);
          pdf.setDrawColor(colorPalette.primary);
          pdf.setFillColor(colorPalette.white);
          pdf.circle(x, y + titleBuffer, gridSizePx * 0.4, "FD");
        }

        pdf.setLineWidth(0.8);
        pdf.setDrawColor(p.color);
        pdf.setFillColor(p.color);
        pdf.circle(x, y + titleBuffer, gridSizePx * (isFollowing ? 0.3 : 0.4), "FD");
  
        pdf.setTextColor(colorPalette.getTextColor(p.color));
        var displayName = dancer.name ?? "";
        var textHeight = pdf.getTextDimensions(displayName, {maxWidth: gridSizePx}).h;
        pdf.text(displayName, x, y - textHeight/2 + titleBuffer, {align: "center", baseline: "top", maxWidth: gridSizePx});
      }
    });

    pdf.setTextColor(colorPalette.black);
    pdf.setFontSize(12);

    var memoY = gridSizePx;

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
  
      var displayY = roundToTenth(position.y);

      pdf.setFontSize(14);
      pdf.text(followingDancer.name, memoLeft, memoY, {maxWidth: memoWidth});

      const dancerNameHeight = pdf.getTextDimensions(followingDancer.name, {maxWidth: memoWidth}).h;
      pdf.setDrawColor(colorPalette.primary);
      memoY += 10;
      pdf.line(memoLeft, memoY, memoLeft + memoWidth, memoY);

      memoY += dancerNameHeight;

      // current position
      pdf.setDrawColor(colorPalette.lightGrey);
      pdf.setLineWidth(1);
      pdf.roundedRect(memoLeft, memoY, memoWidth, 30, 5, 5, "S");
      
      memoY += 10;
      
      pdf.setFontSize(8);
      pdf.setFont(font);
      pdf.setTextColor(colorPalette.grey);
      pdf.text("現在の位置", memoLeft + memoWidth/2, memoY, {maxWidth: memoWidth, align: "center"});
      memoY += pdf.getTextDimensions("現在の位置", {maxWidth: memoWidth}).h * 2.2;
      
      pdf.setFontSize(14);
      pdf.setFont(boldFont);
      pdf.setTextColor(colorPalette.black);
      const currentPositionText = `${displayY}m/${displayX}m`;
      pdf.text(currentPositionText, memoLeft + memoWidth/2 + 4, memoY, {maxWidth: memoWidth, align: "center"});
      memoY += pdf.getTextDimensions(currentPositionText, {maxWidth: memoWidth}).h * 1.25;
      memoY += pdf.getTextDimensions("O", {maxWidth: memoWidth}).h / 2;

      var nextPosition = choreo.sections[i + 1]?.formation?.dancerPositions[followingDancer.id];
      
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
        memoY += pdf.getTextDimensions("次への移動", {maxWidth: memoWidth}).h * 2.2;
        
        pdf.setFontSize(14);
        pdf.setFont(boldFont);
        pdf.setTextColor(colorPalette.black);

        if (delta.x === 0 && delta.y === 0) {
          pdf.text("なし", memoLeft + memoWidth/2, memoY, {maxWidth: memoWidth, align: "center"});
          memoY += pdf.getTextDimensions("なし", {maxWidth: memoWidth}).h * 1.25;
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
          memoY += pdf.getTextDimensions(deltaText, {maxWidth: memoWidth}).h * 1.25;
        }
        memoY += pdf.getTextDimensions("O", {maxWidth: memoWidth}).h / 2;
      }

      if (section.formation.dancerActions.length > 0) {
        section.formation.dancerActions.forEach((action, i) => {
          var assignedTiming = action.timings.find(t => t.dancerIds.includes(followingDancer.id));
          var x = memoLeft + (i % 2 === 0 ? 0 : (memoWidth / 2 + 4));
          var additionalY = 0;

          pdf.setDrawColor(colorPalette.lightGrey);
          pdf.setLineWidth(1);
          pdf.roundedRect(x, memoY, memoWidth / 2 - 2, 30, 5, 5, "S");
          
          additionalY += 5;
          
          pdf.setFontSize(8);
          pdf.setFont(font);
          pdf.setTextColor(colorPalette.grey);

          additionalY += 5;

          pdf.text(action.name, x + memoWidth/4, memoY + additionalY, {maxWidth: memoWidth, align: "center"});
          additionalY += pdf.getTextDimensions(action.name, {maxWidth: memoWidth}).h * 2.2;

          pdf.setFontSize(14);
          pdf.setFont(boldFont);
          pdf.setTextColor(colorPalette.black);
          
          var timingText = `${assignedTiming?.name ?? "---"}`;
          pdf.text(timingText, x + memoWidth/4, memoY + additionalY, {maxWidth: memoWidth, align: "center"});
          additionalY += pdf.getTextDimensions(timingText, {maxWidth: memoWidth}).h * 1.25;
          additionalY += pdf.getTextDimensions("O", {maxWidth: memoWidth}).h / 2;

          if (i % 2 === 1 || i === section.formation.dancerActions.length - 1) {
            memoY += additionalY;
          }
        });
      }
    }

    pdf.setFontSize(12);
    // write note
    if (section.note) {
      pdf.setFont(font);
      if (memoY > (gridSizePx * 2)) {
        pdf.line(memoLeft, memoY, memoLeft + memoWidth, memoY);
        memoY += pdf.getTextDimensions("O", {maxWidth: memoWidth}).h * 2.2;
      }

      pdf.text(section.note, memoLeft, memoY, {maxWidth: (memoWidth)});
    }
    pdf.setFont(boldFont);

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
      if (e?.name === "AbortError" || e?.name === "NotAllowedError") {
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