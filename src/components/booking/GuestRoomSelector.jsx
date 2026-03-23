// src/components/GuestRoomSelector.jsx
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Users, Plus, Minus, Trash2, Home, User, CheckCircle2 } from 'lucide-react';

// ✅ Fix #9 — module-level constant, never recreated
const AGE_OPTIONS = Array.from({ length: 11 }, (_, i) => i + 1);

function GuestRoomSelector({ rooms, setRooms }) {
    const [showGuestPicker, setShowGuestPicker] = useState(false);
    const guestPickerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (guestPickerRef.current && !guestPickerRef.current.contains(event.target)) {
                setShowGuestPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { adults, children } = useMemo(() =>
            rooms.reduce(
                (acc, room) => ({
                    adults:   acc.adults   + room.adults,
                    children: acc.children + room.children.length,
                }),
                { adults: 0, children: 0 }
            ),
        [rooms]);

    const updateRoomAdults = useCallback((roomId, operation) => {
        setRooms(prev => prev.map(room => {
            if (room.id !== roomId) return room;
            const newValue = operation === "increment" ? room.adults + 1 : room.adults - 1;
            if (newValue < 1 || newValue > 5) return room;
            return { ...room, adults: newValue };
        }));
    }, [setRooms]);

    const addChild = useCallback((roomId) => {
        setRooms(prev => prev.map(room => {
            if (room.id !== roomId) return room;
            if (room.children.length >= 4) return room;
            return {
                ...room,
                children: [...room.children, { id: Date.now(), age: 1 }],
            };
        }));
    }, [setRooms]);

    const removeChild = useCallback((roomId, childId) => {
        setRooms(prev => prev.map(room => {
            if (room.id !== roomId) return room;
            return {
                ...room,
                children: room.children.filter(child => child.id !== childId),
            };
        }));
    }, [setRooms]);

    const updateChildAge = useCallback((roomId, childId, age) => {
        const ageNum = parseInt(age);
        if (ageNum < 1 || ageNum > 11) return;
        setRooms(prev => prev.map(room => {
            if (room.id !== roomId) return room;
            return {
                ...room,
                children: room.children.map(child =>
                    child.id === childId ? { ...child, age: ageNum } : child
                ),
            };
        }));
    }, [setRooms]);

    const addRoom = useCallback(() => {
        setRooms(prev => [...prev, { id: Date.now(), adults: 2, children: [] }]);
    }, [setRooms]);

    const removeRoom = useCallback((roomId) => {
        setRooms(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter(room => room.id !== roomId);
        });
    }, [setRooms]);

    // ✅ Always ready — at least 1 room with 1 adult always exists
    const handleConfirm = useCallback(() => {
        setShowGuestPicker(false);
    }, []);

    // ✅ Confirm label — summarises the current selection
    const confirmLabel = useMemo(() => {
        const roomPart  = `${rooms.length} ${rooms.length === 1 ? 'chambre' : 'chambres'}`;
        const adultPart = `${adults} ${adults === 1 ? 'adulte' : 'adultes'}`;
        const childPart = children > 0
            ? `, ${children} ${children === 1 ? 'enfant' : 'enfants'}`
            : '';
        return `${roomPart} · ${adultPart}${childPart}`;
    }, [rooms.length, adults, children]);

    return (
        <div className="relative" ref={guestPickerRef}>
            <button
                onClick={() => setShowGuestPicker(prev => !prev)}
                className="w-full flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-white text-left"
            >
                <Users className="text-sky-600 flex-shrink-0" size={22} />
                <div className="flex-1 flex items-center justify-between">
                    <span className="text-gray-800 text-sm">
                        {adults} {adults === 1 ? 'adulte' : 'adultes'}
                        {children > 0 && `, ${children} ${children === 1 ? 'enfant' : 'enfants'}`}
                    </span>
                    <span className="text-gray-500 text-xs">
                        {rooms.length} ch.
                    </span>
                </div>
            </button>

            {showGuestPicker && (
                // ✅ max-h-[80vh] — fits viewport, scrolls only when truly needed
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 p-5 max-w-md max-h-[80vh] overflow-y-auto custom-scrollbar animate-slideDown">

                    <div className="space-y-4">
                        {rooms.map((room, index) => (
                            <div
                                key={room.id}
                                className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border-2 border-blue-200 space-y-4 shadow-sm"
                            >
                                {/* Room Header */}
                                <div className="flex items-center justify-between pb-3 border-b-2 border-blue-200">
                                    <h4 className="font-bold text-sky-700 flex items-center gap-2">
                                        <Home size={18} className="text-sky-600" />
                                        Chambre {index + 1}
                                    </h4>
                                    {rooms.length > 1 && (
                                        <button
                                            onClick={() => removeRoom(room.id)}
                                            className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                                            title="Supprimer la chambre"
                                        >
                                            <Trash2 size={18} className="text-gray-500 group-hover:text-red-600" />
                                        </button>
                                    )}
                                </div>

                                {/* Adults Counter */}
                                <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                                    <div>
                                        <p className="font-semibold text-gray-800">Adultes</p>
                                        <p className="text-xs text-gray-500">18 ans et plus</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateRoomAdults(room.id, "decrement")}
                                            disabled={room.adults <= 1}
                                            className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200
                                                hover:from-sky-100 hover:to-sky-200 border-2 border-gray-300
                                                hover:border-sky-400 transition-all
                                                disabled:opacity-30 disabled:cursor-not-allowed
                                                flex items-center justify-center shadow-sm active:scale-95"
                                        >
                                            <Minus size={16} className="text-gray-700" />
                                        </button>
                                        <span className="w-8 text-center font-bold text-lg text-gray-800">
                                            {room.adults}
                                        </span>
                                        <button
                                            onClick={() => updateRoomAdults(room.id, "increment")}
                                            disabled={room.adults >= 5}
                                            className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600
                                                hover:from-sky-600 hover:to-sky-700 text-white
                                                transition-all shadow-md hover:shadow-lg
                                                disabled:opacity-30 disabled:cursor-not-allowed
                                                flex items-center justify-center active:scale-95"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Children Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                                        <div>
                                            <p className="font-semibold text-gray-800">Enfants</p>
                                            <p className="text-xs text-gray-500">1-11 ans</p>
                                        </div>
                                        <button
                                            onClick={() => addChild(room.id)}
                                            disabled={room.children.length >= 4}
                                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600
                                                hover:from-orange-600 hover:to-orange-700 text-white
                                                rounded-lg transition-all text-sm font-semibold shadow-md
                                                hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                                                flex items-center gap-2 active:scale-95"
                                        >
                                            <Plus size={16} />
                                            Ajouter
                                        </button>
                                    </div>

                                    {room.children.map((child, childIndex) => (
                                        <div
                                            key={child.id}
                                            className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-emerald-200 shadow-sm"
                                        >
                                            <span className="text-sm text-emerald-700 font-semibold flex items-center gap-1 flex-shrink-0">
                                                <User size={14} className="text-emerald-600" />
                                                Enf. {childIndex + 1}
                                            </span>
                                            <select
                                                value={child.age}
                                                onChange={(e) => updateChildAge(room.id, child.id, e.target.value)}
                                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg
                                                    focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200
                                                    focus:outline-none text-sm font-medium text-gray-800
                                                    bg-gradient-to-r from-white to-gray-50
                                                    hover:border-emerald-400 transition-colors"
                                            >
                                                {AGE_OPTIONS.map(age => (
                                                    <option key={age} value={age}>
                                                        {age} {age === 1 ? 'an' : 'ans'}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => removeChild(room.id, child.id)}
                                                className="p-2 hover:bg-red-100 rounded-lg transition-colors group flex-shrink-0"
                                                title="Retirer l'enfant"
                                            >
                                                <Trash2 size={16} className="text-gray-500 group-hover:text-red-600" />
                                            </button>
                                        </div>
                                    ))}

                                    {room.children.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-3 italic bg-white rounded-lg">
                                            Aucun enfant ajouté
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Room Button */}
                    <button
                        onClick={addRoom}
                        className="w-full mt-4 px-4 py-3 border-2 border-dashed border-orange-400
                            hover:border-orange-500 hover:bg-sky-50 rounded-xl
                            text-orange-500 hover:text-orange-600 font-semibold text-sm
                            flex items-center justify-center gap-2 transition-all
                            shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus size={18} />
                        Ajouter une chambre
                    </button>

                    {/* ── Confirm Button ─────────────────────────────────── */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                            onClick={handleConfirm}
                            className="group relative w-full inline-flex justify-center items-center gap-2
                                py-2.5 px-4 rounded-xl font-bold text-sm text-white
                                shadow-lg hover:shadow-xl active:scale-95 overflow-hidden
                                transition-all duration-300 cursor-pointer
                                focus:outline-none focus:ring-4 focus:ring-sky-300/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            <CheckCircle2 className="w-4 h-4 relative z-10 shrink-0" />
                            <span className="relative z-10 tracking-wide truncate">
                                Confirmer · {confirmLabel}
                            </span>
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}

export default GuestRoomSelector;