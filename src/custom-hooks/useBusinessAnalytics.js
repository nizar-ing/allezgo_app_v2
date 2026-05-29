import { useMemo } from 'react';

const BENEFIT_RATE = 0.08;

const FR_MONTHS_SHORT = [
    'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function resolveEventDate(b) {
    if (b.createdAt) {
        const d = new Date(b.createdAt);
        if (!isNaN(d.getTime())) return d;
    }
    if (b.checkIn) {
        const d = new Date(b.checkIn);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
}

function parseJSON(val) {
    if (!val || typeof val === 'object') return val ?? null;
    try { return JSON.parse(val); } catch { return null; }
}

function monthKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(d) {
    return `${FR_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function useBusinessAnalytics(bookings, selectedYear) {
    const all = bookings ?? [];

    const availableYears = useMemo(() => {
        const years = new Set([new Date().getFullYear()]);
        all.forEach(b => {
            const d = resolveEventDate(b);
            if (d) years.add(d.getFullYear());
        });
        return [...years].sort((a, b) => b - a);
    }, [all]);

    const filtered = useMemo(() => {
        if (selectedYear === 'all') return all;
        return all.filter(b => resolveEventDate(b)?.getFullYear() === selectedYear);
    }, [all, selectedYear]);

    const kpis = useMemo(() => {
        const phones = new Set();
        let revenue = 0, confirmed = 0, pending = 0, rejected = 0, cancelled = 0;

        filtered.forEach(b => {
            const s = b.status?.toUpperCase();
            if (s === 'CONFIRMED') { revenue += Number(b.clientPrice) || 0; confirmed++; }
            else if (s === 'PENDING') pending++;
            else if (s === 'REJECTED') rejected++;
            else if (s === 'CANCELLED') cancelled++;
            if (b.clientPhone) phones.add(b.clientPhone);
        });

        const total = filtered.length;
        return {
            totalRevenue: revenue,
            totalBenefit: revenue * BENEFIT_RATE,
            confirmedCount: confirmed,
            pendingCount: pending,
            rejectedCount: rejected,
            cancelledCount: cancelled,
            totalBookings: total,
            uniqueClients: phones.size,
            conversionRate: total > 0 ? (confirmed / total) * 100 : 0,
            avgBookingValue: confirmed > 0 ? revenue / confirmed : 0,
        };
    }, [filtered]);

    const revenueByMonth = useMemo(() => {
        const map = new Map();
        filtered.forEach(b => {
            const d = resolveEventDate(b);
            if (!d) return;
            const key = monthKey(d);
            if (!map.has(key)) map.set(key, { key, month: monthLabel(d), revenue: 0, benefit: 0, count: 0 });
            const e = map.get(key);
            e.count++;
            if (b.status?.toUpperCase() === 'CONFIRMED') {
                const p = Number(b.clientPrice) || 0;
                e.revenue += p;
                e.benefit += p * BENEFIT_RATE;
            }
        });
        return [...map.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => ({
                month: v.month,
                revenue: Math.round(v.revenue),
                benefit: Math.round(v.benefit),
                count: v.count,
            }));
    }, [filtered]);

    const bookingsByMonth = useMemo(
        () => revenueByMonth.map(({ month, count }) => ({ month, count })),
        [revenueByMonth]
    );

    const bookingsByStatus = useMemo(() => [
        { name: 'Confirmées',   value: kpis.confirmedCount, color: '#10b981' },
        { name: 'En attente',   value: kpis.pendingCount,   color: '#f59e0b' },
        { name: 'Rejetées',     value: kpis.rejectedCount,  color: '#f43f5e' },
        { name: 'Annulées',     value: kpis.cancelledCount, color: '#94a3b8' },
    ].filter(i => i.value > 0), [kpis]);

    const topDestinations = useMemo(() => {
        const map = new Map();
        all.forEach(b => {
            if (b.status?.toUpperCase() !== 'CONFIRMED') return;
            const ipro = parseJSON(b.iproPayload);
            const bd   = parseJSON(b.bookingData);
            const name = ipro?.HotelName || bd?.hotel?.name || b.hotelName || `Hôtel #${b.hotelId}`;
            if (!map.has(name)) map.set(name, { hotel: name, count: 0, revenue: 0 });
            const e = map.get(name);
            e.count++;
            e.revenue += Number(b.clientPrice) || 0;
        });
        return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 7);
    }, [all]);

    // Uses checkIn (not createdAt) — travel month is the seasonality signal
    const seasonalPattern = useMemo(() => {
        const counts = new Array(12).fill(0);
        all.forEach(b => {
            if (!b.checkIn) return;
            const d = new Date(b.checkIn);
            if (!isNaN(d.getTime())) counts[d.getMonth()]++;
        });
        return FR_MONTHS_SHORT.map((mois, i) => ({ mois, reservations: counts[i] }));
    }, [all]);

    const revenueByYear = useMemo(() => {
        const map = new Map();
        all.forEach(b => {
            if (b.status?.toUpperCase() !== 'CONFIRMED') return;
            const d = resolveEventDate(b);
            if (!d) return;
            const yr = String(d.getFullYear());
            if (!map.has(yr)) map.set(yr, { annee: yr, revenue: 0, benefit: 0 });
            const e = map.get(yr);
            const p = Number(b.clientPrice) || 0;
            e.revenue += p;
            e.benefit += p * BENEFIT_RATE;
        });
        return [...map.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => ({ annee: v.annee, revenue: Math.round(v.revenue), benefit: Math.round(v.benefit) }));
    }, [all]);

    return {
        kpis,
        revenueByMonth,
        bookingsByMonth,
        bookingsByStatus,
        topDestinations,
        seasonalPattern,
        revenueByYear,
        availableYears,
        isEmpty: all.length === 0,
    };
}
