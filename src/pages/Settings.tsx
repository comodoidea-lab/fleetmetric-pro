import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { apiRunLegacySpreadsheetRestore, type LegacyRestoreResult } from '../api/gasApi';
import { useStore } from '../store/store';
import { isSkipAuth } from '../config';
import { useTheme, THEMES } from '../hooks/useTheme';
import { useMultiDriverMode } from '../hooks/useMultiDriverMode';
import { DialogModal } from '../components/DialogModal';
import { ManualModal } from '../components/ManualModal';
import {
  getMyOrganizationProfile,
  getOrganizationById,
  issueInviteCode,
  type Organization,
  type UserOrgProfile,
} from '../api/organizationApi';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env ?? {};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-outline-variant/20">
        <p className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant">{title}</p>
      </div>
      <div className="divide-y divide-outline-variant/10">{children}</div>
    </section>
  );
}

function Row({
  icon, label, desc, onClick, danger, chevron = true, rightEl,
}: {
  icon: string;
  label: string;
  desc?: string;
  onClick?: () => void;
  danger?: boolean;
  chevron?: boolean;
  rightEl?: React.ReactNode;
}) {
  const base = 'flex items-center gap-3 px-4 py-3.5 w-full text-left transition-colors';
  const colorCls = danger
    ? 'text-error hover:bg-error-container/20'
    : 'text-on-surface hover:bg-surface-container';

  return (
    <button onClick={onClick} className={`${base} ${colorCls}`} disabled={!onClick && !rightEl}>
      <span
        className={`material-symbols-outlined flex-shrink-0 ${danger ? 'text-error' : 'text-primary'}`}
        style={{ fontSize: 20 }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-label">{label}</p>
        {desc && <p className="text-xs font-label text-on-surface-variant mt-0.5 break-all">{desc}</p>}
      </div>
      {rightEl}
      {chevron && onClick && !rightEl && (
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>
          chevron_right
        </span>
      )}
    </button>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const {
    loadAll,
    vehicles,
    maintenance,
    fuel,
    accidents,
    drivers,
    operationRecords,
    attendanceRecords,
    alcoholChecks,
  } = useStore();
  const { theme, setTheme } = useTheme();
  const { multiDriverMode, setMultiDriverMode } = useMultiDriverMode();
  const firebaseUser = auth.currentUser;
  const skipAuth = isSkipAuth();
  const showRestoreSection = skipAuth || String(env.VITE_ENABLE_RESTORE || 'false') === 'true';

  const [showManual, setShowManual] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [legacySpreadsheetId, setLegacySpreadsheetId] = useState('');
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreResult, setRestoreResult] = useState<LegacyRestoreResult | null>(null);
  const [restoreError, setRestoreError] = useState('');
  const [confirmedSpreadsheetId, setConfirmedSpreadsheetId] = useState('');
  const [csvMessage, setCsvMessage] = useState('');
  const [orgProfile, setOrgProfile] = useState<UserOrgProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ code: string; expiresAt: string } | null>(null);

  async function doLogout() {
    if (!skipAuth) await signOut(auth);
    window.location.reload();
  }

  useEffect(() => {
    let mounted = true;
    async function loadOrganization() {
      if (!firebaseUser) return;
      setOrgLoading(true);
      setOrgError('');
      try {
        const profile = await getMyOrganizationProfile();
        if (!mounted) return;
        setOrgProfile(profile);
        if (profile?.organizationId) {
          const org = await getOrganizationById(profile.organizationId);
          if (!mounted) return;
          setOrganization(org);
        } else {
          setOrganization(null);
        }
      } catch {
        if (!mounted) return;
        setOrgError('組織情報の取得に失敗しました。');
      } finally {
        if (mounted) setOrgLoading(false);
      }
    }
    void loadOrganization();
    return () => {
      mounted = false;
    };
  }, [firebaseUser?.uid]);

  async function handleIssueInviteCode() {
    setInviteBusy(true);
    setOrgError('');
    try {
      const result = await issueInviteCode(7);
      setInviteInfo({ code: result.code, expiresAt: result.expiresAt });
    } catch (error) {
      const message = error instanceof Error ? error.message : '招待コードの発行に失敗しました。';
      setOrgError(message);
    } finally {
      setInviteBusy(false);
    }
  }

  async function runRestore(dryRun: boolean) {
    const id = legacySpreadsheetId.trim();
    if (!id) {
      setRestoreError('スプレッドシートIDを入力してください。');
      return;
    }

    if (!dryRun && confirmedSpreadsheetId !== id) {
      setRestoreError('先に「復旧内容を確認」を実行してください。');
      return;
    }

    setRestoreBusy(true);
    setRestoreError('');
    if (dryRun) {
      setRestoreResult(null);
    }
    try {
      const result = await apiRunLegacySpreadsheetRestore(id, dryRun);
      setRestoreResult(result);
      if (dryRun) {
        setConfirmedSpreadsheetId(id);
      }
      if (!dryRun) {
        await loadAll();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '復旧の実行に失敗しました。';
      setRestoreError(message);
    } finally {
      setRestoreBusy(false);
    }
  }

  function escapeCsvCell(value: unknown): string {
    if (value === null || value === undefined) return '';
    const raw = String(value);
    if (raw.includes('"') || raw.includes(',') || raw.includes('\n')) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  }

  function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
    const headers = Array.from(
      rows.reduce((keys, row) => {
        Object.keys(row).forEach((key) => keys.add(key));
        return keys;
      }, new Set<string>()),
    );

    const lines: string[] = [];
    lines.push(headers.map(escapeCsvCell).join(','));
    rows.forEach((row) => {
      lines.push(headers.map((h) => escapeCsvCell(row[h])).join(','));
    });

    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function toCsvRows<T>(rows: T[]): Array<Record<string, unknown>> {
    return rows.map((row) => row as unknown as Record<string, unknown>);
  }

  function exportCsv(label: string, rows: Array<Record<string, unknown>>, filename: string) {
    if (rows.length === 0) {
      setCsvMessage(`${label} はデータがないため出力をスキップしました。`);
      return;
    }
    downloadCsv(filename, rows);
  }

  function exportAllCsv() {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    setCsvMessage('CSV出力を開始しました。複数ファイルが順番にダウンロードされます。');
    exportCsv('車両', toCsvRows(vehicles), `fleetmetric_vehicles_${stamp}.csv`);
    setTimeout(() => exportCsv('メンテナンス', toCsvRows(maintenance), `fleetmetric_maintenance_${stamp}.csv`), 80);
    setTimeout(() => exportCsv('給油', toCsvRows(fuel), `fleetmetric_fuel_${stamp}.csv`), 160);
    setTimeout(() => exportCsv('事故・修理', toCsvRows(accidents), `fleetmetric_accidents_${stamp}.csv`), 240);
    setTimeout(() => exportCsv('ドライバー', toCsvRows(drivers), `fleetmetric_drivers_${stamp}.csv`), 320);
    setTimeout(() => exportCsv('運行記録', toCsvRows(operationRecords), `fleetmetric_operations_${stamp}.csv`), 400);
    setTimeout(() => exportCsv('出退勤', toCsvRows(attendanceRecords), `fleetmetric_attendance_${stamp}.csv`), 480);
    setTimeout(() => exportCsv('アルコールチェック', toCsvRows(alcoholChecks), `fleetmetric_alcohol_checks_${stamp}.csv`), 560);
  }

  return (
    <div className="max-w-lg space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 -ml-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-headline font-bold text-on-surface">設定</h1>
      </div>

      {/* User */}
      {(firebaseUser || skipAuth) && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          {firebaseUser?.photoURL ? (
            <img
              src={firebaseUser.photoURL}
              alt={firebaseUser.displayName ?? ''}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full border border-outline-variant/20 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-on-primary" style={{ fontSize: 22 }}>person</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-headline font-bold text-on-surface truncate">
              {firebaseUser?.displayName ?? '開発モード'}
            </p>
            <p className="text-sm font-label text-on-surface-variant truncate">
              {firebaseUser?.email ?? 'VITE_SKIP_AUTH=true'}
            </p>
          </div>
        </section>
      )}

      {/* Color theme */}
      <Section title="カラーテーマ">
        <div className="px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all ${
                  theme === t.id
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'hover:bg-surface-container'
                }`}
              >
                <span className="w-6 h-6 rounded-full border border-outline-variant/30" style={{ background: t.color }} />
                <span className="text-[11px] font-label text-on-surface-variant leading-tight text-center">{t.labelJa}</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="表示">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="material-symbols-outlined flex-shrink-0 text-primary" style={{ fontSize: 20 }}>
            group
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold font-label">複数ドライバーモード</p>
            <p className="text-xs font-label text-on-surface-variant mt-0.5">
              ONにするとドライバー管理・運行記録のメニューを表示します
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={multiDriverMode}
            onClick={() => setMultiDriverMode(!multiDriverMode)}
            className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
              multiDriverMode ? 'bg-primary' : 'bg-outline-variant/70'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                multiDriverMode ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </Section>

      <Section title="データ">
        <Row
          icon="sync"
          label="データを再同期"
          desc="Firestoreから最新データを取得"
          onClick={() => loadAll()}
        />
      </Section>

      {!skipAuth && (
        <Section title="組織">
          <div className="px-4 py-4 space-y-3">
            {orgLoading ? (
              <p className="text-xs font-label text-on-surface-variant">組織情報を読み込み中...</p>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-xs font-label text-on-surface-variant">組織名</p>
                  <p className="text-sm font-semibold text-on-surface">{organization?.name ?? '未設定'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-label text-on-surface-variant">組織ID</p>
                  <p className="text-xs font-mono text-on-surface break-all">
                    {orgProfile?.organizationId ?? '未参加'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-label text-on-surface-variant">あなたの権限</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {orgProfile?.role === 'admin' ? '管理者' : orgProfile?.role === 'member' ? 'メンバー' : '未設定'}
                  </p>
                </div>

                {orgProfile?.role === 'admin' && (
                  <div className="pt-2 border-t border-outline-variant/20 space-y-2">
                    <button
                      type="button"
                      onClick={() => void handleIssueInviteCode()}
                      disabled={inviteBusy}
                      className="w-full py-2.5 rounded-full text-xs font-label font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {inviteBusy ? '発行中...' : '6桁の招待コードを発行（7日有効）'}
                    </button>
                    {inviteInfo && (
                      <div className="bg-surface-container rounded-xl px-3 py-2 space-y-1">
                        <p className="text-xs font-label text-on-surface-variant">最新の招待コード</p>
                        <p className="text-lg font-bold tracking-[0.2em] text-on-surface">{inviteInfo.code}</p>
                        <p className="text-xs font-label text-on-surface-variant">
                          有効期限: {new Date(inviteInfo.expiresAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {orgError && (
              <p className="text-xs font-label text-error bg-error-container/30 rounded-lg px-3 py-2">
                {orgError}
              </p>
            )}
          </div>
        </Section>
      )}

      <Section title="CSVエクスポート">
        <div className="px-4 py-4 space-y-3">
          <p className="text-xs font-label text-on-surface-variant leading-relaxed">
            現在のデータをCSVで一括ダウンロードします。Excelやスプレッドシートに取り込めます。
          </p>
          <button
            type="button"
            onClick={exportAllCsv}
            className="w-full py-2.5 rounded-full text-xs font-label font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
          >
            すべてCSV出力
          </button>
          {csvMessage && (
            <p className="text-xs font-label text-on-surface-variant bg-surface-container rounded-lg px-3 py-2">
              {csvMessage}
            </p>
          )}
        </div>
      </Section>

      {showRestoreSection && (
        <Section title="データ復旧（旧スプレッドシート）">
          <div className="px-4 py-4 space-y-3">
            <p className="text-xs font-label text-on-surface-variant leading-relaxed">
              旧スプレッドシートから Firestore へ復旧します。URLの
              {' '}
              <span className="font-semibold text-on-surface">/d/ と /edit の間</span>
              {' '}
              のIDを入力してください。
            </p>
            <p className="text-xs font-label text-on-surface-variant leading-relaxed">
              まず「復旧内容を確認」を押してください。確認だけではデータは変更されません。
            </p>
            <div>
              <label className="text-xs font-label uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                復旧元スプレッドシートID
              </label>
              <input
                type="text"
                value={legacySpreadsheetId}
                onChange={(e) => {
                  setLegacySpreadsheetId(e.target.value);
                  setConfirmedSpreadsheetId('');
                }}
                placeholder="1AbCdEf...（URLの /d/ と /edit の間）"
                className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl text-sm font-label focus:outline-none focus:ring-2 focus:ring-surface-tint/30 placeholder:text-on-surface-variant"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void runRestore(true)}
                disabled={restoreBusy}
                className="flex-1 py-2.5 rounded-full text-xs font-label font-semibold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors disabled:opacity-60"
              >
                復旧内容を確認
              </button>
              <button
                type="button"
                onClick={() => void runRestore(false)}
                disabled={restoreBusy || confirmedSpreadsheetId !== legacySpreadsheetId.trim()}
                className="flex-1 py-2.5 rounded-full text-xs font-label font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {restoreBusy ? '実行中...' : 'この内容で復旧する'}
              </button>
            </div>
            {restoreError && (
              <p className="text-xs font-label text-error bg-error-container/30 rounded-lg px-3 py-2">
                {restoreError}
              </p>
            )}
            {restoreResult && (
              <div className="text-xs font-label text-on-surface-variant bg-surface-container rounded-xl px-3 py-2 space-y-1">
                <p className="font-semibold text-on-surface">{restoreResult.message}</p>
                {restoreResult.summary.map((item) => (
                  <p key={item.collection}>
                    {item.sheetName}: {item.rows} 件（重複スキップ {item.duplicates} 件）
                  </p>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Help */}
      <Section title="ヘルプ">
        <Row
          icon="menu_book"
          label="マニュアルを開く"
          onClick={() => setShowManual(true)}
        />
      </Section>

      {/* Danger zone */}
      <Section title="アカウント">
        <Row
          icon="logout"
          label="ログアウト"
          danger
          onClick={() => setShowLogoutConfirm(true)}
        />
      </Section>

      {/* Modals */}
      {showManual && <ManualModal onClose={() => setShowManual(false)} />}
      {showLogoutConfirm && (
        <DialogModal
          variant="danger"
          title="ログアウト"
          message="ログアウトしますか？"
          confirmLabel="ログアウト"
          onConfirm={doLogout}
          onClose={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}
