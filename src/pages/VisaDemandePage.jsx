import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, User, Mail, Phone, Calendar, Users, Upload, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AllezGoApi } from '../services/allezgo-api/allezGoApi.js';
import PageLoader from '../ui/PageLoader.jsx';
export default function VisaDemandePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: visaData, isLoading } = useQuery({
        queryKey: ['eVisas'],
        queryFn: () => AllezGoApi.EVisas.getAll(),
        staleTime: 10 * 60 * 1000,
    });

    const visas = visaData?.data ?? visaData ?? [];
    const visa = Array.isArray(visas) ? visas.find((v) => String(v.id) === String(id)) : null;

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        travelDate: '',
        travelers: 1,
    });
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [reference, setReference] = useState(null);

    const set = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!visa) return;

        const fd = new FormData();
        fd.append('evisaId', String(visa.id));
        fd.append('country', visa.country);
        fd.append('fullName', form.fullName.trim());
        fd.append('email', form.email.trim());
        fd.append('phone', form.phone.trim());
        fd.append('travelers', String(form.travelers));
        if (form.travelDate) fd.append('travelDate', form.travelDate);
        if (file) fd.append('document', file);

        setSubmitting(true);
        try {
            const res = await AllezGoApi.VisaApplications.create(fd);
            const ref = res?.data?.reference ?? res?.reference;
            setReference(ref);
        } catch {
            toast.error('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <PageLoader section />;

    if (!visa) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
                <AlertCircle className="w-12 h-12 text-orange-400" />
                <p className="text-slate-600">Visa introuvable.</p>
                <button onClick={() => navigate('/e-visa')} className="text-sky-600 underline text-sm">
                    Retour aux visas
                </button>
            </div>
        );
    }

    if (reference) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <div className="bg-white rounded-2xl shadow-md border border-emerald-100 p-10 max-w-md w-full text-center">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Demande envoyée !</h2>
                    <p className="text-slate-500 mb-6 text-sm">
                        Votre demande de visa pour <strong>{visa.country}</strong> a été reçue. Notre équipe vous contactera sous 48h.
                    </p>
                    <div className="bg-sky-50 border border-sky-200 rounded-xl px-6 py-4 mb-6">
                        <p className="text-xs text-sky-600 font-semibold uppercase tracking-wide mb-1">Référence</p>
                        <p className="text-2xl font-mono font-bold text-sky-800">{reference}</p>
                    </div>
                    <button
                        onClick={() => navigate('/e-visa')}
                        className="text-sky-600 hover:underline text-sm"
                    >
                        Retour aux visas
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Back link */}
                <button
                    onClick={() => navigate('/e-visa')}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Retour aux visas
                </button>

                {/* Visa header */}
                <div className="bg-gradient-to-r from-[#1e3a5f] via-[#2c5f7c] to-[#1e3a5f] rounded-2xl p-6 mb-6 flex items-center gap-4">
                    <img
                        src={visa.flagUrl || '/placeholder-flag.png'}
                        alt={`Drapeau ${visa.country}`}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-white/20 shrink-0"
                    />
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            Demande E-Visa — {visa.country}
                        </h1>
                        <p className="text-cyan-100 text-sm mt-1">
                            Remplissez le formulaire ci-dessous. Notre équipe vous contactera sous 48h.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
                    <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                        <FileText size={16} className="text-sky-600" />
                        Informations personnelles
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Nom complet <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={form.fullName}
                                    onChange={set('fullName')}
                                    placeholder="Prénom Nom"
                                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={set('email')}
                                    placeholder="exemple@email.com"
                                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Téléphone <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="tel"
                                    required
                                    value={form.phone}
                                    onChange={set('phone')}
                                    placeholder="0555 XX XX XX"
                                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Date de voyage prévue
                            </label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={form.travelDate}
                                    onChange={set('travelDate')}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Nombre de voyageurs <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={20}
                                    value={form.travelers}
                                    onChange={set('travelers')}
                                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Document upload */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Document (passeport, scan) — facultatif
                        </label>
                        <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-sky-400 hover:bg-sky-50/30 transition-colors">
                            <Upload size={16} className="text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-500 truncate">
                                {file ? file.name : 'Cliquez pour joindre un fichier (max 10 Mo)'}
                            </span>
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-sky-700 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                    >
                        {submitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
                    </button>
                </form>
            </div>
        </div>
    );
}
