import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, CreditCard, CheckCircle2, ChevronLeft, AlertCircle } from "lucide-react";
import GuestInfoForm from "../components/booking/GuestInfoForm.jsx";
import BookingSummaryCard from "../components/booking/BookingSummaryCard.jsx";

// ─── Progress Stepper ─────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: "Informations",            icon: User         },
    { id: 2, label: "Confirmation & Paiement", icon: CreditCard   },
    { id: 3, label: "Succès",                  icon: CheckCircle2 },
];

function ProgressStepper({ currentStep }) {
    return (
        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
            <div className="w-[95%] mx-auto py-5">
                <div className="flex items-center">
                    {STEPS.map((step, idx) => {
                        const isDone   = currentStep > step.id;
                        const isActive = currentStep === step.id;
                        const isLast   = idx === STEPS.length - 1;
                        const Icon     = step.icon;
                        return (
                            <div key={step.id} className={`flex items-center ${!isLast ? "flex-1" : ""}`}>
                                <div className="flex flex-col items-center gap-1.5 shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                        isDone ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-200"
                                            : isActive ? "bg-white border-sky-600 text-sky-600 shadow-lg shadow-sky-100 ring-4 ring-sky-50"
                                                : "bg-white border-gray-200 text-gray-400"
                                    }`}>
                                        {isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                                    </div>
                                    <span className={`text-xs font-bold whitespace-nowrap hidden sm:block ${isActive ? "text-sky-600" : isDone ? "text-sky-500" : "text-gray-400"}`}>
                                        {step.label}
                                    </span>
                                </div>
                                {!isLast && (
                                    <div className="flex-1 h-0.5 mx-3 mb-3 sm:mb-5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-700 ${isDone ? "w-full" : "w-0"}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BookingPage() {
    const { state: locationState } = useLocation();
    const navigate                 = useNavigate();

    // ✅ SOURCE OF TRUTH: If locationState exists, use its totalPrice directly.
    // This prevents recalculation errors when navigating from HotelLightCard.
    const bookingState = useMemo(() => {
        if (!locationState) return null;
        // ✅ FIX: Trust the totalPrice passed in state directly.
        // Do NOT look at selectedRooms[0].price, as that only captures the first room.
        const totalPrice = locationState.totalPrice ?? 0;
        return {
            ...locationState,
            totalPrice,
            currency:   locationState.currency   ?? "DZD",
        };
    }, [locationState]);

    const [currentStep, setCurrentStep] = useState(1);
    const [guestData,   setGuestData]   = useState(null);
    const [bookingRef,  setBookingRef]  = useState(null);

    const handleGuestSubmit = (data) => {
        setGuestData(data);
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleBookingConfirmed = (ref) => {
        setBookingRef(ref);
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((s) => s - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            navigate(-1);
        }
    };

    if (!bookingState?.hotelId) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <AlertCircle size={32} className="text-red-400" />
            <h2 className="text-xl font-bold text-gray-700">Données de réservation manquantes</h2>
            <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold">Retour à l'accueil</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50/70 via-white to-slate-100/80">
            <ProgressStepper currentStep={currentStep} />
            <div className="w-[95%] mx-auto py-6">
                <button onClick={handleBack} className="inline-flex items-center gap-2 text-sky-700 font-semibold mb-5 px-4 py-2 rounded-full bg-white/80 border border-sky-100 shadow-sm transition-all group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5" />
                    {currentStep === 1 ? "Retour à l'hôtel" : "Étape précédente"}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2">
                        {currentStep === 1 && <GuestInfoForm bookingState={bookingState} onSubmit={handleGuestSubmit} />}
                        {currentStep === 2 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                                <CreditCard size={30} className="text-sky-400 mx-auto mb-4" />
                                <p className="text-gray-700 font-extrabold text-lg">Confirmation & Paiement</p>
                                <button onClick={() => handleBookingConfirmed('REF-' + Math.random().toString(36).substr(2, 9).toUpperCase())} className="mt-8 px-8 py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg">Simuler Confirmation</button>
                            </div>
                        )}
                        {currentStep === 3 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                                <CheckCircle2 size={30} className="text-green-500 mx-auto mb-4" />
                                <p className="text-gray-700 font-extrabold text-lg">Réservation Confirmée !</p>
                                <p className="text-sky-600 font-bold text-sm">Référence: {bookingRef}</p>
                                <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl">Retour à l'accueil</button>
                            </div>
                        )}
                    </div>
                    <BookingSummaryCard bookingState={bookingState} />
                </div>
            </div>
        </div>
    );
}