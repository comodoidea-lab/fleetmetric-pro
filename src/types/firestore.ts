import type {
  AlcoholCheckRecord,
  AccidentRecord,
  AttendanceRecord,
  Driver,
  FuelRecord,
  MaintenanceRecord,
  OperationRecord,
  Vehicle,
} from './index';

export const COLLECTIONS = {
  vehicles: 'vehicles',
  maintenanceRecords: 'maintenanceRecords',
  fuelRecords: 'fuelRecords',
  accidentRecords: 'accidentRecords',
  drivers: 'drivers',
  operationRecords: 'operationRecords',
  organizations: 'organizations',
  attendance: 'attendance',
  alcoholChecks: 'alcoholChecks',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export interface AppUserSettings {
  allowedDomain?: string;
  preferredTheme?: string;
  multiDriverMode?: boolean;
  updatedAt?: number;
}

export type FirestoreEntity =
  | Vehicle
  | MaintenanceRecord
  | FuelRecord
  | AccidentRecord
  | Driver
  | OperationRecord
  | AttendanceRecord
  | AlcoholCheckRecord;

export function orgCollectionPath(organizationId: string, collectionName: 'attendance' | 'alcoholChecks'): string {
  return `${COLLECTIONS.organizations}/${organizationId}/${collectionName}`;
}

export function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function toDateString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return '';
}
