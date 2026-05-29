import React, { useState, useEffect } from 'react';
import { Settings, Save, Percent, Info } from 'lucide-react';
import useSettings from '../../custom-hooks/useSettings.js';
import Loader from '../../ui/Loader.jsx';

export default function SettingsPanel() {
    const { settings, loading, actionLoading, error, isError, updateSettings } = useSettings();
    const [benefitMarge, setBenefitMarge] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (settings?.benefit_marge !== undefined) {
            setBenefitMarge(String(settings.benefit_marge));
            setIsDirty(false);
        }
    }, [settings?.benefit_marge]);

    const handleChange = (e) => {
        setBenefitMarge(e.target.value);
        setIsDirty(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const value = parseInt(benefitMarge, 10);
        if (isNaN(value) || value < 0 || value > 100) return;
        await updateSettings({ benefit_marge: value });
        setIsDirty(false);
    };

    const parsedValue = parseInt(benefitMarge, 10);
    const isInvalid = isNaN(parsedValue) || parsedValue < 0 || parsedValue > 100;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden font-sans max-w-2xl">
            <div className="px-6 py-5 border-b border-gray-100 bg-white">
                <h3 className="text-lg font-semibold text-sky-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-sky-600" />
                    Paramètres de l'application
                </h3>
                <p className="text-sm text-gray-500 mt-1">Configurez les paramètres globaux de la plateforme</p>
            </div>

            <div className="p-6">
                {loading ? (
                    <Loader variant="minimal" message="Chargement des paramètres..." />
                ) : isError ? (
                    <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4">
                        {error?.message || "Erreur lors du chargement des paramètres."}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="benefit_marge" className="block text-sm font-semibold text-gray-700">
                                Marge bénéficiaire (%)
                            </label>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="relative w-40">
                                    <input
                                        id="benefit_marge"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={benefitMarge}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
                                            isInvalid && isDirty
                                                ? 'border-rose-400 bg-rose-50'
                                                : 'border-gray-300 bg-white'
                                        }`}
                                        placeholder="0 – 100"
                                    />
                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading || isInvalid || !isDirty}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                >
                                    <Save size={16} />
                                    {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                            {isInvalid && isDirty && (
                                <p className="text-xs text-rose-500">La valeur doit être un entier entre 0 et 100.</p>
                            )}
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                <Info size={12} className="shrink-0" />
                                Appliquée sur tous les prix hôteliers.&nbsp;
                                Valeur actuelle :&nbsp;
                                <span className="font-bold text-sky-700">{settings?.benefit_marge ?? '—'}%</span>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
