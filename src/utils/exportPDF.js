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
  const subject = TAB_SUBJECTS[tab] || '';
  const today   = todayFormatted();

  // ── Build printable HTML ───────────────────────────────────────────────────
  const colWidthPct = (100 / columns.length).toFixed(2) + '%';

  const headerRows = columns
    .map(c => `<th style="border:1px solid #999;padding:4px 6px;text-align:center;background:#D9D9D9;font-weight:bold;">${c}</th>`)
    .join('');

  const dataRows = rows.map((row, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#fafafa';
    const cells = row
      .map(c => `<td style="border:1px solid #999;padding:3px 5px;text-align:center;">${cellLabel(c)}</td>`)
      .join('');
    return `<tr style="background:${bg};">${cells}</tr>`;
  }).join('');

  const html = `
    <div id="__pdf_export__" style="
      font-family:Arial,Helvetica,sans-serif;
      direction:rtl;
      width:1050px;
      font-size:11px;
      color:#000;
      background:#fff;
      padding:10px;
    ">
      <!-- Doc header -->
      <table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-bottom:2px;">
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
            <span>Rev. 02</span>
          </td>
        </tr>
        <tr style="border-top:1px solid #999;background:#D9D9D9;">
          <td colspan="3" style="padding:3px 8px;font-weight:bold;font-size:11px;">
            ${subject}
          </td>
        </tr>
      </table>

      <!-- Data table -->
      <table style="width:100%;border-collapse:collapse;border:1px solid #999;">
        <thead><tr>${headerRows}</tr></thead>
        <tbody>${dataRows}</tbody>
      </table>

      <!-- Footer -->
      <div style="text-align:center;font-size:9px;color:#555;margin-top:6px;border-top:1px solid #ccc;padding-top:4px;">
        v${APP_VERSION} &nbsp;|&nbsp; M. Shoham Trading LTD.
      </div>
    </div>`;

  // ── Inject into DOM temporarily ───────────────────────────────────────────
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // Wait for logo image to load
  const img = wrapper.querySelector('img');
  if (img && !img.complete) {
    await new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
  }

  // ── Render with jsPDF ─────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  await new Promise(resolve => {
    doc.html(wrapper.querySelector('#__pdf_export__'), {
      callback: (d) => {
        document.body.removeChild(wrapper);
        const fileDate = today.replace(/\//g, '-');
        d.save(`Shoham_${tab}_${fileDate}.pdf`);
        resolve();
      },
      margin:    [8, 8, 8, 8],
      autoPaging: 'text',
      width:      281,
      windowWidth: 1050,
    });
  });
}
