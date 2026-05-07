// src/components/admin/CarouselAdmin.jsx
import React, { useState, useRef } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Video, AlertCircle, Loader2 } from 'lucide-react';
import useCarousel from '../../custom-hooks/useCarousel.js';
import Loader from '../../ui/Loader.jsx';
import toast from 'react-hot-toast';

const API_BASE = "https://api.allezgoo.com";

export default function CarouselAdmin() {
    const { data: carouselItems, loading, uploadMedia, removeMedia, reorderMedia, actionLoading } = useCarousel();
    const [uploading, setUploading] = useState(false);
    const [altText, setAltText] = useState('');
    const fileInputRef = useRef(null);

    const handleUpload = async (e) => {
        e.preventDefault();
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            toast.error("Veuillez sélectionner un fichier.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        if (altText) {
            formData.append('alt', altText);
        }

        try {
            setUploading(true);
            await uploadMedia(formData);
            setAltText('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-medium text-slate-800">Voulez-vous vraiment supprimer ce média ?</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            await removeMedia(id);
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            icon: '⚠️',
            style: {
                minWidth: '300px',
            },
        });
    };

    const handleMove = async (index, direction) => {
        if (!carouselItems) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= carouselItems.length) return;

        // Create a copy of the items to compute new order
        const updatedItems = [...carouselItems];

        // Swap
        const temp = updatedItems[index];
        updatedItems[index] = updatedItems[newIndex];
        updatedItems[newIndex] = temp;

        // Reassign displayOrder sequentially based on array index
        const reorderPayload = updatedItems.map((item, idx) => ({
            id: item.id,
            displayOrder: idx
        }));

        await reorderMedia(reorderPayload);
    };

    const isVideo = (media) => media.mimeType && media.mimeType.startsWith('video/');

    if (loading) {
        return (
            <div className="py-12">
                <Loader variant="minimal" fullHeight={false} message="Chargement du carrousel..." />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden font-sans">
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center items-start gap-4 bg-white">
                <div>
                    <h3 className="text-lg font-semibold text-sky-900 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-sky-600" />
                        Gestion du Carrousel
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Ajoutez, réorganisez ou supprimez les médias affichés sur l'accueil</p>
                </div>
            </div>

            <div className="p-6">
                {/* Upload Form */}
                <form onSubmit={handleUpload} className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-md font-semibold text-slate-800 mb-4">Ajouter un nouveau média</h4>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fichier (Image ou Vidéo MP4)</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*,video/mp4,video/webm,video/ogg"
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 border border-slate-300 rounded-md"
                                required
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Texte alternatif (optionnel)</label>
                            <input
                                type="text"
                                value={altText}
                                onChange={(e) => setAltText(e.target.value)}
                                placeholder="Description pour l'accessibilité"
                                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={uploading || actionLoading}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 w-full md:w-auto justify-center"
                        >
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            {uploading ? "Envoi..." : "Ajouter"}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <AlertCircle size={12} /> Les vidéos seront jouées automatiquement (sans son) si configurées ainsi.
                    </p>
                </form>

                {/* Media List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {carouselItems && carouselItems.length > 0 ? (
                        carouselItems.map((item, index) => {
                            const isFirst = index === 0;
                            const isLast = index === carouselItems.length - 1;
                            const fullUrl = item.url.startsWith('http') ? item.url : `${API_BASE}${item.url}`;

                            return (
                                <div key={item.id} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="aspect-video bg-slate-100 relative">
                                        {isVideo(item) ? (
                                            <>
                                                <video src={fullUrl} className="w-full h-full object-cover" muted loop playsInline />
                                                <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1 backdrop-blur-sm">
                                                    <Video size={12} /> Vidéo
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <img src={fullUrl} alt={item.alt || item.filename} className="w-full h-full object-cover" />
                                                <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1 backdrop-blur-sm">
                                                    <ImageIcon size={12} /> Image
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="p-4 flex flex-col gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 truncate" title={item.originalName}>{item.originalName}</p>
                                            {item.alt && <p className="text-xs text-slate-500 truncate" title={item.alt}>Alt: {item.alt}</p>}
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleMove(index, 'up')}
                                                    disabled={isFirst || actionLoading}
                                                    className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded transition-colors disabled:opacity-30"
                                                    title="Déplacer vers le haut"
                                                >
                                                    <ArrowUp size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleMove(index, 'down')}
                                                    disabled={isLast || actionLoading}
                                                    className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded transition-colors disabled:opacity-30"
                                                    title="Déplacer vers le bas"
                                                >
                                                    <ArrowDown size={16} />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                disabled={actionLoading}
                                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50 flex items-center gap-1 text-xs font-semibold px-2"
                                            >
                                                <Trash2 size={14} /> Supprimer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            Aucun média dans le carrousel. Ajoutez-en un pour commencer.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
