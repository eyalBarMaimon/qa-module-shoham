import { useState } from 'react';
import { APP_PASSWORD } from './utils/constants';
import TabNav from './components/TabNav';
import DocFooter from './components/DocFooter';
import DemoWatermark from './components/DemoWatermark';
import logo from './assets/logo.jpeg';
import Dashboard from './pages/Dashboard';
import Tools from './pages/Tools';
import Machines from './pages/Machines';
import Filters from './pages/Filters';
import Lamps from './pages/Lamps';
import Suppliers from './pages/Suppliers';
import Training from './pages/Training';
import './index.css';

const PAGES = {
  dashboard: Dashboard,
  tools: Tools,
  machines: Machines,
  filters: Filters,
  lamps: Lamps,
  suppliers: Suppliers,
  training: Training,
};

function Login({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (pw === APP_PASSWORD) {
      localStorage.setItem('qa_auth', '1');
      onLogin();
    } else {
      setErr(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-80 text-center">
        <img src={logo} alt="M. Shoham" className="h-24 object-contain mx-auto mb-4" />
        <div className="text-sm text-gray-500 mb-6">Quality Assurance</div>
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(false); }}
          placeholder="סיסמה"
          className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-center focus:outline-none focus:border-blue-400"
          autoFocus
        />
        {err && <div className="text-red-500 text-sm mb-3">סיסמה שגויה</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">
          כניסה
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem('qa_auth') === '1');
  const [tab, setTab]       = useState('dashboard');
  const [demo, setDemo]     = useState(() =>
    new URLSearchParams(window.location.search).has('demo') ||
    localStorage.getItem('qa_demo') === '1'
  );

  function toggleDemo() {
    const next = !demo;
    setDemo(next);
    next ? localStorage.setItem('qa_demo', '1') : localStorage.removeItem('qa_demo');
  }

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const Page = PAGES[tab] || Dashboard;

  return (
    <div className="min-h-screen bg-gray-100">
      {demo && <DemoWatermark />}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-end items-center gap-3 mb-3">
          <button
            onClick={toggleDemo}
            className={`text-xs px-2 py-0.5 rounded border ${demo ? 'border-orange-400 text-orange-500 bg-orange-50' : 'border-gray-300 text-gray-400 hover:text-gray-600'}`}
            title="הפעל/כבה DEMO Watermark"
          >
            DEMO
          </button>
          <button
            onClick={() => { localStorage.removeItem('qa_auth'); setAuthed(false); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            יציאה
          </button>
        </div>
        <TabNav active={tab} onChange={setTab} />
        <div className="bg-white rounded shadow p-4">
          <Page />
        </div>
        <DocFooter />
      </div>
    </div>
  );
}
