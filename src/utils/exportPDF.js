import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import logoUrl from '../assets/logo.jpeg';
import { TAB_CHAPTERS, TAB_SUBJECTS, APP_VERSION } from './constants';
import { todayFormatted } from './dateUtils';

const STATUS_LABELS = { red: 'פג תוקף', amber: 'בקרוב', green: 'תקין', gray: 'לא פעיל' };

function cellLabel(val) {
  return STATUS_LABELS[val] ?? String(val ?? '');
}

export async function exportTablePDF(tab, columns, rows) {
  const chapter = TAB_CHAPTERS[tab] || '';
  const subject  = TAB_SUBJECTS[tab]  || '';
  const today    = todayFormatted();

  const colWidthPct = (100 / columns.length).toFixed(2) + '%';

  const headerCells = columns
    .map(c => `<th style="border:1px solid #999;padding:4px 6px;text-align:center;background:#D9D9D9;font-weight:bold;width:${colWidthPct};">${c}</th>`)
    .join('');

  const dataRows = rows.map((row, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#fafafa';
    const cells = row
      .map(c => `<td style="border:1px solid #999;padding:3px 5px;text-align:center;word-break:break-word;">${cellLabel(c)}</td>`)
      .join('');
    return `<tr style="background:${bg};">${cells}</tr>`;
  }).join('');

  const html = `
    <div id="__pdf_export__" style="
      font-family: Arial, Helvetica, sans-serif;
      direction: rtl;
      width: 1050px;
      font-size: 11px;
      color: #000;
      background: #fff;
      padding: 10px;
    ">
      <table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-bottom:4px;">
        <tr>
          <td style="width:90px;text-align:center;border-left:1px solid #999;padding:4px 6px;">
            <img src="${logoUrl}" style="height:38px;object-fit:contain;" />
          </td>
          <td style="text-align:center;font-weight:bold;font-size:16px;padding:4px;">
            Quality Assurance
          </td>
          <td style="width:55px;text-align:center;font-size:9px;padding:4px;border-right:1px solid #999;">
            v${APP_VERSION}
          </td>
        </tr>
        <tr style="border-top:1px solid #999;">
          <td colspan="3" style="padding:3px 8px;font-size:10px;">
            <span style="margin-left:30px;">Chapter: ${chapter}</span>
            <span style="margin-left:30px;">Update: ${today}</span>
          </td>
        </tr>
        <tr style="border-top:1px solid #999;background:#D9D9D9;">
          <td colspan="3" style="padding:3px 8px;font-weight:bold;font-size:11px;">${subject}</td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;border:1px solid #999;">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${dataRows}</tbody>
      </table>

      <div style="text-align:center;font-size:9px;color:#555;margin-top:6px;border-top:1px solid #ccc;padding-top:4px;">
        M. Shoham Trading LTD. &nbsp;|&nbsp; v${APP_VERSION}
      </div>
    </div>`;

  // Inject hidden element
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // Wait for logo
  const img = wrapper.querySelector('img');
  if (img && !img.complete) {
    await new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
  }

  // Render to canvas
  const element = wrapper.querySelector('#__pdf_export__');
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  document.body.removeChild(wrapper);

  // Build PDF with multi-page support
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const margin   = 8;
  const pageW    = doc.internal.pageSize.getWidth();
  const pageH    = doc.internal.pageSize.getHeight();
  const printW   = pageW - margin * 2;
  const printH   = pageH - margin * 2;

  // pixels per mm
  const pxPerMm  = canvas.width / printW;
  const slicePx  = Math.floor(printH * pxPerMm);
  const totalH   = canvas.height;

  let yPx = 0;
  let pageIdx = 0;

  while (yPx < totalH) {
    if (pageIdx > 0) doc.addPage();

    const sliceH = Math.min(slicePx, totalH - yPx);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width  = canvas.width;
    sliceCanvas.height = sliceH;
    sliceCanvas.getContext('2d').drawImage(canvas, 0, yPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

    const sliceImgH = (sliceH / pxPerMm);
    doc.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, printW, sliceImgH);

    yPx += slicePx;
    pageIdx++;
  }

  const fileDate = today.replace(/\//g, '-');
  doc.save(`Shoham_${tab}_${fileDate}.pdf`);
}
