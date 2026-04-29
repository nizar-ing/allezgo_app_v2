import React, { useActionState, useEffect, useState } from 'react';
import { X, Save, UserCheck, Mail, User } from 'lucide-react';
import useUsers from '../../custom-hooks/useUsers.js';

export default function EditUserModal({ user, onClose }) {
    const { updateUser } = useUsers();
    
    // We use a state to ensure form gets reset when a different user is passed
    const [initialValues, setInitialValues] = useState({ firstName: '', lastName: '', email: '' });

    useEffect(() => {
        if (user) {
            setInitialValues({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const submitUser = async (prevState, formData) => {
        try {
            const firstName = formData.get('firstName');
            const lastName = formData.get('lastName');
            const email = formData.get('email');

            if (!firstName || !lastName || !email) {
                return { success: false, error: "Veuillez remplir tous les champs obligatoires." };
            }

            const payload = {
                firstName,
                lastName,
                email
            };

            await updateUser({ id: user.id, payload });

            onClose();
            return { success: true, error: null };
        } catch (error) {
            console.error("Mutation Error:", error);
            return { success: false, error: error.message || 'Échec de la requête' };
        }
    };

    const [state, formAction, isPending] = useActionState(submitUser, null);

    if (!user) return null;

    const preventEnterSubmit = (e) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/40 md:backdrop-blur-sm font-sans md:p-4">
            <div className="fixed inset-0 w-full h-full max-h-screen rounded-none overflow-y-auto bg-white md:relative md:w-full md:max-w-2xl md:h-auto md:max-h-[90vh] md:rounded-xl shadow-xl flex flex-col md:overflow-hidden md:border md:border-sky-100">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-sky-50 flex justify-between items-center bg-gradient-to-r from-sky-50 to-white shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-sky-500" />
                        Modifier l'Utilisateur
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
                                <input type="text" name="firstName" defaultValue={initialValues.firstName} onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                                    <User size={16} className="text-slate-400" /> Nom
                                </label>
                                <input type="text" name="lastName" defaultValue={initialValues.lastName} onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                                    <Mail size={16} className="text-slate-400" /> Email
                                </label>
                                <input type="email" name="email" defaultValue={initialValues.email} onKeyDown={preventEnterSubmit} required className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500" />
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
                            {isPending ? 'Mise à jour...' : 'Mettre à jour'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
