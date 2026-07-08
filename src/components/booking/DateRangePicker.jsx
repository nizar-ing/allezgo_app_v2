// src/components/DateRangePicker.jsx
import {useState, useRef, useEffect, useMemo, useCallback} from 'react';
import {Calendar, ChevronLeft, ChevronRight, CheckCircle2} from 'lucide-react';
import {
    formatDate,
    calculateNights,
    getDaysInMonth,
    getFirstDayOfMonth,
    isSameDay,
    isToday,
    monthNames,
} from '../../utils/dateHelpers';

// ✅ Fix #6 — module-level constant, never recreated
const DAY_HEADERS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function DateRangePicker({range, setRange}) {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const datePickerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let day = 1; day <= daysInMonth; day++) days.push(day);
        return days;
    }, [currentMonth]);

    const weeks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const enrichedDays = calendarDays.map(day => {
            if (!day) return {day: null};
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            return {
                day,
                isDisabled: date < today,
                isSelected: isSameDay(date, range.from) || isSameDay(date, range.to),
                isInRange: range.from && range.to
                    ? date >= range.from && date <= range.to
                    : false,
                isToday: isToday(date),
            };
        });

        const weeksArray = [];
        for (let i = 0; i < enrichedDays.length; i += 7) {
            weeksArray.push(enrichedDays.slice(i, i + 7));
        }
        return weeksArray;
    }, [calendarDays, currentMonth, range]);

    const nights = useMemo(
        () => calculateNights(range.from, range.to),
        [range.from, range.to]
    );

    const changeMonth = useCallback((offset) => {
        setCurrentMonth(prev =>
            new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
        );
    }, []);

    const handleDateClick = useCallback((day, isDisabled) => {
        if (!day || isDisabled) return;
        const clickedDate = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );
        clickedDate.setHours(0, 0, 0, 0);

        if (!range.from || (range.from && range.to)) {
            setRange({from: clickedDate, to: null});
        } else {
            setRange(
                clickedDate < range.from
                    ? {from: clickedDate, to: range.from}
                    : {from: range.from, to: clickedDate}
            );
        }
    }, [currentMonth, range, setRange]);

    // ✅ Confirm handler — only fires when both dates are selected
    const handleConfirm = useCallback(() => {
        if (range.from && range.to) {
            setShowDatePicker(false);
        }
    }, [range.from, range.to]);

    const isConfirmReady = !!(range.from && range.to);

    return (
        <div className="relative" ref={datePickerRef}>
            <button
                onClick={() => setShowDatePicker(prev => !prev)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-3 border-2 rounded-xl transition-all text-left ${
                    showDatePicker
                        ? 'border-sky-400 bg-sky-50 shadow-sm shadow-sky-100'
                        : 'border-sky-100 bg-sky-50/50 hover:border-sky-300 hover:bg-sky-50'
                }`}
            >
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                    <Calendar className="text-sky-600" size={16}/>
                </div>
                <div className="flex-1 flex items-center justify-between min-w-0">
                    {range.from && range.to ? (
                        <>
                            <span className="text-gray-800 text-sm font-medium truncate">
                                {formatDate(range.from)} — {formatDate(range.to)}
                            </span>
                            <span className="text-sky-600 text-xs font-bold bg-sky-100 border border-sky-200 px-2 py-1 rounded-full ml-2 shrink-0">
                                {nights} {nights === 1 ? 'nuit' : 'nuits'}
                            </span>
                        </>
                    ) : range.from ? (
                        <span className="text-gray-700 text-sm font-medium">
                            {formatDate(range.from)} — <span className="text-gray-400">?</span>
                        </span>
                    ) : (
                        <span className="text-gray-400 text-sm">Sélectionnez vos dates...</span>
                    )}
                </div>
            </button>

            {showDatePicker && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-50 border border-sky-100 min-w-[300px] w-full animate-slideDown overflow-hidden">

                    {/* Popup header */}
                    <div className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100 px-5 py-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-700 uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar size={11} className="text-sky-500" /> Choisissez vos dates
                        </span>
                        {range.from && range.to && (
                            <span className="text-xs font-bold text-sky-600 bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-full">
                                {nights} {nights === 1 ? 'nuit' : 'nuits'}
                            </span>
                        )}
                    </div>

                    <div className="p-5">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} className="text-gray-600"/>
                        </button>
                        <h3 className="font-bold text-gray-800">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <button
                            onClick={() => changeMonth(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight size={20} className="text-gray-600"/>
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAY_HEADERS.map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="space-y-1">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="grid grid-cols-7 gap-1">
                                {week.map((cell, dayIndex) => (
                                    <button
                                        key={dayIndex}
                                        onClick={() => handleDateClick(cell.day, cell.isDisabled)}
                                        disabled={!cell.day || cell.isDisabled}
                                        className={`
                                            aspect-square p-2 rounded-lg text-sm font-medium
                                            transition-all duration-200
                                            ${!cell.day ? 'invisible' : ''}
                                            ${cell.isDisabled
                                            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                                            : 'text-gray-700 hover:bg-sky-50 cursor-pointer'
                                        }
                                            ${cell.isInRange && !cell.isSelected ? 'bg-sky-100' : ''}
                                            ${cell.isSelected
                                            ? 'bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-lg scale-105 hover:from-sky-600 hover:to-sky-800'
                                            : ''
                                        }
                                            ${cell.isToday && !cell.isSelected
                                            ? 'ring-2 ring-sky-400 ring-offset-1'
                                            : ''
                                        }
                                        `}
                                    >
                                        {cell.day}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                        {range.from && range.to ? (
                            <div>
                                <p className="text-sm text-gray-600">
                                    {formatDate(range.from)} → {formatDate(range.to)}
                                </p>
                                <p className="text-lg font-bold text-sky-600 mt-1">
                                    {nights} {nights === 1 ? 'nuit' : 'nuits'}
                                </p>
                            </div>
                        ) : range.from ? (
                            <p className="text-sm text-gray-600">Sélectionnez la date de départ</p>
                        ) : (
                            <p className="text-sm text-gray-600">Sélectionnez la date d'arrivée</p>
                        )}
                    </div>

                    {/* ── Confirm Button ─────────────────────────────────── */}
                    <div className="mt-3">
                        <button
                            onClick={handleConfirm}
                            disabled={!isConfirmReady}
                            className={`
                                group relative w-full inline-flex justify-center items-center gap-2
                                py-2.5 px-4 rounded-xl font-bold text-sm
                                transition-all duration-300 overflow-hidden
                                focus:outline-none focus:ring-4 focus:ring-sky-300/50
                                ${isConfirmReady
                                ? 'text-white shadow-lg hover:shadow-xl active:scale-95 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            }
                            `}
                        >
                            {/* Animated gradient bg — only rendered when ready */}
                            {isConfirmReady && (
                                <>
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600"/>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full
                                     group-hover:translate-x-full transition-transform duration-700"/>
                                </>
                            )}
                            <CheckCircle2 className="w-4 h-4 relative z-10"/>
                            <span className="relative z-10 tracking-wide">
                                {isConfirmReady
                                    ? `Confirmer — ${nights} ${nights === 1 ? 'nuit' : 'nuits'}`
                                    : 'Sélectionnez vos dates'
                                }
                            </span>
                        </button>
                    </div>

                </div>
                    </div>
            )}
        </div>
    );
}

export default DateRangePicker;