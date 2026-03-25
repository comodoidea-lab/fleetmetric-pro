import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { StatusBadge } from '../components/StatusBadge';
import { MaintenanceForm } from '../components/forms/MaintenanceForm';
import { FuelForm } from '../components/forms/FuelForm';
import { AccidentForm } from '../components/forms/AccidentForm';
import { VehicleForm } from '../components/forms/VehicleForm';

type Tab = 'info' | 'maintenance' | 'fuel' | 'accidents';

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, maintenance, fuel, accidents, deleteVehicle, deleteMaintenance, deleteFuel, deleteAccident } = useStore();

  const vehicle = vehicles.find(v => v['車両ID'] === id);
  const vMaint = maintenance.filter(r => r['車両ID'] === id).sort((a, b) => new Date(b['日付']).getTime() - new Date(a['日付']).getTime());
  const vFuel = fuel.filter(r => r['車両ID'] === id).sort((a, b) => new Date(b['日付']).getTime() - new Date(a['日付']).getTime());
  const vAccidents = accidents.filter(r => r['車両ID'] === id).sort((a, b) => new Date(b['日付']).getTime() - new Date(a['日付']).getTime());

  const [tab, setTab] = useState<Tab>('info');
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showAccidentForm, setShowAccidentForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant block mb-3">directions_car</span>
        <p className="text-on-surface-variant">車両が見つかりません</p>
        <Link to="/vehicles" className="text-primary text-sm mt-2 inline-block hover:underline">車両一覧に戻る</Link>
      </div>
    );
  }

  const daysUntilInspection = vehicle['車検期限']
    ? Math.floor((new Date(vehicle['車検期限']).getTime() - Date.now()) / 86400000)
    : null;

  const totalMaintCost = vMaint.reduce((s, r) => s + (Number(r['費用(円)']) || 0), 0);
  const totalFuelCost = vFuel.reduce((s, r) => s + (Number(r['費用(円)']) || 0), 0);

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'info', label: '基本情報' },
    { key: 'maintenance', label: 'メンテナンス', count: vMaint.length },
    { key: 'fuel', label: '給油記録', count: vFuel.length },
    { key: 'accidents', label: '事故・修理', count: vAccidents.length },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link to="/vehicles" className="hover:text-primary transition-colors">車両一覧</Link>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
        <span className="text-on-surface font-semibold">{vehicle['車両名']}</span>
      </nav>

      {/* Hero section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main card */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary-container p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={vehicle['ステータス']} />
                  {vehicle['ステータス'] === '稼働中' && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse" />
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-headline font-bold text-white">{vehicle['車両名']}</h1>
                <p className="text-sm text-white/70 mt-1">{vehicle['ナンバー']}</p>
              </div>
              <button
                onClick={() => setShowEditForm(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-outline-variant/20">
            {[
              { label: 'メーカー', value: vehicle['メーカー'] || '—' },
              { label: '車種', value: vehicle['車種'] || '—' },
              { label: '年式', value: vehicle['年式'] ? `${vehicle['年式']}年` : '—' },
              { label: '車検期限', value: vehicle['車検期限'] || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="p-4">
                <p className="text-xs font-label uppercase tracking-wider text-on-surface-variant">{label}</p>
                <p className="text-sm font-semibold text-on-surface mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Side stats */}
        <div className="flex flex-col gap-4">
          <div className={`bg-surface-container-lowest rounded-xl shadow-sm p-5 ${daysUntilInspection !== null && daysUntilInspection <= 30 ? 'border-l-4 border-l-error' : ''}`}>
            <p className="text-xs font-label uppercase tracking-wider text-on-surface-variant mb-2">次回車検まで</p>
            {daysUntilInspection !== null ? (
              <>
                <p className={`text-3xl font-headline font-bold ${daysUntilInspection < 0 ? 'text-error' : daysUntilInspection <= 30 ? 'text-on-secondary-container' : 'text-on-surface'}`}>
                  {daysUntilInspection < 0 ? `${Math.abs(daysUntilInspection)}日超過` : `${daysUntilInspection}日`}
                </p>
                <div className="mt-3 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all ${daysUntilInspection < 0 ? 'bg-error w-full' : daysUntilInspection <= 30 ? 'bg-secondary' : 'bg-tertiary-fixed'}`}
                    style={{ width: daysUntilInspection > 0 ? `${Math.min(100, Math.max(5, (daysUntilInspection / 730) * 100))}%` : '100%' }}
                  />
                </div>
              </>
            ) : <p className="text-on-surface-variant text-sm">未設定</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 text-center">
              <p className="text-xs font-label text-on-surface-variant mb-1">整備費累計</p>
              <p className="text-lg font-headline font-bold text-on-surface">¥{totalMaintCost.toLocaleString()}</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 text-center">
              <p className="text-xs font-label text-on-surface-variant mb-1">給油費累計</p>
              <p className="text-lg font-headline font-bold text-on-surface">¥{totalFuelCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-outline-variant/20 overflow-x-auto">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-label font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === key ? 'border-b-primary text-primary' : 'border-b-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {tab === 'info' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: '車両ID', value: vehicle['車両ID'] },
                { label: '車両名', value: vehicle['車両名'] },
                { label: 'ナンバープレート', value: vehicle['ナンバー'] },
                { label: 'メーカー', value: vehicle['メーカー'] || '—' },
                { label: '車種', value: vehicle['車種'] || '—' },
                { label: '年式', value: vehicle['年式'] ? `${vehicle['年式']}年式` : '—' },
                { label: '車検期限', value: vehicle['車検期限'] || '—' },
                { label: '法定点検期限', value: vehicle['法定点検期限'] || '—' },
                { label: 'ステータス', value: vehicle['ステータス'] },
                { label: '登録日', value: vehicle['登録日'] || '—' },
                { label: '備考', value: vehicle['備考'] || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-xs font-label uppercase tracking-wider text-on-surface-variant mb-1">{label}</p>
                  <p className="text-sm font-semibold text-on-surface">{value}</p>
                </div>
              ))}
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-secondary-container text-on-secondary-fixed rounded-full text-sm font-semibold hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>編集
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`${vehicle['車両名']} を削除しますか？`)) {
                      await deleteVehicle(vehicle['車両ID']);
                      navigate('/vehicles');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-error-container text-on-error-container rounded-full text-sm font-semibold hover:bg-error/20 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>削除
                </button>
              </div>
            </div>
          )}

          {tab === 'maintenance' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-on-surface-variant">{vMaint.length}件の記録</p>
                <button
                  onClick={() => setShowMaintForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-full text-xs font-semibold hover:bg-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>追加
                </button>
              </div>
              <RecordList
                records={vMaint}
                emptyMsg="メンテナンス記録がありません"
                emptyIcon="build"
                renderItem={(r) => (
                  <div key={r['記録ID']} className="flex gap-4 py-3 border-b border-outline-variant/10 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: 15 }}>build</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface">{r['作業内容']}</p>
                      <p className="text-xs text-on-surface-variant">{r['業者']} · {String(r['日付'])}</p>
                      {r['走行距離(km)'] && <p className="text-xs text-on-surface-variant">{Number(r['走行距離(km)']).toLocaleString()} km</p>}
                      {r['備考'] && <p className="text-xs text-secondary mt-0.5">{r['備考']}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {r['費用(円)'] && <p className="text-sm font-bold text-on-surface">¥{Number(r['費用(円)']).toLocaleString()}</p>}
                      <button onClick={() => deleteMaintenance(r['記録ID'])} className="text-error hover:underline text-xs mt-1">削除</button>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {tab === 'fuel' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-on-surface-variant">{vFuel.length}件の記録</p>
                <button
                  onClick={() => setShowFuelForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-full text-xs font-semibold hover:bg-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>追加
                </button>
              </div>
              <RecordList
                records={vFuel}
                emptyMsg="給油記録がありません"
                emptyIcon="local_gas_station"
                renderItem={(r) => (
                  <div key={r['記録ID']} className="flex gap-4 py-3 border-b border-outline-variant/10 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: 15 }}>local_gas_station</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface">{r['スタンド名'] || 'スタンド名未設定'}</p>
                      <p className="text-xs text-on-surface-variant">{String(r['日付'])} · {Number(r['給油量(L)'])}L · ¥{Number(r['単価(円/L)'])}/L</p>
                      {r['走行距離(km)'] && <p className="text-xs text-on-surface-variant">{Number(r['走行距離(km)']).toLocaleString()} km</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {r['費用(円)'] && <p className="text-sm font-bold text-on-surface">¥{Number(r['費用(円)']).toLocaleString()}</p>}
                      <button onClick={() => deleteFuel(r['記録ID'])} className="text-error hover:underline text-xs mt-1">削除</button>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {tab === 'accidents' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-on-surface-variant">{vAccidents.length}件の記録</p>
                <button
                  onClick={() => setShowAccidentForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-full text-xs font-semibold hover:bg-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>追加
                </button>
              </div>
              <RecordList
                records={vAccidents}
                emptyMsg="事故・修理記録がありません"
                emptyIcon="report_problem"
                renderItem={(r) => (
                  <div key={r['記録ID']} className="flex gap-4 py-3 border-b border-outline-variant/10 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-error" style={{ fontSize: 15 }}>report_problem</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface">{r['事故・修理内容']}</p>
                      <p className="text-xs text-on-surface-variant">{r['業者']} · {String(r['日付'])}</p>
                      {r['損傷箇所'] && <p className="text-xs text-on-surface-variant">損傷箇所: {r['損傷箇所']}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {r['費用(円)'] && <p className="text-sm font-bold text-on-surface">¥{Number(r['費用(円)']).toLocaleString()}</p>}
                      <button onClick={() => deleteAccident(r['記録ID'])} className="text-error hover:underline text-xs mt-1">削除</button>
                    </div>
                  </div>
                )}
              />
            </div>
          )}
        </div>
      </div>

      {showMaintForm && <MaintenanceForm vehicleId={id} onClose={() => setShowMaintForm(false)} />}
      {showFuelForm && <FuelForm vehicleId={id} onClose={() => setShowFuelForm(false)} />}
      {showAccidentForm && <AccidentForm vehicleId={id} onClose={() => setShowAccidentForm(false)} />}
      {showEditForm && <VehicleForm vehicle={vehicle} onClose={() => setShowEditForm(false)} />}
    </div>
  );
}

function RecordList<T>({ records, emptyMsg, emptyIcon, renderItem }: {
  records: T[];
  emptyMsg: string;
  emptyIcon: string;
  renderItem: (r: T) => React.ReactNode;
}) {
  if (records.length === 0) {
    return (
      <div className="py-10 text-center">
        <span className="material-symbols-outlined text-on-surface-variant text-3xl block mb-2">{emptyIcon}</span>
        <p className="text-sm text-on-surface-variant">{emptyMsg}</p>
      </div>
    );
  }
  return <div>{records.map(r => renderItem(r))}</div>;
}
