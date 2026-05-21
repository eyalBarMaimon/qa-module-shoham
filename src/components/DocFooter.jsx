import { APP_VERSION } from '../utils/constants';

export default function DocFooter() {
  return (
    <div className="border-t border-[#999] mt-4 py-2 text-xs text-gray-500 text-center" dir="ltr">
      v{APP_VERSION} &nbsp;|&nbsp; M. Shoham Trading LTD.
    </div>
  );
}
