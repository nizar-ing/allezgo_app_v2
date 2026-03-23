import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, CreditCard, CheckCircle2, ChevronLeft, AlertCircle } from "lucide-react";
import GuestInfoForm from "../components/booking/GuestInfoForm.jsx";
import BookingSummaryCard from "../components/booking/BookingSummaryCard.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: "Informations",            icon: User         },
    { id: 2, label: "Confirmation & Paiement", icon: CreditCard   },
    { id: 3, label: "Succès",                  icon: CheckCircle2 },
];

// ─── Progress Stepper ─────────────────────────────────────────────────────────
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
                                {/* Node */}
                                <div className="flex flex-col items-center gap-1.5 shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                        isDone
                                            ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-200"
                                            : isActive
                                                ? "bg-white border-sky-600 text-sky-600 shadow-lg shadow-sky-100 ring-4 ring-sky-50"
                                                : "bg-white border-gray-200 text-gray-400"
                                    }`}>
                                        {isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                                    </div>
                                    <span className={`text-xs font-bold whitespace-nowrap transition-colors hidden sm:block ${
                                        isActive ? "text-sky-600" : isDone ? "text-sky-500" : "text-gray-400"
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>
                                {/* Connector */}
                                {!isLast && (
                                    <div className="flex-1 h-0.5 mx-3 mb-3 sm:mb-5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-700 ${
                                            isDone ? "w-full" : "w-0"
                                        }`} />
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
    const { state: bookingState } = useLocation();
    const navigate                = useNavigate();

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

    // ── Guard ─────────────────────────────────────────────────────────────────
    if (!bookingState?.hotelId) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700">Données de réservation manquantes</h2>
            <p className="text-sm text-gray-400">Veuillez sélectionner un hôtel avant de réserver.</p>
            <button
                onClick={() => navigate("/")}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition-all shadow-md"
            >
                Retour à l'accueil
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50/70 via-white to-slate-100/80">

            {/* ── Progress stepper — always visible, never unmounts ── */}
            <ProgressStepper currentStep={currentStep} />

            <div className="w-[95%] mx-auto py-6">

                {/* ── Back button ── */}
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-900 font-semibold mb-5 bg-white/80 hover:bg-white border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md px-4 py-2 rounded-full transition-all group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    {currentStep === 1 ? "Retour à l'hôtel" : "Étape précédente"}
                </button>

                {/* ── 2-column layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* Left — dynamic step content */}
                    <div className="lg:col-span-2">
                        {currentStep === 1 && (
                            <GuestInfoForm
                                bookingState={bookingState}
                                onSubmit={handleGuestSubmit}
                            />
                        )}
                        {currentStep === 2 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-4">
                                    <CreditCard size={30} className="text-sky-400" />
                                </div>
                                <p className="text-gray-700 font-extrabold text-lg mb-1">Confirmation & Paiement</p>
                                <p className="text-gray-400 text-sm">Cette étape sera disponible prochainement…</p>
                            </div>
                        )}
                        {currentStep === 3 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={30} className="text-green-500" />
                                </div>
                                <p className="text-gray-700 font-extrabold text-lg mb-1">Réservation Confirmée !</p>
                                <p className="text-gray-400 text-sm">Cette étape sera disponible prochainement…</p>
                            </div>
                        )}
                    </div>

                    {/* Right — sticky summary sidebar */}
                    <BookingSummaryCard bookingState={bookingState} />
                </div>
            </div>
        </div>
    );
}