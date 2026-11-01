import { useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ChevronLeft, Calendar, Users, CreditCard, MessageSquare, CheckCircle2 } from "lucide-react";
import { useDestination } from "../custom-hooks/useDestinations.js";
import useSettings from "../custom-hooks/useSettings.js";
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

// shortcut: submit sends a WhatsApp message; replace with real API POST in BST-06b
function buildWhatsAppMessage(destination, selectedDate, roomLines, client, commentaire, paiement) {
    const roomSummary = roomLines
        .filter((r) => r.qty > 0)
        .map((r) => `${r.qty}× ${r.label} (${fmtPrice(r.price)} DZD/pers.)`)
        .join(", ");
    const total = roomLines.reduce((s, r) => s + r.qty * r.price, 0);
    return [
        `Réservation Voyage : ${destination.name}`,
        selectedDate ? `Départ : ${fmtDate(selectedDate)}` : "",
        roomSummary ? `Chambres : ${roomSummary}` : "",
        total > 0 ? `Total estimé : ${fmtPrice(total)} DZD` : "",
        `Client : ${client.nom}`,
        `GSM : ${client.gsm}`,
        client.email ? `Email : ${client.email}` : "",
        client.adresse ? `Adresse : ${client.adresse}` : "",
        commentaire ? `Commentaire : ${commentaire}` : "",
        `Paiement : ${paiement === "AGENCE" ? "À l'agence" : "Virement bancaire"}`,
    ]
        .filter(Boolean)
        .join("\n");
}

export default function VoyageOrganiseBooking() {
    const { tripId } = useParams();
    const { data: destination, isLoading, error } = useDestination(tripId);
    const { settings } = useSettings();

    const [selectedDate, setSelectedDate] = useState("");
    const [rooms, setRooms] = useState({ double: 0, single: 0, triple: 0 });
    const [client, setClient] = useState({ nom: "", gsm: "", email: "", adresse: "" });
    const [commentaire, setCommentaire] = useState("");
    const [paiement, setPaiement] = useState("AGENCE");
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    if (isLoading) return <PageLoader section />;
    if (error || !destination) return <Navigate to="/not-found" replace />;

    const pricing = destination.pricing || {};
    const today = formatDateForAPI(new Date());
    const futureDates = (destination.departureDates ?? [])
        .filter((d) => d.outbound >= today)
        .sort((a, b) => (a.outbound < b.outbound ? -1 : 1));

    const roomLines = [
        { key: "double", label: "Adulte en chambre double", price: pricing.double, qty: rooms.double },
        { key: "single", label: "Adulte en chambre single", price: pricing.single, qty: rooms.single },
        { key: "triple", label: "Adulte en chambre triple", price: pricing.triple, qty: rooms.triple },
    ].filter((r) => r.price > 0);

    const total = roomLines.reduce((s, r) => s + r.qty * r.price, 0);
    const currency = pricing.currency || "DZD";
    const waNumber = settings?.contact_whatsapp || "213770932563";

    const validate = () => {
        const e = {};
        if (!selectedDate && futureDates.length > 0) e.date = "Veuillez choisir une date de départ.";
        const totalPax = roomLines.reduce((s, r) => s + r.qty, 0);
        if (totalPax === 0) e.rooms = "Veuillez sélectionner au moins une chambre.";
        if (!client.nom.trim() || client.nom.trim().length < 3) e.nom = "Nom & Prénom requis (3 caractères min.).";
        const gsm = client.gsm.replace(/[\s-]/g, "");
        if (!PHONE_RE.test(gsm)) e.gsm = "Numéro de téléphone algérien invalide (ex: 0661234567).";
        if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) e.email = "Adresse email invalide.";
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        const msg = buildWhatsAppMessage(destination, selectedDate, roomLines, client, commentaire, paiement);
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
                    <p className="text-gray-600 mb-6 text-sm">
                        Votre demande de réservation pour <span className="font-semibold">{destination.name}</span> a
                        été transmise à notre équipe via WhatsApp. Nous vous contacterons dans les plus brefs délais.
                    </p>
                    <Link
                        to={`/voyages-organises/${tripId}`}
                        className="inline-block px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm hover:bg-sky-700 transition-colors"
                    >
                        Retour au voyage
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">

                {/* Back link */}
                <Link
                    to={`/voyages-organises/${tripId}`}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-sky-600 mb-6 transition-colors"
                >
                    <ChevronLeft size={16} />
                    Retour au voyage
                </Link>

                {/* Trip header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    {destination.image_url && (
                        <img
                            src={resolveMediaUrl(destination.image_url)}
                            alt={destination.name}
                            className="w-full h-36 object-cover"
                        />
                    )}
                    <div className="p-4 sm:p-5">
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900">{destination.name}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {destination.duration?.days} jours · Départ de {destination.departureFrom}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-6">

                    {/* Departure date */}
                    {futureDates.length > 0 && (
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <Calendar className="w-4 h-4 text-sky-500" />
                                Date de départ *
                            </h2>
                            <select
                                value={selectedDate}
                                onChange={(e) => { setSelectedDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })); }}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none bg-white"
                            >
                                <option value="">— Choisir une date —</option>
                                {futureDates.map((d, i) => (
                                    <option key={i} value={d.outbound}>
                                        {fmtDate(d.outbound)}{d.return ? ` → ${fmtDate(d.return)}` : ""}
                                    </option>
                                ))}
                            </select>
                            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                        </section>
                    )}

                    {/* Room type */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <Users className="w-4 h-4 text-sky-500" />
                            Type de chambre *
                        </h2>
                        <div className="space-y-3">
                            {roomLines.map((r) => (
                                <div key={r.key} className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{r.label}</p>
                                        <p className="text-xs text-gray-500">à partir de {fmtPrice(r.price)} {currency} / pers.</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setRooms((p) => ({ ...p, [r.key]: Math.max(0, p[r.key] - 1) }))}
                                            className="w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-lg flex items-center justify-center"
                                        >−</button>
                                        <span className="w-6 text-center text-sm font-semibold">{r.qty}</span>
                                        <button
                                            type="button"
                                            onClick={() => setRooms((p) => ({ ...p, [r.key]: p[r.key] + 1 }))}
                                            className="w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-lg flex items-center justify-center"
                                        >+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.rooms && <p className="text-red-500 text-xs mt-2">{errors.rooms}</p>}
                        {total > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm font-bold text-gray-900">
                                <span>Total estimé</span>
                                <span>{fmtPrice(total)} {currency}</span>
                            </div>
                        )}
                    </section>

                    {/* Client info */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h2 className="font-bold text-gray-900 mb-4">Informations Client</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nom & Prénom *</label>
                                <input
                                    type="text"
                                    value={client.nom}
                                    onChange={(e) => { setClient((p) => ({ ...p, nom: e.target.value })); setErrors((p) => ({ ...p, nom: undefined })); }}
                                    placeholder="Ex : Amir Benali"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                                />
                                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">GSM *</label>
                                <input
                                    type="tel"
                                    value={client.gsm}
                                    onChange={(e) => { setClient((p) => ({ ...p, gsm: e.target.value })); setErrors((p) => ({ ...p, gsm: undefined })); }}
                                    placeholder="Ex : 0661234567"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                                />
                                {errors.gsm && <p className="text-red-500 text-xs mt-1">{errors.gsm}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={client.email}
                                    onChange={(e) => { setClient((p) => ({ ...p, email: e.target.value })); setErrors((p) => ({ ...p, email: undefined })); }}
                                    placeholder="optionnel"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Adresse</label>
                                <input
                                    type="text"
                                    value={client.adresse}
                                    onChange={(e) => setClient((p) => ({ ...p, adresse: e.target.value }))}
                                    placeholder="optionnel"
                                    maxLength={255}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Commentaire */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <MessageSquare className="w-4 h-4 text-sky-500" />
                            Commentaire
                        </h2>
                        <textarea
                            value={commentaire}
                            onChange={(e) => setCommentaire(e.target.value)}
                            rows={3}
                            maxLength={1000}
                            placeholder="Demandes spéciales, informations complémentaires…"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none resize-none"
                        />
                        <p className="text-xs text-gray-400 text-right mt-1">{commentaire.length}/1000</p>
                    </section>

                    {/* Mode de paiement */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <CreditCard className="w-4 h-4 text-sky-500" />
                            Mode de paiement
                        </h2>
                        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold">
                            {[
                                { value: "AGENCE",  label: "Paiement à l'agence" },
                                { value: "VIREMENT", label: "Versement bancaire" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setPaiement(opt.value)}
                                    className={`flex-1 py-2.5 transition-colors ${paiement === opt.value ? "bg-sky-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 transition-all hover:scale-[1.02] text-base"
                    >
                        Finalisez ma réservation
                    </button>

                </form>
            </div>
        </div>
    );
}