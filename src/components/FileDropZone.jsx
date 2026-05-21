import { useRef, useState } from 'react';

export default function FileDropZone({ onFile, computedFileName }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">צרף מסמך כיול (PDF / JPG)</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDragEnd={() => setDragging(false)}
        className={`border-2 border-dashed rounded-lg px-4 py-4 text-center cursor-pointer select-none transition-colors
          ${dragging
            ? 'border-blue-400 bg-blue-50'
            : computedFileName
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg"
          onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }}
          className="hidden"
        />
        {computedFileName ? (
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
