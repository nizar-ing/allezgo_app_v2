import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../services/ApiClient.js";
import {
    User, Mail, Phone, Shield, CalendarDays, Hotel,
    Home, Landmark, CreditCard,
    CheckCircle2, Clock4, XCircle,
    ArrowRight, Loader2, AlertCircle, Luggage,
    RefreshCw, FileText, X
} from "lucide-react";
import useAuth from "../custom-hooks/useAuth.js";
import useMyBookings from "../custom-hooks/useMyBookings.js";

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    PENDING: {
        label: "En attente de vérification",
        icon: Clock4,
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        dot: "bg-amber-400",
        glow: "shadow-amber-100",
    },
    CONFIRMED: {
        label: "Réservation Confirmée",
        icon: CheckCircle2,
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        dot: "bg-emerald-400",
        glow: "shadow-emerald-100",
    },
    REJECTED: {
        label: "Annulée / Rejetée",
        icon: XCircle,
        bg: "bg-rose-50",
        border: "border-rose-200",
        text: "text-rose-600",
        dot: "bg-rose-400",
        glow: "shadow-rose-100",
    },
};

// ─── Payment Method Badge ─────────────────────────────────────────────────────
const PAYMENT_BADGE = {
    agency: { label: "Agence", Icon: Home, cls: "bg-sky-50 text-sky-600 border-sky-200" },
    home: { label: "Virement", Icon: Landmark, cls: "bg-purple-50 text-purple-600 border-purple-200" },
    online: { label: "En ligne", Icon: CreditCard, cls: "bg-teal-50 text-teal-600 border-teal-200" },
};

// ─── Resolved Hotel Name ──────────────────────────────────────────────────────
function ResolvedHotelName({ hotelId, fallbackName }) {
    // Check if the fallbackName is a number string (e.g. "6524")
    const isNumeric = !isNaN(fallbackName) || !isNaN(hotelId);
    const targetId = hotelId || fallbackName;
    const { data: resolvedName, isLoading } = useQuery({
        queryKey: ["hotel-name-resolve", targetId],
        enabled: !!targetId && isNumeric,
        staleTime: Infinity, // Cache the name forever in memory during this session
        queryFn: async () => {
            try {
                // Fetch directly from the external iPro API via your proxy
                const detail = await apiClient.getHotel(targetId);
                // iPro usually returns Name or HotelName depending on the endpoint
                return detail?.Name || detail?.HotelName || detail?.name || fallbackName;
            } catch (error) {
                console.warn(`Could not resolve hotel name for ID: ${targetId}`);
                return fallbackName;
            }
        }
    });

    if (!isNumeric) return <>{fallbackName}</>;
    if (isLoading) return <span className="animate-pulse bg-slate-200 text-transparent rounded px-2">Chargement...</span>;
    return <>{resolvedName || fallbackName}</>;
}

// ─── Travel Card ──────────────────────────────────────────────────────────────
function TravelCard({ booking, onViewReceipt }) {
    const statusKey = booking.status ?? "PENDING";
    const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.PENDING;
    const StatusIcon = cfg.icon;

    const payment = PAYMENT_BADGE[booking.paymentMethod];
    const ref = `ALG-${booking.id.toString().padStart(3, "0")}`;
    const price = new Intl.NumberFormat("fr-DZ").format(booking.clientPrice ?? 0);

    const formatDate = (d) => {
        if (!d) return "—";
        try {
            return new Intl.DateTimeFormat("fr-DZ", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
        } catch { return d; }
    };

    return (
        <div className={`relative bg-white rounded-2xl border ${cfg.border} shadow-md ${cfg.glow} overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5 hover:shadow-lg`}>

            {/* Top accent bar */}
            <div className={`h-1.5 w-full ${cfg.dot.replace("bg-", "bg-")} ${cfg.dot}`} />

            {/* Card Body */}
            <div className="p-5 flex flex-col gap-4 flex-1">

                {/* Header row: ref + payment badge */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-sky-700 tracking-wide font-mono">{ref}</span>
                    {payment && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${payment.cls}`}>
                            <payment.Icon size={11} />
                            {payment.label}
                        </span>
                    )}
                </div>

                {/* Hotel */}
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                        <Hotel size={17} className="text-sky-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Hôtel</p>
                        <p className="text-sm font-bold text-slate-800 leading-tight">
                            <ResolvedHotelName hotelId={booking.hotelId} fallbackName={booking.hotelName || booking.hotelId || "N/A"} />
                        </p>
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: "Check-in", value: formatDate(booking.checkIn) },
                        { label: "Check-out", value: formatDate(booking.checkOut) },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                <CalendarDays size={9} /> {label}
                            </p>
                            <p className="text-xs font-bold text-slate-700">{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer: price + status */}
            <div className={`px-5 py-3.5 ${cfg.bg} border-t ${cfg.border}`}>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Total</p>
                        <p className="text-base font-extrabold text-sky-700">{price} <span className="text-xs font-bold text-slate-500">DZD</span></p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                        <StatusIcon size={13} />
                        {cfg.label}
                    </span>
                </div>
                {booking.receiptFilename && (
                    <button
                        onClick={() => onViewReceipt(booking.receiptFilename)}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                    >
                        <FileText size={14} /> Voir le reçu
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Profile Info Item ────────────────────────────────────────────────────────
function ProfileField({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-sky-600" />
            </div>
            <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { bookings, isLoading, isError, refetch, isFetching } = useMyBookings();
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—";

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50/70 via-white to-slate-100/80">

            {/* ── Hero Banner ── */}
            <div className="relative bg-gradient-to-r from-sky-950 via-sky-900 to-sky-800 overflow-hidden">
                {/* Decorative bubbles */}
                <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
                <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-orange-400/10 blur-3xl" />

                <div className="relative w-[95%] max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-xl shrink-0">
                        <span className="text-3xl font-extrabold text-white">
                            {(user?.firstName?.[0] ?? "?").toUpperCase()}
                        </span>
                    </div>
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl font-extrabold text-white tracking-tight">{fullName}</h1>
                        <p className="text-sky-300 text-sm font-medium mt-0.5">{user?.email}</p>
                        <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                            ${user?.role === "admin"
                                ? "bg-purple-900/60 border-purple-500 text-purple-200"
                                : "bg-emerald-900/60 border-emerald-500 text-emerald-200"
                            }`}>
                            <Shield size={11} />
                            {user?.role === "admin" ? "Administrateur" : "Client"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-5/6 mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* ── Left column: Profile card ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                        <User size={16} className="text-sky-500" /> Mes Informations
                    </h2>
                    <div>
                        <ProfileField icon={User} label="Nom complet" value={fullName} />
                        <ProfileField icon={Mail} label="Adresse e-mail" value={user?.email ?? "—"} />
                        <ProfileField icon={Phone} label="Téléphone" value={user?.phone ?? "—"} />
                        <ProfileField icon={Shield} label="Rôle" value={user?.role === "admin" ? "Administrateur" : "Client"} />
                    </div>
                </div>

                {/* ── Right column: Bookings ── */}
                <div className="lg:col-span-2 flex flex-col gap-5">

                    {/* Section header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                            <Luggage size={17} className="text-sky-500" />
                            Mes Réservations
                            {!isLoading && bookings.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-bold rounded-full">
                                    {bookings.length}
                                </span>
                            )}
                        </h2>
                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Rafraîchir"
                        >
                            <RefreshCw size={18} className={isFetching ? "animate-spin text-sky-600" : ""} />
                        </button>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3 text-sky-600">
                            <Loader2 size={28} className="animate-spin" />
                            <p className="text-sm font-medium text-slate-500">Chargement de vos réservations...</p>
                        </div>
                    )}

                    {/* Error */}
                    {isError && !isLoading && (
                        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-8 flex flex-col items-center gap-3 text-rose-500">
                            <AlertCircle size={28} />
                            <p className="text-sm font-semibold text-slate-600">Impossible de charger vos réservations.</p>
                            <p className="text-xs text-slate-400">Veuillez réessayer dans quelques instants.</p>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && !isError && bookings.length === 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-4 text-slate-400">
                            <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                                <Luggage size={30} className="text-sky-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-600">Aucune réservation pour l'instant</p>
                                <p className="text-xs text-slate-400 mt-1">Explorez nos hôtels et planifiez votre prochain séjour !</p>
                            </div>
                            <button
                                onClick={() => navigate("/")}
                                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                            >
                                Explorer les hôtels <ArrowRight size={15} />
                            </button>
                        </div>
                    )}

                    {/* Travel Cards Grid */}
                    {!isLoading && !isError && bookings.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {bookings.map((booking) => (
                                <TravelCard key={booking.id} booking={booking} onViewReceipt={setSelectedReceipt} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Receipt Viewer Modal */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedReceipt(null)}>
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <FileText size={20} className="text-sky-500" /> Reçu de Paiement
                            </h3>
                            <button onClick={() => setSelectedReceipt(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 overflow-auto bg-slate-50 flex justify-center">
                            <img
                                src={`${import.meta.env.VITE_API_BASE_URL || 'https://api.allezgoo.com'}/api/bookings/receipt/${selectedReceipt}`}
                                alt="Reçu de paiement"
                                className="max-w-full h-auto rounded-lg shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
