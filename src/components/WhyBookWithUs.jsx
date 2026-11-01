import { Headphones, BadgeCheck, Building2, MousePointerClick } from "lucide-react";

const ADVANTAGES = [
    {
        icon: Headphones,
        title: "Service client à votre écoute",
        description: "Une équipe disponible 24h/24 et 7j/7 pour vous accompagner avant, pendant et après votre voyage.",
        number: "01",
    },
    {
        icon: BadgeCheck,
        title: "Meilleurs prix garantis",
        description: "Des tarifs négociés et des promotions sélectionnées pour vous offrir le meilleur rapport qualité-prix.",
        number: "02",
    },
    {
        icon: Building2,
        title: "Sélection d'hôtels diversifiée",
        description: "Un large choix d'établissements soigneusement sélectionnés pour toutes les envies et tous les budgets.",
        number: "03",
    },
    {
        icon: MousePointerClick,
        title: "Facilité de réservation",
        description: "Réservez votre séjour en quelques clics, en toute simplicité et sécurité.",
        number: "04",
    },
];

function WhyBookWithUs() {
    return (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d1f3c] to-slate-900 py-24 px-4">

            {/* Ambient glow layers */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-blue-700/10 blur-[140px]" />
                <div className="absolute -bottom-20 -left-10 h-[350px] w-[350px] rounded-full bg-orange-500/6 blur-[100px]" />
                <div className="absolute -right-10 top-1/3 h-[250px] w-[250px] rounded-full bg-sky-600/8 blur-[90px]" />
                {/* Dot grid */}
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
                        backgroundSize: "36px 36px",
                    }}
                />
            </div>

            <div className="relative mx-auto max-w-5xl">

                {/* Header */}
                <div className="mb-16 text-center">
                    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-400">
                            Notre engagement
                        </span>
                    </span>

                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                        Pourquoi réserver{" "}
                        <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                            avec nous&nbsp;?
                        </span>
                    </h2>

                    <div className="mx-auto mt-5 mb-6 h-px w-24 bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

                    <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-400">
                        ALLEZGO place la qualité de service au cœur de chaque séjour —
                        bâtissant une relation de confiance durable avec chaque client.
                    </p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {ADVANTAGES.map(({ icon: Icon, title, description, number }) => (
                        <div
                            key={number}
                            className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.13] hover:bg-white/[0.07]"
                        >
                            {/* Faded step number — background texture */}
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute -bottom-2 right-3 select-none font-black text-white/[0.04] transition-all duration-300 group-hover:text-white/[0.07]"
                                style={{ fontSize: "6rem", lineHeight: 1 }}
                            >
                                {number}
                            </span>

                            {/* Orange left accent line */}
                            <div className="absolute left-0 top-6 h-8 w-0.5 rounded-r-full bg-gradient-to-b from-orange-400 to-amber-400 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 shadow-lg shadow-orange-500/20">
                                    <Icon size={20} strokeWidth={1.75} className="text-white" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="mb-1.5 text-sm font-semibold text-white/90 leading-snug">
                                        {title}
                                    </h3>
                                    <p className="text-[13px] leading-relaxed text-slate-400">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default WhyBookWithUs;
