import React, { useActionState } from 'react';
import { X, Save, MessageSquare } from 'lucide-react';
import useTestimonials from '../../custom-hooks/useTestimonials.js';

export default function CreateTestimonialModal({ isOpen, onClose }) {
    const { createTestimonial } = useTestimonials();

    const handleClose = () => {
        onClose();
    };

    const preventEnterSubmit = (e) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    const submitTestimonial = async (prevState, formData) => {
        try {
            const name = formData.get('name');
            const imageUrl = formData.get('imageUrl');
            const citation = formData.get('citation');

            if (!name) return { success: false, error: "Veuillez remplir le Nom." };
            if (!imageUrl) return { success: false, error: "Veuillez ajouter une URL d'image." };
            if (!citation) return { success: false, error: "Veuillez ajouter une citation." };

            const payload = {
                name,
                imageUrl,
                citation
            };

            await createTestimonial(payload);
            handleClose();
            return { success: true, error: null };

        } catch (error) {
            console.error("Mutation Error:", error);
            return { success: false, error: error.message || 'Échec de la requête' };
        }
    };

    const [state, formAction, isPending] = useActionState(submitTestimonial, null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/40 md:backdrop-blur-sm font-sans p-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-sky-100">
                {/* Header */}
                <div className="px-6 py-4 border-b border-sky-50 flex justify-between items-center bg-gradient-to-r from-sky-50 to-white shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-sky-500" />
                        Nouveau Témoignage
                    </h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form action={formAction} noValidate className="flex flex-col">
                    <div className="p-6">
                        {state?.error && (
                            <div className="mb-6 p-4 bg-red-50/80 rounded-xl border border-red-100">
                                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Erreur</p>
                                <p className="text-sm text-red-700">{state.error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom du client</label>
                                <input type="text" name="name" onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" placeholder="Ex: Jean Dupont" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">URL de l'image (Avatar)</label>
                                <input type="url" name="imageUrl" onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" placeholder="https://..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Citation (Témoignage)</label>
                                <textarea name="citation" rows="4" required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500 resize-none" placeholder="Superbe expérience avec AllezGo..."></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 border-t border-sky-50 bg-slate-50 flex justify-end gap-3 shrink-0">
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
                            {isPending ? 'Ajout...' : 'Ajouter'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
