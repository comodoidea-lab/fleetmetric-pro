import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useMultiDriverMode } from '../hooks/useMultiDriverMode';

const RECORD_PATH_PREFIXES = ['/maintenance', '/fuel', '/accidents', '/drivers', '/operations'];

function pathIsUnderRecords(pathname: string): boolean {
  return RECORD_PATH_PREFIXES.some(
    p => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function BottomNav() {
  const { multiDriverMode } = useMultiDriverMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const recordLinks = useMemo(() => {
    const base = [
      { to: '/maintenance', label: '整備記録', icon: 'build' as const },
      { to: '/fuel', label: '給油記録', icon: 'local_gas_station' as const },
      { to: '/accidents', label: '事故・修理', icon: 'report_problem' as const },
    ];
    // localStorage と同一タブ同期後の boolean のみで分岐（falsy ではドライバー系を出さない）
    if (multiDriverMode !== true) return base;
    return [
      { to: '/drivers', label: 'ドライバー', icon: 'badge' as const },
      { to: '/operations', label: '運行記録', icon: 'route' as const },
      ...base,
    ];
  }, [multiDriverMode]);

  const onRecordSection = pathIsUnderRecords(location.pathname);

  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  const tabs = [
    { key: 'home', type: 'link' as const, to: '/', icon: 'dashboard', label: 'ホーム', end: true },
    { key: 'vehicles', type: 'link' as const, to: '/vehicles', icon: 'directions_car', label: '車両', end: false },
    { key: 'records', type: 'sheet' as const, icon: 'edit_note', label: '記録' },
    { key: 'reports', type: 'link' as const, to: '/reports', icon: 'bar_chart', label: 'レポート', end: false },
    { key: 'settings', type: 'link' as const, to: '/settings', icon: 'settings', label: '設定', end: false },
  ];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/20 pb-safe">
        <div className="flex items-stretch h-16">
          {tabs.map(tab => {
            if (tab.type === 'link') {
              return (
                <NavLink
                  key={tab.key}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    `flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 transition-colors ${
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
                        {tab.icon}
                      </span>
                      <span className="text-[9px] font-label font-medium leading-none text-center px-0.5">{tab.label}</span>
                    </>
                  )}
                </NavLink>
              );
            }

            const active = onRecordSection;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSheetOpen(true)}
                className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-primary' : 'text-on-surface-variant'
                }`}
                aria-expanded={sheetOpen}
                aria-haspopup="dialog"
                aria-label="記録メニューを開く"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22, fontVariationSettings: active || sheetOpen ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
                <span className="text-[9px] font-label font-medium leading-none text-center px-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="bottom-nav-records-title">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="閉じる"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative bg-surface-container-lowest rounded-t-2xl shadow-xl border-t border-outline-variant/20 max-h-[min(70vh,480px)] flex flex-col pb-safe">
            <div className="flex justify-center pt-3 pb-1">
              <span className="w-10 h-1 rounded-full bg-outline-variant/50" aria-hidden />
            </div>
            <h2 id="bottom-nav-records-title" className="px-5 pb-3 text-base font-headline font-bold text-on-surface">
              記録
            </h2>
            <div className="overflow-y-auto px-3 pb-4">
              <ul className="space-y-1">
                {recordLinks.map(item => {
                  const rowActive =
                    location.pathname === item.to ||
                    (item.to !== '/' && location.pathname.startsWith(`${item.to}/`));
                  return (
                  <li key={item.to}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(item.to);
                        setSheetOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors ${
                        rowActive ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 22 }}>
                        {item.icon}
                      </span>
                      <span className="text-sm font-label font-semibold">{item.label}</span>
                      <span
                        className={`material-symbols-outlined ml-auto ${rowActive ? 'text-primary' : 'text-on-surface-variant'}`}
                        style={{ fontSize: 18 }}
                      >
                        chevron_right
                      </span>
                    </button>
                  </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
