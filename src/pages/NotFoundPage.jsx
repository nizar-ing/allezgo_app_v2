import  { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    AlertCircle,
    Compass,
    MapPin,
    Plane,
    Cloud,
} from 'lucide-react';

function NotFoundPage() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="relative min-h-screen w-full bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Floating clouds */}
                <Cloud className="absolute top-20 left-10 text-white/30 animate-float-slow" size={80} />
                <Cloud className="absolute top-40 right-20 text-white/20 animate-float-slower" size={60} />
                <Cloud className="absolute bottom-32 left-1/4 text-white/25 animate-float-slow" size={70} />

                {/* Floating plane */}
                <Plane className="absolute top-1/3 right-10 text-sky-300/40 animate-plane" size={100} />

                {/* Decorative circles */}
                <div className="absolute top-10 right-1/4 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl animate-pulse-slower"></div>
                <div className="absolute top-1/2 left-10 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
                <div className={`max-w-6xl w-full transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

                        {/* Left Side - Image Section */}
                        <div className="order-2 lg:order-1 flex justify-center">
                            <div className="relative w-full max-w-md lg:max-w-lg">
                                {/* Decorative elements behind image */}
                                <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-sky-400 to-blue-500 rounded-3xl opacity-20 animate-spin-slow"></div>
                                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl opacity-20 animate-spin-slower"></div>

                                {/* Main Image Container */}
                                <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                                    <img
                                        src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80"
                                        alt="Lost traveler with backpack"
                                        className="w-full h-auto object-cover"
                                        onError={(e) => {
                                            e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80";
                                        }}
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                                    {/* Floating compass badge */}
                                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl px-5 py-3 shadow-xl animate-bounce-slow">
                                        <div className="flex items-center gap-3">
                                            <Compass className="text-orange-500 animate-spin-very-slow" size={28} />
                                            <div>
                                                <div className="text-xs text-gray-500 font-medium">Direction</div>
                                                <div className="text-sm font-bold text-gray-800">Inconnue</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom location badge */}
                                    <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md rounded-2xl px-5 py-3 shadow-xl">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="text-red-500" size={20} />
                                            <span className="text-sm font-bold text-gray-800">Position perdue</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative corner accents */}
                                <div className="absolute -top-3 -left-3 w-24 h-24 border-t-4 border-l-4 border-sky-400 rounded-tl-3xl opacity-50"></div>
                                <div className="absolute -bottom-3 -right-3 w-24 h-24 border-b-4 border-r-4 border-orange-400 rounded-br-3xl opacity-50"></div>
                            </div>
                        </div>

                        {/* Right Side - Content Section */}
                        <div className="order-1 lg:order-2 text-center lg:text-left space-y-6">

                            {/* Error Badge */}
                            <div className="inline-flex items-center gap-3 px-5 py-3 bg-white border-2 border-red-200 rounded-2xl shadow-lg animate-fade-in-down">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertCircle className="text-red-500" size={24} />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Erreur</div>
                                    <div className="text-lg font-bold text-red-900">404</div>
                                </div>
                            </div>

                            {/* Main Title */}
                            <div className="space-y-3 animate-fade-in-up">
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight">
                                    <span className="block text-gray-800 drop-shadow-sm">Oups!</span>
                                    <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-600 to-orange-500 animate-gradient-x">
                                        Perdu en route
                                    </span>
                                </h1>
                            </div>

                            {/* Description */}
                            <div className="space-y-4 animate-fade-in-up animation-delay-200">
                                <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                                    La page que vous cherchez a pris des vacances imprévues!
                                </p>
                                <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                                    Pas de panique, même les meilleurs explorateurs se perdent parfois. Retournons sur le bon chemin ensemble.
                                </p>
                            </div>

                            {/* Back Button - Enhanced */}
                            <div className="pt-4 animate-fade-in-up animation-delay-400">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 to-red-800 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden"
                                >
                                    {/* Button shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                                    <ArrowLeft size={24} className="relative z-10 group-hover:-translate-x-2 transition-transform duration-300" />
                                    <span className="relative z-10">Retour à la page précédente</span>
                                </button>
                            </div>

                            {/* Help Card */}
                            <div className="mt-8 p-6 bg-white/80 backdrop-blur-sm border-2 border-sky-200 rounded-2xl shadow-lg animate-fade-in animation-delay-600">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-sky-100 rounded-xl flex-shrink-0">
                                        <Compass className="text-sky-800" size={28} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                                            Besoin d'orientation?
                                        </h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            Notre équipe d'experts en voyages est là pour vous guider vers votre destination idéale.
                                            Chaque aventure commence par un premier pas dans la bonne direction.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Stats Bar */}
                    <div className="mt-16 lg:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in animation-delay-800">
                        {[
                            { label: "Destinations", value: "100+", gradient: "from-sky-500 to-blue-600" },
                            { label: "Hôtels Premium", value: "500+", gradient: "from-purple-500 to-pink-600" },
                            { label: "Voyageurs Heureux", value: "10k+", gradient: "from-orange-500 to-red-600" },
                            { label: "Note Moyenne", value: "4.8★", gradient: "from-amber-500 to-yellow-600" },
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-transparent hover:border-sky-200"
                            >
                                <div className={`text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.gradient} mb-2 group-hover:scale-110 transition-transform`}>
                                    {stat.value}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 font-semibold uppercase tracking-wide">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enhanced Custom Animations */}
            <style jsx>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-20px) translateX(10px); }
                }

                @keyframes float-slower {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-30px) translateX(-15px); }
                }

                @keyframes plane {
                    0%, 100% { transform: translateX(0px) translateY(0px) rotate(-5deg); }
                    50% { transform: translateX(30px) translateY(-20px) rotate(5deg); }
                }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes spin-slower {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }

                @keyframes spin-very-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.05); }
                }

                @keyframes pulse-slower {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.25; transform: scale(1.08); }
                }

                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }

                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .animate-float-slow {
                    animation: float-slow 6s ease-in-out infinite;
                }

                .animate-float-slower {
                    animation: float-slower 8s ease-in-out infinite;
                }

                .animate-plane {
                    animation: plane 10s ease-in-out infinite;
                }

                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }

                .animate-spin-slower {
                    animation: spin-slower 30s linear infinite;
                }

                .animate-spin-very-slow {
                    animation: spin-very-slow 8s linear infinite;
                }

                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }

                .animate-pulse-slower {
                    animation: pulse-slower 6s ease-in-out infinite;
                }

                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }

                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                }

                .animate-fade-in-down {
                    animation: fade-in-down 0.8s ease-out forwards;
                }

                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }

                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }

                .animation-delay-200 {
                    animation-delay: 0.2s;
                }

                .animation-delay-400 {
                    animation-delay: 0.4s;
                }

                .animation-delay-600 {
                    animation-delay: 0.6s;
                }

                .animation-delay-800 {
                    animation-delay: 0.8s;
                }
            `}</style>
        </div>
    );
}

export default NotFoundPage;
