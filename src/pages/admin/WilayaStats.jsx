import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip,
} from 'recharts';
import { MapPin, Users, BarChart2, Download, Info } from 'lucide-react';
import { AllezGoApi } from '../../services/allezgo-api/allezGoApi.js';
import useAuth from '../../custom-hooks/useAuth.js';
import PageLoader from '../../ui/PageLoader.jsx';

const PERIODS = [
    { label: '7 derniers jours', days: 7 },
    { label: '30 derniers jours', days: 30 },
    { label: '12 derniers mois', days: 365 },
];

const TOOLTIP_STYLE = {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    padding: '10px 14px',
    fontSize: '0.78rem',
    fontFamily: 'sans-serif',
};

function KpiCard({ icon: Icon, label, value, sub, color = 'sky' }) {
    const colors = {
        sky: 'text-sky-600 bg-sky-50 border-sky-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        violet: 'text-violet-600 bg-violet-50 border-violet-100',
    };
    return (
        <div className={`rounded-xl border p-5 font-sans ${colors[color]}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${colors[color].split(' ')[1]}`}>
                    <Icon className={`w-5 h-5 ${colors[color].split(' ')[0]}`} />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
    );
}

export default function WilayaStats() {
    const { user } = useAuth();
    const [days, setDays] = useState(30);

    const { data: raw, isLoading } = useQuery({
        queryKey: ['wilaya-stats', days],
        queryFn: () => AllezGoApi.Analytics.getWilayaStats(days),
        enabled: user?.role === 'admin',
        staleTime: 5 * 60 * 1000,
    });

    const data = raw?.data ?? raw;

    if (isLoading) return <PageLoader compact message="Chargement des statistiques..." />;

    const rows = data?.rows ?? [];
    const algRows = rows.filter(r => r.code !== 'UNKNOWN' && r.code !== 'INTL');
    const unknown = rows.find(r => r.code === 'UNKNOWN');
    const intl = rows.find(r => r.code === 'INTL');
    const top10 = algRows.slice(0, 10).map(r => ({ ...r, visitors: Number(r.visitors) }));
    const topWilaya = algRows[0]?.name ?? '—';

    const handleExport = () => {
        const header = 'Wilaya,Code,Visiteurs,Pages vues,Part (%)';
        const body = rows.map(r => `${r.name},${r.code},${r.visitors},${r.pageViews},${r.share}`);
        const csv = '﻿' + [header, ...body].join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        a.download = `visiteurs-wilaya-${days}j.csv`;
        a.click();
    };

    return (
        <div className="space-y-5 font-sans">

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-sky-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-sky-600" />
                        Visiteurs par Wilaya
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Distribution géographique des visiteurs du site
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex rounded-lg border border-sky-200 overflow-hidden">
                        {PERIODS.map(p => (
                            <button
                                key={p.days}
                                type="button"
                                onClick={() => setDays(p.days)}
                                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${days === p.days ? 'bg-sky-600 text-white' : 'bg-white text-sky-700 hover:bg-sky-50'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={rows.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download size={14} />
                        Exporter CSV
                    </button>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 p-12 text-center">
                    <BarChart2 className="w-12 h-12 text-sky-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Aucune donnée pour cette période.</p>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <KpiCard
                            icon={Users}
                            label="Visiteurs totaux"
                            value={Number(data?.total ?? 0).toLocaleString('fr-DZ')}
                            sub={`sur les ${days} derniers jours`}
                            color="sky"
                        />
                        <KpiCard
                            icon={MapPin}
                            label="Wilayas avec trafic"
                            value={data?.wilayas ?? algRows.length}
                            sub="wilayas algériennes détectées"
                            color="emerald"
                        />
                        <KpiCard
                            icon={BarChart2}
                            label="Wilaya principale"
                            value={topWilaya}
                            sub={algRows[0] ? `${algRows[0].share}% du trafic` : undefined}
                            color="violet"
                        />
                    </div>

                    {/* Bar chart — top 10 */}
                    {top10.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100">
                                <h3 className="text-base font-semibold text-sky-900 flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-sky-600" />
                                    Top 10 Wilayas
                                </h3>
                            </div>
                            <div className="p-6">
                                <ResponsiveContainer width="100%" height={Math.max(200, top10.length * 40)}>
                                    <BarChart
                                        data={top10}
                                        layout="vertical"
                                        margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={140}
                                            tick={{ fontSize: 11 }}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={TOOLTIP_STYLE}
                                            formatter={(v) => [v, 'Visiteurs']}
                                        />
                                        <Bar dataKey="visitors" name="Visiteurs" fill="#0284c7" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#64748b' }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Full table */}
                    <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h3 className="text-base font-semibold text-sky-900">Classement complet</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-semibold">#</th>
                                        <th className="px-6 py-3 text-left font-semibold">Wilaya</th>
                                        <th className="px-6 py-3 text-right font-semibold">Visiteurs</th>
                                        <th className="px-6 py-3 text-right font-semibold">Pages vues</th>
                                        <th className="px-6 py-3 text-right font-semibold">Part</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {algRows.map((row, i) => (
                                        <tr key={row.code} className="hover:bg-sky-50/30 transition-colors">
                                            <td className="px-6 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                                            <td className="px-6 py-3 font-medium text-slate-700">
                                                <span className="text-xs text-slate-400 mr-2 font-mono">{row.code}</span>
                                                {row.name}
                                            </td>
                                            <td className="px-6 py-3 text-right text-slate-700 font-semibold">{Number(row.visitors).toLocaleString('fr-DZ')}</td>
                                            <td className="px-6 py-3 text-right text-slate-500">{Number(row.pageViews).toLocaleString('fr-DZ')}</td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                                        <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${Math.min(row.share, 100)}%` }} />
                                                    </div>
                                                    <span className="text-slate-600 font-medium w-12 text-right">{row.share}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Separator rows */}
                                    {(intl || unknown) && (
                                        <tr><td colSpan={5} className="px-6 py-2 bg-slate-50 text-xs text-slate-400 font-semibold uppercase tracking-wide">Autres</td></tr>
                                    )}
                                    {intl && (
                                        <tr className="hover:bg-sky-50/30 transition-colors">
                                            <td className="px-6 py-3 text-slate-400">—</td>
                                            <td className="px-6 py-3 text-slate-500 italic">Hors Algérie</td>
                                            <td className="px-6 py-3 text-right text-slate-500">{Number(intl.visitors).toLocaleString('fr-DZ')}</td>
                                            <td className="px-6 py-3 text-right text-slate-400">{Number(intl.pageViews).toLocaleString('fr-DZ')}</td>
                                            <td className="px-6 py-3 text-right text-slate-400">{intl.share}%</td>
                                        </tr>
                                    )}
                                    {unknown && (
                                        <tr className="hover:bg-sky-50/30 transition-colors">
                                            <td className="px-6 py-3 text-slate-400">—</td>
                                            <td className="px-6 py-3 text-slate-500 italic">Non déterminée</td>
                                            <td className="px-6 py-3 text-right text-slate-500">{Number(unknown.visitors).toLocaleString('fr-DZ')}</td>
                                            <td className="px-6 py-3 text-right text-slate-400">{Number(unknown.pageViews).toLocaleString('fr-DZ')}</td>
                                            <td className="px-6 py-3 text-right text-slate-400">{unknown.share}%</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Accuracy note */}
                    <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                        <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
                        <p>Données indicatives basées sur la géolocalisation IP. La couverture mobile en Algérie peut sur-représenter certaines wilayas (Alger, Oran) au détriment d'autres.</p>
                    </div>
                </>
            )}
        </div>
    );
}
