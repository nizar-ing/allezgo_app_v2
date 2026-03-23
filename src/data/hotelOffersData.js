// src/data/hotelOffersData.js
// price.formatted removed — use formatPrice(offer.price.amount) from pricingHelpers.js

/**
 * Static hotel offer cards shown in HotelShowcase.jsx and HotelsPopup.jsx.
 * All prices are raw numbers in DZD.
 */
export const hotelOfferCards = [
    {
        id: "hotel-blue-beach-golf-spa-monastir",
        type: "hotel-offer",
        hotel: {
            name: "Blue Beach Golf & Spa",
            rating: 4,
            location: { city: "Monastir", country: "Tunisia", display: "Monastir - Tunisie" },
        },
        image: {
            src: "/images/hotels/hotel-blue-beach-golf-spa-monastir.webp",
            alt: "Blue Beach Golf & Spa Monastir",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "All Inclusive",
            boardTypeLabel: "Tout compris",
            price: { amount: 9800, currency: "DZD", unit: "per night", per: "person" },
            childPolicy: { description: "1er Enfant - 6 ans Gratuit", maxAge: 6, free: true },
        },
        cta: { label: "Voir l'offre", action: "VIEW_OFFER", url: "/offers/hotel-blue-beach-golf-spa-monastir" },
        badges: [{ type: "family", label: "Famille" }],
        metadata: { locale: "fr-DZ" },
    },
    {
        id: "hotel-dar-ismail-tabarka-sousse",
        type: "hotel-offer",
        hotel: {
            name: "Dar Ismail Tabarka",
            rating: 5,
            location: { city: "Tabarka", country: "Tunisia", display: "Tabarka - Tunisie" },
        },
        image: {
            src: "/images/hotels/hotel-dar-ismail-tabarka-sousse.webp",
            alt: "Dar Ismail Tabarka Resort",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "Full Board",
            boardTypeLabel: "Pension complète",
            price: { amount: 11200, currency: "DZD", unit: "per night", per: "person" },
            childPolicy: { description: "Enfant - 5 ans Gratuit", maxAge: 5, free: true },
        },
        cta: { label: "Voir l'offre", action: "VIEW_OFFER", url: "/offers/hotel-dar-ismail-tabarka-sousse" },
        badges: [{ type: "nature", label: "Nature & Mer" }],
        metadata: { locale: "fr-DZ" },
    },
    {
        id: "hotel-eden-club-skanes-enfants",
        type: "hotel-offer",
        hotel: {
            name: "Eden Club Skanes",
            rating: 3,
            location: { city: "Skanes", country: "Tunisia", display: "Skanes - Tunisie" },
        },
        image: {
            src: "/images/hotels/hotel-eden-club-skanes-enfants.webp",
            alt: "Eden Club Skanes",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "All Inclusive",
            boardTypeLabel: "Tout compris",
            price: { amount: 7200, currency: "DZD", unit: "per night", per: "person" },
            childPolicy: { description: "2 Enfants Gratuit", maxAge: 12, free: true },
        },
        cta: { label: "Voir l'offre", action: "VIEW_OFFER", url: "/offers/hotel-eden-club-skanes-enfants" },
        badges: [{ type: "kids", label: "Spécial Enfants" }],
        metadata: { locale: "fr-DZ" },
    },
    {
        id: "hotel-ibiris-oran",
        type: "hotel-offer",
        hotel: {
            name: "Hôtel Ibiris",
            rating: 4,
            location: { city: "Oran", country: "Algeria", display: "Oran - Algérie" },
        },
        image: {
            src: "/images/hotels/hotel-ibiris-oran.webp",
            alt: "Hôtel Ibiris Oran",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "Breakfast",
            boardTypeLabel: "Petit déjeuner",
            price: { amount: 8500, currency: "DZD", unit: "per night", per: "person" },
            childPolicy: { description: "Enfant - 4 ans Gratuit", maxAge: 4, free: true },
        },
        cta: { label: "Voir l'offre", action: "VIEW_OFFER", url: "/offers/hotel-ibiris-oran" },
        badges: [{ type: "city", label: "City Hotel" }],
        metadata: { locale: "fr-DZ" },
    },
    {
        id: "hotel-madaure",
        type: "hotel-offer",
        hotel: {
            name: "Hôtel Madaure",
            rating: 4,
            location: { city: "Batna", country: "Algeria", display: "Batna - Algérie" },
        },
        image: {
            src: "/images/hotels/hotel-madaure.webp",
            alt: "Hôtel Madaure Batna",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "Half Board",
            boardTypeLabel: "Demi pension",
            price: { amount: 7900, currency: "DZD", unit: "per night", per: "person" },
            childPolicy: { description: "Enfant - 6 ans Gratuit", maxAge: 6, free: true },
        },
        cta: { label: "Voir l'offre", action: "VIEW_OFFER", url: "/offers/hotel-madaure" },
        badges: [{ type: "business", label: "Business" }],
        metadata: { locale: "fr-DZ" },
    },
    {
        id: "hotel-moevenpick-resort-marine-sousse",
        type: "hotel-offer",
        hotel: {
            name: "Mövenpick Resort & Marine Spa",
            rating: 5,
            location: { city: "Sousse", country: "Tunisia", display: "Sousse - Tunisie" },
        },
        image: {
            src: "/images/hotels/hotel-moevenpick-resort-marine-sousse.webp",
            alt: "Mövenpick Resort & Marine Spa",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "Half Board",
            boardTypeLabel: "Demi pension",
            price: { amount: 11900, currency: "DZD", unit: "per night", per: "person" },
            childPolicy: { description: "1er Enfant - 7 ans Gratuit", maxAge: 7, free: true },
        },
        cta: { label: "Voir l'offre", action: "VIEW_OFFER", url: "/offers/hotel-moevenpick-resort-marine-sousse" },
        badges: [{ type: "luxury", label: "Luxe" }],
        metadata: { locale: "fr-DZ" },
    },
    {
        id: "hotel-sabri-annaba",
        type: "hotel-offer",
        hotel: {
            name: "Hôtel Sabri",
            rating: 4,
            location: { city: "Annaba", country: "Algeria", display: "Annaba - Algérie" },
        },
        image: {
            src: "/images/hotels/Hotel-sabri-annaba.webp",
            alt: "Hôtel Sabri Annaba",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "Half Board",
            boardTypeLabel: "Demi pension",
            price: { amount: 8700, currency: "DZD", unit: "per night", per: "person" },
            childPolicy: { description: "Enfant - 5 ans Gratuit", maxAge: 5, free: true },
        },
        cta: { label: "Voir l'offre", action: "VIEW_OFFER", url: "/offers/hotel-sabri-annaba" },
        badges: [{ type: "sea", label: "Vue Mer" }],
        metadata: { locale: "fr-DZ" },
    },
    {
        id: "le-soleil-bella-vista-resort-toboggan",
        type: "hotel-offer",
        hotel: {
            name: "Le Soleil Bella Vista Resort",
            rating: 4,
            location: { city: "Monastir", country: "Tunisia", display: "Monastir - Tunisie" },
        },
        image: {
            src: "/images/hotels/Le-Soleil-Bella-Vista-Resort-Toboggan.webp",
            alt: "Le Soleil Bella Vista Resort",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "All Inclusive",
            boardTypeLabel: "Tout compris",
            price: { amount: 8600, currency: "DZD", unit: "per night", per: "person" },
            childPolicy: { description: "Enfant Gratuit", maxAge: 10, free: true },
        },
        cta: { label: "Voir l'offre", action: "VIEW_OFFER", url: "/offers/le-soleil-bella-vista-resort-toboggan" },
        badges: [{ type: "aqua", label: "Toboggans" }],
        metadata: { locale: "fr-DZ" },
    },
    {
        id: "regency-hammamet-hotel-piscine",
        type: "hotel-offer",
        hotel: {
            name: "Regency Hammamet",
            rating: 4,
            location: { city: "Hammamet", country: "Tunisia", display: "Hammamet - Tunisie" },
        },
        image: {
            src: "/images/hotels/Regency-Hammamet-Hotel-piscine.webp",
            alt: "Regency Hammamet Hotel",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "Half Board",
            boardTypeLabel: "Demi pension",
            price: { amount: 9100, currency: "DZD", unit: "per night", per: "person" },
            childPolicy: { description: "Enfant - 6 ans Gratuit", maxAge: 6, free: true },
        },
        cta: { label: "Voir l'offre", action: "VIEW_OFFER", url: "/offers/regency-hammamet-hotel-piscine" },
        badges: [{ type: "pool", label: "Piscine" }],
        metadata: { locale: "fr-DZ" },
    },
];
