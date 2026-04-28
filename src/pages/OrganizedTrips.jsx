// src/pages/OrganizedTrips.jsx
import DestinationCard from "../components/DestinationCard.jsx";
import { MapPin, AlertCircle } from "lucide-react";
import useDestinations from "../custom-hooks/useDestinations.js";
import Loader from "../ui/Loader.jsx";

function OrganizedTrips() {
    // Consume the custom hook
    const { data: destinations, loading, error } = useDestinations();

    // Handle Loading State
    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-slate-50">
                <Loader />
            </div>
        );
    }

    // Handle Error State
    if (error) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Erreur de chargement</h3>
                <p className="text-gray-600">{error.message || "Impossible de charger les destinations."}</p>
            </div>
        );
    }

    return (
        <section className="relative w-full bg-linear-to-br from-slate-50 via-white to-slate-100 overflow-hidden min-h-screen">
            <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center mb-16">
                    <h2 className="text-4xl lg:text-5xl font-bold text-sky-700 mb-6">
                        Nos Destinations Exclusives
                    </h2>
                </div>

                {destinations && destinations.length > 0 ? (
                    <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 xl:gap-12">
                            {destinations.map((destination, index) => (
                                <div
                                    key={destination.id}
                                    className="animate-fade-in-up w-full"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <DestinationCard {...destination} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
                            <MapPin className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                            Aucune destination disponible
                        </h3>
                        <p className="text-slate-500">
                            Nos prochaines destinations seront bientôt disponibles. Restez à
                            l'écoute !
                        </p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0"></div>

            <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
        </section>
    );
}

export default OrganizedTrips;