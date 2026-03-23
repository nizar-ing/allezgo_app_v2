// src/custom-hooks/useBookingValidation.js
import toast from "react-hot-toast";

export function useBookingValidation() {
    const validateSearch = ({ selectedCity, selectedHotel, range, rooms }) => {

        if (!selectedCity && !selectedHotel) {
            toast.error("Veuillez sélectionner une ville ou un hôtel", {
                duration: 4000, position: "top-center",
            });
            return false;
        }

        if (!range.from || !range.to) {
            toast.error("Veuillez sélectionner les dates de séjour", {
                duration: 4000, position: "top-center",
            });
            return false;
        }

        // ✅ Fix 1 — explicit getTime() comparison
        if (range.from.getTime() >= range.to.getTime()) {
            toast.error("La date de départ doit être après la date d'arrivée", {
                duration: 4000, position: "top-center",
            });
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (range.from.getTime() < today.getTime()) {
            toast.error("La date d'arrivée ne peut pas être dans le passé", {
                duration: 4000, position: "top-center",
            });
            return false;
        }

        if (rooms.length === 0) {
            toast.error("Veuillez configurer au moins une chambre", {
                duration: 4000, position: "top-center",
            });
            return false;
        }

        return true;
    };

    return { validateSearch };
}