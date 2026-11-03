import { useState } from "react";
import { useParams, useSearchParams, Navigate, Link } from "react-router-dom";
import { ChevronLeft, Calendar, Users, CreditCard, MessageSquare, CheckCircle2, Info } from "lucide-react";
import { useDestination } from "../custom-hooks/useDestinations.js";
import useSettings from "../custom-hooks/useSettings.js";
import { AllezGoApi } from "../services/allezgo-api/allezGoApi.js";
import { formatDateForAPI } from "../utils/dateHelpers.js";
import { resolveMediaUrl } from "../utils/resolveMediaUrl.js";
import PageLoader from "../ui/PageLoader.jsx";

const fmtPrice = (v) => new Intl.NumberFormat("fr-DZ").format(v);
const fmtDate  = (iso) =>
    iso
        ? new Intl.DateTimeFormat("fr-DZ", { day: "numeric", month: "short", year: "numeric" })
              .format(new Date(iso + "T00:00:00"))
        : "";

const PHONE_RE = /^(?:\+213|0)(5|6|7)\d{8}$/;

const ROOM_LABELS = {
    double:    "Adulte en chambre double",
    single:    "Adulte en chambre single",
    triple:    "Adulte en chambre triple",
    quadruple: "Adulte en chambre quadruple",
};

export default function VoyageOrganiseBooking({ basePath = '/voyages-organises' }) {
    const { tripId } = useParams();
    const [searchParams] = useSearchParams();
    const hotelParam = searchParams.get("accId");

    const { data: destination, isLoading, error } = useDestination(tripId);
    const { settings } = useSettings();

    const [selectedDate, setSelectedDate] = useState(searchParams.get('date') ?? "");
    const [rooms, setRooms] = useState({});
    const [client, setClient] = useState({ nom: "", gsm: "", email: "", adresse: "" });
    const [commentaire, setCommentaire] = useState("");
    const [paiement, setPaiement] = useState("AGENCE");
    const [cgv, setCgv] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [booking, setBooking] = useState(null);

    if (isLoading) return <PageLoader section />;
    if (error || !destination) return <Navigate to="/not-found" replace />;

    const pricing = destination.pricing || {};
    const today = formatDateForAPI(new Date());
    const futureDates = (destination.departureDates ?? [])
        .filter((d) => d.outbound >= today)
        .sort((a, b) => (a.outbound < b.outbound ? -1 : 1));

    const selectedAcc = hotelParam
        ? (destination.accommodations || []).find((a) => a.id === Number(hotelParam))
        : null;

    // Prefer per-hotel prices (BST-03); fall back to flat destination pricing
    const roomLineConfigs =
        selectedAcc?.prices?.length > 0
            ? selectedAcc.prices.map((p) => ({
                  key: p.roomType,
                  label: ROOM_LABELS[p.roomType] ?? `Chambre ${p.roomType}`,
                  price: Number(p.pricePerAdult),
              }))
            : [
                  { key: "double", label: ROOM_LABELS.double, price: Number(pricing.double || 0) },
                  { key: "single", label: ROOM_LABELS.single, price: Number(pricing.single || 0) },
                  { key: "triple", label: ROOM_LABELS.triple, price: Number(pricing.triple || 0) },
              ].filter((r) => r.price > 0);

    const roomLines = roomLineConfigs.map((r) => ({ ...r, qty: rooms[r.key] ?? 0 }));
    const total = roomLines.reduce((s, r) => s + r.qty * r.price, 0);
    const currency = pricing.currency || "DZD";

    const validate = () => {
        const e = {};
        if (!selectedDate && futureDates.length > 0) e.date = "Veuillez choisir une date de départ.";
        const totalPax = roomLines.reduce((s, r) => s + r.qty, 0);
        if (totalPax === 0) e.rooms = "Veuillez sélectionner au moins une chambre.";
        if (!client.nom.trim() || client.nom.trim().length < 3) e.nom = "Nom & Prénom requis (3 caractères min.).";
        const gsm = client.gsm.replace(/[\s-]/g, "");
        if (!PHONE_RE.test(gsm)) e.gsm = "Numéro de téléphone algérien invalide (ex: 0661234567).";
        if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) e.email = "Adresse email invalide.";
        if (!cgv) e.cgv = "Veuillez accepter les conditions générales de vente.";
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSubmitting(true);
        try {
            const result = await AllezGoApi.VoBookings.create({
                destinationId: destination.id,
                accommodationId: selectedAcc?.id ?? null,
                departureDate: selectedDate || null,
                roomLines: roomLines
                    .filter((r) => r.qty > 0)
                    .map((r) => ({ key: r.key, label: r.label, qty: r.qty, price: r.price.toFixed(2) })),
                clientNom: client.nom.trim(),
                clientGsm: client.gsm.replace(/[\s-]/g, ""),
                clientEmail: client.email || null,
                clientAdresse: client.adresse || null,
                commentaire: commentaire || null,
                paymentMethod: paiement,
                totalDzd: total.toFixed(2),
            });
            setBooking(result);
        } catch {
            setErrors((p) => ({ ...p, submit: "Une erreur est survenue. Veuillez réessayer." }));
        } finally {
            setSubmitting(false);
        }
    };

    if (booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Réservation enregistrée !</h2>
                    <p className="text-sm font-mono bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 mb-4 text-sky-800 font-bold inline-block tracking-wider">
                        {booking.reference}
                    </p>
                    <p className="text-gray-600 mb-4 text-sm">
                        Votre demande pour <span className="font-semibold">{destination.name}</span> a été enregistrée.
                        Notre équipe vous contactera dans les plus brefs délais.
                    </p>
                    {booking.paymentMethod === "VIREMENT" && (settings?.baridimob_number || settings?.bank_rib) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left">
                            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Effectuez votre paiement</p>
                            {settings.baridimob_number && (
                                <div className="mb-2">
                                    <p className="text-xs text-gray-500">BaridiMob / CCP</p>
                                    <p className="text-sm font-mono font-semibold text-gray-800">{settings.baridimob_number}</p>
                                    {settings.baridimob_holder && (
                                        <p className="text-xs text-gray-500">Au nom de : {settings.baridimob_holder}</p>
                                    )}
                                </div>
                            )}
                            {settings.bank_rib && (
                                <div>
                                    {settings.bank_name && <p className="text-xs text-gray-600">{settings.bank_name}</p>}
                                    <p className="text-sm font-mono font-semibold text-gray-800">{settings.bank_rib}</p>
                                    {settings.bank_holder && (
                                        <p className="text-xs text-gray-500">Au nom de : {settings.bank_holder}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <Link
                        to={`${basePath}/${tripId}`}
                        className="inline-block px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm hover:bg-sky-700 transition-colors"
                    >
                        Retour au voyage
                    </Link>
                </div>
            </div>
        );
    }

    const stepBase = futureDates.length > 0 ? 1 : 0;

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ── Hero banner ── */}
            <div className="bg-gradient-to-br from-[#0c1a2e] via-[#0e2647] to-[#0c1a2e] pb-16 pt-8 px-4">
                <div className="max-w-5xl mx-auto">
                    <Link
                        to={`${basePath}/${tripId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-sky-400/80 hover:text-sky-300 mb-8 transition-colors"
                    >
                        <ChevronLeft size={16} />
                        Retour au voyage
                    </Link>
                    <p className="text-sky-400 text-[11px] uppercase tracking-[0.2em] font-bold mb-2">
                        Réservation en ligne
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                        {destination.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-slate-400 text-sm">
                        {destination.duration?.days && (
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                                {destination.duration.days} jours
                            </span>
                        )}
                        {destination.departureFrom && <span>Départ de {destination.departureFrom}</span>}
                        {destination.airline && <span>{destination.airline}</span>}
                    </div>
                </div>
            </div>

            {/* ── Content pulled up over hero ── */}
            <div className="max-w-5xl mx-auto px-4 pb-12 -mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-8 items-start">

                    {/* ── Form column (3/5) ── */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit} noValidate className="space-y-4">

                            {/* Step 1 — Date */}
                            {futureDates.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                                        <span className="w-7 h-7 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-sky-500" />
                                            Date de départ *
                                        </h2>
                                    </div>
                                    <div className="p-5">
                                        <select
                                            value={selectedDate}
                                            onChange={(e) => { setSelectedDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })); }}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none bg-white"
                                        >
                                            <option value="">— Choisir une date —</option>
                                            {futureDates.map((d, i) => (
                                                <option key={i} value={d.outbound}>
                                                    {fmtDate(d.outbound)}{d.return ? ` → ${fmtDate(d.return)}` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.date && <p className="text-red-500 text-xs mt-2">{errors.date}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Step 2 — Rooms */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                                    <span className="w-7 h-7 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {stepBase + 1}
                                    </span>
                                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-sky-500" />
                                        Type de chambre *
                                    </h2>
                                </div>
                                <div className="p-5 space-y-3">
                                    {roomLines.map((r) => (
                                        <div key={r.key} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-sky-100 transition-colors">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{r.label}</p>
                                                <p className="text-xs font-bold text-sky-600 mt-0.5">{fmtPrice(r.price)} {currency} / pers.</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setRooms((p) => ({ ...p, [r.key]: Math.max(0, (p[r.key] ?? 0) - 1) }))}
                                                    className="w-9 h-9 rounded-full border-2 border-gray-200 text-gray-500 hover:border-sky-400 hover:text-sky-600 font-bold text-lg flex items-center justify-center transition-colors"
                                                >−</button>
                                                <span className={`w-8 h-8 flex items-center justify-center text-sm font-black rounded-lg transition-all ${r.qty > 0 ? "bg-sky-600 text-white shadow-sm" : "text-gray-900"}`}>
                                                    {r.qty}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setRooms((p) => ({ ...p, [r.key]: (p[r.key] ?? 0) + 1 }))}
                                                    className="w-9 h-9 rounded-full border-2 border-gray-200 text-gray-500 hover:border-sky-400 hover:text-sky-600 font-bold text-lg flex items-center justify-center transition-colors"
                                                >+</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {errors.rooms && <p className="text-red-500 text-xs px-5 pb-3">{errors.rooms}</p>}
                                {total > 0 && (
                                    <div className="mx-5 mb-5 pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-600">Sous-total</span>
                                        <span className="text-lg font-black text-sky-600">{fmtPrice(total)} {currency}</span>
                                    </div>
                                )}
                            </div>

                            {/* Step 3 — Client info */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                                    <span className="w-7 h-7 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {stepBase + 2}
                                    </span>
                                    <h2 className="font-bold text-gray-900">Informations Client</h2>
                                </div>
                                <div className="p-5 space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nom & Prénom *</label>
                                        <input
                                            type="text"
                                            value={client.nom}
                                            onChange={(e) => { setClient((p) => ({ ...p, nom: e.target.value })); setErrors((p) => ({ ...p, nom: undefined })); }}
                                            placeholder="Ex : Amir Benali"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none transition-shadow"
                                        />
                                        {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">GSM *</label>
                                        <input
                                            type="tel"
                                            value={client.gsm}
                                            onChange={(e) => { setClient((p) => ({ ...p, gsm: e.target.value })); setErrors((p) => ({ ...p, gsm: undefined })); }}
                                            placeholder="Ex : 0661234567"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none transition-shadow"
                                        />
                                        {errors.gsm && <p className="text-red-500 text-xs mt-1">{errors.gsm}</p>}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={client.email}
                                                onChange={(e) => { setClient((p) => ({ ...p, email: e.target.value })); setErrors((p) => ({ ...p, email: undefined })); }}
                                                placeholder="optionnel"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none transition-shadow"
                                            />
                                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Adresse</label>
                                            <input
                                                type="text"
                                                value={client.adresse}
                                                onChange={(e) => setClient((p) => ({ ...p, adresse: e.target.value }))}
                                                placeholder="optionnel"
                                                maxLength={255}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none transition-shadow"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 — Comment (optional, muted badge) */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                                    <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                                        {stepBase + 3}
                                    </span>
                                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-sky-500" />
                                        Commentaire
                                        <span className="text-[10px] font-normal text-gray-400 ml-1">optionnel</span>
                                    </h2>
                                </div>
                                <div className="p-5">
                                    <textarea
                                        value={commentaire}
                                        onChange={(e) => setCommentaire(e.target.value)}
                                        rows={3}
                                        maxLength={1000}
                                        placeholder="Demandes spéciales, informations complémentaires…"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none resize-none transition-shadow"
                                    />
                                    <p className="text-xs text-gray-400 text-right mt-1">{commentaire.length}/1000</p>
                                </div>
                            </div>

                            {/* Step 5 — Payment */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                                    <span className="w-7 h-7 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {stepBase + 4}
                                    </span>
                                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-sky-500" />
                                        Mode de paiement
                                    </h2>
                                </div>
                                <div className="p-5">
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {[
                                            { value: "AGENCE",   label: "À l'agence" },
                                            { value: "VIREMENT", label: "Virement bancaire" },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setPaiement(opt.value)}
                                                className={`py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${paiement === opt.value ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-slate-50"}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {paiement === "VIREMENT" && (settings?.baridimob_number || settings?.bank_rib) && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                            <p className="text-xs font-semibold text-blue-700 uppercase flex items-center gap-1.5 mb-3">
                                                <Info size={12} />
                                                Coordonnées de paiement
                                            </p>
                                            {settings.baridimob_number && (
                                                <div className="mb-3">
                                                    <p className="text-xs text-gray-500 mb-0.5">BaridiMob / CCP</p>
                                                    <p className="text-sm font-mono font-semibold text-gray-800">{settings.baridimob_number}</p>
                                                    {settings.baridimob_holder && (
                                                        <p className="text-xs text-gray-500 mt-0.5">Au nom de : {settings.baridimob_holder}</p>
                                                    )}
                                                </div>
                                            )}
                                            {settings.bank_rib && (
                                                <div>
                                                    {settings.bank_name && <p className="text-xs text-gray-500 mb-0.5">{settings.bank_name}</p>}
                                                    <p className="text-sm font-mono font-semibold text-gray-800">{settings.bank_rib}</p>
                                                    {settings.bank_holder && <p className="text-xs text-gray-500 mt-0.5">Au nom de : {settings.bank_holder}</p>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CGV */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={cgv}
                                        onChange={(e) => { setCgv(e.target.checked); setErrors((p) => ({ ...p, cgv: undefined })); }}
                                        className="mt-0.5 w-4 h-4 accent-sky-600 shrink-0"
                                    />
                                    <span className="text-sm text-gray-600">
                                        J'accepte les{" "}
                                        <span className="text-sky-600 font-semibold">conditions générales de vente</span>
                                        {" "}et confirme avoir pris connaissance des informations relatives au voyage.
                                    </span>
                                </label>
                                {errors.cgv && <p className="text-red-500 text-xs mt-2 ml-7">{errors.cgv}</p>}
                            </div>

                            {errors.submit && <p className="text-center text-red-500 text-sm">{errors.submit}</p>}

                            {/* Tactile 3D submit button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 relative select-none font-black text-base text-white rounded-2xl bg-gradient-to-br from-sky-400 to-sky-700 shadow-[0_5px_0_#0369a1,0_8px_20px_rgba(3,105,161,0.35)] hover:shadow-[0_3px_0_#0369a1,0_5px_12px_rgba(3,105,161,0.25)] hover:translate-y-[2px] active:shadow-[0_1px_0_#0369a1,0_2px_6px_rgba(3,105,161,0.20)] active:translate-y-[4px] transition-[box-shadow,transform] duration-100 ease-out disabled:opacity-60 disabled:pointer-events-none"
                            >
                                {submitting ? "Envoi en cours…" : "Confirmer ma réservation"}
                            </button>

                        </form>
                    </div>

                    {/* ── Summary sidebar (2/5) ── */}
                    <div className="lg:col-span-2 lg:sticky lg:top-6 space-y-4">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

                            {/* Image hero with overlay */}
                            <div className="relative h-52 overflow-hidden">
                                {destination.image_url ? (
                                    <img
                                        src={resolveMediaUrl(destination.image_url)}
                                        alt={destination.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-sky-600 to-sky-900" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <p className="text-white font-black text-xl leading-tight">{destination.name}</p>
                                    <p className="text-sky-300 text-xs mt-1 font-medium">
                                        {destination.duration?.days} jours · {destination.departureFrom}
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">

                                {/* Selected date */}
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                                    {selectedDate ? (
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Date de départ</p>
                                            <p className="text-sm text-gray-800 font-semibold">{fmtDate(selectedDate)}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Aucune date sélectionnée</p>
                                    )}
                                </div>

                                {/* Accommodation if selected */}
                                {selectedAcc && (
                                    <div className="p-3 rounded-xl bg-sky-50 border border-sky-100">
                                        <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wide">Hébergement</p>
                                        <p className="text-sm text-gray-800 font-semibold mt-0.5">{selectedAcc.hotel}</p>
                                    </div>
                                )}

                                {/* Room breakdown */}
                                {roomLines.some((r) => r.qty > 0) ? (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Chambres</p>
                                        <div className="space-y-2">
                                            {roomLines.filter((r) => r.qty > 0).map((r) => (
                                                <div key={r.key} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">
                                                        <span className="font-bold text-gray-900">{r.qty}×</span>{" "}
                                                        {r.label.replace("Adulte en chambre ", "").replace("Adulte en ", "")}
                                                    </span>
                                                    <span className="font-bold text-gray-800">{fmtPrice(r.qty * r.price)} {currency}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic text-center py-1">Sélectionnez vos chambres</p>
                                )}

                                {/* Total */}
                                {total > 0 && (
                                    <div className="pt-4 border-t-2 border-dashed border-gray-100">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total estimé</p>
                                                <p className="text-[10px] text-gray-400">Toutes taxes incluses</p>
                                            </div>
                                            <p className="text-2xl font-black text-sky-600 leading-none">
                                                {fmtPrice(total)}{" "}
                                                <span className="text-sm font-bold">{currency}</span>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Guarantee */}
                                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    <p className="text-xs text-green-700 font-semibold">Départ garanti · Paiement sécurisé</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
