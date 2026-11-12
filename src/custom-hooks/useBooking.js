import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AllezGoApi } from '../services/allezgo-api/allezGoApi';

export function useBooking({ onSuccess: externalOnSuccess, onError: externalOnError, onOfferExpired } = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ bookingState, paymentMethod, receiptFile, clientPhone }) => {
            // clientPrice is a display echo only — the server re-prices from offerIds
            const clientPrice = bookingState?.totalPrice || bookingState?.basePrice || 0;
            const hotelId     = bookingState?.hotelId;
            const hotelName   = bookingState?.hotelName || bookingState?.hotel?.Name || 'Hôtel inconnu';
            const checkIn     = bookingState?.checkIn;
            const checkOut    = bookingState?.checkOut;

            const formData = new FormData();
            formData.append('bookingData', JSON.stringify({
                hotelId,
                hotelName,
                checkIn,
                checkOut,
                clientPrice,
                paymentMethod,
                clientPhone,
                clientName:  bookingState?.clientName,
                clientEmail: bookingState?.clientEmail,
                boardingType: bookingState?.boardingType,
                offerIds: bookingState?.offerIds || [],
                // Passengers grouped by room for server-side assignment
                rooms: (bookingState?.rooms || []).map((room, i) => ({
                    roomType:    room.roomType,
                    boardingCode: room.boardingCode,
                    adults:      room.adults,
                    children:    room.children,
                    travellers:  bookingState?.roomPassengers?.[i]?.travellers || [],
                })),
                // Flat passenger list for backward compatibility
                passengers: bookingState?.passengers || [],
            }));

            if (receiptFile) formData.append('receipt', receiptFile);

            return await AllezGoApi.Bookings.create(formData);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
            toast.success("Réservation créée avec succès");
            externalOnSuccess?.(data);
        },
        onError: (error) => {
            const status = error?.status || error?.response?.status;

            if (status === 410) {
                toast.error("Cette offre a expiré, nous actualisons les prix…");
                onOfferExpired?.();
                return;
            }

            const msg = status === 400
                ? "Les informations voyageurs ne correspondent pas à l'offre sélectionnée."
                : (error?.message || "Erreur lors de la création de la réservation");
            toast.error(msg);
            externalOnError?.(error);
        },
    });
}

export default useBooking;
