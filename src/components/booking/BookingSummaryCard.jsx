// src/components/booking/BookingSummaryCard.jsx
import {
    Hotel, MapPin, Calendar, Moon, BedDouble,
    Users, Utensils, Tag, Star,
} from "lucide-react";

const BOARDING_LABELS = {
    RO: "Chambre Seule",
    BB: "Bed & Breakfast",
    HB: "Demi-Pension",
    FB: "Pension Complète",
    AI: "Tout Inclus",
    SC: "Self Catering",
};

function Row({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-2 shrink-0">
                <Icon size={13} className="text-sky-400 shrink-0" />
                <span className="text-xs text-gray-400 font-semibold">{label}</span>
            </div>
            <span className="text-xs font-extrabold text-gray-700 text-right leading-snug">
                {value}
            </span>
        </div>
    );
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
        rooms = [],
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
        <div className="sticky top-[110px]">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">

                {/* ── Gradient header ── */}
                <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 px-5 pt-5 pb-8">
                    <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Hotel size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-extrabold text-white leading-tight truncate">
                                {hotelName ?? "Hôtel"}
                            </h3>
                            {(city || country) && (
                                <p className="text-sky-300 text-xs font-medium mt-0.5 flex items-center gap-1">
                                    <MapPin size={10} />
                                    {city}{country ? `, ${country}` : ""}
                                </p>
                            )}
                            {stars > 0 && (
                                <div className="flex items-center gap-0.5 mt-1.5">
                                    {Array(stars).fill(null).map((_, i) => (
                                        <Star key={i} size={11} className="fill-amber-300 text-amber-300" />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Pull-up white body ── */}
                <div className="bg-white rounded-t-2xl -mt-4 relative z-10 px-5 pt-5 pb-5">

                    {/* Detail rows */}
                    <div className="mb-4">
                        {checkIn && checkOut && (
                            <Row icon={Calendar}  label="Dates"    value={`${checkIn} → ${checkOut}`} />
                        )}
                        {nights > 0 && (
                            <Row icon={Moon}      label="Durée"    value={`${nights} nuit${nights > 1 ? "s" : ""}`} />
                        )}
                        {rooms.length > 0 && (
                            <Row icon={BedDouble} label="Chambres" value={`${rooms.length} chambre${rooms.length > 1 ? "s" : ""}`} />
                        )}
                        {totalAdults > 0 && (
                            <Row
                                icon={Users}
                                label="Voyageurs"
                                value={`${totalAdults} adulte${totalAdults > 1 ? "s" : ""}${totalChildren > 0 ? ` · ${totalChildren} enfant${totalChildren > 1 ? "s" : ""}` : ""}`}
                            />
                        )}
                        {boardingType && (
                            <Row icon={Utensils} label="Pension" value={boardLabel} />
                        )}
                    </div>

                    {/* Room type lines */}
                    {rooms.length > 0 && (
                        <div className="flex flex-col gap-1.5 mb-4">
                            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">
                                Types de chambre
                            </p>
                            {rooms.map((room, i) => {
                                // ✅ FIX: HotelLightCard sends `name` + `price`
                                //         HotelDetails  sends `roomType` + `total`
                                const label      = room.roomType ?? room.name ?? `Chambre ${i + 1}`;
                                const roomTotal  = room.total > 0
                                    ? room.total
                                    : (room.price ? room.price * (nights ?? 1) : 0);
                                return (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between gap-2 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Tag size={11} className="text-sky-400 shrink-0" />
                                            <span className="text-xs font-bold text-sky-700 truncate">
                                                {label}
                                            </span>
                                        </div>
                                        {roomTotal > 0 && (
                                            <span className="text-xs font-extrabold text-sky-600 shrink-0">
                                                {new Intl.NumberFormat("fr-DZ").format(roomTotal)} {currency}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="border-t border-gray-100 my-4" />

                    {/* Total price */}
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-4 text-center">
                        <p className="text-[10px] text-sky-500 uppercase tracking-widest font-extrabold mb-1.5">
                            Total du séjour
                        </p>
                        <p className="text-2xl font-extrabold text-sky-700 leading-none">
                            {new Intl.NumberFormat("fr-DZ").format(totalPrice)}
                            <span className="text-sm font-semibold text-sky-400 ml-1.5">{currency}</span>
                        </p>
                        {nights > 1 && totalPrice > 0 && (
                            <p className="text-[11px] text-sky-400 mt-1.5 font-medium">
                                ≈ {new Intl.NumberFormat("fr-DZ").format(Math.round(totalPrice / nights))} {currency} / nuit
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}