import React, { useState, useEffect } from 'react';
import { Settings, Save, Percent, Info, Phone, Mail, MessageCircle, Landmark } from 'lucide-react';
import useSettings from '../../custom-hooks/useSettings.js';
import PageLoader from '../../ui/PageLoader.jsx';
import SiteStatsBox from '../../components/admin/SiteStatsBox.jsx';

export default function SettingsPanel() {
    const { settings, loading, actionLoading, error, isError, updateSettings } = useSettings();
    const [benefitMarge, setBenefitMarge] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [contactPhone, setContactPhone] = useState('');
    const [contactWhatsapp, setContactWhatsapp] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [isContactDirty, setIsContactDirty] = useState(false);
    const [bankName, setBankName] = useState('');
    const [bankRib, setBankRib] = useState('');
    const [bankHolder, setBankHolder] = useState('');
    const [baridimobNumber, setBaridimobNumber] = useState('');
    const [baridimobHolder, setBaridimobHolder] = useState('');
    const [isPaymentDirty, setIsPaymentDirty] = useState(false);

    useEffect(() => {
        if (settings?.benefit_marge !== undefined) {
            setBenefitMarge(String(settings.benefit_marge));
            setIsDirty(false);
        }
    }, [settings?.benefit_marge]);

    useEffect(() => {
        if (settings) {
            setContactPhone(settings.contact_phone ?? '');
            setContactWhatsapp(settings.contact_whatsapp ?? '');
            setContactEmail(settings.contact_email ?? '');
            setIsContactDirty(false);
        }
    }, [settings?.contact_phone, settings?.contact_whatsapp, settings?.contact_email]);

    useEffect(() => {
        if (settings) {
            setBankName(settings.bank_name ?? '');
            setBankRib(settings.bank_rib ?? '');
            setBankHolder(settings.bank_holder ?? '');
            setBaridimobNumber(settings.baridimob_number ?? '');
            setBaridimobHolder(settings.baridimob_holder ?? '');
            setIsPaymentDirty(false);
        }
    }, [settings?.bank_name, settings?.bank_rib, settings?.bank_holder, settings?.baridimob_number, settings?.baridimob_holder]);

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

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        await updateSettings({
            contact_phone:    contactPhone.trim()    || null,
            contact_whatsapp: contactWhatsapp.trim() || null,
            contact_email:    contactEmail.trim()    || null,
        });
        setIsContactDirty(false);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        await updateSettings({
            bank_name:         bankName.trim()         || null,
            bank_rib:          bankRib.trim()          || null,
            bank_holder:       bankHolder.trim()       || null,
            baridimob_number:  baridimobNumber.trim()  || null,
            baridimob_holder:  baridimobHolder.trim()  || null,
        });
        setIsPaymentDirty(false);
    };

    const parsedValue = parseInt(benefitMarge, 10);
    const isInvalid = isNaN(parsedValue) || parsedValue < 0 || parsedValue > 100;

    return (
        <div className="flex gap-5 items-start">

            {/* Left column: Traffic stats + Coordonnées */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">
                <SiteStatsBox />

                {/* Coordonnées */}
                <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden font-sans">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-sky-50/30">
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-sky-100/70 flex items-center justify-center shrink-0">
                                <Phone className="w-5 h-5 text-sky-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-sky-900">Coordonnées</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Affichées sur le site et les bons</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5">
                        {loading ? (
                            <PageLoader compact message="Chargement..." />
                        ) : (
                            <form onSubmit={handleContactSubmit} className="space-y-3">
                                <div className="space-y-1.5">
                                    <label htmlFor="contact_phone" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                        <Phone size={13} className="text-gray-400" /> Téléphone
                                    </label>
                                    <input
                                        id="contact_phone"
                                        type="text"
                                        value={contactPhone}
                                        onChange={e => { setContactPhone(e.target.value); setIsContactDirty(true); }}
                                        placeholder="+213 770 93 25 63"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 hover:border-sky-300 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="contact_whatsapp" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                        <MessageCircle size={13} className="text-gray-400" /> WhatsApp <span className="text-xs font-normal text-gray-400">(chiffres seuls)</span>
                                    </label>
                                    <input
                                        id="contact_whatsapp"
                                        type="text"
                                        value={contactWhatsapp}
                                        onChange={e => { setContactWhatsapp(e.target.value); setIsContactDirty(true); }}
                                        placeholder="213770932563"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 hover:border-sky-300 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="contact_email" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                        <Mail size={13} className="text-gray-400" /> Email
                                    </label>
                                    <input
                                        id="contact_email"
                                        type="email"
                                        value={contactEmail}
                                        onChange={e => { setContactEmail(e.target.value); setIsContactDirty(true); }}
                                        placeholder="info@allezgoo.com"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 hover:border-sky-300 transition-colors"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading || !isContactDirty}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                >
                                    <Save size={15} />
                                    {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

            </div>

            {/* Right column: Paramètres + Paiement */}
            <div className="w-[400px] shrink-0 flex flex-col gap-5">

            {/* Paramètres */}
            <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden font-sans">

                    {/* Header — mirrors SiteStatsBox header style */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-sky-50/30">
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-sky-100/70 flex items-center justify-center shrink-0">
                                <Settings className="w-5 h-5 text-sky-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-sky-900">Paramètres</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Configuration de la plateforme</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5">
                        {loading ? (
                            <PageLoader compact message="Chargement..." />
                        ) : isError ? (
                            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4">
                                {error?.message || "Erreur lors du chargement des paramètres."}
                            </div>
                        ) : (
                            <div className="space-y-4">

                                {/* Current marge — prominent display */}
                                <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 rounded-xl p-4 border border-sky-100/80 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-sky-500 uppercase tracking-wider mb-0.5">
                                            Marge actuelle
                                        </p>
                                        <p className="text-xs text-sky-400">Sur tous les prix hôteliers</p>
                                    </div>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-4xl font-black text-sky-700 tabular-nums leading-none">
                                            {settings?.benefit_marge ?? '—'}
                                        </span>
                                        {settings?.benefit_marge !== undefined && (
                                            <span className="text-xl font-bold text-sky-400 leading-none">%</span>
                                        )}
                                    </div>
                                </div>

                                {/* Edit form */}
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label htmlFor="benefit_marge" className="block text-sm font-semibold text-gray-700">
                                            Nouvelle valeur (%)
                                        </label>
                                        <div className="relative">
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
                                                        : 'border-gray-200 bg-white hover:border-sky-300'
                                                }`}
                                                placeholder="0 – 100"
                                            />
                                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                        {isInvalid && isDirty && (
                                            <p className="text-xs text-rose-500">Entier entre 0 et 100 requis.</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={actionLoading || isInvalid || !isDirty}
                                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                    >
                                        <Save size={15} />
                                        {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                </form>

                                {/* Footer note */}
                                <p className="text-xs text-gray-400 flex items-start gap-1.5 pt-2 border-t border-gray-100">
                                    <Info size={11} className="shrink-0 mt-0.5" />
                                    Appliquée automatiquement via ApiClient sur tous les tarifs hôteliers.
                                </p>

                            </div>
                        )}
                    </div>
            </div>

            {/* Paiement */}
            <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden font-sans">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-sky-50/30">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-sky-100/70 flex items-center justify-center shrink-0">
                            <Landmark className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-sky-900">Paiement</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Coordonnées bancaires et BaridiMob</p>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    {loading ? (
                        <PageLoader compact message="Chargement..." />
                    ) : (
                        <form onSubmit={handlePaymentSubmit} className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">BaridiMob / CCP</p>
                            <div className="space-y-1.5">
                                <label htmlFor="baridimob_number" className="block text-sm font-semibold text-gray-700">Numéro</label>
                                <input
                                    id="baridimob_number"
                                    type="text"
                                    value={baridimobNumber}
                                    onChange={e => { setBaridimobNumber(e.target.value); setIsPaymentDirty(true); }}
                                    placeholder="0023456789"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 hover:border-sky-300 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="baridimob_holder" className="block text-sm font-semibold text-gray-700">Titulaire</label>
                                <input
                                    id="baridimob_holder"
                                    type="text"
                                    value={baridimobHolder}
                                    onChange={e => { setBaridimobHolder(e.target.value); setIsPaymentDirty(true); }}
                                    placeholder="AllezGo Voyages"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 hover:border-sky-300 transition-colors"
                                />
                            </div>

                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Virement bancaire</p>
                            <div className="space-y-1.5">
                                <label htmlFor="bank_name" className="block text-sm font-semibold text-gray-700">Banque</label>
                                <input
                                    id="bank_name"
                                    type="text"
                                    value={bankName}
                                    onChange={e => { setBankName(e.target.value); setIsPaymentDirty(true); }}
                                    placeholder="Banque Nationale d'Algérie"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 hover:border-sky-300 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="bank_rib" className="block text-sm font-semibold text-gray-700">RIB</label>
                                <input
                                    id="bank_rib"
                                    type="text"
                                    value={bankRib}
                                    onChange={e => { setBankRib(e.target.value); setIsPaymentDirty(true); }}
                                    placeholder="002 00300 0000123456 78"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 hover:border-sky-300 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="bank_holder" className="block text-sm font-semibold text-gray-700">Titulaire du compte</label>
                                <input
                                    id="bank_holder"
                                    type="text"
                                    value={bankHolder}
                                    onChange={e => { setBankHolder(e.target.value); setIsPaymentDirty(true); }}
                                    placeholder="AllezGo Voyages SARL"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 hover:border-sky-300 transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading || !isPaymentDirty}
                                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                            >
                                <Save size={15} />
                                {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            </div>{/* /right col */}

        </div>
    );
}
