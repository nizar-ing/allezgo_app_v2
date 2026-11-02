import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { AllezGoApi } from '../../services/allezgo-api/allezGoApi.js';
import PageLoader from '../../ui/PageLoader.jsx';

const STATUS_CONFIG = {
    nouvelle:            { label: 'Nouvelle',             bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },
    en_traitement:       { label: 'En traitement',        bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
    documents_manquants: { label: 'Docs manquants',       bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
    acceptee:            { label: 'Acceptée',             bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    refusee:             { label: 'Refusée',              bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
    annulee:             { label: 'Annulée',              bg: 'bg-slate-100',  text: 'text-slate-500',   border: 'border-slate-200' },
};

const STATUSES = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }));

function StatusBadge({ status }) {
    const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.nouvelle;
    return (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            {c.label}
        </span>
    );
}

export default function VisaApplicationsPanel() {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [editNotes, setEditNotes] = useState('');

    const handleDownload = async (documentPath) => {
        const filename = documentPath.split(/[\\/]/).pop();
        try {
            const res = await AllezGoApi.client.get(
                `/api/visa-applications/document/${filename}`,
                { responseType: 'blob' },
            );
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Impossible de télécharger le document');
        }
    };

    const { data: raw, isLoading } = useQuery({
        queryKey: ['visa-applications'],
        queryFn: () => AllezGoApi.VisaApplications.getAll(),
        staleTime: 60 * 1000,
    });

    const applications = raw?.data ?? raw ?? [];

    const { mutate: updateStatus, isPending } = useMutation({
        mutationFn: ({ id, status, adminNotes }) =>
            AllezGoApi.VisaApplications.updateStatus(id, { status, adminNotes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['visa-applications'] });
            toast.success('Statut mis à jour');
            setEditingId(null);
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
    });

    const openEdit = (app) => {
        setEditingId(app.id);
        setEditStatus(app.status);
        setEditNotes(app.adminNotes ?? '');
    };

    if (isLoading) return <PageLoader compact message="Chargement des demandes…" />;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden font-sans">
            <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-sky-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sky-600" />
                    Demandes E-Visa
                </h3>
                <p className="text-sm text-slate-500 mt-1">{applications.length} demande(s) reçue(s)</p>
            </div>

            {applications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">Aucune demande pour l'instant.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Réf</th>
                                <th className="px-4 py-3 text-left font-semibold">Pays</th>
                                <th className="px-4 py-3 text-left font-semibold">Client</th>
                                <th className="px-4 py-3 text-left font-semibold">Contact</th>
                                <th className="px-4 py-3 text-left font-semibold">Voyage</th>
                                <th className="px-4 py-3 text-center font-semibold">Voy.</th>
                                <th className="px-4 py-3 text-left font-semibold">Statut</th>
                                <th className="px-4 py-3 text-left font-semibold">Date</th>
                                <th className="px-4 py-3 text-center font-semibold">Doc</th>
                                <th className="px-4 py-3 text-center font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {applications.map((app) => (
                                <tr key={app.id} className="hover:bg-sky-50/30 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{app.reference}</td>
                                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{app.country}</td>
                                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{app.fullName}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">
                                        <div>{app.email}</div>
                                        <div>{app.phone}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                        {app.travelDate ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-600">{app.travelers}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {editingId === app.id ? (
                                            <div className="space-y-2 min-w-[180px]">
                                                <select
                                                    value={editStatus}
                                                    onChange={(e) => setEditStatus(e.target.value)}
                                                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                >
                                                    {STATUSES.map((s) => (
                                                        <option key={s.value} value={s.value}>{s.label}</option>
                                                    ))}
                                                </select>
                                                <textarea
                                                    rows={2}
                                                    value={editNotes}
                                                    onChange={(e) => setEditNotes(e.target.value)}
                                                    placeholder="Notes admin…"
                                                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                                                />
                                                <div className="flex gap-1.5">
                                                    <button
                                                        disabled={isPending}
                                                        onClick={() => updateStatus({ id: app.id, status: editStatus, adminNotes: editNotes })}
                                                        className="flex-1 py-1 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 disabled:opacity-50"
                                                    >
                                                        Sauvegarder
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="flex-1 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <StatusBadge status={app.status} />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                        {new Date(app.createdAt).toLocaleDateString('fr-DZ')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {app.documentPath ? (
                                            <button
                                                onClick={() => handleDownload(app.documentPath)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 transition-colors"
                                                title="Télécharger le document"
                                            >
                                                <Download size={14} />
                                            </button>
                                        ) : (
                                            <span className="text-slate-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {editingId !== app.id && (
                                            <button
                                                onClick={() => openEdit(app)}
                                                className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
                                            >
                                                Modifier
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
