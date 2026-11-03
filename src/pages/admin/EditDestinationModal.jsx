import React, { useState, useActionState, useEffect } from 'react';
import { X, Save, Globe, Plane, DollarSign, List, Home, Map, Plus, Trash2, ImageUp, Images } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AllezGoApi from "../../services/allezgo-api/allezGoApi.js";
import ArrayInput from '../../components/admin/ArrayInput.jsx';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl.js';

export default function EditDestinationModal({ destination, onClose }) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState(1);
    const [imagePreview, setImagePreview] = useState(null);

    const [mainCities, setMainCities] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [included, setIncluded] = useState([]);
    const [notIncluded, setNotIncluded] = useState([]);
    const [keyAttractions, setKeyAttractions] = useState([]);
    const [accommodations, setAccommodations] = useState([]);
    const [itineraries, setItineraries] = useState([]);
    const [departureDates, setDepartureDates] = useState([]);
    const [visaInfo, setVisaInfo] = useState({ required: false, price: '', duration: '', notes: '' });
    const [galleryImages, setGalleryImages] = useState([]);
    const [flightType, setFlightType] = useState('Vol direct');
    const [category, setCategory] = useState(destination?.category ?? 'voyage_organise');

    useEffect(() => {
        if (destination) {
            setMainCities(destination.mainCities || []);
            setHighlights(destination.highlights || []);
            setIncluded(destination.included || []);
            setNotIncluded(destination.notIncluded || []);
            setKeyAttractions(destination.keyAttractions || []);
            setAccommodations(destination.accommodations || []);
            setItineraries(destination.itineraries || []);
            setDepartureDates(destination.departureDates || []);
            const vi = destination.visaInfo;
            setVisaInfo(vi ? { required: vi.required ?? false, price: vi.price ?? '', duration: vi.duration ?? '', notes: vi.notes ?? '' } : { required: false, price: '', duration: '', notes: '' });
            setFlightType(destination.flightDetails?.type || 'Vol direct');
            setGalleryImages(destination.images || []);
            setCategory(destination.category ?? 'voyage_organise');
            setImagePreview(null);
            setActiveTab(1);
        }
    }, [destination]);

    const handleGalleryUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const newImage = await AllezGoApi.Destinations.addImage(destination.id, formData);
            setGalleryImages(prev => [...prev, newImage]);
            queryClient.invalidateQueries({ queryKey: ['destinations'] });
            queryClient.invalidateQueries({ queryKey: ['destination', String(destination.id)] });
            toast.success('Photo ajoutée');
        } catch {
            toast.error("Erreur lors de l'ajout de la photo");
        }
        e.target.value = '';
    };

    const handleGalleryRemove = async (imageId) => {
        try {
            await AllezGoApi.Destinations.removeImage(destination.id, imageId);
            setGalleryImages(prev => prev.filter(img => img.id !== imageId));
            queryClient.invalidateQueries({ queryKey: ['destinations'] });
            queryClient.invalidateQueries({ queryKey: ['destination', String(destination.id)] });
            toast.success('Photo supprimée');
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleSetCover = async (imageId) => {
        try {
            await AllezGoApi.Destinations.setCover(destination.id, imageId);
            setGalleryImages(prev => prev.map(img => ({ ...img, isCover: img.id === imageId })));
            queryClient.invalidateQueries({ queryKey: ['destinations'] });
            queryClient.invalidateQueries({ queryKey: ['destination', String(destination.id)] });
            toast.success('Photo de couverture mise à jour');
        } catch {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const handleClose = () => {
        setImagePreview(null);
        onClose();
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const preventEnterSubmit = (e) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    const handleAddAccommodation = () => {
        setAccommodations([...accommodations, { location: '', hotel: '', stars: 3, nights: 1, prices: [] }]);
    };

    const updateAccommodation = (index, field, value) => {
        const newAcc = [...accommodations];
        newAcc[index][field] = (field === 'stars' || field === 'nights')
            ? Number(value)
            : field === 'distance_to_haram'
                ? (value === '' ? null : Number(value))
                : value;
        setAccommodations(newAcc);
    };

    const addPrice = (accIdx) => {
        const updated = [...accommodations];
        updated[accIdx] = { ...updated[accIdx], prices: [...(updated[accIdx].prices ?? []), { roomType: 'double', pricePerAdult: 0, currency: 'DZD' }] };
        setAccommodations(updated);
    };

    const updatePrice = (accIdx, priceIdx, field, value) => {
        const updated = [...accommodations];
        const prices = [...(updated[accIdx].prices ?? [])];
        prices[priceIdx] = { ...prices[priceIdx], [field]: value };
        updated[accIdx] = { ...updated[accIdx], prices };
        setAccommodations(updated);
    };

    const removePrice = (accIdx, priceIdx) => {
        const updated = [...accommodations];
        updated[accIdx] = { ...updated[accIdx], prices: (updated[accIdx].prices ?? []).filter((_, i) => i !== priceIdx) };
        setAccommodations(updated);
    };

    const handleAddItinerary = () => {
        setItineraries([...itineraries, { day: itineraries.length + 1, title: '' }]);
    };

    const updateItinerary = (index, field, value) => {
        const newItin = [...itineraries];
        newItin[index][field] = field === 'day' ? Number(value) : value;
        setItineraries(newItin);
    };

    const handleAddDepartureDate = () => {
        setDepartureDates([...departureDates, { outbound: '', return: '' }]);
    };

    const updateDepartureDate = (index, field, value) => {
        const updated = [...departureDates];
        updated[index][field] = value;
        setDepartureDates(updated);
    };

    const submitDestination = async (prevState, formData) => {
        try {
            // 1. Validation
            const name = formData.get('name');
            if (!name) return { success: false, error: "Veuillez remplir le Nom de la destination (Onglet 1)." };
            if (!formData.get('image_url') && !formData.get('image_file')?.size)
                return { success: false, error: "Veuillez ajouter une image (Onglet 1)." };
            // 2. Resolve image URL — upload new file if provided, else keep existing
            let image_url = destination.image_url;
            const imageFile = formData.get('image_file');
            if (imageFile && imageFile.size > 0) {
                const uploadFD = new FormData();
                uploadFD.append('file', imageFile);
                const uploadResult = await AllezGoApi.Destinations.uploadImage(uploadFD);
                image_url = uploadResult?.url ?? uploadResult?.path ?? (uploadResult?.filename ? `/upload/destinations/${uploadResult.filename}` : null);
                if (!image_url) throw new Error("Le serveur n'a pas retourné l'URL de l'image.");
            }

            // 3. Compile payload
            const pricing = {
                double: Number(formData.get('pricing.double') || 0),
                single: Number(formData.get('pricing.single') || 0),
                infant: Number(formData.get('pricing.infant') || 0),
                triple: Number(formData.get('pricing.triple') || 0),
                child_under4: Number(formData.get('pricing.child_under4') || 0),
                second_child: Number(formData.get('pricing.second_child') || 0),
                child_under12: Number(formData.get('pricing.child_under12') || 0),
                currency: formData.get('pricing.currency') || 'DZD',
            };

            const flightDetails = {
                type: formData.get('flightDetails.type') || 'Vol direct',
                via: formData.get('flightDetails.via') || undefined,
                outbound: {
                    departure: formData.get('flightDetails.outbound.departure') || '',
                    arrival: formData.get('flightDetails.outbound.arrival') || '',
                },
                return: {
                    departure: formData.get('flightDetails.return.departure') || '',
                    arrival: formData.get('flightDetails.return.arrival') || '',
                },
            };
            if (!flightDetails.via) delete flightDetails.via;

            const visaInfoPayload = visaInfo.required
                ? { required: true, price: visaInfo.price || undefined, duration: visaInfo.duration || undefined, notes: visaInfo.notes || undefined }
                : { required: false };

            const payload = {
                name,
                image_url,
                duration: {
                    days: Number(formData.get('duration.days') || 0),
                    nights: Number(formData.get('duration.nights') || 0),
                },
                departureFrom: formData.get('departureFrom') || '',
                airline: formData.get('airline') || '',
                mealPlan: formData.get('mealPlan') || '',
                pricing,
                flightDetails,
                departureDates,
                visaInfo: visaInfoPayload,
                mainCities,
                highlights,
                included,
                notIncluded,
                keyAttractions,
                accommodations: accommodations.map(acc => ({
                    ...acc,
                    holy_city: acc.holy_city || undefined,
                    distance_to_haram: acc.distance_to_haram ?? undefined,
                })),
                itineraries,
                category,
            };

            await AllezGoApi.Destinations.update(destination.id, payload);
            await queryClient.invalidateQueries({ queryKey: ['destinations', category] });

            toast.success('Destination modifiée avec succès !');
            handleClose();
            return { success: true, error: null };

        } catch (error) {
            console.error("Mutation Error:", error);
            toast.error('Erreur lors de la modification');
            return { success: false, error: error.message || 'Échec de la requête' };
        }
    };

    const [state, formAction, isPending] = useActionState(submitDestination, null);

    if (!destination) return null;

    const currentImageSrc = resolveMediaUrl(destination.image_url);

    const tabs = [
        { id: 1, label: 'Infos Générales', icon: Globe },
        { id: 2, label: 'Tarification & Vols', icon: DollarSign },
        { id: 3, label: 'Détails & Inclusions', icon: List },
        { id: 4, label: 'Hébergements', icon: Home },
        { id: 5, label: 'Itinéraire', icon: Map },
        { id: 6, label: 'Photos', icon: Images },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/40 md:backdrop-blur-sm font-sans md:p-4">
            <div className="fixed inset-0 w-full h-full max-h-screen rounded-none overflow-y-auto bg-white md:relative md:w-full md:max-w-5xl md:h-auto md:max-h-[90vh] md:rounded-xl shadow-xl flex flex-col md:overflow-hidden md:border md:border-sky-100">

                {/* Header */}
                <div className="px-6 py-4 border-b border-sky-50 flex justify-between items-center bg-gradient-to-r from-sky-50 to-white shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Plane className="w-6 h-6 text-sky-500" />
                        Modifier Destination
                    </h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form action={formAction} noValidate className="flex flex-col md:flex-row flex-1 min-h-0 md:overflow-hidden">

                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-sky-50 p-4 shrink-0 md:overflow-y-auto">
                        <nav className="flex md:flex-col overflow-x-auto whitespace-nowrap scrollbar-hide pb-2 md:pb-0 gap-2 md:gap-0 md:space-y-1">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`shrink-0 md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all
                                            ${isActive ? 'bg-white text-sky-600 shadow-sm border border-sky-100' : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent'}
                                        `}
                                    >
                                        <Icon size={18} className={isActive ? 'text-sky-500' : 'text-slate-400'} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>

                        {state?.error && (
                            <div className="mt-8 p-4 bg-red-50/80 rounded-xl border border-red-100">
                                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Erreur</p>
                                <p className="text-sm text-red-700">{state.error}</p>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col min-h-0 md:overflow-hidden bg-white">
                        <div className="flex-1 overflow-y-auto p-4 md:p-8">

                            {/* Tab 1: Infos Générales */}
                            <div className={activeTab === 1 ? 'block' : 'hidden'}>
                                <h4 className="text-lg font-bold text-slate-800 mb-6 border-b border-sky-50 pb-2">Informations Générales</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nom (ex: Istanbul Evasion)</label>
                                        <input type="text" name="name" defaultValue={destination.name} onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Catégorie</label>
                                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="block w-full md:w-1/2 px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500">
                                            <option value="voyage_organise">Voyage organisé</option>
                                            <option value="omra">Omra</option>
                                        </select>
                                    </div>

                                    {/* Image section */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Image principale</label>

                                        {/* Current image */}
                                        {!imagePreview && destination.image_url && (
                                            <div className="mb-3">
                                                <p className="text-xs text-slate-400 mb-1">Image actuelle</p>
                                                <img
                                                    src={currentImageSrc}
                                                    alt="Image actuelle"
                                                    className="h-36 w-full object-cover rounded-lg border border-sky-100 shadow-sm"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}

                                        {/* New file preview */}
                                        {imagePreview && (
                                            <div className="mb-3">
                                                <p className="text-xs text-sky-500 font-semibold mb-1">Nouvelle image</p>
                                                <img
                                                    src={imagePreview}
                                                    alt="Aperçu nouvelle image"
                                                    className="h-36 w-full object-cover rounded-lg border border-sky-300 shadow-sm"
                                                />
                                            </div>
                                        )}

                                        {/* Hidden field carries the existing image_url so validation passes when no new file */}
                                        <input type="hidden" name="image_url" value={destination.image_url || ''} />

                                        <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-sky-200 bg-sky-50/40 rounded-lg cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors">
                                            <ImageUp size={20} className="text-sky-500 shrink-0" />
                                            <span className="text-sm text-slate-500">
                                                {imagePreview ? 'Changer l\'image…' : 'Remplacer l\'image (optionnel)'}
                                            </span>
                                            <input
                                                type="file"
                                                name="image_file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="sr-only"
                                            />
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Départ depuis</label>
                                        <input type="text" name="departureFrom" defaultValue={destination.departureFrom} placeholder="Ex: Alger" onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Jours</label>
                                            <input type="number" name="duration.days" defaultValue={destination.duration?.days} min="1" onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nuits</label>
                                            <input type="number" name="duration.nights" defaultValue={destination.duration?.nights} min="0" onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Compagnie Aérienne</label>
                                        <input type="text" name="airline" defaultValue={destination.airline} placeholder="Ex: Air Algérie" onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Plan de Repas par défaut</label>
                                        <input type="text" name="mealPlan" defaultValue={destination.mealPlan} placeholder="Ex: Petit Déjeuner inclus" onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Tab 2: Tarification & Vols */}
                            <div className={activeTab === 2 ? 'block' : 'hidden'}>
                                <h4 className="text-lg font-bold text-slate-800 mb-6 border-b border-sky-50 pb-2">Tarification</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Devise (Currency)</label>
                                        <select name="pricing.currency" defaultValue={destination.pricing?.currency || "DZD"} className="block w-full md:w-1/2 px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500">
                                            <option value="DZD">DZD (Dinars)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="USD">USD ($)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Chambre Double</label>
                                        <input type="number" name="pricing.double" defaultValue={destination.pricing?.double} onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Chambre Single</label>
                                        <input type="number" name="pricing.single" defaultValue={destination.pricing?.single} onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Chambre Triple</label>
                                        <input type="number" name="pricing.triple" defaultValue={destination.pricing?.triple} onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Bébé (&lt; 2 ans)</label>
                                        <input type="number" name="pricing.infant" defaultValue={destination.pricing?.infant} onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Enfant (- de 4 ans)</label>
                                        <input type="number" name="pricing.child_under4" defaultValue={destination.pricing?.child_under4} onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Enfant (2ème)</label>
                                        <input type="number" name="pricing.second_child" defaultValue={destination.pricing?.second_child} onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Enfant (- de 12 ans)</label>
                                        <input type="number" name="pricing.child_under12" defaultValue={destination.pricing?.child_under12} onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                </div>

                                <h4 className="text-lg font-bold text-slate-800 mb-6 border-b border-sky-50 pb-2">Vols (Flight Details)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Type de vol</label>
                                        <select name="flightDetails.type" value={flightType} onChange={(e) => setFlightType(e.target.value)} className="block w-full md:w-1/2 px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500">
                                            <option value="Vol direct">Vol direct</option>
                                            <option value="Avec escale">Avec escale</option>
                                        </select>
                                    </div>
                                    {flightType === 'Avec escale' && (
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Escale (Via)</label>
                                            <input type="text" name="flightDetails.via" defaultValue={destination.flightDetails?.via} placeholder="Ex: Via Dubai" onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Vol Aller — Départ</label>
                                        <input type="text" name="flightDetails.outbound.departure" defaultValue={destination.flightDetails?.outbound?.departure} placeholder="Ex: AH3015 · Alger 15:30" onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Vol Aller — Arrivée</label>
                                        <input type="text" name="flightDetails.outbound.arrival" defaultValue={destination.flightDetails?.outbound?.arrival} placeholder="Ex: Istanbul 20:00" onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Vol Retour — Départ</label>
                                        <input type="text" name="flightDetails.return.departure" defaultValue={destination.flightDetails?.return?.departure} placeholder="Ex: AH3016 · Istanbul 22:00" onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Vol Retour — Arrivée</label>
                                        <input type="text" name="flightDetails.return.arrival" defaultValue={destination.flightDetails?.return?.arrival} placeholder="Ex: Alger 02:00" onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-4 border-b border-sky-50 pb-2">
                                    <h4 className="text-lg font-bold text-slate-800">Dates de Départ</h4>
                                    <button type="button" onClick={handleAddDepartureDate} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-lg transition-colors">
                                        <Plus size={16} /> Ajouter une date
                                    </button>
                                </div>
                                {departureDates.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic mb-2">Aucune date ajoutée.</p>
                                ) : (
                                    <div className="space-y-2 mb-2">
                                        {departureDates.map((d, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white border border-sky-100 rounded-xl p-3">
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Départ (YYYY-MM-DD)</label>
                                                        <input type="date" value={d.outbound} onChange={(e) => updateDepartureDate(i, 'outbound', e.target.value)} className="block w-full px-2 py-1.5 text-sm border border-sky-100 rounded-lg focus:ring-1 focus:ring-sky-500 outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Retour (YYYY-MM-DD)</label>
                                                        <input type="date" value={d.return} onChange={(e) => updateDepartureDate(i, 'return', e.target.value)} className="block w-full px-2 py-1.5 text-sm border border-sky-100 rounded-lg focus:ring-1 focus:ring-sky-500 outline-none" />
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => setDepartureDates(departureDates.filter((_, idx) => idx !== i))} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tab 3: Détails & Inclusions */}
                            <div className={activeTab === 3 ? 'block' : 'hidden'}>
                                <h4 className="text-lg font-bold text-slate-800 mb-6 border-b border-sky-50 pb-2">Données Spécifiques</h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2">
                                    <ArrayInput label="Villes Principales (Main Cities)" items={mainCities} setItems={setMainCities} placeholder="Ex: Kuala Lumpur" />
                                    <ArrayInput label="Attractions Clés (Key Attractions)" items={keyAttractions} setItems={setKeyAttractions} placeholder="Ex: Tours Petronas" />

                                    <div className="col-span-1 lg:col-span-2"><hr className="border-sky-50 my-2" /></div>

                                    <ArrayInput label="Ce qui est Inclus" items={included} setItems={setIncluded} placeholder="Ex: Billet d'avion A/R" />
                                    <ArrayInput label="Ce qui n'est pas Inclus (Not Included)" items={notIncluded} setItems={setNotIncluded} placeholder="Ex: Frais de visa" />

                                    <div className="col-span-1 lg:col-span-2"><hr className="border-sky-50 my-2" /></div>

                                    <ArrayInput label="Points Forts (Highlights)" items={highlights} setItems={setHighlights} placeholder="Ex: Meilleur rapport qualité/prix" />

                                    <div className="col-span-1 lg:col-span-2"><hr className="border-sky-50 my-2" /></div>

                                    <div className="col-span-1 lg:col-span-2">
                                        <p className="text-sm font-bold text-slate-700 mb-3">Informations Visa</p>
                                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                            <input type="checkbox" checked={visaInfo.required} onChange={(e) => setVisaInfo({ ...visaInfo, required: e.target.checked })} className="w-4 h-4 accent-sky-600 rounded" />
                                            <span className="text-sm font-semibold text-slate-700">Visa requis</span>
                                        </label>
                                        {visaInfo.required && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Prix du visa</label>
                                                    <input type="text" value={visaInfo.price} onChange={(e) => setVisaInfo({ ...visaInfo, price: e.target.value })} onKeyDown={preventEnterSubmit} placeholder="Ex: 15 000 DZD" className="block w-full px-3 py-2 text-sm border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-1 focus:ring-sky-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Durée de validité</label>
                                                    <input type="text" value={visaInfo.duration} onChange={(e) => setVisaInfo({ ...visaInfo, duration: e.target.value })} onKeyDown={preventEnterSubmit} placeholder="Ex: 30 jours" className="block w-full px-3 py-2 text-sm border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-1 focus:ring-sky-500 outline-none" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Notes / Documents requis</label>
                                                    <textarea value={visaInfo.notes} onChange={(e) => setVisaInfo({ ...visaInfo, notes: e.target.value })} rows={2} placeholder="Ex: Passeport valide 6 mois + photos..." className="block w-full px-3 py-2 text-sm border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-1 focus:ring-sky-500 outline-none resize-none" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tab 4: Hébergements */}
                            <div className={activeTab === 4 ? 'block' : 'hidden'}>
                                <div className="flex justify-between items-center mb-6 border-b border-sky-50 pb-2">
                                    <h4 className="text-lg font-bold text-slate-800">Liste des Hébergements</h4>
                                    <button type="button" onClick={handleAddAccommodation} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-lg transition-colors">
                                        <Plus size={16} /> Ajouter un hôtel
                                    </button>
                                </div>

                                {accommodations.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                                        <Home className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-500 font-medium text-sm">Aucun hébergement ajouté.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {accommodations.map((acc, index) => (
                                            <div key={index} className="bg-white p-4 border border-sky-100 rounded-xl shadow-sm relative">
                                                <button type="button" onClick={() => setAccommodations(accommodations.filter((_, i) => i !== index))} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1 bg-slate-50 hover:bg-red-50 rounded-md">
                                                    <Trash2 size={16} />
                                                </button>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full pr-8">
                                                    <div className="col-span-2">
                                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Localisation / Ville</label>
                                                        <input type="text" value={acc.location} onChange={(e) => updateAccommodation(index, 'location', e.target.value)} onKeyDown={preventEnterSubmit} placeholder="Ex: Istanbul" className="block w-full px-3 py-2 text-sm border border-sky-100 rounded-lg focus:ring-1 focus:ring-sky-500 outline-none" required />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Nom de l'Hôtel</label>
                                                        <input type="text" value={acc.hotel} onChange={(e) => updateAccommodation(index, 'hotel', e.target.value)} onKeyDown={preventEnterSubmit} placeholder="Ex: Hilton Bosphorus" className="block w-full px-3 py-2 text-sm border border-sky-100 rounded-lg focus:ring-1 focus:ring-sky-500 outline-none" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Étoiles</label>
                                                        <input type="number" min="1" max="5" value={acc.stars} onChange={(e) => updateAccommodation(index, 'stars', e.target.value)} onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 text-sm border border-sky-100 rounded-lg focus:ring-1 focus:ring-sky-500 outline-none" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre de nuits</label>
                                                        <input type="number" min="1" value={acc.nights} onChange={(e) => updateAccommodation(index, 'nights', e.target.value)} onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 text-sm border border-sky-100 rounded-lg focus:ring-1 focus:ring-sky-500 outline-none" required />
                                                    </div>
                                                </div>
                                                {category === 'omra' && (
                                                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-emerald-50">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-emerald-600 mb-1">Ville sainte</label>
                                                            <select value={acc.holy_city ?? ''} onChange={(e) => updateAccommodation(index, 'holy_city', e.target.value || null)} className="block w-full px-3 py-2 text-sm border border-emerald-100 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
                                                                <option value="">— Choisir —</option>
                                                                <option value="makkah">🕋 Makkah</option>
                                                                <option value="madinah">🕌 Madinah</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-emerald-600 mb-1">Distance du Haram (m)</label>
                                                            <input type="number" min="0" value={acc.distance_to_haram ?? ''} onChange={(e) => updateAccommodation(index, 'distance_to_haram', e.target.value)} onKeyDown={preventEnterSubmit} placeholder="Ex: 500" className="block w-full px-3 py-2 text-sm border border-emerald-100 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Per-hotel price grid */}
                                                <div className="mt-3 pt-3 border-t border-sky-50">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-semibold text-slate-600">Tarifs par type de chambre</span>
                                                        <button type="button" onClick={() => addPrice(index)} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg transition-colors">
                                                            <Plus size={12} /> Ajouter un tarif
                                                        </button>
                                                    </div>
                                                    {(acc.prices ?? []).length === 0 && (
                                                        <p className="text-xs text-slate-400 italic">Aucun tarif — utilisera les tarifs généraux du voyage.</p>
                                                    )}
                                                    <div className="space-y-2">
                                                        {(acc.prices ?? []).map((p, pi) => (
                                                            <div key={pi} className="bg-slate-50 rounded-lg p-2.5 space-y-2">
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
                                                                    <div>
                                                                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Type</label>
                                                                        <select value={p.roomType} onChange={(e) => updatePrice(index, pi, 'roomType', e.target.value)} className="block w-full px-2 py-1.5 text-xs border border-sky-100 rounded-md bg-white focus:ring-1 focus:ring-sky-500 outline-none">
                                                                            <option value="double">Double</option>
                                                                            <option value="triple">Triple</option>
                                                                            <option value="single">Single</option>
                                                                            <option value="quadruple">Quadruple</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Prix / adulte</label>
                                                                        <input type="number" min="0" value={p.pricePerAdult ?? ''} onKeyDown={preventEnterSubmit} onChange={(e) => updatePrice(index, pi, 'pricePerAdult', Number(e.target.value))} className="block w-full px-2 py-1.5 text-xs border border-sky-100 rounded-md focus:ring-1 focus:ring-sky-500 outline-none" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Prix promo</label>
                                                                        <input type="number" min="0" value={p.promoPrice ?? ''} onKeyDown={preventEnterSubmit} onChange={(e) => updatePrice(index, pi, 'promoPrice', e.target.value ? Number(e.target.value) : null)} placeholder="Optionnel" className="block w-full px-2 py-1.5 text-xs border border-sky-100 rounded-md focus:ring-1 focus:ring-sky-500 outline-none" />
                                                                    </div>
                                                                    <div className="flex items-end gap-1.5">
                                                                        <div className="flex-1">
                                                                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Label promo</label>
                                                                            <input type="text" value={p.promoLabel ?? ''} onKeyDown={preventEnterSubmit} onChange={(e) => updatePrice(index, pi, 'promoLabel', e.target.value || null)} placeholder="Ex: Early Booking" className="block w-full px-2 py-1.5 text-xs border border-sky-100 rounded-md focus:ring-1 focus:ring-sky-500 outline-none" />
                                                                        </div>
                                                                        <button type="button" onClick={() => removePrice(index, pi)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0">
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {p.promoPrice != null && p.promoPrice !== '' && p.promoPrice !== 0 && (
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div>
                                                                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Promo du</label>
                                                                            <input type="date" value={p.promoStartsAt ?? ''} onChange={(e) => updatePrice(index, pi, 'promoStartsAt', e.target.value || null)} className="block w-full px-2 py-1.5 text-xs border border-sky-100 rounded-md focus:ring-1 focus:ring-sky-500 outline-none" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Au</label>
                                                                            <input type="date" value={p.promoEndsAt ?? ''} onChange={(e) => updatePrice(index, pi, 'promoEndsAt', e.target.value || null)} className="block w-full px-2 py-1.5 text-xs border border-sky-100 rounded-md focus:ring-1 focus:ring-sky-500 outline-none" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tab 5: Itinéraire */}
                            <div className={activeTab === 5 ? 'block' : 'hidden'}>
                                <div className="flex justify-between items-center mb-6 border-b border-sky-50 pb-2">
                                    <h4 className="text-lg font-bold text-slate-800">Itinéraire du voyage</h4>
                                    <button type="button" onClick={handleAddItinerary} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-lg transition-colors">
                                        <Plus size={16} /> Ajouter un jour
                                    </button>
                                </div>

                                {itineraries.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                                        <Map className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-500 font-medium text-sm">Aucun itinéraire ajouté.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {itineraries.map((itin, index) => (
                                            <div key={index} className="flex gap-4 items-center bg-white p-4 border border-sky-100 rounded-xl shadow-sm relative">
                                                <div className="w-20 shrink-0">
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Jour Num</label>
                                                    <input type="number" min="1" value={itin.day} onChange={(e) => updateItinerary(index, 'day', e.target.value)} onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 text-sm border border-sky-100 rounded-lg focus:ring-1 focus:ring-sky-500 outline-none font-bold text-sky-700 bg-sky-50/50 text-center" required />
                                                </div>
                                                <div className="flex-1 pr-10">
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Titre de la journée / Programme</label>
                                                    <input type="text" value={itin.title} onChange={(e) => updateItinerary(index, 'title', e.target.value)} onKeyDown={preventEnterSubmit} placeholder="Ex: Arrivée et temps libre..." className="block w-full px-3 py-2 text-sm border border-sky-100 rounded-lg focus:ring-1 focus:ring-sky-500 outline-none" required />
                                                </div>
                                                <button type="button" onClick={() => setItineraries(itineraries.filter((_, i) => i !== index))} className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 hover:text-red-500 transition-colors p-1.5 bg-slate-50 hover:bg-red-50 rounded-md">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tab 6: Photos */}
                            <div className={activeTab === 6 ? 'block' : 'hidden'}>
                                <h4 className="text-lg font-bold text-slate-800 mb-6 border-b border-sky-50 pb-2">Galerie Photos</h4>
                                <label className="flex items-center gap-2 cursor-pointer mb-6 px-4 py-3 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl border border-dashed border-sky-300 w-fit transition-colors">
                                    <ImageUp size={20} />
                                    <span className="font-medium text-sm">Ajouter une photo</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                                </label>
                                {galleryImages.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                                        <Images className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-500 font-medium text-sm">Aucune photo. La photo de l'Onglet 1 sert de couverture.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {galleryImages.map(img => (
                                            <div key={img.id} className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 group/img">
                                                <img src={resolveMediaUrl(img.url)} alt="" className="w-full h-full object-cover" />
                                                {img.isCover && (
                                                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-sky-600 text-white text-xs font-semibold rounded-full">Couverture</span>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    {!img.isCover && (
                                                        <button type="button" onClick={() => handleSetCover(img.id)} className="px-2 py-1 bg-sky-600 text-white text-xs rounded-lg font-medium">
                                                            Couverture
                                                        </button>
                                                    )}
                                                    <button type="button" onClick={() => handleGalleryRemove(img.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg font-medium">
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-sky-50 bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex gap-2 text-sm">
                                {activeTab > 1 && (
                                    <button type="button" onClick={() => setActiveTab(activeTab - 1)} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                                        Précédent
                                    </button>
                                )}
                                {activeTab < 6 && (
                                    <button type="button" onClick={() => setActiveTab(activeTab + 1)} className="px-4 py-2 text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg font-medium transition-colors">
                                        Suivant
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isPending}
                                    className="px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-6 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors flex items-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isPending ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    {isPending ? 'Modification...' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
}
