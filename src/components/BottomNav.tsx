import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', icon: 'dashboard', label: 'ホーム' },
  { to: '/vehicles', icon: 'directions_car', label: '車両' },
  { to: '/maintenance', icon: 'build', label: '整備' },
  { to: '/fuel', icon: 'local_gas_station', label: '給油' },
  { to: '/reports', icon: 'bar_chart', label: 'レポート' },
  { to: '/settings', icon: 'settings', label: '設定' },
];

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/20 pb-safe">
      <div className="flex items-stretch h-16">
        {TABS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {icon}
                </span>
                <span className="text-[9px] font-label font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
