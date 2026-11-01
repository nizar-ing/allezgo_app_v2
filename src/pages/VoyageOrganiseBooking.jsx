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

export default function VoyageOrganiseBooking() {
    const { tripId } = useParams();
    const [searchParams] = useSearchParams();
    const hotelParam = searchParams.get("hotel");

    const { data: destination, isLoading, error } = useDestination(tripId);
    const { settings } = useSettings();

    const [selectedDate, setSelectedDate] = useState("");
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
                        {selectedAcc && (
                            <p className="text-xs text-sky-600 mt-1 font-medium">
                                Hébergement sélectionné : {selectedAcc.hotel}
                            </p>
                        )}
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
                                        <p className="text-xs text-gray-500">
                                            à partir de {fmtPrice(r.price)} {currency} / pers.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setRooms((p) => ({ ...p, [r.key]: Math.max(0, (p[r.key] ?? 0) - 1) }))}
                                            className="w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-lg flex items-center justify-center"
                                        >−</button>
                                        <span className="w-6 text-center text-sm font-semibold">{r.qty}</span>
                                        <button
                                            type="button"
                                            onClick={() => setRooms((p) => ({ ...p, [r.key]: (p[r.key] ?? 0) + 1 }))}
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
                        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold mb-4">
                            {[
                                { value: "AGENCE",   label: "Paiement à l'agence" },
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
                                        {settings.bank_name && (
                                            <p className="text-xs text-gray-500 mb-0.5">{settings.bank_name}</p>
                                        )}
                                        <p className="text-sm font-mono font-semibold text-gray-800">{settings.bank_rib}</p>
                                        {settings.bank_holder && (
                                            <p className="text-xs text-gray-500 mt-0.5">Au nom de : {settings.bank_holder}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* CGV */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={cgv}
                                onChange={(e) => { setCgv(e.target.checked); setErrors((p) => ({ ...p, cgv: undefined })); }}
                                className="mt-0.5 w-4 h-4 accent-sky-600 shrink-0"
                            />
                            <span className="text-sm text-gray-700">
                                J'accepte les{" "}
                                <span className="text-sky-600 font-semibold">conditions générales de vente</span>
                                {" "}et confirme avoir pris connaissance des informations relatives au voyage.
                            </span>
                        </label>
                        {errors.cgv && <p className="text-red-500 text-xs mt-2 ml-7">{errors.cgv}</p>}
                    </section>

                    {errors.submit && (
                        <p className="text-center text-red-500 text-sm">{errors.submit}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/30 transition-all hover:scale-[1.02] text-base"
                    >
                        {submitting ? "Envoi en cours…" : "Confirmer ma réservation"}
                    </button>

                </form>
            </div>
        </div>
    );
}
