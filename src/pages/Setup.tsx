import { useState } from 'react';
import { User } from 'firebase/auth';
import { setGasUrl, setAllowedDomain, saveGasUrlToFirestore, isSkipAuth } from '../config';
import { ManualModal } from '../components/ManualModal';

const GAS_CODE = `// ============================================================
// 営業車管理システム - Code.gs
// Google Apps Script サーバーサイドコード
// ============================================================

const SHEET = {
  VEHICLES:    '車両マスタ',
  MAINTENANCE: 'メンテナンス記録',
  ACCIDENTS:   '事故・修理履歴',
  FUEL:        '給油記録'
};

function doGet(e) {
  if (!e || !e.parameter || !e.parameter.action) {
    return ContentService.createTextOutput('FleetMetric Pro API is running.')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const action   = e.parameter.action;
  const callback = e.parameter.callback;
  let result;

  try {
    switch (action) {
      case 'init':
        result = initializeAllSheets();
        break;
      case 'dashboard':
        result = { success: true, data: getDashboardData() };
        break;
      case 'vehicles':
        result = { success: true, data: getVehicles() };
        break;
      case 'maintenance':
        result = { success: true, data: getMaintenanceRecords(e.parameter.vehicleId || null) };
        break;
      case 'fuel':
        result = { success: true, data: getFuelRecords(e.parameter.vehicleId || null) };
        break;
      case 'accidents':
        result = { success: true, data: getAccidentRecords(e.parameter.vehicleId || null) };
        break;
      case 'statistics':
        result = { success: true, data: getStatistics() };
        break;
      case 'addVehicle':
        result = addVehicle(JSON.parse(e.parameter.data));
        break;
      case 'updateVehicle':
        result = updateVehicle(JSON.parse(e.parameter.data));
        break;
      case 'deleteVehicle':
        result = deleteVehicle(e.parameter.id);
        break;
      case 'addMaintenance':
        result = addMaintenanceRecord(JSON.parse(e.parameter.data));
        break;
      case 'deleteMaintenance':
        result = deleteMaintenanceRecord(e.parameter.id);
        break;
      case 'addFuel':
        result = addFuelRecord(JSON.parse(e.parameter.data));
        break;
      case 'deleteFuel':
        result = deleteFuelRecord(e.parameter.id);
        break;
      case 'addAccident':
        result = addAccidentRecord(JSON.parse(e.parameter.data));
        break;
      case 'deleteAccident':
        result = deleteAccidentRecord(e.parameter.id);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  const json = JSON.stringify(result);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    _initSheet(sheet, sheetName);
  }
  return sheet;
}

function _initSheet(sheet, sheetName) {
  const HEADERS = {
    '車両マスタ':      ['車両ID','車両名','ナンバー','メーカー','車種','年式','車検期限','法定点検期限','ステータス','備考','登録日','アイコン'],
    'メンテナンス記録': ['記録ID','車両ID','車両名','日付','走行距離(km)','作業内容','費用(円)','業者','次回予定日','備考'],
    '事故・修理履歴':   ['記録ID','車両ID','車両名','日付','事故・修理内容','損傷箇所','費用(円)','業者','完了日','備考'],
    '給油記録':        ['記録ID','車両ID','車両名','日付','走行距離(km)','給油量(L)','単価(円/L)','費用(円)','スタンド名','備考']
  };
  const headers = HEADERS[sheetName];
  if (!headers) return;
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground('#1a73e8')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 160);
}

function initializeAllSheets() {
  try {
    ['車両マスタ','メンテナンス記録','事故・修理履歴','給油記録'].forEach(name => getSheet(name));
    return { success: true, message: 'シートを初期化しました' };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

function _sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (row[i] instanceof Date)
          ? Utilities.formatDate(row[i], 'Asia/Tokyo', 'yyyy/MM/dd')
          : row[i];
      });
      return obj;
    })
    .filter(r => r[headers[0]]);
}

function getVehicles() { return _sheetToObjects(getSheet('車両マスタ')); }

function addVehicle(v) {
  try {
    const id = 'V' + new Date().getTime();
    getSheet('車両マスタ').appendRow([
      id, v.name||v['車両名'], v.plateNumber||v['ナンバー'],
      v.maker||v['メーカー']||'', v.model||v['車種']||'',
      v.year||v['年式']||'', v.inspectionDate||v['車検期限']||'',
      v.periodicInspectionDate||v['法定点検期限']||'',
      v.status||v['ステータス']||'稼働中',
      v.notes||v['備考']||'',
      Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd'),
      v['アイコン']||'directions_car'
    ]);
    return { success: true, id };
  } catch(e) { return { success: false, error: e.message }; }
}

function updateVehicle(v) {
  try {
    const sheet = getSheet('車両マスタ');
    const data = sheet.getDataRange().getValues();
    const id = v.id||v['車両ID'];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.getRange(i+1,1,1,12).setValues([[
          id, v.name||v['車両名'], v.plateNumber||v['ナンバー'],
          v.maker||v['メーカー']||'', v.model||v['車種']||'',
          v.year||v['年式']||'', v.inspectionDate||v['車検期限']||'',
          v.periodicInspectionDate||v['法定点検期限']||'',
          v.status||v['ステータス']||'稼働中',
          v.notes||v['備考']||'', data[i][10],
          v['アイコン']||'directions_car'
        ]]);
        return { success: true };
      }
    }
    return { success: false, error: '車両が見つかりません' };
  } catch(e) { return { success: false, error: e.message }; }
}

function deleteVehicle(vehicleId) {
  try {
    const sheet = getSheet('車両マスタ');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(vehicleId)) { sheet.deleteRow(i+1); return { success: true }; }
    }
    return { success: false, error: '車両が見つかりません' };
  } catch(e) { return { success: false, error: e.message }; }
}

function getMaintenanceRecords(vehicleId) {
  let r = _sheetToObjects(getSheet('メンテナンス記録'));
  if (vehicleId) r = r.filter(x => x['車両ID'] === vehicleId);
  return r.sort((a,b) => new Date(b['日付']) - new Date(a['日付']));
}

function addMaintenanceRecord(r) {
  try {
    getSheet('メンテナンス記録').appendRow([
      'M'+new Date().getTime(), r.vehicleId||r['車両ID'], r.vehicleName||r['車両名'],
      r.date||r['日付'], r.mileage||r['走行距離(km)']||'',
      r.workContent||r['作業内容'], r.cost||r['費用(円)']||'',
      r.contractor||r['業者']||'', r.nextDate||r['次回予定日']||'', r.notes||r['備考']||''
    ]);
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

function deleteMaintenanceRecord(id) { return _deleteRecord('メンテナンス記録', id); }

function getAccidentRecords(vehicleId) {
  let r = _sheetToObjects(getSheet('事故・修理履歴'));
  if (vehicleId) r = r.filter(x => x['車両ID'] === vehicleId);
  return r.sort((a,b) => new Date(b['日付']) - new Date(a['日付']));
}

function addAccidentRecord(r) {
  try {
    getSheet('事故・修理履歴').appendRow([
      'A'+new Date().getTime(), r.vehicleId||r['車両ID'], r.vehicleName||r['車両名'],
      r.date||r['日付'], r.content||r['事故・修理内容'], r.damageArea||r['損傷箇所']||'',
      r.cost||r['費用(円)']||'', r.contractor||r['業者']||'',
      r.completionDate||r['完了日']||'', r.notes||r['備考']||''
    ]);
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

function deleteAccidentRecord(id) { return _deleteRecord('事故・修理履歴', id); }

function getFuelRecords(vehicleId) {
  let r = _sheetToObjects(getSheet('給油記録'));
  if (vehicleId) r = r.filter(x => x['車両ID'] === vehicleId);
  return r.sort((a,b) => new Date(b['日付']) - new Date(a['日付']));
}

function addFuelRecord(r) {
  try {
    const amount = r.amount||r['給油量(L)']||0;
    const unitPrice = r.unitPrice||r['単価(円/L)']||0;
    const cost = (amount && unitPrice) ? Math.round(parseFloat(amount)*parseFloat(unitPrice)) : r.cost||r['費用(円)']||'';
    getSheet('給油記録').appendRow([
      'F'+new Date().getTime(), r.vehicleId||r['車両ID'], r.vehicleName||r['車両名'],
      r.date||r['日付'], r.mileage||r['走行距離(km)']||'',
      amount, unitPrice, cost, r.station||r['スタンド名']||'', r.notes||r['備考']||''
    ]);
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

function deleteFuelRecord(id) { return _deleteRecord('給油記録', id); }

function _deleteRecord(sheetName, recordId) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(recordId)) { sheet.deleteRow(i+1); return { success: true }; }
    }
    return { success: false, error: '記録が見つかりません' };
  } catch(e) { return { success: false, error: e.message }; }
}

function getDashboardData() {
  const vehicles = getVehicles();
  const today = new Date(); today.setHours(0,0,0,0);
  const alerts = [];
  vehicles.forEach(v => {
    [['車検期限','車検'],['法定点検期限','法定点検']].forEach(([field,label]) => {
      if (!v[field]) return;
      const d = new Date(v[field]);
      const daysLeft = Math.floor((d - today) / 86400000);
      if (daysLeft < 0) {
        alerts.push({ type:'danger', vehicleName:v['車両名'], plateNumber:v['ナンバー'],
          message:\`期限切れ（\${Math.abs(daysLeft)}日経過）\`, daysLeft, category:label });
      } else if (daysLeft <= 30) {
        alerts.push({ type:'warning', vehicleName:v['車両名'], plateNumber:v['ナンバー'],
          message:\`あと\${daysLeft}日\`, daysLeft, category:label });
      }
    });
  });
  const allMaintenance = getMaintenanceRecords(null);
  const allFuel = getFuelRecords(null);
  const thisMonth = Utilities.formatDate(today, 'Asia/Tokyo', 'yyyy/MM');
  const monthlyFuelCost = allFuel
    .filter(r => String(r['日付']).replace(/-/g,'/').startsWith(thisMonth))
    .reduce((s,r) => s + (parseFloat(r['費用(円)']) || 0), 0);
  return {
    vehicleCount: vehicles.length,
    activeCount: vehicles.filter(v => v['ステータス'] === '稼働中').length,
    maintenanceCount: allMaintenance.length,
    alerts: alerts.sort((a,b) => a.daysLeft - b.daysLeft),
    recentMaintenance: allMaintenance.slice(0, 5),
    monthlyFuelCost
  };
}

function getStatistics() {
  const allFuel = getFuelRecords(null);
  const allMaintenance = getMaintenanceRecords(null);
  const allAccidents = getAccidentRecords(null);
  const monthlyFuel = {};
  allFuel.forEach(r => {
    if (!r['日付'] || !r['費用(円)']) return;
    const month = String(r['日付']).replace(/-/g,'/').substring(0,7);
    monthlyFuel[month] = (monthlyFuel[month] || 0) + (parseFloat(r['費用(円)']) || 0);
  });
  const vehicleMaintCost = {};
  allMaintenance.forEach(r => {
    if (!r['車両名'] || !r['費用(円)']) return;
    vehicleMaintCost[r['車両名']] = (vehicleMaintCost[r['車両名']] || 0) + (parseFloat(r['費用(円)']) || 0);
  });
  const vehicleFuelCost = {};
  allFuel.forEach(r => {
    if (!r['車両名'] || !r['費用(円)']) return;
    vehicleFuelCost[r['車両名']] = (vehicleFuelCost[r['車両名']] || 0) + (parseFloat(r['費用(円)']) || 0);
  });
  return {
    monthlyFuel, vehicleMaintCost, vehicleFuelCost,
    totalFuelCost: allFuel.reduce((s,r) => s + (parseFloat(r['費用(円)']) || 0), 0),
    totalMaintCost: allMaintenance.reduce((s,r) => s + (parseFloat(r['費用(円)']) || 0), 0),
    totalAccidentCost: allAccidents.reduce((s,r) => s + (parseFloat(r['費用(円)']) || 0), 0)
  };
}`;

type Step = 1 | 2 | 3;
type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface Props {
  onComplete: () => void;
  firebaseUser?: User | null;
}

export function Setup({ onComplete, firebaseUser }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [gasUrl, setGasUrlState] = useState('');
  const [allowedDomain, setAllowedDomainState] = useState('');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showManual, setShowManual] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(GAS_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleTest() {
    const url = gasUrl.trim();
    if (!url) { setTestMessage('URLを入力してください'); return; }
    if (!url.startsWith('https://script.google.com/')) {
      setTestMessage('正しいGAS URLを入力してください（https://script.google.com/... で始まるURL）');
      return;
    }

    setTestStatus('testing');
    setTestMessage('');

    const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      const cbName = `_setup_test_${Date.now()}`;
      const timeout = setTimeout(() => {
        delete (window as unknown as Record<string, unknown>)[cbName];
        const el = document.getElementById(cbName);
        if (el) el.remove();
        resolve({ success: false, error: 'タイムアウト（30秒）。URLとアクセス設定を確認してください' });
      }, 30000);

      (window as unknown as Record<string, unknown>)[cbName] = (data: unknown) => {
        clearTimeout(timeout);
        delete (window as unknown as Record<string, unknown>)[cbName];
        const el = document.getElementById(cbName);
        if (el) el.remove();
        resolve(data as { success: boolean; error?: string });
      };

      const script = document.createElement('script');
      script.id = cbName;
      const params = new URLSearchParams({ action: 'init', callback: cbName });
      script.src = `${url}?${params}`;
      script.onerror = () => {
        clearTimeout(timeout);
        delete (window as unknown as Record<string, unknown>)[cbName];
        const el = document.getElementById(cbName);
        if (el) el.remove();
        resolve({ success: false, error: 'スクリプト読み込みエラー。URLを確認してください' });
      };
      document.head.appendChild(script);
    });

    if (result.success) {
      setTestStatus('success');
      setTestMessage('接続成功！スプレッドシートを初期化しました');
      // localStorageに保存（gasApi.ts が参照するため・バイパスモード兼用）
      setGasUrl(gasUrl.trim());
      setAllowedDomain(allowedDomain.trim());
      // Firestoreに保存（通常モード・複数端末対応）
      if (!isSkipAuth() && firebaseUser) {
        await saveGasUrlToFirestore(firebaseUser.uid, gasUrl.trim(), allowedDomain.trim());
      }
      setTimeout(() => onComplete(), 1500);
    } else {
      setTestStatus('error');
      setTestMessage(result.error || '接続に失敗しました');
    }
  }

  const STEPS = [
    { n: 1 as Step, label: 'スクリプト設置' },
    { n: 2 as Step, label: 'デプロイ' },
    { n: 3 as Step, label: 'URL設定' },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center justify-between w-full max-w-lg mb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
          </div>
          <div>
            <p className="text-xl font-headline font-black text-primary leading-tight">FleetMetric Pro</p>
            <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant">初回セットアップ</p>
          </div>
        </div>
        <button
          onClick={() => setShowManual(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>menu_book</span>
          <span className="text-xs font-label font-semibold">マニュアル</span>
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-label transition-all ${
                step === n ? 'bg-primary text-on-primary shadow-sm scale-110' :
                step > n ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                'bg-surface-container text-on-surface-variant'
              }`}>
                {step > n
                  ? <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                  : n}
              </div>
              <span className={`text-xs font-label font-medium hidden sm:block ${step === n ? 'text-primary' : 'text-on-surface-variant'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px mx-1 ${step > n ? 'bg-tertiary-fixed' : 'bg-outline-variant'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">スクリプトを設置する</h2>
              <p className="text-sm font-label text-on-surface-variant mt-1">
                Googleスプレッドシートに管理スクリプトを貼り付けます。
              </p>
            </div>

            <div className="space-y-2">
              {[
                { n: '01', text: '新しいGoogleスプレッドシートを作成する', action: (
                  <a href="https://sheets.new" target="_blank" rel="noopener noreferrer"
                    className="text-xs font-label text-primary underline-offset-2 underline flex-shrink-0">
                    sheets.new を開く
                  </a>
                )},
                { n: '02', text: 'メニューから「拡張機能」→「Apps Script」を開く' },
                { n: '03', text: 'エディタの内容を全て削除し、下のコードを貼り付けて保存（Ctrl+S）' },
              ].map(({ n, text, action }) => (
                <div key={n} className="flex items-start gap-3 p-3 bg-surface-container-low rounded-xl">
                  <span className="text-xs font-label font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded flex-shrink-0">{n}</span>
                  <p className="text-sm font-label text-on-surface flex-1">{text}</p>
                  {action}
                </div>
              ))}
            </div>

            {/* Code block */}
            <div className="rounded-xl overflow-hidden border border-outline-variant/30">
              <div className="flex items-center justify-between px-3 py-2 bg-surface-container">
                <span className="text-xs font-label text-on-surface-variant font-medium">Code.gs</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-label font-semibold px-3 py-1.5 rounded-lg transition-all bg-primary text-on-primary hover:bg-primary/90 active:scale-95"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'コピーしました！' : 'コードをコピー'}
                </button>
              </div>
              <div className="bg-[#1e1e2e] px-4 py-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-[#cdd6f4] font-mono whitespace-pre-wrap leading-relaxed">{GAS_CODE.slice(0, 300)}...</pre>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-on-primary rounded-full font-semibold font-label text-sm hover:bg-primary/90 transition-colors active:scale-95"
            >
              貼り付けて保存できました
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
            </button>

            <div className="text-center">
              <button
                onClick={onComplete}
                className="text-xs font-label text-on-surface-variant hover:text-primary transition-colors underline-offset-2 hover:underline"
              >
                スキップしてデモデータで試す
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">ウェブアプリとしてデプロイする</h2>
              <p className="text-sm font-label text-on-surface-variant mt-1">
                Apps Scriptエディタで以下の操作をしてください。
              </p>
            </div>

            {/* デプロイ手順 */}
            <div className="space-y-2">
              {[
                { n: '01', text: '右上の「デプロイ」ボタン →「新しいデプロイ」をクリック' },
                { n: '02', text: '左側の⚙アイコンをクリック →「ウェブアプリ」を選択' },
                { n: '03', text: '「次のユーザーとして実行」→「自分」のまま変更しない' },
                { n: '04', text: '「アクセスできるユーザー」→「全員（匿名ユーザーを含む）」を選択' },
                { n: '05', text: '「デプロイ」ボタンをクリック' },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-start gap-3 p-3 bg-surface-container-low rounded-xl">
                  <span className="text-xs font-label font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded flex-shrink-0">{n}</span>
                  <p className="text-sm font-label text-on-surface">{text}</p>
                </div>
              ))}
            </div>

            {/* 承認手順 */}
            <div className="rounded-xl border border-outline-variant/40 overflow-hidden">
              <div className="px-3 py-2 bg-surface-container flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 16 }}>verified_user</span>
                <span className="text-xs font-label font-semibold text-on-surface">アクセスの承認手順</span>
              </div>
              <div className="p-3 space-y-2">
                {[
                  '「アクセスを承認」をクリック',
                  'Googleアカウント選択画面で自分のアカウントを選ぶ',
                  '「このアプリはGoogleで確認されていません」と表示されたら「詳細」をクリック',
                  '「（安全ではないページ）に移動」をクリック',
                  '「許可」をクリック',
                  '表示された「ウェブアプリURL」をコピーする',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs font-label font-bold text-secondary bg-secondary-container px-1.5 py-0.5 rounded flex-shrink-0">{i + 1}</span>
                    <p className="text-xs font-label text-on-surface">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary-fixed/30 rounded-xl p-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 16 }}>info</span>
              <p className="text-xs font-label text-on-surface">「確認されていません」の警告はスクリプトが自分で作成したものであるため問題ありません。安心して許可してください。</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold font-label text-sm hover:bg-surface-dim transition-colors"
              >
                ← 戻る
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-full font-semibold font-label text-sm hover:bg-primary/90 transition-colors"
              >
                URLをコピーしました
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">URLを貼り付けて接続する</h2>
              <p className="text-sm font-label text-on-surface-variant mt-1">
                コピーしたウェブアプリURLを貼り付けてください。
              </p>
            </div>

            <div>
              <label className="text-xs font-label uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                GAS ウェブアプリ URL
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>link</span>
                <input
                  type="url"
                  value={gasUrl}
                  onChange={e => { setGasUrlState(e.target.value); setTestStatus('idle'); setTestMessage(''); }}
                  placeholder="https://script.google.com/macros/s/..."
                  className="w-full pl-9 pr-4 py-3 bg-surface-container-low rounded-xl text-sm font-label focus:outline-none focus:ring-2 focus:ring-surface-tint/30 placeholder:text-on-surface-variant"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-label uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                アクセス許可する Google ドメイン（任意）
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>domain</span>
                <input
                  type="text"
                  value={allowedDomain}
                  onChange={e => setAllowedDomainState(e.target.value)}
                  placeholder="例: company.co.jp"
                  className="w-full pl-9 pr-4 py-3 bg-surface-container-low rounded-xl text-sm font-label focus:outline-none focus:ring-2 focus:ring-surface-tint/30 placeholder:text-on-surface-variant"
                />
              </div>
              <p className="text-xs font-label text-on-surface-variant mt-1.5">
                空欄の場合、すべての Google アカウントでログイン可能になります
              </p>
            </div>

            {testMessage && (
              <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm font-label ${
                testStatus === 'success' ? 'bg-tertiary-fixed/30 text-on-tertiary-fixed' :
                testStatus === 'error' ? 'bg-error-container text-on-error-container' :
                'bg-secondary-container text-on-secondary-fixed'
              }`}>
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16 }}>
                  {testStatus === 'success' ? 'check_circle' : testStatus === 'error' ? 'error' : 'info'}
                </span>
                {testMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold font-label text-sm hover:bg-surface-dim transition-colors"
              >
                ← 戻る
              </button>
              <button
                onClick={handleTest}
                disabled={testStatus === 'testing' || testStatus === 'success'}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-full font-semibold font-label text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {testStatus === 'testing' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    接続中...
                  </>
                ) : testStatus === 'success' ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                    接続成功！
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>wifi</span>
                    接続テスト
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={onComplete}
                className="text-xs font-label text-on-surface-variant hover:text-primary transition-colors underline-offset-2 hover:underline"
              >
                スキップしてデモデータで試す
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs font-label text-on-surface-variant mt-6 text-center max-w-sm leading-relaxed">
        GAS URLはFirebaseに安全に保存されます。<br />
        一度設定すれば、他の端末でも自動的に引き継がれます。
      </p>

      {showManual && <ManualModal onClose={() => setShowManual(false)} />}
    </div>
  );
}
