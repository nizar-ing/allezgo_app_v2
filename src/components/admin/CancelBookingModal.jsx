import { useState } from "react";
import { AlertTriangle, X, Loader2, CheckCircle2, BadgeDollarSign } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import apiClient from "../../services/ApiClient.js";
import AllezGoApi from "../../services/allezgo-api/allezGoApi.js";

export default function CancelBookingModal({ isOpen, booking, onClose }) {
    const [isPending, setIsPending] = useState(false);
    const [step, setStep] = useState(1);
    const [fees, setFees] = useState(null);
    const queryClient = useQueryClient();

    if (!isOpen || !booking) return null;

    const externalId = booking.externalId || booking.bookingData?.iProId || booking.bookingData?.externalId;

    const checkFees = async () => {
        if (!externalId) {
            toast.error("ID Externe introuvable. Annulation impossible.");
            return;
        }
        try {
            setIsPending(true);
            const response = await apiClient.cancelBooking(externalId, true);
            setFees(response.Fees || "0.00");
            setStep(2);
        } catch (error) {
            toast.error(error.message || "Impossible de vérifier les frais.");
            onClose();
        } finally {
            setIsPending(false);
        }
    };

    const confirmCancellation = async () => {
        try {
            setIsPending(true);
            await apiClient.cancelBooking(externalId, false);
            await AllezGoApi.client.patch(`/api/bookings/${booking.id}`, { status: "CANCELLED" });

            toast.success("Réservation annulée avec succès.");
            queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
            setStep(1);
            onClose();
        } catch (error) {
            toast.error(error.message || "L'annulation a échoué.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                <div className="px-6 py-5 border-b bg-rose-50 text-rose-900 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-200 rounded-full text-rose-700">
                            <AlertTriangle size={20} />
                        </div>
                        <h2 className="font-extrabold">Annuler la Réservation</h2>
                    </div>
                    <button onClick={onClose} disabled={isPending} className="hover:bg-rose-200 p-1 rounded-md transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-600 mb-6 text-center leading-relaxed">
                        Vous êtes sur le point d'annuler la réservation <strong className="text-slate-900">{booking.reference || booking.id}</strong>. Cette action est irréversible dans le système iPro.
                    </p>

                    {step === 2 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-4">
                            <BadgeDollarSign className="text-amber-500" size={32} />
                            <div>
                                <p className="text-xs font-bold text-amber-700 uppercase">Frais d'annulation iPro</p>
                                <p className="text-xl font-extrabold text-amber-900">{fees} DZD</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {step === 1 ? (
                            <button onClick={checkFees} disabled={isPending} className="w-full flex justify-center items-center gap-2 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl disabled:opacity-50">
                                {isPending ? <Loader2 className="animate-spin" size={18} /> : <AlertTriangle size={18} />}
                                Évaluer les frais d'annulation
                            </button>
                        ) : (
                            <button onClick={confirmCancellation} disabled={isPending} className="w-full flex justify-center items-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl disabled:opacity-50 shadow-md shadow-rose-200">
                                {isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                Confirmer l'annulation définitive
                            </button>
                        )}
                        <button onClick={onClose} disabled={isPending} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl disabled:opacity-50">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}