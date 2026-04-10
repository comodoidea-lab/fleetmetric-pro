import { NavLink, useNavigate } from 'react-router-dom';
import { useMultiDriverMode } from '../hooks/useMultiDriverMode';

type NavItem = { to: string; icon: string; label: string; fillActive?: boolean };

const NAV_BASE: NavItem[] = [
  { to: '/', icon: 'dashboard', label: 'ダッシュボード', fillActive: true },
  { to: '/vehicles', icon: 'directions_car', label: '車両一覧' },
  { to: '/maintenance', icon: 'build', label: 'メンテナンス' },
  { to: '/fuel', icon: 'local_gas_station', label: '給油記録' },
  { to: '/accidents', icon: 'report_problem', label: '事故・修理' },
  { to: '/reports', icon: 'bar_chart', label: 'レポート' },
];

const NAV_DRIVER_EXTRA: NavItem[] = [
  { to: '/drivers', icon: 'badge', label: 'ドライバー' },
  { to: '/operations', icon: 'route', label: '運行記録' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { multiDriverMode } = useMultiDriverMode();
  const NAV_ITEMS: NavItem[] = multiDriverMode
    ? [
        ...NAV_BASE.slice(0, 2),
        ...NAV_DRIVER_EXTRA,
        ...NAV_BASE.slice(2),
      ]
    : NAV_BASE;

  return (
    <aside className="hidden lg:flex flex-col py-6 px-4 gap-2 h-screen w-64 fixed left-0 top-16 bg-surface-container-low z-40 overflow-y-auto">
      {/* Brand */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
          </div>
          <div>
            <p className="text-base font-black font-headline text-primary leading-tight">Fleet Authority</p>
            <p className="text-[10px] uppercase tracking-widest text-on-secondary-container font-bold font-label">Command Center</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon, label, fillActive }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 py-3 px-4 bg-surface-container-lowest text-primary rounded-lg shadow-sm font-bold transition-all duration-200'
                : 'flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-surface-container transition-all duration-200 rounded-lg'
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive && fillActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {icon}
                </span>
                <span className="font-label text-sm font-semibold tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant/30 pt-4">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 py-3 px-4 w-full text-on-surface-variant hover:bg-surface-container transition-all rounded-lg"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label text-sm font-semibold">設定</span>
        </button>
        <a className="flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-surface-container transition-all rounded-lg cursor-pointer">
          <span className="material-symbols-outlined">help</span>
          <span className="font-label text-sm font-semibold">ヘルプ</span>
        </a>
      </div>
    </aside>
  );
}
