import {
  BarChart3,
  Settings,
} from 'lucide-react';

import {
  Navigate,
  NavLink,
  Route,
  Routes,
} from 'react-router-dom';

import ActiveAnalyticsUsers from '../components/Admin/ActiveAnalyticsUsers';
import AnalyticsDashboard from '../components/Admin/AnalyticsDashboard';
import { ROUTES } from '../constants/routes';
import Admin from './Admin';

const ADMIN_SECTIONS = [
  {
    id: 'management',
    label: 'ניהול שוטף',
    to: ROUTES.ADMIN,
    end: true,
    icon: Settings,
  },
  {
    id: 'analytics',
    label: 'סטטיסטיקות אתר',
    to: `${ROUTES.ADMIN}/analytics`,
    end: false,
    icon: BarChart3,
  },
];

function AdminPortal() {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f7f4ee]"
    >
      <div className="border-b border-[#cfa756]/25 bg-[#0d2340] px-3 py-3 shadow-md sm:px-5">
        <nav
          className="mx-auto flex max-w-5xl items-center justify-center gap-2 rounded-2xl border border-[#cfa756]/25 bg-[#091a30] p-1.5 sm:w-fit"
          aria-label="אזורי ניהול"
        >
          {ADMIN_SECTIONS.map((section) => {
            const Icon = section.icon;

            return (
              <NavLink
                key={section.id}
                to={section.to}
                end={section.end}
                className={({ isActive }) =>
                  `inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition sm:min-w-[180px] ${
                    isActive
                      ? 'bg-[#cfa756] text-[#0d2340] shadow-[0_6px_20px_rgba(207,167,86,.24)]'
                      : 'text-[#f7f4e9]/70 hover:bg-white/5 hover:text-[#f7d98a]'
                  }`
                }
              >
                <Icon
                  size={18}
                  aria-hidden="true"
                />

                {section.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <Routes>
        <Route
          index
          element={<Admin />}
        />

        <Route
          path="analytics"
          element={(
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
              <div className="space-y-6">
                <ActiveAnalyticsUsers />
                <AnalyticsDashboard />
              </div>
            </div>
          )}
        />

        <Route
          path="*"
          element={(
            <Navigate
              to={ROUTES.ADMIN}
              replace
            />
          )}
        />
      </Routes>
    </div>
  );
}

export default AdminPortal;