import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../services/ApiClient.js";
import { AllezGoApi } from "../services/allezgo-api/allezGoApi.js";
import {
    User, Mail, Phone, Shield,
    Home, Landmark, CreditCard,
    CheckCircle2, Clock4, XCircle, BanIcon,
    ArrowRight, Loader2, AlertCircle,
    RefreshCw, FileText, X, MapPin, Compass
} from "lucide-react";
import useAuth from "../custom-hooks/useAuth.js";
import useMyBookings from "../custom-hooks/useMyBookings.js";
import VoucherModal from "../components/admin/VoucherModal";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
    ivory:       '#FAF6EF',
    navy:        '#0D1B2A',
    terracotta:  '#C05621',
    parchment:   '#F5EDE0',
    border:      '#E8DDD0',
    warmGray:    '#9B8F82',
    darkText:    '#1C1917',
};

// ─── Injected Styles ──────────────────────────────────────────────────────────
const PG_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=Jost:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  .pg-page  { font-family: 'Jost', system-ui, sans-serif; }
  .pg-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
  .pg-mono  { font-family: 'DM Mono', 'Courier New', monospace; }

  @keyframes pgFadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pgReveal {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pgOrb {
    0%, 100% { transform: scale(1) translate(0, 0);       opacity: 0.12; }
    40%      { transform: scale(1.08) translate(12px, -8px); opacity: 0.18; }
    70%      { transform: scale(0.94) translate(-6px, 10px); opacity: 0.09; }
  }

  .pg-fade-up { animation: pgFadeUp  0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .pg-reveal  { animation: pgReveal  0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .pg-orb     { animation: pgOrb 9s ease-in-out infinite; }

  .pg-boarding {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #FFFFFF;
    border: 1px solid #E8DDD0;
    border-radius: 18px;
    box-shadow: 0 2px 16px rgba(13,27,42,0.07), 0 1px 3px rgba(13,27,42,0.04);
    transition: box-shadow 0.35s ease, transform 0.35s ease;
  }
  .pg-boarding:hover {
    box-shadow: 0 10px 36px rgba(13,27,42,0.13), 0 3px 10px rgba(13,27,42,0.07);
    transform: translateY(-4px);
  }

  .pg-shine-wrap { position: relative; overflow: hidden; }
  .pg-shine-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.07) 50%, transparent 62%);
    transform: translateX(-110%);
    transition: transform 0.75s ease;
    pointer-events: none;
  }
  .pg-boarding:hover .pg-shine-wrap::after { transform: translateX(110%); }

  .pg-field-last { border-bottom: none !important; }
`;

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    PENDING: {
        label:  'En attente',
        icon:   Clock4,
        color:  '#B45309',
        bg:     'rgba(180,83,9,0.07)',
        border: 'rgba(180,83,9,0.2)',
        bar:    '#F59E0B',
    },
    CONFIRMED: {
        label:  'Confirmée',
        icon:   CheckCircle2,
        color:  '#047857',
        bg:     'rgba(4,120,87,0.07)',
        border: 'rgba(4,120,87,0.2)',
        bar:    '#10B981',
    },
    REJECTED: {
        label:  'Rejetée',
        icon:   XCircle,
        color:  '#B91C1C',
        bg:     'rgba(185,28,28,0.07)',
        border: 'rgba(185,28,28,0.2)',
        bar:    '#EF4444',
    },
    CANCELLED: {
        label:  'Annulée',
        icon:   BanIcon,
        color:  '#64748B',
        bg:     'rgba(100,116,139,0.06)',
        border: 'rgba(100,116,139,0.18)',
        bar:    '#94A3B8',
    },
};

// ─── Payment Badge ────────────────────────────────────────────────────────────
const PAYMENT_BADGE = {
    AGENCE:   { label: 'Agence',   Icon: Home,       color: '#0369A1', bg: 'rgba(3,105,161,0.09)'   },
    VIREMENT: { label: 'Virement', Icon: Landmark,   color: '#6D28D9', bg: 'rgba(109,40,217,0.09)'  },
    ONLINE:   { label: 'En ligne', Icon: CreditCard, color: '#0D9488', bg: 'rgba(13,148,136,0.09)'  },
};

// ─── Resolved Hotel Name ──────────────────────────────────────────────────────
function ResolvedHotelName({ hotelId, fallbackName, dark }) {
    const isNumeric = !isNaN(fallbackName) || !isNaN(hotelId);
    const targetId  = hotelId || fallbackName;
    const { data: resolvedName, isLoading } = useQuery({
        queryKey:  ['hotel-name-resolve', targetId],
        enabled:   !!targetId && isNumeric,
        staleTime: Infinity,
        queryFn: async () => {
            try {
                const detail = await apiClient.getHotel(targetId);
                return detail?.Name || detail?.HotelName || detail?.name || fallbackName;
            } catch { return fallbackName; }
        },
    });
    if (!isNumeric) return <>{fallbackName}</>;
    if (isLoading)  return (
        <span style={{
            display: 'inline-block', width: 110, height: 14, verticalAlign: 'middle',
            background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(13,27,42,0.08)',
            borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite',
        }} />
    );
    return <>{resolvedName || fallbackName}</>;
}

// ─── Travel Card — Boarding Pass ──────────────────────────────────────────────
function TravelCard({ booking, onViewReceipt, onViewVoucher, animDelay }) {
    const statusKey  = booking.status ?? 'PENDING';
    const cfg        = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.PENDING;
    const StatusIcon = cfg.icon;
    const payment    = PAYMENT_BADGE[booking.paymentMethod];
    const price      = new Intl.NumberFormat('fr-DZ').format(booking.clientPrice ?? 0);

    const fmt = (d) => {
        if (!d) return '—';
        try { return new Intl.DateTimeFormat('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d)); }
        catch { return d; }
    };

    return (
        <div className="pg-boarding pg-fade-up" style={{ animationDelay: `${animDelay}s` }}>

            {/* Status accent bar — left edge */}
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                background: cfg.bar, borderRadius: '18px 0 0 18px',
            }} />

            {/* ── Dark top section ── */}
            <div className="pg-shine-wrap" style={{ background: T.navy, padding: '20px 20px 18px 24px' }}>
                {/* Reference + Payment row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="pg-mono" style={{
                        fontSize: 12, fontWeight: 500, color: T.terracotta, letterSpacing: '0.09em',
                    }}>
                        {booking.reference ?? `#${booking.id}`}
                    </span>
                    {payment && (
                        <span className="flex items-center gap-1" style={{
                            fontSize: 9, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.65)',
                            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 6, padding: '3px 7px',
                        }}>
                            <payment.Icon size={8} />
                            {payment.label}
                        </span>
                    )}
                </div>

                {/* Hotel name */}
                <p className="pg-serif" style={{
                    fontSize: 'clamp(17px, 3vw, 22px)', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.01em',
                    color: '#FFFFFF', marginBottom: 9,
                }}>
                    <ResolvedHotelName dark hotelId={booking.hotelId} fallbackName={booking.hotelName || String(booking.hotelId) || 'N/A'} />
                </p>

                {/* Stub */}
                <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>
                    <MapPin size={8} />
                    <span className="pg-mono" style={{ letterSpacing: '0.1em' }}>ALLEZGOO VOYAGES</span>
                </div>
            </div>

            {/* ── Perforation divider ── */}
            <div style={{ position: 'relative', height: 0, margin: '0 -1px', zIndex: 10 }}>
                <div style={{
                    position: 'absolute', left: -11, top: -11, width: 22, height: 22,
                    borderRadius: '50%', background: T.ivory, border: `1px solid ${T.border}`,
                }} />
                <div style={{
                    position: 'absolute', left: 22, right: 22, top: -0.5,
                    borderTop: `1.5px dashed ${T.border}`,
                }} />
                <div style={{
                    position: 'absolute', right: -11, top: -11, width: 22, height: 22,
                    borderRadius: '50%', background: T.ivory, border: `1px solid ${T.border}`,
                }} />
            </div>

            {/* ── Light bottom section ── */}
            <div style={{ padding: '22px 20px 0 24px', flex: 1, background: '#FDFAF7' }}>
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                    {[
                        { label: 'ARRIVÉE', value: fmt(booking.checkIn)  },
                        { label: 'DÉPART',  value: fmt(booking.checkOut) },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p className="pg-mono" style={{
                                fontSize: 8, fontWeight: 500, color: T.warmGray,
                                letterSpacing: '0.12em', marginBottom: 6,
                            }}>
                                {label}
                            </p>
                            <p className="pg-serif" style={{ fontSize: 17, fontWeight: 600, color: T.darkText, lineHeight: 1 }}>
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Price + Status row */}
                <div style={{
                    borderTop: `1px solid ${T.border}`, paddingTop: 16, paddingBottom: 16,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8,
                }}>
                    <div>
                        <p className="pg-mono" style={{ fontSize: 8, fontWeight: 500, color: T.warmGray, letterSpacing: '0.1em', marginBottom: 4 }}>
                            MONTANT
                        </p>
                        <p className="pg-serif" style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: 600, color: T.darkText, lineHeight: 1 }}>
                            {price}&nbsp;
                            <span style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 500, color: T.warmGray, fontFamily: "'Jost', sans-serif" }}>DZD</span>
                        </p>
                    </div>
                    <span className="flex items-center gap-1.5" style={{
                        padding: '6px 12px', borderRadius: 8,
                        border: `1.5px solid ${cfg.border}`, background: cfg.bg,
                        color: cfg.color, fontSize: 11, fontWeight: 700,
                        fontFamily: "'Jost', sans-serif", letterSpacing: '0.05em',
                        textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>
                        <StatusIcon size={11} />
                        {cfg.label}
                    </span>
                </div>
            </div>

            {/* ── Action buttons ── */}
            {(booking.receiptFilename || booking.status === 'CONFIRMED') && (
                <div style={{ padding: '0 20px 18px 24px', background: '#FDFAF7', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {booking.receiptFilename && (
                        <button
                            onClick={() => onViewReceipt(booking.receiptFilename)}
                            className="flex items-center justify-center gap-1.5 w-full transition-colors"
                            style={{
                                padding: '9px 0', background: 'transparent',
                                border: `1px solid ${T.border}`, borderRadius: 10, cursor: 'pointer',
                                color: T.darkText, fontSize: 11, fontWeight: 600,
                                fontFamily: "'Jost', sans-serif", letterSpacing: '0.04em',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(13,27,42,0.04)'; e.currentTarget.style.borderColor = '#C0B0A0'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.border; }}
                        >
                            <FileText size={11} /> Voir le reçu
                        </button>
                    )}
                    {booking.status === 'CONFIRMED' && (
                        <button
                            onClick={() => onViewVoucher(booking)}
                            className="flex items-center justify-center gap-1.5 w-full"
                            style={{
                                padding: '10px 0',
                                background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                                border: 'none', borderRadius: 10, cursor: 'pointer',
                                color: '#FFFFFF', fontSize: 11, fontWeight: 700,
                                fontFamily: "'Jost', sans-serif", letterSpacing: '0.05em',
                                boxShadow: '0 2px 10px rgba(4,120,87,0.28)',
                                transition: 'filter 0.2s, box-shadow 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(4,120,87,0.38)'; }}
                            onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(4,120,87,0.28)'; }}
                        >
                            <FileText size={11} /> Voir le Voucher
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Profile Field ────────────────────────────────────────────────────────────
function ProfileField({ icon: Icon, label, value, last }) {
    return (
        <div
            className={`flex items-center gap-3.5 py-4 ${last ? 'pg-field-last' : ''}`}
            style={{ borderBottom: `1px solid ${T.border}` }}
        >
            <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(13,27,42,0.04)', border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={15} style={{ color: T.navy }} />
            </div>
            <div className="min-w-0">
                <p className="pg-mono" style={{
                    fontSize: 9, fontWeight: 500, color: T.warmGray,
                    letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1, marginBottom: 4,
                }}>
                    {label}
                </p>
                <p className="pg-sans" style={{
                    fontSize: 'clamp(13px, 2vw, 15px)', fontWeight: 600, color: T.darkText,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {value}
                </p>
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, accent, delay }) {
    return (
        <div className="pg-reveal flex flex-col items-center sm:items-start gap-1 px-3 sm:px-5 lg:px-6 py-3.5 sm:py-4 lg:py-5" style={{
            background: '#FFFFFF', border: `1px solid ${T.border}`,
            borderLeft: `3px solid ${accent}`, borderRadius: 13,
            animationDelay: delay,
        }}>
            <p className="pg-serif" style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 600, color: T.darkText, lineHeight: 0.9 }}>
                {value}
            </p>
            <p className="pg-mono" style={{ fontSize: 'clamp(7px, 1.5vw, 9px)', fontWeight: 500, color: T.warmGray, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 5 }}>
                {label}
            </p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { bookings, isLoading, isError, refetch, isFetching } = useMyBookings();

    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [receiptBlobUrl,  setReceiptBlobUrl]  = useState(null);
    const [receiptLoading,  setReceiptLoading]  = useState(false);

    const openReceipt = useCallback(async (filename) => {
        setSelectedReceipt(filename);
        setReceiptBlobUrl(null);
        setReceiptLoading(true);
        try {
            const blob = await AllezGoApi.client.get(`/api/bookings/my/receipt/${filename}`, { responseType: 'blob' });
            setReceiptBlobUrl(URL.createObjectURL(blob));
        } catch { setReceiptBlobUrl(null); }
        finally   { setReceiptLoading(false); }
    }, []);

    const closeReceipt = useCallback(() => {
        setSelectedReceipt(null);
        if (receiptBlobUrl) { URL.revokeObjectURL(receiptBlobUrl); setReceiptBlobUrl(null); }
    }, [receiptBlobUrl]);

    const fullName  = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—';
    const initials  = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
    const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
    const pending   = bookings.filter(b => b.status === 'PENDING').length;

    return (
        <div className="pg-page min-h-screen" style={{ background: T.ivory }}>
            <style>{PG_STYLES}</style>

            {/* ── Hero ──────────────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden" style={{ background: T.navy }}>
                {/* Grid pattern */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.035,
                    backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)`,
                    backgroundSize: '38px 38px',
                }} />
                {/* Terracotta orb */}
                <div className="pg-orb" style={{
                    position: 'absolute', top: -80, right: '18%',
                    width: 320, height: 320, borderRadius: '50%',
                    background: T.terracotta, filter: 'blur(90px)',
                    opacity: 0.12, pointerEvents: 'none',
                }} />
                {/* Teal orb */}
                <div style={{
                    position: 'absolute', bottom: -80, left: '12%',
                    width: 220, height: 220, borderRadius: '50%',
                    background: '#1AACB0', filter: 'blur(80px)',
                    opacity: 0.07, pointerEvents: 'none',
                }} />

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-8">

                        {/* Wax-seal avatar */}
                        <div className="pg-fade-up relative shrink-0" style={{ animationDelay: '0s' }}>
                            <div style={{
                                width: 82, height: 82, borderRadius: '50%',
                                background: `radial-gradient(140deg, #D4691C 0%, #8B3A16 100%)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 0 0 4px rgba(192,86,33,0.22), 0 0 0 9px rgba(192,86,33,0.07), 0 10px 36px rgba(0,0,0,0.45)`,
                            }}>
                                <span className="pg-serif" style={{ fontSize: 28, fontWeight: 600, fontStyle: 'italic', color: '#FFFFFF', lineHeight: 1 }}>
                                    {initials}
                                </span>
                            </div>
                            <div style={{
                                position: 'absolute', bottom: 1, right: 1,
                                width: 22, height: 22, borderRadius: '50%',
                                background: user?.role === 'admin' ? '#7C3AED' : '#10B981',
                                border: `2.5px solid ${T.navy}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Shield size={9} style={{ color: '#fff' }} />
                            </div>
                        </div>

                        {/* Name + meta */}
                        <div className="pg-fade-up text-center sm:text-left" style={{ animationDelay: '0.09s' }}>
                            <p className="pg-mono" style={{
                                fontSize: 9, fontWeight: 500, color: T.terracotta,
                                letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 7,
                            }}>
                                Espace Voyageur · AllezGoo
                            </p>
                            <h1 className="pg-serif" style={{
                                fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 600,
                                color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 7,
                            }}>
                                {fullName}
                            </h1>
                            <p className="pg-sans" style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.42)', marginBottom: 11 }}>
                                {user?.email}
                            </p>
                            <span className="pg-mono inline-flex items-center gap-1.5" style={{
                                fontSize: 9, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
                                padding: '4px 11px', borderRadius: 20,
                                background: user?.role === 'admin' ? 'rgba(124,58,237,0.14)' : 'rgba(16,185,129,0.12)',
                                border: user?.role === 'admin' ? '1px solid rgba(124,58,237,0.28)' : '1px solid rgba(16,185,129,0.24)',
                                color:  user?.role === 'admin' ? '#A78BFA' : '#6EE7B7',
                            }}>
                                <Shield size={8} />
                                {user?.role === 'admin' ? 'Administrateur' : 'Voyageur'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats bar ─────────────────────────────────────────────────────── */}
            {!isLoading && (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-4 mb-5 relative z-10">
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                        <StatCard value={bookings.length} label="Réservations" accent={T.terracotta} delay="0.12s" />
                        <StatCard value={confirmed}       label="Confirmées"   accent="#10B981"       delay="0.17s" />
                        <StatCard value={pending}         label="En attente"   accent="#F59E0B"       delay="0.22s" />
                    </div>
                </div>
            )}

            {/* ── Content grid ──────────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 sm:pb-16 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start">

                {/* ── Profile card ── */}
                <div className="pg-reveal" style={{
                    background: '#FFFFFF', border: `1px solid ${T.border}`,
                    borderRadius: 16, overflow: 'hidden', animationDelay: '0.15s',
                }}>
                    {/* Passport-style header */}
                    <div style={{ background: T.navy, padding: '14px 18px 13px' }}>
                        <p className="pg-mono" style={{
                            fontSize: 8, color: 'rgba(255,255,255,0.38)',
                            letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3,
                        }}>
                            Passeport Voyageur
                        </p>
                        <p className="pg-serif" style={{ fontSize: 19, fontWeight: 600, color: '#FFFFFF', lineHeight: 1 }}>
                            Mes Informations
                        </p>
                    </div>
                    {/* Fields */}
                    <div style={{ padding: '2px 18px 6px' }}>
                        <ProfileField icon={User}   label="Nom complet"   value={fullName}                                              />
                        <ProfileField icon={Mail}   label="Adresse e-mail" value={user?.email ?? '—'}                                   />
                        <ProfileField icon={Phone}  label="Téléphone"     value={user?.phone ?? '—'}                                    />
                        <ProfileField icon={Shield} label="Statut"        value={user?.role === 'admin' ? 'Administrateur' : 'Voyageur'} last />
                    </div>
                </div>

                {/* ── Bookings panel ── */}
                <div className="md:col-span-2 flex flex-col gap-4">

                    {/* Section header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="pg-serif" style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 600, color: T.darkText, letterSpacing: '-0.01em' }}>
                                Mes Réservations
                            </h2>
                            {!isLoading && bookings.length > 0 && (
                                <span className="pg-mono" style={{
                                    fontSize: 10, fontWeight: 500, color: T.warmGray,
                                    padding: '2px 9px', borderRadius: 20,
                                    background: 'rgba(155,143,130,0.1)', border: `1px solid ${T.border}`,
                                    letterSpacing: '0.05em',
                                }}>
                                    {bookings.length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            style={{
                                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                                background: 'transparent', border: `1px solid ${T.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: T.warmGray, transition: 'all 0.2s',
                                opacity: isFetching ? 0.5 : 1,
                            }}
                            title="Rafraîchir"
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(13,27,42,0.04)'; e.currentTarget.style.color = T.darkText; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.warmGray; }}
                        >
                            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div style={{
                            background: '#FFFFFF', border: `1px solid ${T.border}`,
                            borderRadius: 16, padding: '52px 0',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                        }}>
                            <Loader2 size={22} className="animate-spin" style={{ color: T.warmGray }} />
                            <p className="pg-mono" style={{ fontSize: 10, color: T.warmGray, letterSpacing: '0.08em' }}>
                                Chargement des réservations…
                            </p>
                        </div>
                    )}

                    {/* Error — only when cached bookings exist but refresh failed */}
                    {isError && !isLoading && bookings.length > 0 && (
                        <div style={{
                            background: '#FFFFFF', border: '1px solid rgba(239,68,68,0.18)',
                            borderRadius: 16, padding: '36px 24px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                        }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.14)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <AlertCircle size={20} style={{ color: '#EF4444' }} />
                            </div>
                            <p className="pg-sans" style={{ fontSize: 13, fontWeight: 600, color: T.darkText }}>Impossible de charger vos réservations.</p>
                            <p className="pg-sans" style={{ fontSize: 11, color: T.warmGray }}>Veuillez réessayer dans quelques instants.</p>
                            <button
                                onClick={() => refetch()}
                                style={{
                                    marginTop: 4, padding: '8px 22px',
                                    background: 'rgba(13,27,42,0.05)', border: `1px solid ${T.border}`,
                                    borderRadius: 9, cursor: 'pointer',
                                    color: T.darkText, fontSize: 11, fontWeight: 700,
                                    fontFamily: "'Jost', sans-serif", letterSpacing: '0.04em',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(13,27,42,0.09)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(13,27,42,0.05)'; }}
                            >
                                Réessayer
                            </button>
                        </div>
                    )}

                    {/* Empty state — shown whenever bookings.length === 0 */}
                    {!isLoading && bookings.length === 0 && (
                        <div style={{
                            background: '#FFFFFF', border: `1px solid ${T.border}`,
                            borderRadius: 16, padding: '52px 24px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center',
                        }}>
                            {/* Compass icon */}
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: 72, height: 72, borderRadius: '50%',
                                    background: 'rgba(13,27,42,0.03)', border: `2px dashed ${T.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Compass size={30} style={{ color: T.border }} />
                                </div>
                                <div style={{
                                    position: 'absolute', top: -5, right: -5,
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: '#FFF7ED', border: '1px solid rgba(192,86,33,0.18)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <MapPin size={10} style={{ color: T.terracotta }} />
                                </div>
                            </div>

                            <div>
                                <p className="pg-serif" style={{ fontSize: 21, fontWeight: 600, color: T.darkText, marginBottom: 7 }}>
                                    Aucun voyage prévu
                                </p>
                                <p className="pg-sans" style={{ fontSize: 13, fontWeight: 400, color: T.warmGray, maxWidth: 270 }}>
                                    Planifiez votre prochain séjour et retrouvez toutes vos réservations ici.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/')}
                                className="inline-flex items-center gap-2"
                                style={{
                                    padding: '11px 26px',
                                    background: T.navy, border: 'none', borderRadius: 11,
                                    cursor: 'pointer', color: '#FFFFFF', fontSize: 12, fontWeight: 700,
                                    fontFamily: "'Jost', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase',
                                    boxShadow: '0 4px 18px rgba(13,27,42,0.2)',
                                    transition: 'filter 0.2s, box-shadow 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.18)'; e.currentTarget.style.boxShadow = '0 6px 26px rgba(13,27,42,0.3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(13,27,42,0.2)'; }}
                            >
                                Explorer les hôtels <ArrowRight size={13} />
                            </button>

                            {isError && (
                                <button
                                    onClick={() => refetch()}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: 11, color: T.warmGray, textDecoration: 'underline',
                                        fontFamily: "'Jost', sans-serif", transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#0369A1'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = T.warmGray; }}
                                >
                                    Réessayer le chargement
                                </button>
                            )}
                        </div>
                    )}

                    {/* Boarding pass cards grid */}
                    {!isLoading && bookings.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {bookings.map((booking, i) => (
                                <TravelCard
                                    key={booking.id}
                                    booking={booking}
                                    onViewReceipt={openReceipt}
                                    onViewVoucher={setSelectedVoucher}
                                    animDelay={i * 0.07}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Receipt Modal ──────────────────────────────────────────────────── */}
            {selectedReceipt && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    style={{ background: 'rgba(13,27,42,0.78)', backdropFilter: 'blur(6px)' }}
                    onClick={closeReceipt}
                >
                    <div
                        className="relative rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
                        style={{ background: '#FFFFFF' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center px-4 py-3 sm:p-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                            <h3 className="pg-sans font-bold text-sm sm:text-base flex items-center gap-2" style={{ color: T.darkText }}>
                                <FileText size={14} style={{ color: T.warmGray }} />
                                Reçu de Paiement
                            </h3>
                            <button
                                onClick={closeReceipt}
                                style={{
                                    width: 30, height: 30, borderRadius: '50%',
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: T.warmGray, transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(13,27,42,0.06)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-3 sm:p-4 overflow-auto flex justify-center" style={{ background: T.ivory }}>
                            {receiptLoading && (
                                <div className="flex items-center gap-2 py-10" style={{ color: T.warmGray }}>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="pg-mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>Chargement…</span>
                                </div>
                            )}
                            {!receiptLoading && receiptBlobUrl && (
                                <img src={receiptBlobUrl} alt="Reçu de paiement" className="max-w-full h-auto rounded-xl shadow-sm" />
                            )}
                            {!receiptLoading && !receiptBlobUrl && (
                                <div className="flex flex-col items-center gap-2 py-10" style={{ color: T.warmGray }}>
                                    <AlertCircle size={18} />
                                    <span className="pg-mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>Impossible de charger le reçu.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <VoucherModal
                isOpen={!!selectedVoucher}
                onClose={() => setSelectedVoucher(null)}
                booking={selectedVoucher}
            />
        </div>
    );
}
