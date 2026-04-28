// src/pages/OrganizedTrip.jsx
import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import AllezGoApi from "../services/allezgo-api/allezGoApi.js";
import Loader from "../ui/Loader.jsx";
import {
  FaPlane,
  FaHotel,
  FaCalendarAlt,
  FaUsers,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaUtensils,
  FaChild,
  FaInfoCircle,
  FaPhoneAlt,
  FaChevronDown,
  FaChevronUp,
  FaGlobe,
  FaBed,
} from "react-icons/fa";
import { MdVerifiedUser, MdTour } from "react-icons/md";
import Button from "../ui/Button.jsx";

function OrganizedTrip() {
  const { tripId: id } = useParams();

  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [scrolled, setScrolled] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(0);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    const fetchDestination = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await AllezGoApi.Destinations.getById(id);
        setDestination(data);
      } catch (err) {
        console.error("Failed to fetch destination:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDestination();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <Loader />
      </div>
    );
  }

  if (error || !destination) return <Navigate to="/not-found" replace />;

  const getPricing = () => {
    if (destination.pricing?.hotel3Star) {
      return {
        "3star": destination.pricing.hotel3Star,
        "4star": destination.pricing.hotel4Star,
        "5star": destination.pricing.hotel5Star,
      };
    } else if (destination.pricing?.hotel4Star) {
      return {
        "4star": destination.pricing.hotel4Star,
        "5star": destination.pricing.hotel5Star,
      };
    }
    return { standard: destination.pricing || {} };
  };

  const pricingOptions = getPricing();
  const currentPricing =
    Object.values(pricingOptions)[selectedHotel] || destination.pricing || {};

  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <main className="max-w-6xl lg:max-w-4/5 mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-10 sm:pb-12">

        {/* Hero */}
        <div className="relative h-[260px] sm:h-[340px] md:h-[420px] lg:h-[500px] rounded-3xl overflow-hidden mb-8 sm:mb-10 shadow-2xl group">
          <img
            src={destination.image_url}
            alt={destination.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600/90 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
                <MdTour />
                Voyage Organisé
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600/90 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
                <MdVerifiedUser />
                Garanti
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
              {destination.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm md:text-base">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FaMapMarkerAlt className="text-blue-400" />
                <span className="truncate">
                  {destination.mainCities?.join(" • ")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FaCalendarAlt className="text-blue-400" />
                <span>
                  {destination.duration?.days} jours /{" "}
                  {destination.duration?.nights} nuits
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FaPlane className="text-blue-400" />
                <span>{destination.airline}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                À propos de ce voyage
              </h2>
              <div className="prose max-w-none text-gray-600 leading-relaxed space-y-3 sm:space-y-4">
                <p className="text-base sm:text-lg">
                  Découvrez la beauté envoûtante de{" "}
                  <span className="font-semibold text-gray-900">
                    {destination.name}
                  </span>
                  , une destination qui combine histoire millénaire, culture
                  fascinante et paysages à couper le souffle. Ce voyage organisé
                  de {destination.duration?.days} jours est conçu pour vous
                  offrir une expérience complète et inoubliable.
                </p>
                <p className="text-sm sm:text-base">
                  Au départ de{" "}
                  <span className="font-semibold">{destination.departureFrom}</span>{" "}
                  avec {destination.airline}, vous profiterez d&apos;un programme
                  soigneusement élaboré incluant les sites les plus emblématiques,
                  un hébergement de qualité, et l&apos;accompagnement de guides
                  expérimentés pour enrichir votre découverte.
                </p>
              </div>
            </div>

            {/* Highlights */}
            {destination.highlights && destination.highlights.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                  <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
                  Points forts du voyage
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {destination.highlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-green-50 to-white border border-green-100 hover:shadow-md transition-all duration-200"
                    >
                      <FaCheckCircle className="text-green-500 text-lg sm:text-xl mt-0.5 flex-shrink-0" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accommodation (updated to accommodations) */}
            {destination.accommodations && destination.accommodations.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                  <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full" />
                  Hébergement
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {destination.accommodations.map((acc, index) => (
                    <div
                      key={index}
                      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <div className="flex items-center gap-3">
                          <FaHotel className="text-purple-500 text-xl sm:text-2xl flex-shrink-0" />
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">
                              {acc.hotel}
                            </h3>
                            {acc.location && (
                              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                                <FaMapMarkerAlt className="text-xs" />
                                {acc.location}
                              </p>
                            )}
                          </div>
                        </div>
                        {acc.stars && (
                          <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-yellow-50 rounded-full border border-yellow-200">
                            {Array(acc.stars)
                              .fill(0)
                              .map((_, i) => (
                                <FaStar
                                  key={i}
                                  className="text-yellow-400 text-[11px] sm:text-sm"
                                />
                              ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <FaBed className="text-purple-400" />
                        <span className="font-medium">{acc.nights} nuits</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-800 text-sm sm:text-base">
                    <FaUtensils className="text-blue-600" />
                    <span className="font-semibold">
                      Formule: {destination.mealPlan}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Itinerary (updated to itineraries) */}
            {destination.itineraries && destination.itineraries.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                  <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full" />
                  Programme détaillé
                </h2>
                <div className="space-y-3">
                  {destination.itineraries.map((day, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 transition-all duration-200"
                    >
                      <button
                        onClick={() =>
                          setExpandedDay(expandedDay === index ? null : index)
                        }
                        className="w-full px-3 py-4 sm:p-5 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-orange-50 hover:to-white transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg text-sm sm:text-base">
                            {day.day}
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                              Jour {day.day}
                            </h3>
                          </div>
                        </div>
                        {expandedDay === index ? (
                          <FaChevronUp className="text-orange-500 text-sm sm:text-base" />
                        ) : (
                          <FaChevronDown className="text-gray-400 text-sm sm:text-base" />
                        )}
                      </button>
                      {expandedDay === index && (
                        <div className="p-4 sm:p-5 bg-white border-t border-gray-100">
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
                            {/* Prioritize API description, fallback to intelligent hardcoded defaults */}
                            {day.description ? day.description :
                              day.title?.includes("Arrivée")
                                ? "Arrivée à l'aéroport, accueil par notre équipe locale et transfert vers votre hôtel. Installation dans vos chambres et briefing sur le programme. Reste de la journée libre pour vous reposer du voyage."
                                : day.title?.includes("Départ")
                                  ? "Petit-déjeuner à l'hôtel. Selon l'horaire de votre vol, temps libre pour derniers achats. Transfert vers l'aéroport et assistance aux formalités d'embarquement. Vol retour vers l'Algérie."
                                  : day.title?.toLowerCase().includes("libre")
                                    ? "Journée complètement libre pour découvrir la destination à votre rythme. Profitez pour faire du shopping, vous détendre ou explorer les environs selon vos envies."
                                    : `Journée complète d'excursions et de découvertes. ${day.title}. Accompagnement par guide local francophone. Déjeuner libre. Retour à l'hôtel en fin d'après-midi.`}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sites & Attractions */}
            {destination.keyAttractions && destination.keyAttractions.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                  <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                  Sites & Attractions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {destination.keyAttractions.map((attraction, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                    >
                      <FaGlobe className="text-blue-500 text-lg sm:text-xl flex-shrink-0" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        {attraction}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Included / Not included */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

              {destination.included && destination.included.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-green-100">
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-green-700">
                    <FaCheckCircle className="text-green-500" />
                    Inclus dans le prix
                  </h3>
                  <ul className="space-y-2.5 sm:space-y-3">
                    {destination.included.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-xs sm:text-sm text-gray-700"
                      >
                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {destination.notIncluded && destination.notIncluded.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-red-100">
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-red-700">
                    <FaTimesCircle className="text-red-500" />
                    Non inclus
                  </h3>
                  <ul className="space-y-2.5 sm:space-y-3">
                    {destination.notIncluded.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-xs sm:text-sm text-gray-700"
                      >
                        <FaTimesCircle className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column (sidebar) ── */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4">

            {/* Pricing card */}
            <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-5 sm:p-7 md:p-8 border-2 border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20 opacity-50" />
              <div className="relative">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
                  Tarifs & Réservation
                </h3>

                {Object.keys(pricingOptions).length > 1 && (
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Choisissez votre hôtel:
                    </label>
                    <div className="space-y-2">
                      {Object.entries(pricingOptions).map(([key, pricing], index) => (
                        <button
                          key={key}
                          onClick={() => setSelectedHotel(index)}
                          className={`w-full p-3 sm:p-4 rounded-xl text-left transition-all duration-200 ${selectedHotel === index
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-sm sm:text-base truncate">
                                {pricing?.name}
                              </p>
                              {key.includes("star") && (
                                <div className="flex items-center gap-1 mt-1">
                                  {Array(parseInt(key.charAt(0), 10))
                                    .fill(0)
                                    .map((_, i) => (
                                      <FaStar
                                        key={i}
                                        className={`text-[11px] sm:text-xs ${selectedHotel === index
                                          ? "text-yellow-300"
                                          : "text-yellow-400"
                                          }`}
                                      />
                                    ))}
                                </div>
                              )}
                            </div>
                            {selectedHotel === index && (
                              <FaCheckCircle className="text-lg sm:text-2xl flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  {/* Double */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-blue-600" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          Chambre Double
                        </span>
                      </div>
                      <span className="text-xl sm:text-2xl font-bold text-blue-600">
                        {(currentPricing.double || currentPricing.triple)?.toLocaleString()}{" "}
                        {destination.pricing?.currency || "DZD"}
                      </span>
                    </div>
                  </div>

                  {/* Single */}
                  {currentPricing.single && (
                    <div className="p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          Chambre Single
                        </span>
                        <span className="font-bold text-gray-900 text-sm sm:text-base">
                          {currentPricing.single.toLocaleString()}{" "}
                          {destination.pricing?.currency || "DZD"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Children */}
                  {(currentPricing.child_2to5 ||
                    currentPricing.child_5to11 ||
                    currentPricing.infant ||
                    currentPricing.child_under12 ||
                    currentPricing.first_child ||
                    currentPricing.second_child) && (
                      <div className="p-3 sm:p-4 rounded-xl bg-pink-50 border border-pink-200">
                        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                          <FaChild className="text-pink-600" />
                          <span className="font-semibold text-gray-900 text-sm sm:text-base">
                            Tarifs Enfants
                          </span>
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm text-gray-700">
                          {currentPricing.child_2to5 && (
                            <div className="flex justify-between">
                              <span>2-5 ans:</span>
                              <span className="font-semibold">
                                {currentPricing.child_2to5.toLocaleString()}{" "}
                                {destination.pricing?.currency || "DZD"}
                              </span>
                            </div>
                          )}
                          {currentPricing.child_5to11 && (
                            <div className="flex justify-between">
                              <span>5-11 ans:</span>
                              <span className="font-semibold">
                                {currentPricing.child_5to11.toLocaleString()}{" "}
                                {destination.pricing?.currency || "DZD"}
                              </span>
                            </div>
                          )}
                          {currentPricing.first_child && (
                            <div className="flex justify-between">
                              <span>1er enfant:</span>
                              <span className="font-semibold">
                                {currentPricing.first_child.toLocaleString()}{" "}
                                {destination.pricing?.currency || "DZD"}
                              </span>
                            </div>
                          )}
                          {currentPricing.second_child && (
                            <div className="flex justify-between">
                              <span>2e enfant:</span>
                              <span className="font-semibold">
                                {currentPricing.second_child.toLocaleString()}{" "}
                                {destination.pricing?.currency || "DZD"}
                              </span>
                            </div>
                          )}
                          {currentPricing.infant && (
                            <div className="flex justify-between">
                              <span>Bébé:</span>
                              <span className="font-semibold">
                                {currentPricing.infant.toLocaleString()}{" "}
                                {destination.pricing?.currency || "DZD"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* Departure dates */}
                {destination.departureDates && destination.departureDates.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <FaCalendarAlt className="text-blue-600" />
                      Dates disponibles
                    </h4>
                    <div className="space-y-2">
                      {destination.departureDates.slice(0, 3).map((date, index) => (
                        <div
                          key={index}
                          className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-blue-300 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-700">
                              {date.outbound}{date.return && ` → ${date.return}`}
                            </span>
                            <FaCheckCircle className="text-green-500 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Guarantee */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-5 rounded-2xl mb-4 sm:mb-6 border border-green-200">
                  <div className="flex items-start gap-3">
                    <MdVerifiedUser className="text-green-600 text-xl sm:text-2xl mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-green-900 mb-0.5 sm:mb-1 text-sm sm:text-base">
                        Garantie & Sécurité
                      </h4>
                      <p className="text-xs sm:text-sm text-green-700 leading-relaxed">
                        Départ garanti • Assurance voyage incluse • Paiement sécurisé
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  variant="primary"
                  className="w-full py-3.5 sm:py-4 text-sm sm:text-lg font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 mb-2.5 sm:mb-3"
                >
                  Réserver maintenant
                </Button>

                <p className="text-[10px] sm:text-xs text-center text-gray-500 flex items-center justify-center gap-1.5 sm:gap-2">
                  <FaInfoCircle />
                  Places limitées • Réservez dès maintenant
                </p>
              </div>
            </div>

            {/* Support card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-6 border border-orange-200">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-white p-2.5 sm:p-3 rounded-full shadow-md">
                  <FaPhoneAlt className="text-orange-500 text-lg sm:text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">
                    Besoin d&apos;aide ?
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Notre équipe est disponible 24/7 pour répondre à vos questions.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-2 border-orange-300 text-orange-700 hover:bg-orange-100 font-semibold text-xs sm:text-sm transition-all duration-200"
              >
                Contacter le support
              </Button>
            </div>

          </div>
        </div>
      </main>
    </section>
  );
}

export default OrganizedTrip;