import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PredictionResult } from './knn';
import { LinearRegressionModel } from './linearRegression';

export interface ReportOptions {
  data: any[];
  inputs: Record<string, string | number>;
  prediction: PredictionResult | null;
  linearPrediction?: { magnitude: number; uncertainty: number; formula?: string } | null;
  linearModel?: LinearRegressionModel | null;
  featureRanges?: Record<string, { min: number; max: number }> | null;
  maxMag?: number;
  avgDepth?: number;
}

function getMagnitudeClassification(mag: number): { label: string; impact: string } {
  if (mag < 3.0) return { label: 'Micro (< 3.0)', impact: 'Generally not felt by people, recorded by seismographs.' };
  if (mag < 4.0) return { label: 'Minor (3.0 – 3.9)', impact: 'Often felt by people, rarely causes damage.' };
  if (mag < 5.0) return { label: 'Light (4.0 – 4.9)', impact: 'Noticeable shaking of indoor items, rattling noises. Significant damage unlikely.' };
  if (mag < 6.0) return { label: 'Moderate (5.0 – 5.9)', impact: 'Can cause damage to poorly constructed buildings. Felt by everyone.' };
  if (mag < 7.0) return { label: 'Strong (6.0 – 6.9)', impact: 'Damage to moderate number of well-built structures in populated areas.' };
  if (mag < 8.0) return { label: 'Major (7.0 – 7.9)', impact: 'Causes serious damage over large areas. Loss of life possible.' };
  return { label: 'Great (8.0+)', impact: 'Can destroy entire communities near epicenter.' };
}

export function generatePredictionReport({
  data,
  inputs,
  prediction,
  linearPrediction,
  linearModel,
  featureRanges,
  maxMag,
  avgDepth
}: ReportOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor: [number, number, number] = [67, 56, 202]; // indigo-700
  const secondaryColor: [number, number, number] = [30, 41, 59]; // slate-800
  const mutedText: [number, number, number] = [100, 116, 139]; // slate-500
  const lightBg: [number, number, number] = [248, 250, 252]; // slate-50

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 75, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SEISMIC ANALYSIS & PREDICTION REPORT', margin, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(224, 231, 255);
  doc.text('Earthquake Magnitude Estimation via K-Nearest Neighbors (K-NN) Regression', margin, 54);

  // Generation timestamp top right
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  doc.setFontSize(8);
  doc.setTextColor(199, 210, 254);
  doc.text(`Generated: ${dateStr} ${timeStr}`, pageWidth - margin, 46, { align: 'right' });

  let yPos = 95;

  // 2. Executive Prediction Summary Card (if prediction is present)
  if (prediction) {
    const classification = getMagnitudeClassification(prediction.magnitude);

    doc.setFillColor(...lightBg);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, contentWidth, 90, 6, 6, 'FD');

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('PREDICTION SUMMARY', margin + 14, yPos + 20);

    // Callout values
    // Metric 1: Predicted Magnitude
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedText);
    doc.text('PREDICTED MAGNITUDE (Mw)', margin + 14, yPos + 38);

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(prediction.magnitude.toFixed(2), margin + 14, yPos + 64);

    // Metric 2: Uncertainty
    const col2X = margin + 170;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedText);
    doc.text('UNCERTAINTY (±1σ)', col2X, yPos + 38);

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`±${prediction.uncertainty.toFixed(2)}`, col2X, yPos + 64);

    // Metric 3: Confidence Interval
    const col3X = margin + 320;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedText);
    doc.text('68% CONFIDENCE INTERVAL', col3X, yPos + 38);

    const minBound = Math.max(0, prediction.magnitude - prediction.uncertainty).toFixed(2);
    const maxBound = (prediction.magnitude + prediction.uncertainty).toFixed(2);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text(`${minBound} – ${maxBound}`, col3X, yPos + 64);

    // Sub-info: Classification & K value
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    const linearComparisonText = linearPrediction
      ? `  •  Linear Reg: M ${linearPrediction.magnitude.toFixed(2)} (Δ ${Math.abs(prediction.magnitude - linearPrediction.magnitude).toFixed(2)})`
      : '';
    doc.text(
      `Classification: ${classification.label}  •  K-NN (k=${prediction.k})${linearComparisonText}  •  ${classification.impact}`,
      margin + 14,
      yPos + 80
    );

    yPos += 105;
  } else {
    // Prediction not run yet notice
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.roundedRect(margin, yPos, contentWidth, 38, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(180, 83, 9);
    doc.text('Note: Prediction was not yet executed for this query; baseline inputs and dataset parameters are recorded below.', margin + 12, yPos + 23);

    yPos += 50;
  }

  // 3. Section: Input Query Parameters Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...secondaryColor);
  doc.text('1. Input Query Parameters', margin, yPos);
  yPos += 8;

  const latNum = Number(inputs.latitude);
  const lonNum = Number(inputs.longitude);
  const depthNum = Number(inputs.depth);
  const gapNum = Number(inputs.gap);
  const rmsNum = Number(inputs.rms);

  const getRangeText = (key: string, unit: string) => {
    if (!featureRanges || !featureRanges[key]) return 'N/A';
    return `${featureRanges[key].min.toFixed(2)} to ${featureRanges[key].max.toFixed(2)} ${unit}`.trim();
  };

  const getStatusText = (val: number, key: string) => {
    if (isNaN(val)) return 'Invalid';
    if (!featureRanges || !featureRanges[key]) return 'Observed';
    const r = featureRanges[key];
    if (val < r.min || val > r.max) return 'Out of bounds';
    return 'In Range';
  };

  const inputRows = [
    ['Latitude', `${latNum}°`, 'Degree (°)', getRangeText('latitude', '°'), getStatusText(latNum, 'latitude')],
    ['Longitude', `${lonNum}°`, 'Degree (°)', getRangeText('longitude', '°'), getStatusText(lonNum, 'longitude')],
    ['Focal Depth', `${depthNum} km`, 'Kilometers (km)', getRangeText('depth', 'km'), getStatusText(depthNum, 'depth')],
    ['Azimuthal Gap', `${gapNum}°`, 'Degree (°)', getRangeText('gap', '°'), getStatusText(gapNum, 'gap')],
    ['Root Mean Square (RMS)', `${rmsNum} s`, 'Seconds (sec)', getRangeText('rms', 'sec'), getStatusText(rmsNum, 'rms')]
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [['Parameter', 'User Input Value', 'Unit', 'Dataset Observed Range', 'Validation Status']],
    body: inputRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85], // slate-700
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: 'bold' },
      1: { cellWidth: 100 },
      2: { cellWidth: 80 },
      3: { cellWidth: 130 },
      4: { cellWidth: 'auto', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        if (data.cell.raw === 'In Range') {
          data.cell.styles.textColor = [16, 185, 129]; // emerald-600
        } else if (data.cell.raw === 'Out of bounds' || data.cell.raw === 'Invalid') {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
        }
      }
    }
  });

  // Calculate position after first table
  yPos = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 18 : yPos + 120;

  // 4. Section: Nearest Neighbor Breakdown (if prediction is present)
  if (prediction && prediction.neighborMagnitudes && prediction.neighborMagnitudes.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...secondaryColor);
    doc.text(`2. K-Nearest Neighbors Analysis (k=${prediction.k})`, margin, yPos);
    yPos += 8;

    const neighborRows = prediction.neighborMagnitudes.map((mag, idx) => {
      const cls = getMagnitudeClassification(mag);
      const diff = mag - prediction.magnitude;
      const diffStr = diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
      return [
        `Neighbor #${idx + 1}`,
        `${mag.toFixed(2)} Mw`,
        diffStr,
        cls.label,
        cls.impact
      ];
    });

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Neighbor Index', 'Observed Magnitude', 'Deviation from Prediction', 'Classification', 'Expected Impact']],
      body: neighborRows,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // indigo-600
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 90, fontStyle: 'bold' },
        2: { cellWidth: 90 },
        3: { cellWidth: 90 },
        4: { cellWidth: 'auto' }
      }
    });

    yPos = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 18 : yPos + 100;
  }

  // Feature Importance Table (if linear model trained)
  if (linearModel && linearModel.featureImportance && linearModel.featureImportance.length > 0) {
    if (yPos > pageHeight - 140) {
      doc.addPage();
      yPos = margin + 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...secondaryColor);
    doc.text(`Feature Importance Ranking (Multiple Linear Regression, R² = ${linearModel.r2.toFixed(3)})`, margin, yPos);
    yPos += 8;

    const importanceRows = linearModel.featureImportance.map((f) => [
      `#${f.rank}`,
      f.displayName + (f.unit ? ` (${f.unit})` : ''),
      f.importanceScore.toFixed(3),
      `${f.relativePercentage.toFixed(1)}%`,
      `${f.rawCoefficient >= 0 ? '+' : ''}${f.rawCoefficient.toFixed(5)}`,
      f.direction === 'positive' ? 'Direct (+)' : 'Inverse (-)'
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Rank', 'Variable Name', 'Std Beta (|β*|)', 'Relative Share', 'Raw Slope (β)', 'Correlation']],
      body: importanceRows,
      theme: 'grid',
      headStyles: {
        fillColor: [225, 29, 72], // rose-600
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 130, fontStyle: 'bold' },
        2: { cellWidth: 90 },
        3: { cellWidth: 80 },
        4: { cellWidth: 90 },
        5: { cellWidth: 'auto' }
      }
    });

    yPos = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 18 : yPos + 100;
  }

  // 5. Section: Dataset Summary Statistics
  const sectionNum = prediction ? '3' : '2';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...secondaryColor);
  doc.text(`${sectionNum}. Processed Dataset Summary Statistics`, margin, yPos);
  yPos += 8;

  // Calculate detailed column metrics if data exists
  const calcStats = (key: string) => {
    if (!data.length) return { min: 0, max: 0, mean: 0, std: 0 };
    const vals = data.map(d => parseFloat(d[key])).filter(v => !isNaN(v));
    if (!vals.length) return { min: 0, max: 0, mean: 0, std: 0 };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length);
    return { min, max, mean, std };
  };

  const magStats = calcStats('mag');
  const depthStats = calcStats('depth');
  const latStats = calcStats('latitude');
  const lonStats = calcStats('longitude');
  const gapStats = calcStats('gap');
  const rmsStats = calcStats('rms');

  const datasetRows = [
    ['Magnitude (mag)', 'Target Variable', magStats.min.toFixed(2), magStats.max.toFixed(2), magStats.mean.toFixed(2), `±${magStats.std.toFixed(2)}`],
    ['Focal Depth (depth)', 'Kilometers (km)', depthStats.min.toFixed(2), depthStats.max.toFixed(2), depthStats.mean.toFixed(2), `±${depthStats.std.toFixed(2)}`],
    ['Latitude (lat)', 'Degrees (°)', latStats.min.toFixed(2), latStats.max.toFixed(2), latStats.mean.toFixed(2), `±${latStats.std.toFixed(2)}`],
    ['Longitude (lon)', 'Degrees (°)', lonStats.min.toFixed(2), lonStats.max.toFixed(2), lonStats.mean.toFixed(2), `±${lonStats.std.toFixed(2)}`],
    ['Azimuthal Gap (gap)', 'Degrees (°)', gapStats.min.toFixed(2), gapStats.max.toFixed(2), gapStats.mean.toFixed(2), `±${gapStats.std.toFixed(2)}`],
    ['Root Mean Square (rms)', 'Seconds (s)', rmsStats.min.toFixed(2), rmsStats.max.toFixed(2), rmsStats.mean.toFixed(2), `±${rmsStats.std.toFixed(2)}`]
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [['Feature Name', 'Unit / Type', 'Min Value', 'Max Value', 'Mean (μ)', 'Std Dev (σ)']],
    body: datasetRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 130, fontStyle: 'bold' },
      1: { cellWidth: 90 },
      2: { cellWidth: 70 },
      3: { cellWidth: 70 },
      4: { cellWidth: 75, fontStyle: 'bold' },
      5: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 16 : yPos + 120;

  // Key KPI metrics summary bar
  const totalRecords = data.length.toLocaleString();
  const maxMagVal = maxMag !== undefined ? maxMag.toFixed(2) : magStats.max.toFixed(2);
  const avgDepthVal = avgDepth !== undefined ? avgDepth.toFixed(2) : depthStats.mean.toFixed(2);

  // Check if we need a page break or if it fits
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 40;
  }

  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, yPos, contentWidth, 34, 4, 4, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...secondaryColor);
  doc.text(
    `Total Dataset Samples: ${totalRecords} records  |  Maximum Recorded Magnitude: ${maxMagVal} Mw  |  Average Focal Depth: ${avgDepthVal} km`,
    margin + 12,
    yPos + 21
  );

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedText);
    doc.text(
      'Earthquake Magnitude Predictor Pipeline  •  Generated for Seismic Risk Assessment  •  Confidential & Research Use',
      margin,
      pageHeight - 16
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 16,
      { align: 'right' }
    );
  }

  // Save the PDF
  const filename = prediction
    ? `earthquake_prediction_report_M${prediction.magnitude.toFixed(1)}_${now.toISOString().slice(0, 10)}.pdf`
    : `earthquake_dataset_report_${now.toISOString().slice(0, 10)}.pdf`;

  doc.save(filename);
}
