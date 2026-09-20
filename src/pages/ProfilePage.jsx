import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../services/ApiClient.js";
import {
    User, Mail, Phone, Shield, CalendarDays, Hotel,
    Home, Landmark, CreditCard,
    CheckCircle2, Clock4, XCircle, BanIcon,
    ArrowRight, Loader2, AlertCircle, Luggage,
    RefreshCw, FileText, X, TrendingUp, MapPin
} from "lucide-react";
import useAuth from "../custom-hooks/useAuth.js";
import useMyBookings from "../custom-hooks/useMyBookings.js";

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    PENDING: {
        label: "En attente",
        icon: Clock4,
        bar: "bg-amber-400",
        badge: "bg-amber-50 border-amber-200 text-amber-700",
        footer: "bg-amber-50/60 border-amber-100",
        shadow: "shadow-amber-100/60",
    },
    CONFIRMED: {
        label: "Confirmée",
        icon: CheckCircle2,
        bar: "bg-emerald-500",
        badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
        footer: "bg-emerald-50/60 border-emerald-100",
        shadow: "shadow-emerald-100/60",
    },
    REJECTED: {
        label: "Rejetée",
        icon: XCircle,
        bar: "bg-rose-500",
        badge: "bg-rose-50 border-rose-200 text-rose-600",
        footer: "bg-rose-50/60 border-rose-100",
        shadow: "shadow-rose-100/60",
    },
    CANCELLED: {
        label: "Annulée",
        icon: BanIcon,
        bar: "bg-slate-400",
        badge: "bg-slate-50 border-slate-200 text-slate-500",
        footer: "bg-slate-50/60 border-slate-100",
        shadow: "shadow-slate-100/60",
    },
};

// ─── Payment Method Badge ─────────────────────────────────────────────────────
const PAYMENT_BADGE = {
    AGENCE: { label: "Agence", Icon: Home, cls: "bg-sky-50 text-sky-600 border-sky-200" },
    VIREMENT: { label: "Virement", Icon: Landmark, cls: "bg-violet-50 text-violet-600 border-violet-200" },
    ONLINE: { label: "En ligne", Icon: CreditCard, cls: "bg-teal-50 text-teal-600 border-teal-200" },
};

// ─── Resolved Hotel Name ──────────────────────────────────────────────────────
function ResolvedHotelName({ hotelId, fallbackName }) {
    const isNumeric = !isNaN(fallbackName) || !isNaN(hotelId);
    const targetId = hotelId || fallbackName;
    const { data: resolvedName, isLoading } = useQuery({
        queryKey: ["hotel-name-resolve", targetId],
        enabled: !!targetId && isNumeric,
        staleTime: Infinity,
        queryFn: async () => {
            try {
                const detail = await apiClient.getHotel(targetId);
                return detail?.Name || detail?.HotelName || detail?.name || fallbackName;
            } catch {
                return fallbackName;
            }
        },
    });

    if (!isNumeric) return <>{fallbackName}</>;
    if (isLoading) return (
        <span className="inline-block w-28 h-3.5 bg-slate-200 rounded animate-pulse" />
    );
    return <>{resolvedName || fallbackName}</>;
}

// ─── Travel Card ──────────────────────────────────────────────────────────────
function TravelCard({ booking, onViewReceipt }) {
    const statusKey = booking.status ?? "PENDING";
    const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.PENDING;
    const StatusIcon = cfg.icon;
    const payment = PAYMENT_BADGE[booking.paymentMethod];
    const price = new Intl.NumberFormat("fr-DZ").format(booking.clientPrice ?? 0);

    const formatDate = (d) => {
        if (!d) return "—";
        try {
            return new Intl.DateTimeFormat("fr-DZ", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
        } catch { return d; }
    };

    return (
        <div className={`group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg ${cfg.shadow} overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-0.5`}>

            {/* Status bar — left edge */}
            <div className={`absolute inset-y-0 left-0 w-1 ${cfg.bar} rounded-l-2xl`} />

            {/* Card body */}
            <div className="pl-5 pr-5 pt-5 pb-4 flex flex-col gap-4 flex-1">

                {/* Top row: reference + payment */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Référence</p>
                        <span className="text-sm font-black text-slate-700 tracking-wider font-mono">{booking.reference ?? `#${booking.id}`}</span>
                    </div>
                    {payment && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold ${payment.cls} shrink-0`}>
                            <payment.Icon size={10} />
                            {payment.label}
                        </span>
                    )}
                </div>

                {/* Hotel name — prominent */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-sky-50 group-hover:border-sky-100 transition-colors">
                        <Hotel size={18} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Hôtel</p>
                        <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                            <ResolvedHotelName hotelId={booking.hotelId} fallbackName={booking.hotelName || String(booking.hotelId) || "N/A"} />
                        </p>
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: "Arrivée", value: formatDate(booking.checkIn) },
                        { label: "Départ", value: formatDate(booking.checkOut) },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50/80 rounded-xl px-3 py-2.5 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                <CalendarDays size={9} /> {label}
                            </p>
                            <p className="text-xs font-bold text-slate-700">{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className={`px-5 py-3.5 ${cfg.footer} border-t`}>
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Montant total</p>
                        <p className="text-base font-black text-slate-800">
                            {price} <span className="text-xs font-semibold text-slate-400">DZD</span>
                        </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold ${cfg.badge}`}>
                        <StatusIcon size={12} />
                        {cfg.label}
                    </span>
                </div>

                {booking.receiptFilename && (
                    <button
                        onClick={() => onViewReceipt(booking.receiptFilename)}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-colors border border-slate-200"
                    >
                        <FileText size={13} /> Voir le reçu
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Profile Field ────────────────────────────────────────────────────────────
function ProfileField({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3.5 py-3.5 border-b border-slate-100 last:border-0">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-slate-500" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{value}</p>
            </div>
        </div>
    );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────
function StatChip({ label, value, accent }) {
    return (
        <div className={`flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border ${accent.border} shadow-sm`}>
            <div className={`w-9 h-9 rounded-xl ${accent.iconBg} flex items-center justify-center shrink-0`}>
                <accent.Icon size={16} className={accent.iconColor} />
            </div>
            <div>
                <p className={`text-xl font-black ${accent.text} leading-none`}>{value}</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{label}</p>
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
    const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

    const confirmed = bookings.filter(b => b.status === "CONFIRMED").length;
    const pending = bookings.filter(b => b.status === "PENDING").length;

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ── Hero Banner ────────────────────────────────────────────────── */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                {/* Geometric grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)`,
                        backgroundSize: "40px 40px",
                    }}
                />
                {/* Warm glow orbs */}
                <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 left-1/3 w-56 h-56 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

                <div className="relative max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center sm:items-end gap-6">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-orange-900/40">
                            <span className="text-2xl font-black text-white tracking-tight">{initials}</span>
                        </div>
                        <div className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-slate-900 text-[9px] font-black
                            ${user?.role === "admin" ? "bg-violet-500 text-white" : "bg-emerald-500 text-white"}`}>
                            {user?.role === "admin" ? "A" : "C"}
                        </div>
                    </div>

                    <div className="text-center sm:text-left">
                        <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                            <MapPin size={12} className="text-orange-400" />
                            <span className="text-orange-400/80 text-xs font-semibold tracking-wide uppercase">AllezGoo Voyages</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight leading-none">{fullName}</h1>
                        <p className="text-slate-400 text-sm mt-1.5">{user?.email}</p>
                        <span className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                            ${user?.role === "admin"
                                ? "bg-violet-500/20 border border-violet-400/30 text-violet-300"
                                : "bg-emerald-500/20 border border-emerald-400/30 text-emerald-300"
                            }`}>
                            <Shield size={10} />
                            {user?.role === "admin" ? "Administrateur" : "Voyageur"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Stats bar ──────────────────────────────────────────────────── */}
            {!isLoading && (
                <div className="max-w-5xl mx-auto px-6 -mt-5 mb-6 relative z-10">
                    <div className="grid grid-cols-3 gap-3">
                        <StatChip
                            label="Total réservations"
                            value={bookings.length}
                            accent={{
                                Icon: Luggage,
                                border: "border-slate-200",
                                iconBg: "bg-slate-100",
                                iconColor: "text-slate-500",
                                text: "text-slate-800",
                            }}
                        />
                        <StatChip
                            label="Confirmées"
                            value={confirmed}
                            accent={{
                                Icon: CheckCircle2,
                                border: "border-emerald-100",
                                iconBg: "bg-emerald-50",
                                iconColor: "text-emerald-500",
                                text: "text-emerald-700",
                            }}
                        />
                        <StatChip
                            label="En attente"
                            value={pending}
                            accent={{
                                Icon: Clock4,
                                border: "border-amber-100",
                                iconBg: "bg-amber-50",
                                iconColor: "text-amber-500",
                                text: "text-amber-700",
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ── Content grid ───────────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* ── Left: Profile card ── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                        <User size={15} className="text-slate-500" />
                        <h2 className="text-sm font-bold text-slate-700">Mes Informations</h2>
                    </div>
                    <div className="px-5 pb-2">
                        <ProfileField icon={User} label="Nom complet" value={fullName} />
                        <ProfileField icon={Mail} label="Adresse e-mail" value={user?.email ?? "—"} />
                        <ProfileField icon={Phone} label="Téléphone" value={user?.phone ?? "—"} />
                        <ProfileField icon={Shield} label="Statut" value={user?.role === "admin" ? "Administrateur" : "Voyageur"} />
                    </div>
                </div>

                {/* ── Right: Bookings ── */}
                <div className="lg:col-span-2 flex flex-col gap-4">

                    {/* Section header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-700">Mes Réservations</h2>
                            {!isLoading && bookings.length > 0 && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                                    {bookings.length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
                            title="Rafraîchir"
                        >
                            <RefreshCw size={15} className={isFetching ? "animate-spin text-slate-600" : ""} />
                        </button>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3">
                            <Loader2 size={24} className="animate-spin text-slate-400" />
                            <p className="text-sm font-medium text-slate-400">Chargement de vos réservations…</p>
                        </div>
                    )}

                    {/* Error */}
                    {isError && !isLoading && (
                        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-8 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                                <AlertCircle size={22} className="text-rose-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700">Impossible de charger vos réservations.</p>
                            <p className="text-xs text-slate-400">Veuillez réessayer dans quelques instants.</p>
                            <button
                                onClick={() => refetch()}
                                className="mt-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                            >
                                Réessayer
                            </button>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && !isError && bookings.length === 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-5">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                                    <Luggage size={32} className="text-slate-300" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                                    <TrendingUp size={12} className="text-orange-400" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-base font-bold text-slate-700">Aucun voyage prévu</p>
                                <p className="text-sm text-slate-400 mt-1 max-w-xs">Planifiez votre prochain séjour et retrouvez toutes vos réservations ici.</p>
                            </div>
                            <button
                                onClick={() => navigate("/")}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                            >
                                Explorer les hôtels <ArrowRight size={14} />
                            </button>
                        </div>
                    )}

                    {/* Travel Cards Grid */}
                    {!isLoading && !isError && bookings.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {bookings.map((booking) => (
                                <TravelCard key={booking.id} booking={booking} onViewReceipt={setSelectedReceipt} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Receipt Viewer Modal ────────────────────────────────────────── */}
            {selectedReceipt && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setSelectedReceipt(null)}
                >
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                                <FileText size={18} className="text-slate-500" />
                                Reçu de Paiement
                            </h3>
                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 overflow-auto bg-slate-50 flex justify-center">
                            <img
                                src={`${import.meta.env.VITE_API_BASE_URL || "https://api.allezgoo.com"}/api/bookings/receipt/${selectedReceipt}`}
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
