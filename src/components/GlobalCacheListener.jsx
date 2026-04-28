import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function GlobalCacheListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleRefreshSignal = () => {
      console.log('🔄 Signal [X-Refresh-Data] reçu : Invalidation globale du cache en arrière-plan...');
      
      // Invalide de manière agressive toutes les requêtes actives.
      // React Query va automatiquement relancer un fetch en arrière-plan (refetch)
      // pour les requêtes actuellement affichées à l'écran.
      queryClient.invalidateQueries();
      
      // Alternative ciblée : Si vous voulez éviter de tout rafraîchir, 
      // vous pourriez passer des tags dans le header depuis NestJS 
      // (ex: X-Refresh-Data: "bookings,users") et parser l'événement.
    };

    window.addEventListener('allezgo:refresh-data', handleRefreshSignal);
    
    return () => {
      window.removeEventListener('allezgo:refresh-data', handleRefreshSignal);
    };
  }, [queryClient]);

  return null; // Ce composant est un pur composant logique (Renderless)
}
