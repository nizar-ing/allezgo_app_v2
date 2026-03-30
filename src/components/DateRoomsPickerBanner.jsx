// src/components/DateRoomsPickerBanner.jsx
import { Calendar, Users, Hotel, RefreshCw, X } from 'lucide-react';
import { IoAddOutline, IoTrashOutline } from 'react-icons/io5';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

export default function DateRoomsPickerBanner({
    // Display values
    searchParams,
    nights,
    pricingData,

    // Picker state
    showDatePicker,
    tempSearchParams,
    dateRange,
    currentMonth,
    isLoadingPricing,

    // Event Handlers
    onOpen,
    onClose,
    onMonthChange,
    onDateSelect,
    onSearch,
    onAddRoom,
    onRemoveRoom,
    onUpdateAdults,
    onAddChild,
    onRemoveChild,
    onUpdateChildAge,

    // Helpers
    formatDate,
}) {
    return (
        <div className="bg-white rounded-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Calendar className="text-sky-600" size={24}/>
                        Dates de séjour
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="font-semibold">{searchParams.checkIn}</span>
                        <span>→</span>
                        <span className="font-semibold">{searchParams.checkOut}</span>
                        <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold border border-sky-200 transition-all duration-200 ease-in-out">
                            {nights} nuit{nights > 1 ? 's' : ''}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 transition-all duration-200 ease-in-out">
                            {searchParams.rooms.reduce((s, r) => s + r.adults, 0)} adulte{searchParams.rooms.reduce((s, r) => s + r.adults, 0) > 1 ? 's' : ''}
                        </span>
                        {searchParams.rooms.reduce((s, r) => s + r.children.length, 0) > 0 && (
                            <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-lg text-xs font-semibold border border-pink-200 transition-all duration-200 ease-in-out">
                                {searchParams.rooms.reduce((s, r) => s + r.children.length, 0)} enfant{searchParams.rooms.reduce((s, r) => s + r.children.length, 0) > 1 ? 's' : ''}
                            </span>
                        )}
                        {pricingData && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold border border-green-200 transition-all duration-200 ease-in-out">
                                Prix chargés ✓
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={onOpen}
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-2xl transition-all duration-200 ease-in-out shadow-lg flex items-center gap-2 focus:ring-4 focus:ring-sky-200 focus:outline-none"
                >
                    <Calendar size={20}/>
                    Modifier les dates
                </button>
            </div>

            {/* Expanded date + rooms picker */}
            {showDatePicker && (
                <div className="mt-4 p-6 sm:p-8 bg-linear-to-br from-sky-50 to-blue-50 rounded-3xl border border-sky-100 shadow-lg">

                    {/* Selected dates summary */}
                    <div className="mb-6 p-5 bg-white rounded-2xl border border-sky-100 shadow-md flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Arrivée</span>
                                <span className="text-base font-extrabold text-slate-800">{formatDate(tempSearchParams.checkIn)}</span>
                            </div>
                            <div className="w-8 h-px bg-gray-300"></div>
                            <div>
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Départ</span>
                                <span className="text-base font-extrabold text-slate-800">{formatDate(tempSearchParams.checkOut)}</span>
                            </div>
                        </div>
                        <div className="px-4 py-1.5 bg-sky-50 text-sky-700 rounded-xl text-sm font-bold border border-sky-100 shadow-md">
                            {tempSearchParams.checkIn && tempSearchParams.checkOut
                                ? Math.max(1, Math.ceil(
                                    (new Date(tempSearchParams.checkOut) - new Date(tempSearchParams.checkIn))
                                    / (1000 * 60 * 60 * 24)
                                ))
                                : '-'} nuit{tempSearchParams.checkIn && tempSearchParams.checkOut && Math.ceil((new Date(tempSearchParams.checkOut) - new Date(tempSearchParams.checkIn)) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 mb-8">
                        {/* Calendar */}
                        <div className="w-full lg:w-1/3">
                            <label className="flex text-sm font-bold text-slate-800 mb-4 items-center gap-2">
                                <Calendar size={18} className="text-sky-700"/>
                                Sélectionnez vos dates
                            </label>
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => {
                                            const m = new Date(currentMonth);
                                            m.setMonth(m.getMonth() - 1);
                                            onMonthChange(m);
                                        }}
                                        className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:border-orange-400 hover:bg-orange-50 text-gray-600 font-bold text-xl transition-all duration-200 ease-in-out shadow-md focus:ring-4 focus:ring-orange-100 outline-none"
                                        aria-label="Mois précédent"
                                    >‹</button>
                                    <div className="text-center font-extrabold text-slate-800 capitalize">
                                        {currentMonth.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})}
                                    </div>
                                    <button
                                        onClick={() => {
                                            const m = new Date(currentMonth);
                                            m.setMonth(m.getMonth() + 1);
                                            onMonthChange(m);
                                        }}
                                        className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:border-orange-400 hover:bg-orange-50 text-gray-600 font-bold text-xl transition-all duration-200 ease-in-out shadow-md focus:ring-4 focus:ring-orange-100 outline-none"
                                        aria-label="Mois suivant"
                                    >›</button>
                                </div>
                                <style>
                                    {`
                                    .custom-day-picker .rdp-day_selected,
                                    .custom-day-picker .rdp-day_selected:focus-visible,
                                    .custom-day-picker .rdp-day_selected:hover,
                                    .custom-day-picker .rdp-day:hover .rdp-day_button {
                                        background-color: #ea580c !important; /* bg-orange-600 */
                                        color: white !important;
                                    }
                                    .custom-day-picker .rdp-day_selected.rdp-day_range_middle {
                                        background-color: #ffedd5 !important; /* bg-orange-100 */
                                        color: #c2410c !important; /* text-orange-800 */
                                    }
                                    .custom-day-picker .rdp-chevron {
                                        fill: #ea580c; /* orange-600 */
                                    }
                                    .custom-day-picker .rdp-range_start .rdp-day_button{
                                         background-color: #ea580c;
                                         border-color: #ea580c;
                                    }
                                    .custom-day-picker .rdp-range_end .rdp-day_button{
                                         background-color: #ea580c;
                                         border-color: #ea580c;
                                    }
                                    `}
                                </style>
                                <DayPicker
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={onDateSelect}
                                    disabled={date => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        return date < today;
                                    }}
                                    month={currentMonth}
                                    onMonthChange={onMonthChange}
                                    numberOfMonths={1}
                                    className="custom-day-picker"
                                />
                            </div>
                        </div>

                        {/* Rooms & Guests */}
                        <div className="w-full lg:w-2/3">
                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Users size={18} className="text-sky-600"/>
                                Chambres et voyageurs
                            </h4>
                            <div className="space-y-5 max-h-112.5 overflow-y-auto filter-scroll pr-3">
                                {tempSearchParams.rooms.map((room, index) => (
                                    <div key={index} className="p-5 sm:p-6 bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-200 ease-in-out">
                                        <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4">
                                            <span className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                                <div className="p-1.5 bg-sky-50 rounded-xl">
                                                    <Hotel size={16} className="text-sky-600"/>
                                                </div>
                                                Chambre {index + 1}
                                            </span>
                                            {tempSearchParams.rooms.length > 1 && (
                                                <button
                                                    onClick={() => onRemoveRoom(index)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 ease-in-out focus:ring-4 focus:ring-red-100 outline-none"
                                                    title="Supprimer la chambre"
                                                >
                                                    <IoTrashOutline size={18}/>
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-6">
                                            {/* Adults */}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="text-xs text-slate-500 font-bold block uppercase tracking-wider mb-0.5">Adultes</label>
                                                    <span className="text-xs text-slate-400 font-medium">12 ans et plus</span>
                                                </div>
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <button
                                                        onClick={() => onUpdateAdults(index, room.adults - 1)}
                                                        disabled={room.adults <= 1}
                                                        className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 ease-in-out font-bold text-lg focus:outline-none focus:ring-4 focus:ring-sky-100"
                                                    >−</button>
                                                    <input
                                                        type="number" min={1} max={6}
                                                        value={room.adults}
                                                        onChange={e => onUpdateAdults(index, e.target.value)}
                                                        className="w-16 h-10 px-2 border border-gray-200 shadow-sm bg-gray-50 rounded-2xl text-center font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all duration-200 ease-in-out"
                                                        style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                                                    />
                                                    <button
                                                        onClick={() => onUpdateAdults(index, room.adults + 1)}
                                                        disabled={room.adults >= 6}
                                                        className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 ease-in-out font-bold text-lg focus:outline-none focus:ring-4 focus:ring-sky-100"
                                                    >+</button>
                                                </div>
                                            </div>

                                            {/* Children */}
                                            <div className="pt-5 border-t border-dashed border-gray-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-bold block uppercase tracking-wider mb-0.5">Enfants</label>
                                                        <span className="text-xs text-slate-400 font-medium">1 à 11 ans</span>
                                                    </div>
                                                    <button
                                                        onClick={() => onAddChild(index)}
                                                        disabled={room.children.length >= 4}
                                                        className="text-sm text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 bg-sky-50 hover:bg-sky-100 rounded-2xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-sky-100 shadow-sm"
                                                    >
                                                        <IoAddOutline size={16}/>
                                                        Ajouter
                                                    </button>
                                                </div>
                                                
                                                {room.children.length === 0 ? (
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center text-sm text-slate-400 font-medium">
                                                        Aucun enfant
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {room.children.map((childAge, childIndex) => (
                                                            <div key={childIndex} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-200 shadow-md focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 transition-all duration-200 ease-in-out">
                                                                <div className="pl-2 flex-1">
                                                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Âge enfant {childIndex + 1}</span>
                                                                    <select
                                                                        value={childAge}
                                                                        onChange={e => onUpdateChildAge(index, childIndex, e.target.value)}
                                                                        className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer appearance-none transition-all duration-200 ease-in-out"
                                                                    >
                                                                        {[...Array(11)].map((_, i) => (
                                                                            <option key={i + 1} value={i + 1}>
                                                                                {i + 1} an{i + 1 > 1 ? 's' : ''}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <button
                                                                    onClick={() => onRemoveChild(index, childIndex)}
                                                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 ease-in-out focus:outline-none"
                                                                    title="Supprimer l'enfant"
                                                                >
                                                                    <X size={16}/>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {tempSearchParams.rooms.length < 5 && (
                                <button
                                    onClick={onAddRoom}
                                    className="w-full mt-6 py-3 px-4 border-2 border-dashed border-sky-300 hover:border-sky-500 text-sky-600 hover:bg-sky-50 rounded-3xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-sky-100 shadow-md"
                                >
                                    <IoAddOutline size={18}/>
                                    Ajouter une chambre
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button
                            onClick={onSearch}
                            disabled={!tempSearchParams.checkIn || !tempSearchParams.checkOut || isLoadingPricing}
                            className="flex-1 px-6 py-3.5 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-2xl transition-all duration-200 ease-in-out flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-orange-200"
                        >
                            {isLoadingPricing ? (
                                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"/>Recherche...</>
                            ) : (
                                <><RefreshCw size={20}/>Actualiser les prix</>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3.5 bg-white border border-gray-200 shadow-md hover:bg-gray-50 text-slate-700 font-bold rounded-2xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-gray-100"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}