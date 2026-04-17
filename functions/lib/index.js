"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatisticsData = exports.getDashboardData = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}
function toDate(value) {
    if (typeof value !== 'string' || !value)
        return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}
exports.getDashboardData = (0, https_1.onCall)({ region: 'asia-northeast1' }, async () => {
    const [vehiclesSnap, maintenanceSnap, fuelSnap] = await Promise.all([
        db.collection('vehicles').get(),
        db.collection('maintenanceRecords').get(),
        db.collection('fuelRecords').get(),
    ]);
    const vehicles = vehiclesSnap.docs.map((d) => d.data());
    const maintenance = maintenanceSnap.docs.map((d) => d.data());
    const fuel = fuelSnap.docs.map((d) => d.data());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alerts = [];
    for (const vehicle of vehicles) {
        for (const [key, label] of [['車検期限', '車検'], ['法定点検期限', '法定点検']]) {
            const date = toDate(vehicle[key]);
            if (!date)
                continue;
            const daysLeft = Math.floor((date.getTime() - today.getTime()) / 86400000);
            if (daysLeft < 0 || daysLeft <= 30) {
                alerts.push({
                    type: daysLeft < 0 ? 'danger' : 'warning',
                    vehicleName: String(vehicle['車両名'] ?? ''),
                    plateNumber: String(vehicle['ナンバー'] ?? ''),
                    message: daysLeft < 0 ? `期限切れ（${Math.abs(daysLeft)}日経過）` : `あと${daysLeft}日`,
                    daysLeft,
                    category: label,
                });
            }
        }
    }
    const thisMonth = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit' }).slice(0, 7);
    const monthlyFuelCost = fuel
        .filter((x) => String(x['日付'] ?? '').replace(/-/g, '/').startsWith(thisMonth))
        .reduce((sum, x) => sum + toNumber(x['費用(円)']), 0);
    return {
        vehicleCount: vehicles.length,
        activeCount: vehicles.filter((v) => v['ステータス'] === '稼働中').length,
        maintenanceCount: maintenance.length,
        alerts: alerts.sort((a, b) => a.daysLeft - b.daysLeft),
        recentMaintenance: maintenance
            .sort((a, b) => String(b['日付'] ?? '').localeCompare(String(a['日付'] ?? '')))
            .slice(0, 5),
        monthlyFuelCost,
    };
});
exports.getStatisticsData = (0, https_1.onCall)({ region: 'asia-northeast1' }, async () => {
    const [maintenanceSnap, fuelSnap, accidentsSnap] = await Promise.all([
        db.collection('maintenanceRecords').get(),
        db.collection('fuelRecords').get(),
        db.collection('accidentRecords').get(),
    ]);
    const maintenance = maintenanceSnap.docs.map((d) => d.data());
    const fuel = fuelSnap.docs.map((d) => d.data());
    const accidents = accidentsSnap.docs.map((d) => d.data());
    const monthlyFuel = {};
    const vehicleMaintCost = {};
    const vehicleFuelCost = {};
    for (const row of fuel) {
        const month = String(row['日付'] ?? '').replace(/-/g, '/').slice(0, 7);
        if (month)
            monthlyFuel[month] = (monthlyFuel[month] || 0) + toNumber(row['費用(円)']);
        const vehicleName = String(row['車両名'] ?? '');
        if (vehicleName)
            vehicleFuelCost[vehicleName] = (vehicleFuelCost[vehicleName] || 0) + toNumber(row['費用(円)']);
    }
    for (const row of maintenance) {
        const vehicleName = String(row['車両名'] ?? '');
        if (vehicleName)
            vehicleMaintCost[vehicleName] = (vehicleMaintCost[vehicleName] || 0) + toNumber(row['費用(円)']);
    }
    return {
        monthlyFuel,
        vehicleMaintCost,
        vehicleFuelCost,
        totalFuelCost: fuel.reduce((sum, x) => sum + toNumber(x['費用(円)']), 0),
        totalMaintCost: maintenance.reduce((sum, x) => sum + toNumber(x['費用(円)']), 0),
        totalAccidentCost: accidents.reduce((sum, x) => sum + toNumber(x['費用(円)']), 0),
    };
});
