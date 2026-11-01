// src/components/WhyBookWithUs.jsx
import { Headphones, BadgeCheck, Building2, MousePointerClick } from "lucide-react";

const ADVANTAGES = [
    {
        icon: Headphones,
        title: "SERVICE CLIENT À VOTRE ÉCOUTE",
        description: "Une équipe disponible 24h/24 et 7j/7 pour vous accompagner avant, pendant et après votre voyage.",
    },
    {
        icon: BadgeCheck,
        title: "MEILLEURS PRIX GARANTIS",
        description: "Des tarifs négociés et des promotions sélectionnées pour vous.",
    },
    {
        icon: Building2,
        title: "SÉLECTION D'HÔTELS DIVERSIFIÉE",
        description: "Un large choix d'hôtels pour toutes les envies et tous les budgets.",
    },
    {
        icon: MousePointerClick,
        title: "FACILITÉ DE RÉSERVATION",
        description: "Réservez votre séjour en quelques clics, en toute simplicité.",
    },
];

function WhyBookWithUs() {
    return (
        <section className="w-full bg-sky-50 py-16 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-gray-800">
                        POURQUOI RÉSERVER AVEC NOUS ?
                    </h2>
                    <div className="mx-auto mt-3 mb-5 h-1 w-16 rounded-full bg-sky-500" />
                    <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
                        ALLEZGO est une agence de voyages en ligne qui place la qualité de service au
                        cœur de chaque séjour. Cette exigence nous permet de construire une relation
                        de confiance durable avec nos clients et nos partenaires.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {ADVANTAGES.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex-shrink-0 p-3 rounded-xl border-2 border-sky-200 bg-sky-50 text-sky-600">
                                <Icon size={24} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800 mb-1">
                                    {title}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default WhyBookWithUs;
