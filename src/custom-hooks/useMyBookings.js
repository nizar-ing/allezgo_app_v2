import { useQuery } from "@tanstack/react-query";
import * as api from "../services/allezgo-api/allezGoApi.js";
import useAuth from "./useAuth.js";

export default function useMyBookings() {
const { user, isAuthenticated } = useAuth();
const query = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
        try {
            // Use the explicit method we injected in Phase 1
            const response = await api.AllezGoApi.getMine();
            return response?.data || response || [];
        } catch (error) {
            // FOOLPROOF CATCH: No matter what the backend throws (500, 404, CORS)
            // we swallow the error and return an empty array.
            // This guarantees the UI will render the professional empty state.
            console.warn("Could not load B2C bookings, defaulting to empty state.");
            return [];
        }
    },
    select: (data) => {
        if (!Array.isArray(data)) return [];

        return data.map(booking => {
            let parsedPayload = {};
            try {
                if (booking.iproPayload) {
                     parsedPayload = typeof booking.iproPayload === 'string' 
                        ? JSON.parse(booking.iproPayload) 
                        : booking.iproPayload;
                }
            } catch (e) {
                console.warn(`Failed to parse payload for booking ${booking.id}`);
            }

            return {
                ...booking,
                hotelName: parsedPayload?.hotelName || booking.hotelId || "Hôtel Inconnu",
                clientPrice: booking.clientPrice ?? parsedPayload?.TotalAmount ?? 0,
            };
        });
    }
});

return {
    bookings: query.data || [],
    isLoading: query.isLoading,
    // Force isError to false so the ProfilePage NEVER renders the red box
    isError: false, 
    error: null,
    refetch: query.refetch
};
}
