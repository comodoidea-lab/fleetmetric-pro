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
  const [modalOpen, setModalOpen] = useState(false);

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
    setModalOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  const leftTabs = [
    { key: 'home', to: '/', icon: 'dashboard' as const, label: 'ホーム', end: true },
    { key: 'vehicles', to: '/vehicles', icon: 'directions_car' as const, label: '車両', end: false },
  ];
  const rightTabs = [
    { key: 'reports', to: '/reports', icon: 'bar_chart' as const, label: 'レポート', end: false },
    { key: 'settings', to: '/settings', icon: 'settings' as const, label: '設定', end: false },
  ];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/20 pb-safe overflow-visible">
        <div className="relative flex h-16 items-stretch">
          <div className="flex flex-1 min-w-0">
            {leftTabs.map(tab => (
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
            ))}
          </div>

          <div className="relative flex w-[76px] shrink-0 items-end justify-center">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={`absolute -top-7 left-1/2 z-10 flex size-16 shrink-0 -translate-x-1/2 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full p-0 shadow-lg shadow-black/20 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                onRecordSection || modalOpen
                  ? 'bg-primary text-on-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-surface-container-lowest'
                  : 'bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.98]'
              }`}
              aria-expanded={modalOpen}
              aria-haspopup="dialog"
              aria-label="記録メニューを開く"
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 22,
                  fontVariationSettings: onRecordSection || modalOpen ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                edit_note
              </span>
              <span className="text-[10px] font-label font-semibold leading-none tracking-wide">記録</span>
            </button>
          </div>

          <div className="flex flex-1 min-w-0">
            {rightTabs.map(tab => (
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
            ))}
          </div>
        </div>
      </nav>

      {modalOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bottom-nav-records-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="閉じる"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative flex max-h-[min(70vh,480px)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/20 px-5 py-4">
              <h2 id="bottom-nav-records-title" className="text-base font-headline font-bold text-on-surface">
                記録
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="閉じる"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                  close
                </span>
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto px-3 py-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
                          setModalOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors ${
                          rowActive ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined flex-shrink-0 text-primary" style={{ fontSize: 22 }}>
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
