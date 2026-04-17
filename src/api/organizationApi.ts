import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, fn } from '../firebase';

export interface UserOrgProfile {
  organizationId: string;
  role: 'admin' | 'member';
  joinedAt?: string;
  email?: string;
  displayName?: string;
}

export interface Organization {
  organizationId: string;
  name: string;
  createdByUid: string;
  createdAt?: string;
}

export interface InviteCodeResult {
  code: string;
  organizationId: string;
  expiresAt: string;
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('ログインが必要です');
  return uid;
}

export async function getMyOrganizationProfile(): Promise<UserOrgProfile | null> {
  const uid = requireUid();
  const snap = await getDoc(doc(db, 'users', uid, 'profile', 'main'));
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserOrgProfile>;
  if (!data.organizationId) return null;
  return {
    organizationId: data.organizationId,
    role: data.role === 'admin' ? 'admin' : 'member',
    joinedAt: data.joinedAt,
    email: data.email,
    displayName: data.displayName,
  };
}

export async function getOrganizationById(organizationId: string): Promise<Organization | null> {
  const snap = await getDoc(doc(db, 'organizations', organizationId));
  if (!snap.exists()) return null;
  return snap.data() as Organization;
}

export async function createOrganization(name: string): Promise<{ organizationId: string }> {
  const callable = httpsCallable(fn, 'createOrganization');
  const res = await callable({ name });
  return res.data as { organizationId: string };
}

export async function joinOrganizationByInviteCode(code: string): Promise<{ organizationId: string }> {
  const callable = httpsCallable(fn, 'joinOrganizationByInviteCode');
  const res = await callable({ code });
  return res.data as { organizationId: string };
}

export async function issueInviteCode(expiresInDays = 7): Promise<InviteCodeResult> {
  const callable = httpsCallable(fn, 'issueInviteCode');
  const res = await callable({ expiresInDays });
  return res.data as InviteCodeResult;
}
