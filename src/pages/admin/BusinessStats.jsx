import { useState } from 'react';
import {
    ResponsiveContainer,
    ComposedChart, Area, Line,
    BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
    BarChart2, TrendingUp, Wallet, CreditCard, CheckCircle2, Users,
} from 'lucide-react';
import useAdminBookings from '../../custom-hooks/useAdminBookings.js';
import { useBusinessAnalytics } from '../../custom-hooks/useBusinessAnalytics.js';
import KpiCard from '../../components/admin/analytics/KpiCard.jsx';
import Loader from '../../ui/Loader.jsx';

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtDZD = (v) =>
    new Intl.NumberFormat('fr-DZ').format(Math.round(v)) + ' DZD';

const fmtCompact = (v) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
    return String(v);
};

const TOOLTIP_STYLE = {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    padding: '10px 14px',
    fontSize: '0.78rem',
    fontFamily: 'sans-serif',
};

// ─── Shared chart card wrapper ─────────────────────────────────────────────────

function ChartCard({ title, subtitle, icon: Icon, children, className = '' }) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden font-sans ${className}`}>
            <div className="px-6 py-5 border-b border-gray-100 bg-white">
                <h3 className="text-lg font-semibold text-sky-900 flex items-center gap-2">
                    <Icon className="w-5 h-5 text-sky-600" />
                    {title}
                </h3>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function EmptyChart({ message = 'Aucune donnée pour cette période.' }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <BarChart2 className="w-8 h-8 mb-2 text-sky-200" />
            <p className="text-sm">{message}</p>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BusinessStats() {
    const { bookings, loading } = useAdminBookings();
    const [selectedYear, setSelectedYear] = useState('all');

    const {
        kpis,
        revenueByMonth,
        bookingsByMonth,
        bookingsByStatus,
        topDestinations,
        seasonalPattern,
        revenueByYear,
        availableYears,
        isEmpty,
    } = useBusinessAnalytics(bookings, selectedYear);

    if (loading) {
        return (
            <div className="py-12">
                <Loader variant="minimal" message="Calcul des statistiques..." />
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 p-12 text-center font-sans">
                <BarChart2 className="w-16 h-16 text-sky-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-sky-900 mb-1">Aucune donnée disponible</h3>
                <p className="text-sm text-gray-500">
                    Les statistiques apparaîtront dès que des réservations seront enregistrées.
                </p>
            </div>
        );
    }

    const totalCancelled = kpis.cancelledCount + kpis.rejectedCount;

    return (
        <div className="space-y-5 font-sans">

            {/* ── Header + Year filter ──────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-sky-900 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-sky-600" />
                        Business &amp; Statistiques
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Analyse de performance basée sur{' '}
                        <span className="font-semibold text-sky-700">{kpis.totalBookings}</span>{' '}
                        réservation{kpis.totalBookings !== 1 ? 's' : ''}{' '}
                        {selectedYear === 'all' ? '— toutes périodes' : `— ${selectedYear}`}
                    </p>
                </div>
                <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(
                        e.target.value === 'all' ? 'all' : Number(e.target.value)
                    )}
                    className="border border-sky-200 rounded-lg px-3 py-1.5 text-sm text-sky-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 self-start md:self-auto"
                >
                    <option value="all">Toutes les années</option>
                    {availableYears.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                    ))}
                </select>
            </div>

            {/* ── KPI Grid ─────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                <KpiCard
                    label="Chiffre d'Affaires"
                    value={fmtDZD(kpis.totalRevenue)}
                    subLabel="réservations confirmées uniquement"
                    icon={TrendingUp}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-50"
                    borderClass="border-emerald-100"
                />
                <KpiCard
                    label="Bénéfice Agence"
                    value={fmtDZD(kpis.totalBenefit)}
                    subLabel="8% du chiffre d'affaires confirmé"
                    icon={Wallet}
                    colorClass="text-amber-600"
                    bgClass="bg-amber-50"
                    borderClass="border-amber-100"
                />
                <KpiCard
                    label="Réservations Totales"
                    value={String(kpis.totalBookings)}
                    subLabel={`${kpis.confirmedCount} confirmées · ${kpis.pendingCount} en attente`}
                    icon={CreditCard}
                    colorClass="text-sky-600"
                    bgClass="bg-sky-50"
                    borderClass="border-sky-100"
                />
                <KpiCard
                    label="Taux de Confirmation"
                    value={`${kpis.conversionRate.toFixed(1)}%`}
                    subLabel={`${totalCancelled} annulée${totalCancelled !== 1 ? 's' : ''} ou rejetée${totalCancelled !== 1 ? 's' : ''}`}
                    icon={CheckCircle2}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-50"
                    borderClass="border-emerald-100"
                />
                <KpiCard
                    label="Clients Uniques"
                    value={String(kpis.uniqueClients)}
                    subLabel="par numéro de téléphone"
                    icon={Users}
                    colorClass="text-sky-600"
                    bgClass="bg-sky-50"
                    borderClass="border-sky-100"
                />
                <KpiCard
                    label="Valeur Moy. Réservation"
                    value={kpis.confirmedCount > 0 ? fmtDZD(kpis.avgBookingValue) : '—'}
                    subLabel="sur les réservations confirmées"
                    icon={BarChart2}
                    colorClass="text-violet-600"
                    bgClass="bg-violet-50"
                    borderClass="border-violet-100"
                />
            </div>

            {/* ── Charts Grid ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Revenue + Benefit over time — full width */}
                <ChartCard
                    title="Chiffre d'Affaires & Bénéfices"
                    subtitle="Évolution mensuelle du CA confirmé et du bénéfice agence (8%)"
                    icon={TrendingUp}
                    className="md:col-span-2"
                >
                    {revenueByMonth.length === 0 ? (
                        <EmptyChart />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={revenueByMonth} margin={{ top: 4, right: 24, left: 0, bottom: 64 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 11, angle: -35, textAnchor: 'end' }}
                                    height={70}
                                />
                                <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} width={64} />
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(value, name) => [fmtDZD(value), name]}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Chiffre d'affaires"
                                    fill="#bae6fd"
                                    stroke="#0284c7"
                                    strokeWidth={2}
                                    fillOpacity={0.6}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="benefit"
                                    name="Bénéfice agence"
                                    stroke="#f59e0b"
                                    strokeWidth={2.5}
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Bookings per month */}
                <ChartCard
                    title="Réservations par Mois"
                    subtitle="Tous statuts confondus"
                    icon={CreditCard}
                >
                    {bookingsByMonth.length === 0 ? (
                        <EmptyChart />
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={bookingsByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 64 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }}
                                    height={70}
                                />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(v) => [v, 'Réservations']}
                                />
                                <Bar dataKey="count" name="Réservations" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Status distribution donut */}
                <ChartCard
                    title={`Répartition par Statut · ${kpis.totalBookings} total`}
                    subtitle="Distribution des réservations par statut"
                    icon={CheckCircle2}
                >
                    {bookingsByStatus.length === 0 ? (
                        <EmptyChart />
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={bookingsByStatus}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={55}
                                    outerRadius={95}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {bookingsByStatus.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(v, name) => [v, name]}
                                />
                                <Legend iconType="circle" iconSize={10} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Top destinations — full width */}
                <ChartCard
                    title="Top Destinations"
                    subtitle="Hôtels les plus réservés parmi les réservations confirmées"
                    icon={BarChart2}
                    className="md:col-span-2"
                >
                    {topDestinations.length === 0 ? (
                        <EmptyChart message="Aucune réservation confirmée pour établir un classement." />
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(200, topDestinations.length * 52)}>
                            <BarChart
                                data={topDestinations}
                                layout="vertical"
                                margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                <YAxis
                                    type="category"
                                    dataKey="hotel"
                                    width={200}
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(v, name) =>
                                        name === 'count' ? [v, 'Réservations'] : [fmtDZD(v), 'Revenu']
                                    }
                                />
                                <Bar dataKey="count" name="count" fill="#0284c7" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Seasonal pattern — full width */}
                <ChartCard
                    title="Saisonnalité des Réservations"
                    subtitle="Répartition des check-ins par mois calendaire (toutes années confondues)"
                    icon={TrendingUp}
                    className="md:col-span-2"
                >
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={seasonalPattern} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(v) => [v, 'Check-ins']}
                            />
                            <Bar dataKey="reservations" name="Check-ins" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Revenue by year — full width, only in 'all time' mode */}
                {selectedYear === 'all' && revenueByYear.length > 0 && (
                    <ChartCard
                        title="Évolution Annuelle"
                        subtitle="Chiffre d'affaires et bénéfice agence par année"
                        icon={TrendingUp}
                        className="md:col-span-2"
                    >
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={revenueByYear} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} width={64} />
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(v, name) => [fmtDZD(v), name]}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Bar
                                    dataKey="revenue"
                                    name="Chiffre d'affaires"
                                    fill="#0284c7"
                                    radius={[4, 4, 0, 0]}
                                    barSize={36}
                                />
                                <Bar
                                    dataKey="benefit"
                                    name="Bénéfice agence"
                                    fill="#f59e0b"
                                    radius={[4, 4, 0, 0]}
                                    barSize={36}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

            </div>
        </div>
    );
}
