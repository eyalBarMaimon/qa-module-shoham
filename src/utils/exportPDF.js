import { jsPDF } from 'jspdf';
import { TAB_CHAPTERS, TAB_SUBJECTS, APP_VERSION } from './constants';
import { todayFormatted } from './dateUtils';

const STATUS_LABELS = { red: 'פג תוקף', amber: 'בקרוב', green: 'תקין', gray: 'לא פעיל' };

export function exportTablePDF(tab, columns, rows) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentW = pageW - margin * 2;

  // ---- Header ----
  // Row 1: company name + version
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, margin, contentW, 10, 'F');
  doc.setDrawColor(153, 153, 153);
  doc.rect(margin, margin, contentW, 10);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('M. Shoham Trading LTD. / Quality Assurance', pageW / 2, margin + 6.5, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`v${APP_VERSION}`, pageW - margin - 2, margin + 6.5, { align: 'right' });

  // Row 2: Chapter | Update | Rev
  const chapter = TAB_CHAPTERS[tab] || '';
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, margin + 10, contentW, 8, 'F');
  doc.rect(margin, margin + 10, contentW, 8);
  doc.setFontSize(7);
  doc.text(`Chapter: ${chapter}`, margin + 2, margin + 15);
  doc.text(`Update: ${todayFormatted()}`, pageW / 2, margin + 15, { align: 'center' });
  doc.text('Rev. 02', pageW - margin - 2, margin + 15, { align: 'right' });

  // Row 3: Subject
  const subject = TAB_SUBJECTS[tab] || '';
  doc.setFillColor(217, 217, 217);
  doc.rect(margin, margin + 18, contentW, 7, 'F');
  doc.rect(margin, margin + 18, contentW, 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Subject: ${subject}`, margin + 2, margin + 23);

  // ---- Table ----
  const tableTop = margin + 28;
  const colW = contentW / columns.length;
  const rowH = 7;

  // Header row
  doc.setFillColor(217, 217, 217);
  doc.rect(margin, tableTop, contentW, rowH, 'F');
  doc.setDrawColor(153, 153, 153);
  doc.rect(margin, tableTop, contentW, rowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  columns.forEach((col, j) => {
    doc.rect(margin + j * colW, tableTop, colW, rowH);
    doc.text(col, margin + j * colW + colW / 2, tableTop + rowH - 2, { align: 'center' });
  });

  // Data rows
  doc.setFont('helvetica', 'normal');
  let y = tableTop + rowH;
  rows.forEach((row, i) => {
    if (y + rowH > pageH - 15) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250);
    doc.rect(margin, y, contentW, rowH, 'F');
    doc.setDrawColor(153, 153, 153);
    doc.rect(margin, y, contentW, rowH);
    row.forEach((cell, j) => {
      doc.rect(margin + j * colW, y, colW, rowH);
      const label = STATUS_LABELS[cell] || String(cell ?? '');
      const text = doc.splitTextToSize(label, colW - 2);
      doc.text(text[0] || '', margin + j * colW + colW / 2, y + rowH - 2, { align: 'center' });
    });
    y += rowH;
  });

  // Footer
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('QA Manager: Ilana Hofman  |  QC Manager: Sveta Matveev  |  M. Shoham Trading LTD.', pageW / 2, pageH - 5, { align: 'center' });

  // Save
  const today = todayFormatted().replace(/\//g, '-');
  doc.save(`Shoham_${tab}_${today}.pdf`);
}
