import React, { useState, useActionState, useEffect } from 'react';
import { X, Save, Globe, Plane, DollarSign, List, Home, Map, Plus, Trash2, ImageUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AllezGoApi from "../../services/allezgo-api/allezGoApi.js";
import ArrayInput from '../../components/admin/ArrayInput.jsx';

const BACKEND_BASE = 'https://api.allezgoo.com';

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

    useEffect(() => {
        if (destination) {
            setMainCities(destination.mainCities || []);
            setHighlights(destination.highlights || []);
            setIncluded(destination.included || []);
            setNotIncluded(destination.notIncluded || []);
            setKeyAttractions(destination.keyAttractions || []);
            const dedupedAccommodations = Object.values(
                (destination.accommodations || []).reduce((map, entry) => {
                    const key = `${entry.hotel}||${entry.location}`;
                    if (!map[key] || (entry.id ?? 0) > (map[key].id ?? 0)) map[key] = entry;
                    return map;
                }, {})
            );
            setAccommodations(dedupedAccommodations);
            const dedupedItineraries = Object.values(
                (destination.itineraries || []).reduce((map, entry) => {
                    const key = entry.day;
                    if (!map[key] || (entry.id ?? 0) > (map[key].id ?? 0)) map[key] = entry;
                    return map;
                }, {})
            ).sort((a, b) => a.day - b.day);
            setItineraries(dedupedItineraries);
            setImagePreview(null);
            setActiveTab(1);
        }
    }, [destination]);

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
        setAccommodations([...accommodations, { location: '', hotel: '', stars: 3, nights: 1 }]);
    };

    const updateAccommodation = (index, field, value) => {
        const newAcc = [...accommodations];
        newAcc[index][field] = field === 'stars' || field === 'nights' ? Number(value) : value;
        setAccommodations(newAcc);
    };

    const handleAddItinerary = () => {
        setItineraries([...itineraries, { day: itineraries.length + 1, title: '' }]);
    };

    const updateItinerary = (index, field, value) => {
        const newItin = [...itineraries];
        newItin[index][field] = field === 'day' ? Number(value) : value;
        setItineraries(newItin);
    };

    const submitDestination = async (prevState, formData) => {
        try {
            // 1. Validation
            const name = formData.get('name');
            if (!name) return { success: false, error: "Veuillez remplir le Nom de la destination (Onglet 1)." };
            if (!formData.get('image_url') && !formData.get('image_file')?.size)
                return { success: false, error: "Veuillez ajouter une image (Onglet 1)." };
            if (itineraries.length === 0) return { success: false, error: "Veuillez ajouter au moins un jour d'itinéraire (Onglet 5)." };

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

            // 3. Compile payload — strip `id` from nested arrays (backend rejects them on update)
            const sanitizedAccommodations = accommodations.map(({ id, ...rest }) => rest);
            const sanitizedItineraries = itineraries.map(({ id, ...rest }) => rest);

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
                via: formData.get('flightDetails.via') || '',
                arrival: formData.get('flightDetails.arrival') || '',
                departure: formData.get('flightDetails.departure') || '',
            };

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
                mainCities,
                highlights,
                included,
                notIncluded,
                keyAttractions,
                accommodations: sanitizedAccommodations,
                itineraries: sanitizedItineraries,
            };

            await AllezGoApi.Destinations.update(destination.id, payload);
            await queryClient.invalidateQueries({ queryKey: ['destinations'] });

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

    // Resolve the URL to display the current image (may be relative path)
    const currentImageSrc = destination.image_url?.startsWith('http')
        ? destination.image_url
        : `${BACKEND_BASE}${destination.image_url}`;

    const tabs = [
        { id: 1, label: 'Infos Générales', icon: Globe },
        { id: 2, label: 'Tarification & Vols', icon: DollarSign },
        { id: 3, label: 'Détails & Inclusions', icon: List },
        { id: 4, label: 'Hébergements', icon: Home },
        { id: 5, label: 'Itinéraire', icon: Map },
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Escale (Via)</label>
                                        <input type="text" name="flightDetails.via" defaultValue={destination.flightDetails?.via} placeholder="Ex: Vol direct, Via Dubai..." onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Départ (Aller)</label>
                                        <input type="text" name="flightDetails.departure" defaultValue={destination.flightDetails?.departure} placeholder="Ex: AH3015 - 15:30" onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Arrivée (Retour)</label>
                                        <input type="text" name="flightDetails.arrival" defaultValue={destination.flightDetails?.arrival} placeholder="Ex: AH3016 - 21:00" onKeyDown={preventEnterSubmit} className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                    </div>
                                </div>
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
                                            <div key={index} className="flex gap-4 items-start bg-white p-4 border border-sky-100 rounded-xl shadow-sm relative">
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

                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-sky-50 bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex gap-2 text-sm">
                                {activeTab > 1 && (
                                    <button type="button" onClick={() => setActiveTab(activeTab - 1)} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                                        Précédent
                                    </button>
                                )}
                                {activeTab < 5 && (
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
