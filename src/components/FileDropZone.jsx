import { useRef, useState } from 'react';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg'];
const ACCEPTED_EXTS  = ['.pdf', '.jpg', '.jpeg'];

function isAccepted(file) {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return ACCEPTED_EXTS.includes(ext);
}

export default function FileDropZone({ onFile, computedFileName }) {
  const inputRef   = useRef(null);
  const dragCount  = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [typeError, setTypeError] = useState(false);

  function handleDragEnter(e) {
    e.preventDefault();
    dragCount.current += 1;
    if (dragCount.current === 1) setDragging(true);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragCount.current -= 1;
    if (dragCount.current === 0) setDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    dragCount.current = 0;
    setDragging(false);
    setTypeError(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!isAccepted(f)) { setTypeError(true); return; }
    onFile(f);
  }

  function handleChange(e) {
    setTypeError(false);
    const f = e.target.files[0];
    if (f) onFile(f);
  }

  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">צרף מסמך כיול (PDF / JPG)</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg px-4 py-4 text-center cursor-pointer select-none transition-colors
          ${dragging
            ? 'border-blue-400 bg-blue-50'
            : typeError
              ? 'border-red-400 bg-red-50'
              : computedFileName
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg"
          onChange={handleChange}
          className="hidden"
        />
        {typeError ? (
          <div className="text-sm text-red-600">סוג קובץ לא נתמך — יש לבחור PDF או JPG בלבד</div>
        ) : computedFileName ? (
          <div className="text-sm text-green-700 font-medium break-all">{computedFileName}</div>
        ) : (
          <>
            <div className="text-3xl text-gray-300 leading-none mb-1">&#8593;</div>
            <div className="text-sm text-gray-500 font-medium">גרור קובץ לכאן</div>
            <div className="text-xs text-gray-400 mt-0.5">או לחץ לבחירה מתיקייה</div>
            <div className="text-xs text-gray-300 mt-1">PDF · JPG</div>
          </>
        )}
      </div>
    </div>
  );
}
