// src/components/booking/BookingSummaryCard.jsx
import { MapPin, Printer } from "lucide-react";

const RECEIPT_EMERGE_CSS = `
@keyframes receipt-emerge {
  from { clip-path: inset(0 0 100% 0); }
  to   { clip-path: inset(0 0 0% 0); }
}
`;

const BOARDING_LABELS = {
    RO: "Chambre Seule",
    BB: "Bed & Breakfast",
    HB: "Demi-Pension",
    FB: "Pension Complète",
    AI: "Tout Inclus",
    SC: "Self Catering",
};

// Receipt bottom edge — zigzag perforation, computed once at module load
// Mirrors the technique in ui/receipt-printer/ReceiptPrinter.tsx
const TOOTH_COUNT  = 24;
const TOOTH_DEPTH  = 5;
const toothPoints  = Array.from({ length: TOOTH_COUNT * 2 }, (_, i) => {
    const x = 100 - ((i + 1) * 100) / (TOOTH_COUNT * 2);
    const y = i % 2 === 0 ? "100%" : `calc(100% - ${TOOTH_DEPTH}px)`;
    return `${x}% ${y}`;
}).join(", ");
const RECEIPT_CLIP = `polygon(0 0, 100% 0, 100% calc(100% - ${TOOTH_DEPTH}px), ${toothPoints})`;

function ReceiptRow({ label, value }) {
    return (
        <div className="flex items-baseline justify-between gap-2 py-[3px]">
            <span className="font-mono text-[9px] font-semibold text-zinc-400 uppercase tracking-[0.18em] shrink-0">
                {label}
            </span>
            <span className="font-mono text-[11px] font-bold text-zinc-700 text-right leading-snug">
                {value}
            </span>
        </div>
    );
}

function ReceiptDivider() {
    return <div className="border-t border-dashed border-zinc-200 my-3" />;
}

export default function BookingSummaryCard({ bookingState }) {
    if (!bookingState) return null;

    const {
        hotelName,
        hotel,
        checkIn,
        checkOut,
        nights,
        boardingType,
        rooms    = [],
        totalPrice,
        currency = "DZD",
    } = bookingState;

    const stars      = hotel?.Category?.Star ?? 0;
    const city       = hotel?.City?.Name ?? "";
    const country    = hotel?.City?.Country?.Name ?? "";
    const boardLabel = BOARDING_LABELS[boardingType] ?? boardingType ?? "—";

    const totalAdults   = rooms.reduce((acc, r) => acc + (r.adults   ?? 0), 0);
    const totalChildren = rooms.reduce((acc, r) => acc + (r.children ?? 0), 0);

    return (
        <>
        <style>{RECEIPT_EMERGE_CSS}</style>
        <div className="sticky top-[110px]">

            {/* ── Printer machine body ─────────────────────────────────── */}
            <div className="relative bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 rounded-2xl pt-4 px-4 pb-5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55),0_8px_16px_-6px_rgba(0,0,0,0.3)] border border-zinc-600/40 overflow-hidden">

                {/* Plastic sheen overlay */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(255,255,255,0.09)_0%,transparent_100%)]"
                />

                {/* Machine header row */}
                <div className="relative flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-zinc-600/50 flex items-center justify-center border border-zinc-500/30 shadow-inner">
                            <Printer size={13} className="text-zinc-300" />
                        </div>
                        <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-zinc-300">
                            Allez<span className="text-sky-400">Go</span>
                        </span>
                    </div>
                    <span className="font-mono text-[8px] tracking-[0.18em] uppercase text-emerald-400 bg-emerald-900/25 border border-emerald-700/35 rounded-full px-2.5 py-1">
                        En cours
                    </span>
                </div>

                {/* LCD screen */}
                <div className="relative bg-zinc-950 rounded-xl px-4 py-4 border border-zinc-700/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.65),inset_0_0_28px_rgba(0,0,0,0.25)] overflow-hidden">
                    {/* CRT scanline texture */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-xl bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.07)_2px,rgba(0,0,0,0.07)_4px)]"
                    />
                    {/* Screen inner glow */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_28px_4px_rgba(0,0,0,0.45)]"
                    />

                    <div className="relative z-10">
                        <p className="font-mono text-[8px] text-emerald-600/80 uppercase tracking-[0.28em] mb-2">
                            Réservation · Hôtel
                        </p>
                        <p className="font-mono text-[13px] text-white font-bold leading-tight truncate">
                            {hotelName ?? "Hôtel"}
                        </p>
                        {(city || country) && (
                            <p className="font-mono text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                                <MapPin size={8} className="text-zinc-500 shrink-0" />
                                {city}{country ? `, ${country}` : ""}
                            </p>
                        )}
                        {stars > 0 && (
                            <p className="font-mono text-[11px] text-amber-400 mt-1.5 leading-none">
                                {"★".repeat(stars)}
                                <span className="text-zinc-700">{"★".repeat(Math.max(0, 5 - stars))}</span>
                            </p>
                        )}

                        <div className="border-t border-zinc-800 mt-3 pt-2.5 flex items-center justify-between">
                            <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-[0.2em]">
                                Total
                            </span>
                            <span className="font-mono text-[15px] font-extrabold text-emerald-400 tracking-tight leading-none">
                                {new Intl.NumberFormat("fr-DZ").format(totalPrice)}
                                <span className="text-[9px] text-emerald-600/80 ml-1.5 font-semibold">{currency}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Paper feed slot */}
                <div
                    aria-hidden="true"
                    className="mt-4 mx-3 h-2 rounded-sm bg-zinc-950 border border-zinc-700/70 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]"
                />
            </div>

            {/* ── Thermal receipt paper emerging from the slot ─────────── */}
            <div
                className="relative z-10 -mt-1.5 mx-3"
                style={{ animation: 'receipt-emerge 2.5s steps(50, end) 0.5s both' }}
            >
                <article
                    style={{ clipPath: RECEIPT_CLIP }}
                    className="bg-[#fafaf7] px-5 pt-6 pb-14 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.22),0_4px_10px_-4px_rgba(0,0,0,0.12)]"
                >
                    {/* Receipt title */}
                    <div className="text-center mb-4">
                        <p className="font-mono text-[9px] text-zinc-500 font-semibold uppercase tracking-[0.25em]">
                            — Récapitulatif de réservation —
                        </p>
                    </div>

                    {/* Booking details rows */}
                    {checkIn && checkOut && (
                        <>
                            <ReceiptRow label="Check-in"  value={checkIn}  />
                            <ReceiptRow label="Check-out" value={checkOut} />
                        </>
                    )}
                    {nights > 0 && (
                        <ReceiptRow label="Durée" value={`${nights} nuit${nights > 1 ? "s" : ""}`} />
                    )}
                    {rooms.length > 0 && (
                        <ReceiptRow label="Chambres" value={`${rooms.length} chambre${rooms.length > 1 ? "s" : ""}`} />
                    )}
                    {totalAdults > 0 && (
                        <ReceiptRow
                            label="Voyageurs"
                            value={`${totalAdults} adulte${totalAdults > 1 ? "s" : ""}${totalChildren > 0 ? ` · ${totalChildren} enf.` : ""}`}
                        />
                    )}
                    {boardingType && (
                        <ReceiptRow label="Pension" value={boardLabel} />
                    )}

                    {/* Room breakdown */}
                    {rooms.length > 0 && (
                        <>
                            <ReceiptDivider />
                            <p className="font-mono text-[8px] text-zinc-400 uppercase tracking-[0.22em] mb-2">
                                Détail chambres
                            </p>
                            {rooms.map((room, i) => {
                                const label     = room.roomType ?? room.name ?? `Chambre ${i + 1}`;
                                // ✅ STAY TOTAL: Use room price directly without math logic.
                                const roomTotal = room.price ?? room.total ?? 0;
                                return (
                                    <div
                                        key={i}
                                        className="flex items-baseline justify-between gap-2 py-[3px]"
                                    >
                                        <span className="font-mono text-[10px] text-zinc-500 truncate min-w-0">
                                            {label}
                                        </span>
                                        {roomTotal > 0 && (
                                            <span className="font-mono text-[10px] font-bold text-zinc-700 shrink-0">
                                                {new Intl.NumberFormat("fr-DZ").format(roomTotal)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}

                    <ReceiptDivider />

                    {/* Total */}
                    <div>
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-bold">
                                Total du séjour
                            </span>
                            <span className="font-mono text-base font-extrabold text-zinc-900 leading-none">
                                {/* ✅ SOURCE OF TRUTH: totalPrice read directly from props with ZERO multiplication. */}
                                {new Intl.NumberFormat("fr-DZ").format(totalPrice)}
                                <span className="font-mono text-[10px] text-zinc-400 ml-1 font-semibold">{currency}</span>
                            </span>
                        </div>
                        {/* ✅ PER-NIGHT: division for display only, never stored */}
                        {nights > 1 && totalPrice > 0 && (
                            <p className="font-mono text-[9px] text-zinc-400 text-right mt-1">
                                ≈ {new Intl.NumberFormat("fr-DZ").format(Math.round(totalPrice / nights))} {currency} / nuit
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <div className="border-t border-dashed border-zinc-200 mb-3" />
                        <p className="font-mono text-[11px] text-zinc-500 font-semibold uppercase tracking-[0.25em]">
                            Merci de votre confiance
                        </p>
                        <p className="font-mono text-[11px] text-zinc-400 font-bold tracking-widest mt-0.5">
                            allezgoo.com
                        </p>
                    </div>
                </article>
            </div>

        </div>
        </>
    );
}