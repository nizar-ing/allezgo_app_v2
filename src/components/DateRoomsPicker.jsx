// src/components/DateRoomsPicker.jsx
import {useState} from 'react';
import {DayPicker} from 'react-day-picker';
import 'react-day-picker/style.css';
import {Calendar, Hotel, RefreshCw, X} from 'lucide-react';
import {IoAddOutline, IoTrashOutline} from 'react-icons/io5';
import toast from 'react-hot-toast';

// ── Internal utils ─────────────────────────────────────────────────────────────
const computeNights = (checkIn, checkOut) =>
    checkIn && checkOut
        ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
        : 1;

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'short',
    });
};

// ── Component ──────────────────────────────────────────────────────────────────
function DateRoomsPicker({value, onChange, onConfirm, onClose, isLoading = false}) {

    // ── Internal UI state ──────────────────────────────────────────────────────
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [dateRange,    setDateRange]    = useState({
        from: value.checkIn  ? new Date(value.checkIn)  : undefined,
        to:   value.checkOut ? new Date(value.checkOut) : undefined,
    });

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleDateRangeSelect = (range) => {
        if (!range?.from) return;
        setDateRange(range);
        onChange(prev => ({
            ...prev,
            checkIn:  range.from.toISOString().split('T')[0],
            checkOut: range.to
                ? range.to.toISOString().split('T')[0]
                : range.from.toISOString().split('T')[0],
        }));
    };

    const handleAddRoom = () =>
        onChange(prev => ({
            ...prev,
            rooms: [...prev.rooms, {adults: 1, children: []}],
        }));

    const handleRemoveRoom = (index) => {
        if (value.rooms.length <= 1)
            return toast.error('Au moins une chambre requise');
        onChange(prev => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index),
        }));
    };

    const handleUpdateRoomAdults = (index, val) => {
        const n = parseInt(val);
        if (n < 1 || n > 6) return;
        onChange(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) =>
                i === index ? {...room, adults: n} : room),
        }));
    };

    const handleAddChild = (roomIndex) =>
        onChange(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) => {
                if (i !== roomIndex) return room;
                if (room.children.length >= 4) {
                    toast.error('Maximum 4 enfants par chambre');
                    return room;
                }
                return {...room, children: [...room.children, 1]};
            }),
        }));

    const handleRemoveChild = (roomIndex, childIndex) =>
        onChange(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) =>
                i === roomIndex
                    ? {...room, children: room.children.filter((_, ci) => ci !== childIndex)}
                    : room),
        }));

    const handleUpdateChildAge = (roomIndex, childIndex, age) => {
        const ageNum = parseInt(age);
        if (ageNum < 1 || ageNum > 11) return;
        onChange(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) =>
                i === roomIndex
                    ? {
                        ...room,
                        children: room.children.map((a, ci) =>
                            ci === childIndex ? ageNum : a),
                    }
                    : room),
        }));
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="mt-5 rounded-2xl border border-sky-100 bg-white shadow-xl overflow-hidden">

            {/* ── Header strip ─────────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <Calendar size={18} className="text-white"/>
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm leading-tight">Modifier le séjour</p>
                        <p className="text-sky-100 text-xs">Dates · Chambres · Voyageurs</p>
                    </div>
                </div>
                <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                    <span className="text-white font-bold text-sm">
                        {(() => {
                            const n = computeNights(value.checkIn, value.checkOut);
                            return (isNaN(n) || n <= 0) ? '—' : `${n} nuit${n > 1 ? 's' : ''}`;
                        })()}
                    </span>
                </div>
            </div>

            {/* ── Dates summary ─────────────────────────────────────────────── */}
            <div className="px-5 py-3 bg-sky-50 border-b border-sky-100 flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 bg-white rounded-xl px-4 py-2.5 border border-sky-200 shadow-sm">
                        <p className="text-[10px] text-sky-800 font-semibold uppercase tracking-widest mb-0.5">Arrivée</p>
                        <p className="text-sm font-bold text-gray-800">{formatDate(value.checkIn)}</p>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                        <div className="w-8 h-px bg-sky-300"/>
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-400"/>
                        <div className="w-8 h-px bg-sky-300"/>
                    </div>
                    <div className="flex-1 bg-white rounded-xl px-4 py-2.5 border border-sky-200 shadow-sm">
                        <p className="text-[10px] text-sky-800 font-semibold uppercase tracking-widest mb-0.5">Départ</p>
                        <p className="text-sm font-bold text-gray-800">{formatDate(value.checkOut)}</p>
                    </div>
                </div>
            </div>

            {/* ── Main body ─────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

                {/* ── Calendar ─────────────────────────────────────────────── */}
                <div className="w-full lg:w-[340px] flex-shrink-0 p-5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                        Sélectionnez vos dates
                    </p>
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={() => {
                                const m = new Date(currentMonth);
                                m.setMonth(m.getMonth() - 1);
                                setCurrentMonth(m);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-sky-100 hover:text-sky-600 text-gray-500 font-bold transition-all text-base"
                            aria-label="Mois précédent"
                        >‹</button>
                        <span className="text-sm font-bold text-gray-800 capitalize">
                            {currentMonth.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})}
                        </span>
                        <button
                            onClick={() => {
                                const m = new Date(currentMonth);
                                m.setMonth(m.getMonth() + 1);
                                setCurrentMonth(m);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-sky-100 hover:text-sky-600 text-gray-500 font-bold transition-all text-base"
                            aria-label="Mois suivant"
                        >›</button>
                    </div>
                    <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={handleDateRangeSelect}
                        disabled={date => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                        }}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        numberOfMonths={1}
                        className="custom-day-picker"
                    />
                </div>

                {/* ── Rooms & Guests ────────────────────────────────────────── */}
                <div className="flex-1 p-5 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Chambres &amp; Voyageurs
                        </p>
                        <span className="text-xs text-sky-600 font-semibold bg-sky-50 px-2 py-1 rounded-lg border border-sky-100">
                            {value.rooms.length} chambre{value.rooms.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[380px] filter-scroll pr-1 flex-1">
                        {value.rooms.map((room, index) => (
                            <div
                                key={`room-${index}-${room.adults}`}
                                className="rounded-xl border border-gray-200 bg-gray-50 hover:border-sky-200 hover:bg-sky-50/40 transition-all overflow-hidden"
                            >
                                {/* Room header */}
                                <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center">
                                            <Hotel size={12} className="text-sky-600"/>
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">Chambre {index + 1}</span>
                                    </div>
                                    {value.rooms.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveRoom(index)}
                                            className="w-6 h-6 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                                        >
                                            <IoTrashOutline size={14}/>
                                        </button>
                                    )}
                                </div>

                                <div className="px-4 py-3 space-y-3">
                                    {/* Adults */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-gray-700">Adultes</p>
                                            <p className="text-[10px] text-gray-400">18 ans et plus</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUpdateRoomAdults(index, room.adults - 1)}
                                                disabled={room.adults <= 1}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-gray-200 hover:border-sky-400 hover:bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:text-sky-600 font-bold text-sm transition-all"
                                            >−</button>
                                            <span className="w-6 text-center text-sm font-bold text-gray-800">
                                                {room.adults}
                                            </span>
                                            <button
                                                onClick={() => handleUpdateRoomAdults(index, room.adults + 1)}
                                                disabled={room.adults >= 6}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-gray-200 hover:border-sky-400 hover:bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:text-sky-600 font-bold text-sm transition-all"
                                            >+</button>
                                        </div>
                                    </div>

                                    <div className="border-t border-dashed border-gray-200"/>

                                    {/* Children */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-gray-700">Enfants</p>
                                            <p className="text-[10px] text-gray-400">De 1 à 11 ans</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => room.children.length > 0 && handleRemoveChild(index, room.children.length - 1)}
                                                disabled={room.children.length === 0}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-gray-200 hover:border-pink-400 hover:bg-pink-50 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:text-pink-600 font-bold text-sm transition-all"
                                            >−</button>
                                            <span className="w-6 text-center text-sm font-bold text-gray-800">
                                                {room.children.length}
                                            </span>
                                            <button
                                                onClick={() => handleAddChild(index)}
                                                disabled={room.children.length >= 4}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-gray-200 hover:border-pink-400 hover:bg-pink-50 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:text-pink-600 font-bold text-sm transition-all"
                                            >+</button>
                                        </div>
                                    </div>

                                    {/* Child ages */}
                                    {room.children.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            {room.children.map((childAge, childIndex) => (
                                                <div
                                                    key={childIndex}
                                                    className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1.5 border border-gray-200"
                                                >
                                                    <span className="text-[10px] text-gray-500 font-semibold whitespace-nowrap">
                                                        Enf. {childIndex + 1}
                                                    </span>
                                                    <select
                                                        value={childAge}
                                                        onChange={e => handleUpdateChildAge(index, childIndex, e.target.value)}
                                                        className="flex-1 text-xs font-bold text-gray-700 bg-transparent border-none outline-none cursor-pointer"
                                                    >
                                                        {[...Array(11)].map((_, i) => (
                                                            <option key={i + 1} value={i + 1}>
                                                                {i + 1} an{i + 1 > 1 ? 's' : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleRemoveChild(index, childIndex)}
                                                        className="text-red-300 hover:text-red-500 transition-colors flex-shrink-0"
                                                    >
                                                        <X size={12}/>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {value.rooms.length < 5 && (
                        <button
                            onClick={handleAddRoom}
                            className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-sky-400 hover:bg-sky-50 text-gray-400 hover:text-sky-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all group"
                        >
                            <IoAddOutline size={16} className="group-hover:scale-110 transition-transform"/>
                            Ajouter une chambre
                        </button>
                    )}
                </div>
            </div>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                <button
                    onClick={onConfirm}
                    disabled={!value.checkIn || !value.checkOut || isLoading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-500 to-sky-700 hover:from-orange-500 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-300 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"/>
                            Recherche en cours...
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16}/>
                            Actualiser les prix
                        </>
                    )}
                </button>
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 border-2 border-gray-200 hover:border-gray-300 text-white text-sm font-semibold transition-all"
                >
                    Fermer
                </button>
            </div>
        </div>
    );
}

export default DateRoomsPicker;