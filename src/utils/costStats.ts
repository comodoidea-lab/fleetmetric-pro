import type { AccidentRecord, FuelRecord, MaintenanceRecord, Statistics } from '../types';
import { toNumber } from '../types/firestore';
import { getMonthKeyFromDateString } from './date';

function addMonthlyCost(
  buckets: Record<string, number>,
  dateStr: string,
  amount: number,
) {
  const monthKey = getMonthKeyFromDateString(dateStr);
  if (!monthKey) return;
  buckets[monthKey] = (buckets[monthKey] || 0) + amount;
}

export function buildCostStatistics(
  fuel: FuelRecord[],
  maintenance: MaintenanceRecord[],
  accidents: AccidentRecord[],
): Statistics {
  const monthlyFuel: Record<string, number> = {};
  const monthlyMaint: Record<string, number> = {};
  const monthlyAccident: Record<string, number> = {};
  const vehicleMaintCost: Record<string, number> = {};
  const vehicleFuelCost: Record<string, number> = {};

  for (const record of fuel) {
    addMonthlyCost(monthlyFuel, String(record['日付']), toNumber(record['費用(円)']));
    const vehicleName = record['車両名'];
    if (vehicleName) {
      vehicleFuelCost[vehicleName] = (vehicleFuelCost[vehicleName] || 0) + toNumber(record['費用(円)']);
    }
  }

  for (const record of maintenance) {
    addMonthlyCost(monthlyMaint, String(record['日付']), toNumber(record['費用(円)']));
    const vehicleName = record['車両名'];
    if (vehicleName) {
      vehicleMaintCost[vehicleName] = (vehicleMaintCost[vehicleName] || 0) + toNumber(record['費用(円)']);
    }
  }

  for (const record of accidents) {
    addMonthlyCost(monthlyAccident, String(record['日付']), toNumber(record['費用(円)']));
  }

  const monthKeys = new Set([
    ...Object.keys(monthlyFuel),
    ...Object.keys(monthlyMaint),
    ...Object.keys(monthlyAccident),
  ]);
  const monthlyOperatingCost: Record<string, number> = {};
  for (const monthKey of monthKeys) {
    monthlyOperatingCost[monthKey] =
      (monthlyFuel[monthKey] || 0) +
      (monthlyMaint[monthKey] || 0) +
      (monthlyAccident[monthKey] || 0);
  }

  return {
    monthlyFuel,
    monthlyMaint,
    monthlyAccident,
    monthlyOperatingCost,
    vehicleMaintCost,
    vehicleFuelCost,
    totalFuelCost: fuel.reduce((sum, record) => sum + toNumber(record['費用(円)']), 0),
    totalMaintCost: maintenance.reduce((sum, record) => sum + toNumber(record['費用(円)']), 0),
    totalAccidentCost: accidents.reduce((sum, record) => sum + toNumber(record['費用(円)']), 0),
  };
}

export function getMonthlyOperatingCost(
  fuel: FuelRecord[],
  maintenance: MaintenanceRecord[],
  accidents: AccidentRecord[],
  monthKey: string,
): number {
  const costRecords = [
    ...fuel.map(record => ({ date: String(record['日付']), amount: toNumber(record['費用(円)']) })),
    ...maintenance.map(record => ({ date: String(record['日付']), amount: toNumber(record['費用(円)']) })),
    ...accidents.map(record => ({ date: String(record['日付']), amount: toNumber(record['費用(円)']) })),
  ];

  return costRecords.reduce((sum, record) => {
    if (getMonthKeyFromDateString(record.date) !== monthKey) return sum;
    return sum + record.amount;
  }, 0);
}
