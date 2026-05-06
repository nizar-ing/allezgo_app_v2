import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AllezGoApi } from '../services/allezgo-api/allezGoApi';

export function useBooking({ onSuccess: externalOnSuccess, onError: externalOnError } = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ bookingState, paymentMethod, receiptFile, clientPhone }) => {
            // The price coming from the bookingState (via ApiClient) already contains the 8% margin.
            const clientPrice = bookingState?.totalPrice || bookingState?.basePrice || 0;

            const cityId = Number(bookingState?.hotel?.City?.Id || bookingState?.hotel?.City);
            const tunisianCityIds = [34, 35, 36, 37, 38]; // Force VIP Maghreb rates

            // Ipro Payload Formatting
            const selectedRooms = bookingState?.selectedRooms || bookingState?.rooms || [];
            const iproPayload = {
                Token: bookingState?.Token || bookingState?.token,
                Source: bookingState?.Source || bookingState?.source,
                City: cityId,
                Option: bookingState?.hotel?.Option || bookingState?.Option || selectedRooms?.[0]?.Option || [],
                rawRooms: selectedRooms,
                boardingType: bookingState?.boardingType,
                PreBooking: true,
                Adult: [],
                Child: []
            };

            if (tunisianCityIds.includes(cityId)) {
                iproPayload.GuestNationality = 'DZ';
                iproPayload.Currency = 'DZD';
            }

            if (bookingState?.passengers && Array.isArray(bookingState.passengers)) {
                bookingState.passengers.forEach(pax => {
                    const passenger = {
                        Civility: pax.Civility,
                        Name: pax.Name,
                        Surname: pax.Surname,
                        Age: pax.Age
                    };
                    
                    if (pax.Age !== undefined && pax.Age < 12) {
                        iproPayload.Child.push(passenger);
                    } else {
                        iproPayload.Adult.push(passenger);
                    }
                });
            }

            // FormData Construction
            const formData = new FormData();
            const hotelId = bookingState?.hotelId;
            const hotelName = bookingState?.hotelName || bookingState?.hotel?.name || 'Hôtel inconnu';
            const checkIn = bookingState?.checkIn;
            const checkOut = bookingState?.checkOut;

            // Stringify the core data, keeping all B2C state intact!
            formData.append('bookingData', JSON.stringify({ 
                ...bookingState, // 🔴 CRITICAL: Spreads hotel, rooms, and boarding details
                Token: bookingState?.Token || bookingState?.token, 
                hotelId, 
                hotelName,
                checkIn, 
                checkOut, 
                clientPrice, 
                paymentMethod, 
                clientPhone, 
                iproPayload 
            }));

            // Append the file if it exists
            if (receiptFile) {
                formData.append('receipt', receiptFile);
            }

            // API Call
            return await AllezGoApi.Bookings.create(formData);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
            toast.success("Réservation créée avec succès");
            externalOnSuccess?.(data);
        },
        onError: (error) => {
            toast.error(error?.message || "Erreur lors de la création de la réservation");
            externalOnError?.(error);
        }
    });
}

export default useBooking;
