import React, { useActionState } from 'react';
import { X, Save, UserPlus, Mail, User, Lock } from 'lucide-react';
import useUsers from '../../custom-hooks/useUsers.js';

export default function CreateUserModal({ isOpen, onClose }) {
    const { createUser } = useUsers();

    const submitUser = async (prevState, formData) => {
        try {
            const firstName = formData.get('firstName');
            const lastName = formData.get('lastName');
            const email = formData.get('email');
            const password = formData.get('password');

            if (!firstName || !lastName || !email || !password) {
                return { success: false, error: "Veuillez remplir tous les champs obligatoires." };
            }

            if (password.length < 6) {
                return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères." };
            }

            const payload = {
                firstName,
                lastName,
                email,
                password
            };

            await createUser(payload);

            onClose();
            return { success: true, error: null };
        } catch (error) {
            console.error("Mutation Error:", error);
            return { success: false, error: error.message || 'Échec de la requête' };
        }
    };

    const [state, formAction, isPending] = useActionState(submitUser, null);

    if (!isOpen) return null;

    const preventEnterSubmit = (e) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/40 md:backdrop-blur-sm font-sans md:p-4">
            <div className="fixed inset-0 w-full h-full max-h-screen rounded-none overflow-y-auto bg-white md:relative md:w-full md:max-w-2xl md:h-auto md:max-h-[90vh] md:rounded-xl shadow-xl flex flex-col md:overflow-hidden md:border md:border-sky-100">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-sky-50 flex justify-between items-center bg-gradient-to-r from-sky-50 to-white shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-sky-500" />
                        Nouvel Utilisateur
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form action={formAction} noValidate className="flex flex-col flex-1 min-h-0 md:overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        {state?.error && (
                            <div className="mb-6 p-4 bg-red-50/80 rounded-xl border border-red-100">
                                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Erreur</p>
                                <p className="text-sm text-red-700">{state.error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                                    <User size={16} className="text-slate-400" /> Prénom
                                </label>
                                <input type="text" name="firstName" onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                                    <User size={16} className="text-slate-400" /> Nom
                                </label>
                                <input type="text" name="lastName" onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                                    <Mail size={16} className="text-slate-400" /> Email
                                </label>
                                <input type="email" name="email" onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                                    <Lock size={16} className="text-slate-400" /> Mot de passe
                                </label>
                                <input type="password" name="password" minLength="6" onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                                <p className="text-xs text-slate-500 mt-1">Au moins 6 caractères. Le rôle par défaut sera 'Client'.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-sky-50 bg-slate-50 flex justify-end items-center shrink-0 gap-3">
                        <button
                            type="button"
                            onClick={onClose}
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
                            {isPending ? 'Création...' : 'Créer l\'utilisateur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
