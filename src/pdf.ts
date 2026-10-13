import { jsPDF } from 'jspdf';
import { calculateLadderPlan, calculateLineMetrics } from './engine';
import { GarmentStyle } from './types';

/**
 * Generates and downloads a print-ready Industrial Engineering Line Bulletin
 * and Learning Curve Ramp-Up Ladder Plan PDF.
 */
export async function exportLadderPlanPDF(
  style: GarmentStyle,
  efficiencies: number[]
): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const metrics = calculateLineMetrics(style);
    const ladderPlans = calculateLadderPlan(style, efficiencies, style.customLadderDays);

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 16;

    // Header Branding Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SMV PRODUCTION LADDER PLANNER', margin + 6, y + 8);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Industrial Engineering Line Loading & Ramp-Up Bulletin', margin + 6, y + 15);

    // Date & Version stamp on right
    doc.setFontSize(8);
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
      pageWidth - margin - 6,
      y + 8,
      { align: 'right' }
    );
    doc.text('Android Mobile Industrial Edition', pageWidth - margin - 6, y + 15, { align: 'right' });

    y += 28;

    // Style & Order Information Box
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('GARMENT STYLE & ORDER SPECIFICATIONS', margin + 4, y + 6);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    // Left Column
    doc.text(`Style Name: ${style.styleName}`, margin + 4, y + 13);
    doc.text(`Style Code: ${style.styleCode}`, margin + 4, y + 19);
    doc.text(`Buyer / Brand: ${style.buyer || 'N/A'}`, margin + 4, y + 25);
    doc.text(`Garment Category: ${style.category}`, margin + 4, y + 30);

    // Right Column
    const col2X = margin + 100;
    doc.text(`Order Quantity: ${style.orderQuantity.toLocaleString()} pcs`, col2X, y + 13);
    doc.text(`Sewing Shift: ${style.workingHours} Hours/Day`, col2X, y + 19);
    doc.text(`Manpower: ${style.totalOperators} Operators + ${style.totalHelpers} Helpers`, col2X, y + 25);
    doc.text(`Labor Rate: $${style.hourlyLaborRate.toFixed(2)}/hr`, col2X, y + 30);

    y += 40;

    // Key IE Metrics Grid (4 Stat Badges)
    const cardWidth = (contentWidth - 9) / 4;
    const cards = [
      { label: 'TOTAL SMV', val: `${metrics.totalSMV.toFixed(2)} min`, sub: 'Standard Allowed Min' },
      { label: 'PITCH TIME', val: `${metrics.pitchTimeMinutes.toFixed(2)} min`, sub: 'Target station cycle' },
      { label: 'LINE BAL. EFF.', val: `${metrics.lineBalanceEfficiencyPct.toFixed(1)}%`, sub: `Bottlenecks: ${metrics.bottleneckCount}` },
      { label: 'STEADY TARGET', val: `${metrics.targetPiecesPerDay.toLocaleString()} pcs/day`, sub: `@ ${metrics.targetEfficiencyPct}% efficiency` },
    ];

    cards.forEach((card, i) => {
      const cx = margin + i * (cardWidth + 3);
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(cx, y, cardWidth, 18, 1.5, 1.5, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, cx + 3, y + 5);

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(card.val, cx + 3, y + 11.5);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(card.sub, cx + 3, y + 15.5);
    });

    y += 24;

    // SECTION 1: LEARNING CURVE RAMP-UP LADDER TABLE
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('LEARNING CURVE RAMP-UP LADDER (DAILY PRODUCTION TARGETS)', margin + 3, y + 4.2);

    y += 7;

    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');

    const ladderCols = [
      { name: 'Day #', x: margin + 3, w: 16 },
      { name: 'Target Eff (%)', x: margin + 22, w: 26 },
      { name: 'Daily Target (Pcs)', x: margin + 50, w: 32 },
      { name: 'Avg Hourly (Pcs)', x: margin + 84, w: 30 },
      { name: 'Cumulative (Pcs)', x: margin + 116, w: 32 },
      { name: 'Order Remaining', x: margin + 150, w: 30 },
    ];

    ladderCols.forEach((col) => {
      doc.text(col.name, col.x, y + 3.8);
    });

    y += 6;

    // Table Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    ladderPlans.slice(0, 10).forEach((plan, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5, 'F');
      }
      doc.setTextColor(51, 65, 85);

      doc.text(`Day ${plan.dayNumber}`, margin + 3, y + 3.6);
      doc.text(`${plan.efficiencyPct}%`, margin + 22, y + 3.6);
      doc.text(`${plan.targetDailyPcs.toLocaleString()}`, margin + 50, y + 3.6);
      doc.text(`${plan.targetHourlyAverage.toLocaleString()}`, margin + 84, y + 3.6);
      doc.text(`${plan.cumulativeTargetPcs.toLocaleString()}`, margin + 116, y + 3.6);
      doc.text(`${plan.remainingOrderPcs.toLocaleString()}`, margin + 150, y + 3.6);

      y += 5.2;
    });

    y += 5;

    // SECTION 2: OPERATION BULLETIN SUMMARY
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('OPERATION BULLETIN & LINE BALANCING LAYOUT', margin + 3, y + 4.2);

    y += 7;

    // Bulletin Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');

    const opCols = [
      { name: 'Seq', x: margin + 2, w: 10 },
      { name: 'Operation Name', x: margin + 12, w: 68 },
      { name: 'Machine', x: margin + 82, w: 30 },
      { name: 'SMV (min)', x: margin + 114, w: 20 },
      { name: 'Assigned', x: margin + 136, w: 18 },
      { name: 'Capacity/Hr', x: margin + 156, w: 24 },
    ];

    opCols.forEach((col) => {
      doc.text(col.name, col.x, y + 3.8);
    });

    y += 6;

    // Bulletin rows (first 16 operations fit nicely on page 1)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);

    const opsToDisplay = style.operations.slice(0, 16);
    opsToDisplay.forEach((op, idx) => {
      // Check if near page boundary
      if (y > 260) {
        doc.addPage();
        y = 16;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 4.8, 'F');
      }

      if (op.isBottleneck) {
        doc.setTextColor(185, 28, 28); // red for bottleneck
      } else {
        doc.setTextColor(51, 65, 85);
      }

      doc.text(String(op.seq), margin + 2, y + 3.4);
      const truncatedName = op.name.length > 36 ? `${op.name.slice(0, 34)}...` : op.name;
      doc.text(truncatedName, margin + 12, y + 3.4);
      doc.text(op.machineCode, margin + 82, y + 3.4);
      doc.text(op.smv.toFixed(2), margin + 114, y + 3.4);
      doc.text(String(op.operatorAssigned), margin + 136, y + 3.4);
      doc.text(
        `${op.targetCapacityPerHour} pcs ${op.isBottleneck ? '[BOTTLENECK]' : ''}`,
        margin + 156,
        y + 3.4
      );

      y += 4.9;
    });

    // Sign-off / Approval Block at footer
    const footerY = 270;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    doc.text('Prepared by (IE Dept): ____________________', margin, footerY + 7);
    doc.text('Approved by (Production Mgr): ____________________', margin + 65, footerY + 7);
    doc.text('Line Supervisor: ____________________', margin + 130, footerY + 7);

    doc.setFontSize(6.5);
    doc.text(
      'Document: SMV-LADDER-PLAN-V1 | Auto-generated by SMV Ladder Planner Android Edition',
      margin,
      footerY + 14
    );

    // Save PDF
    const filename = `SMV_Ladder_Plan_${style.styleCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return false;
  }
}
