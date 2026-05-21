import logo from '../assets/logo.jpeg';
import { TAB_CHAPTERS, TAB_SUBJECTS, APP_VERSION } from '../utils/constants';
import { todayFormatted } from '../utils/dateUtils';

export default function DocHeader({ tab }) {
  const chapter = TAB_CHAPTERS[tab] || '';
  const subject = TAB_SUBJECTS[tab] || '';

  return (
    <div className="border border-[#999] mb-4 text-sm" dir="ltr">
      {/* Row 1 */}
      <div className="flex items-center border-b border-[#999] bg-white">
        <div className="w-24 p-2 border-l border-[#999] flex items-center justify-center">
          <img src={logo} alt="M. Shoham" className="h-10 object-contain" />
        </div>
        <div className="flex-1 text-center font-bold py-2">
          M. Shoham Trading LTD. / Quality Assurance
        </div>
        <div className="w-24 p-2 text-center text-xs border-r border-[#999]">
          v{APP_VERSION}
        </div>
      </div>
      {/* Row 2 */}
      <div className="flex border-b border-[#999] bg-white text-xs">
        <div className="flex-1 p-1.5 border-l border-[#999]">Chapter: {chapter}</div>
        <div className="p-1.5 border-l border-[#999] whitespace-nowrap">Update: {todayFormatted()}</div>
        <div className="p-1.5 border-l border-[#999] whitespace-nowrap">Rev. 02</div>
      </div>
      {/* Row 3 */}
      <div className="bg-[#D9D9D9] p-1.5 text-xs font-semibold">
        Subject: {subject}
      </div>
    </div>
  );
}
