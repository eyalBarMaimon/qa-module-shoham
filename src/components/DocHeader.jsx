import logo from '../assets/logo.jpeg';
import { TAB_CHAPTERS, TAB_SUBJECTS } from '../utils/constants';
import { todayFormatted } from '../utils/dateUtils';

export default function DocHeader({ tab }) {
  const chapter = TAB_CHAPTERS[tab] || '';
  const subject = TAB_SUBJECTS[tab] || '';

  return (
    <div className="border border-[#999] mb-4 text-sm" dir="ltr">
      <div className="flex items-stretch bg-white">

        {/* Logo */}
        <div className="w-52 p-2 border-l border-[#999] flex items-center justify-center shrink-0">
          <img src={logo} alt="M. Shoham" className="h-44 object-contain" />
        </div>

        {/* Right side: title + meta + subject */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex-1 flex items-center justify-center font-bold text-xl px-4">
            Quality Assurance
          </div>
          <div className="border-t border-[#999] flex text-xs text-gray-600">
            <div className="flex-1 px-2 py-1 border-l border-[#999]">Chapter: {chapter}</div>
            <div className="px-2 py-1 whitespace-nowrap">Update: {todayFormatted()}</div>
          </div>
          <div className="bg-[#D9D9D9] px-2 py-2 text-base font-bold border-t border-[#999] text-center">
            {subject}
          </div>
        </div>

      </div>
    </div>
  );
}
