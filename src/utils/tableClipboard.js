const INTERACTIVE = 'button, input, select, textarea, a, label';

/** Select table cell text on right-click so the browser Copy menu item works. */
export function handleTableContextMenu(e) {
  if (e.target.closest(INTERACTIVE)) return;

  const td = e.target.closest('td');
  if (!td || td.closest(INTERACTIVE)) return;

  const text = (td.innerText || '').trim();
  if (!text) return;

  const range = document.createRange();
  range.selectNodeContents(td);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export function installTableClipboard() {
  document.addEventListener('contextmenu', handleTableContextMenu);
  return () => document.removeEventListener('contextmenu', handleTableContextMenu);
}
