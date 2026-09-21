import { useQuery } from "@tanstack/react-query";
import { AllezGoApi } from "../services/allezgo-api/allezGoApi.js";
import useAuth from "./useAuth.js";

export default function useMyBookings() {
    const { user, isAuthenticated } = useAuth();

    const query = useQuery({
        queryKey: ["my-bookings", user?.id],
        enabled: isAuthenticated && !!user?.id,
        staleTime: 1000 * 30,
        refetchOnWindowFocus: true,
        refetchInterval: (query) => {
            const raw = query.state.data;
            if (!Array.isArray(raw)) return false;
            return raw.some(b => b.status === "PENDING") ? 30_000 : false;
        },
        queryFn: () => AllezGoApi.getMine(),
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
                } catch {
                    // iproPayload malformed — silently ignore, fall back to defaults
                }

                return {
                    ...booking,
                    hotelName: parsedPayload?.hotelName || booking.hotelId || "Hôtel Inconnu",
                    clientPrice: booking.clientPrice ?? parsedPayload?.TotalAmount ?? 0,
                };
            });
        },
    });

    return {
        bookings: query.data ?? [],
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}
