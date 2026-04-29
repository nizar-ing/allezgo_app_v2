import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AllezGoApi } from '../services/allezgo-api/allezGoApi.js';
import apiClient from '../services/ApiClient.js';

export function useAdminBookings() {
    const queryClient = useQueryClient();

    const fetchBookings = useQuery({
        queryKey: ['admin-bookings'],
        queryFn: async () => {
            return await AllezGoApi.Bookings.getAll();
        }
    });

    const updateBookingStatus = useMutation({
        mutationFn: async ({ id, status, iproPayload }) => {
            // 1. Mettre à jour le statut dans le backend AllezGo
            const response = await AllezGoApi.Bookings.updateStatus(id, status);

            // 2. Si approuvé, déclencher le POST vers l'API iPro Booking
            if (status === 'CONFIRMED' && iproPayload) {
                try {
                    // Création de la requête vers iPro en injectant les identifiants
                    await apiClient.client.post('/HotelBooking', apiClient.createRequestBody(
                        typeof iproPayload === 'string' ? JSON.parse(iproPayload) : iproPayload
                    ));
                } catch (error) {
                    console.error("Erreur API iPro Booking:", error);
                    // On avertit l'utilisateur sans faire échouer la mutation car le statut est déjà à jour en base
                    toast.error("Virement approuvé, mais la transmission à iPro a échoué.");
                }
            }

            return response;
        },
        onSuccess: (data, variables) => {
            // Invalidations du cache pour rafraîchir l'interface
            queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
            
            if (variables.status === 'CONFIRMED') {
                toast.success("Réservation confirmée avec succès !");
            } else if (variables.status === 'REJECTED') {
                toast.error("Réservation rejetée.");
            } else {
                toast.success("Statut mis à jour !");
            }
        },
        onError: (error) => {
            console.error("Update Booking Error:", error);
            toast.error(error?.message || "Erreur lors de la mise à jour du statut.");
        }
    });

    const removeBooking = useMutation({
        mutationFn: async (id) => {
            return await AllezGoApi.Bookings.remove(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
            // Le toast de succès est géré directement dans le composant pour plus de contexte
        },
        onError: (error) => {
            console.error("Delete Booking Error:", error);
            toast.error(error?.message || "Erreur lors de la suppression.");
        }
    });

    return {
        bookings: fetchBookings.data,
        loading: fetchBookings.isLoading,
        updateBookingStatus,
        removeBooking // Exposer la nouvelle mutation
    };
}

export default useAdminBookings;
