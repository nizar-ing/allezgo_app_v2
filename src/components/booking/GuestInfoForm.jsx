import { useState, useCallback } from "react";
import {
    User, Mail, Phone, MapPin,
    CreditCard, Landmark,
    Home, ChevronRight, AlertCircle, Baby, UploadCloud,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
    { id: "agency", label: "Paiement à l'agence", icon: Home },
    { id: "home", label: "Paiement par virement bancaire", icon: Landmark },
    { id: "online", label: "Paiement en ligne", icon: CreditCard },
];

const BANK_ACCOUNTS = [
    { id: "baridi", name: "BaridiMob", details: "00799999001822490138", icon: "/images/icons/baridiMob.jpg" },
    { id: "bdl", name: "BDL", details: "005 003260000002617", icon: "/images/icons/bdl.jpg" },
];

// ─── Local sub-components ─────────────────────────────────────────────────────
function SectionHeader({ number, title, subtitle, gradient = "from-sky-500 to-blue-600" }) {
    return (
        <div className="flex items-start gap-3 mb-5">
            <div className={`w-8 h-8 rounded-xl bg-linear-to-br ${gradient} text-white flex items-center justify-center shrink-0 font-extrabold text-sm shadow-md mt-0.5`}>
                {number}
            </div>
            <div>
                <h3 className="text-base font-extrabold text-gray-800 leading-tight">{title}</h3>
                {subtitle && (
                    <p className="text-xs text-gray-400 font-medium mt-0.5 leading-snug">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

function Field({ label, icon: Icon, error, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                {Icon && <Icon size={11} className="text-sky-500 shrink-0" />}
                {label}
            </label>
            {children}
            {error && (
                <p className="field-error text-xs text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                    <AlertCircle size={11} className="shrink-0" /> {error}
                </p>
            )}
        </div>
    );
}

function TextInput({ error, ...props }) {
    return (
        <input
            {...props}
            className={`w-full border-2 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 transition-all font-medium ${props.readOnly
                ? "bg-gray-50 border-gray-100 cursor-not-allowed text-gray-400"
                : error
                    ? "bg-red-50/40 border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "bg-white border-gray-200 focus:border-sky-400 focus:ring-sky-100"
                }`}
        />
    );
}

const normalizeChildren = (room) => {
    const raw = room.children;
    if (Array.isArray(raw)) {
        return { count: raw.length, ages: raw };
    }
    const count = raw ?? 0;
    const ages = Array.isArray(room.childAges) ? room.childAges : [];
    return { count, ages };
};

// ─── Main export ──────────────────────────────────────────────────────────────
export default function GuestInfoForm({ bookingState, onSubmit, isPending }) {

    const [formData, setFormData] = useState(() => ({
        contact: { fullName: "", email: "", phone: "", address: "" },
        rooms: bookingState.rooms.map((room) => {
            const { count, ages } = normalizeChildren(room);
            return {
                adults: Array.from({ length: room.adults ?? 1 }, () => ({
                    fullName: "",
                })),
                children: Array.from({ length: count }, (_, ci) => ({
                    firstName: "",
                    age: ages[ci] ?? "",
                })),
            };
        }),
        paymentMethod: "agency",
        selectedBank: null,
        receiptFile: null,
    }));

    const [errors, setErrors] = useState({});

    const clearError = useCallback((key) => {
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);

    const updateContact = useCallback((field, value) => {
        setFormData((p) => ({ ...p, contact: { ...p.contact, [field]: value } }));
        clearError(`contact.${field}`);
    }, [clearError]);

    const updateAdult = useCallback((ri, ai, field, value) => {
        setFormData((p) => ({
            ...p,
            rooms: p.rooms.map((room, r) =>
                r !== ri ? room : {
                    ...room,
                    adults: room.adults.map((adult, a) =>
                        a !== ai ? adult : { ...adult, [field]: value }
                    ),
                }
            ),
        }));
        clearError(`rooms.${ri}.adults.${ai}.${field}`);
    }, [clearError]);

    const updateChild = useCallback((ri, ci, field, value) => {
        setFormData((p) => ({
            ...p,
            rooms: p.rooms.map((room, r) =>
                r !== ri ? room : {
                    ...room,
                    children: room.children.map((child, c) =>
                        c !== ci ? child : { ...child, [field]: value }
                    ),
                }
            ),
        }));
        clearError(`rooms.${ri}.children.${ci}.${field}`);
    }, [clearError]);

    const handleCopyContactToPrincipalTraveler = useCallback(() => {
        const { fullName } = formData.contact;
        if (!fullName.trim()) return;

        setFormData((p) => {
            if (!p.rooms[0]?.adults[0]) return p;
            const newRooms = [...p.rooms];
            const newAdults = [...newRooms[0].adults];
            newAdults[0] = { ...newAdults[0], fullName };
            newRooms[0] = { ...newRooms[0], adults: newAdults };
            return { ...p, rooms: newRooms };
        });

        clearError('rooms.0.adults.0.fullName');
    }, [formData.contact.fullName, clearError]);

    const validate = useCallback(() => {
        const errs = {};
        const { contact, rooms } = formData;

        if (!contact.fullName.trim()) errs["contact.fullName"] = "Ce champ est requis";
        else if (contact.fullName.trim().length < 3) errs["contact.fullName"] = "Minimum 3 caractères";

        if (!contact.email.trim()) errs["contact.email"] = "Ce champ est requis";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errs["contact.email"] = "Adresse email invalide";

        if (!contact.phone.trim()) errs["contact.phone"] = "Ce champ est requis";
        else if (!/^\d[\d\s]{6,}$/.test(contact.phone.replace(/\s/g, ""))) errs["contact.phone"] = "Numéro invalide";

        if (!contact.address.trim()) errs["contact.address"] = "Ce champ est requis";

        rooms.forEach((room, ri) => {
            room.adults.forEach((adult, ai) => {
                if (!adult.fullName.trim()) errs[`rooms.${ri}.adults.${ai}.fullName`] = "Requis";
            });
            room.children.forEach((child, ci) => {
                if (!child.firstName.trim()) errs[`rooms.${ri}.children.${ci}.firstName`] = "Requis";
            });
        });

        if (formData.paymentMethod === 'home') {
            if (!formData.selectedBank) errs["payment.selectedBank"] = "Veuillez sélectionner un compte";
            if (!formData.receiptFile) errs["payment.receiptFile"] = "Preuve de paiement requise";
        }

        return errs;
    }, [formData]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            setTimeout(() => {
                document.querySelector(".field-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
            return;
        }

        const passengers = [];
        formData.rooms.forEach((room) => {
            room.adults.forEach((adult) => {
                const parts = adult.fullName.trim().split(' ');
                const surname = parts.length > 1 ? parts.pop() : parts[0];
                const name = parts.length > 0 ? parts.join(' ') : surname;
                passengers.push({ Civility: 1, Name: name, Surname: surname, Age: 30 });
            });
            room.children.forEach((child) => {
                const parts = child.firstName.trim().split(' ');
                const surname = parts.length > 1 ? parts.pop() : parts[0];
                const name = parts.length > 0 ? parts.join(' ') : surname;
                passengers.push({ Civility: 1, Name: name, Surname: surname, Age: parseInt(child.age, 10) || 5 });
            });
        });

        onSubmit({
            bookingState: {
                ...bookingState,
                passengers,
                clientName: formData.contact.fullName,
                clientEmail: formData.contact.email,
            },
            paymentMethod: formData.paymentMethod,
            receiptFile: formData.paymentMethod === 'home' ? formData.receiptFile : null,
            clientPhone: formData.contact.phone, // Le téléphone est maintenant une propriété de haut niveau
        });
    }, [validate, formData, onSubmit, bookingState]);

    const renderPaymentDetails = () => {
        switch (formData.paymentMethod) {
            case 'agency':
                return (
                    <div className="mt-4 p-5 bg-sky-50 border border-sky-200 rounded-xl">
                        <h4 className="text-sm font-bold text-sky-800 mb-3">Rendez-vous à notre agence</h4>
                        <div className="space-y-2 text-sm text-sky-700">
                            <p className="flex items-center gap-2"><MapPin size={16} /> <strong>Adresse:</strong> Cite El moustakbel Ain Beida, OEB</p>
                            <p className="flex items-center gap-2"><Phone size={16} /> <strong>Tél:</strong> 0770932563 / 0670230235</p>
                        </div>
                    </div>
                );
            case 'home':
                return (
                    <div className="mt-4 p-5 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                        <h4 className="text-sm font-bold text-gray-800 mb-4">Comptes bancaires</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {BANK_ACCOUNTS.map(bank => (
                                <label key={bank.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.selectedBank === bank.id ? 'bg-white border-orange-500 ring-2 ring-orange-200' : 'bg-white border-gray-200 hover:border-orange-300'}`}>
                                    <input type="radio" className="sr-only" onChange={() => { setFormData(p => ({ ...p, selectedBank: bank.id })); clearError('payment.selectedBank'); }} />
                                    <img src={bank.icon} alt={bank.name} className="w-10 h-10 rounded-lg object-cover" />
                                    <div><p className="font-bold text-sm text-gray-800">{bank.name}</p><p className="text-xs text-gray-500 font-mono">{bank.details}</p></div>
                                </label>
                            ))}
                        </div>
                        <Field label="Preuve de paiement" icon={UploadCloud} error={errors["payment.receiptFile"]}>
                            <div className="relative">
                                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => { setFormData(p => ({ ...p, receiptFile: e.target.files[0] })); clearError('payment.receiptFile'); }} />
                                <div className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl px-4 py-3 text-sm font-medium transition-all ${errors["payment.receiptFile"] ? 'border-red-300 text-red-500' : 'border-gray-300 text-gray-500 hover:border-orange-400'}`}>
                                    <UploadCloud size={16} /> {formData.receiptFile ? formData.receiptFile.name : 'Envoyer votre reçu'}
                                </div>
                            </div>
                        </Field>
                    </div>
                );
            case 'online':
                return (
                    <div className="mt-4 p-5 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2.5">
                        <AlertCircle size={18} className="text-gray-400" />
                        <p className="text-sm text-gray-500 font-medium">Bientôt disponible.</p>
                    </div>
                );
            default:
                return (
                    <div className="mt-4 p-5 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-400 font-medium">Détails disponibles prochainement.</p>
                    </div>
                );
        }
    };

    const errCount = Object.keys(errors).length;

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Contact Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader number="1" title="Informations Client" subtitle="Contact Principal pour la confirmation" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nom & Prénom" icon={User} error={errors["contact.fullName"]}>
                        <TextInput type="text" value={formData.contact.fullName} onChange={(e) => updateContact("fullName", e.target.value)} error={errors["contact.fullName"]} />
                    </Field>
                    <Field label="Email" icon={Mail} error={errors["contact.email"]}>
                        <TextInput type="email" value={formData.contact.email} onChange={(e) => updateContact("email", e.target.value)} error={errors["contact.email"]} />
                    </Field>
                    <Field label="Mobile" icon={Phone} error={errors["contact.phone"]}>
                        <TextInput type="tel" value={formData.contact.phone} onChange={(e) => updateContact("phone", e.target.value)} error={errors["contact.phone"]} />
                    </Field>
                    <Field label="Adresse" icon={MapPin} error={errors["contact.address"]}>
                        <TextInput type="text" value={formData.contact.address} onChange={(e) => updateContact("address", e.target.value)} error={errors["contact.address"]} />
                    </Field>
                </div>
                <div className="mt-6 pt-5 border-t border-dashed border-gray-200 flex justify-end">
                    <button type="button" onClick={handleCopyContactToPrincipalTraveler} className="flex items-center gap-2 text-sm font-bold text-sky-600 bg-sky-50 px-5 py-2.5 rounded-xl border border-sky-100 hover:bg-sky-100 transition-all">
                        <User size={16} /> Utiliser pour le voyageur principal
                    </button>
                </div>
            </div>

            {/* Rooms Section */}
            <div className="flex flex-col gap-4">
                {formData.rooms.map((room, ri) => (
                    <div key={ri} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md bg-linear-to-br ${ri === 0 ? "from-emerald-400 to-teal-600" : "from-teal-400 to-cyan-600"}`}>
                                {ri + 1}
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-gray-800">Chambre {ri + 1}</h3>
                                <p className="text-xs text-sky-600 font-semibold">{bookingState.rooms[ri]?.roomType || "Standard"}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-6">
                            {room.adults.map((adult, ai) => (
                                <Field key={ai} label={ai === 0 ? "Voyageur Principal" : `Adulte ${ai + 1}`} icon={User} error={errors[`rooms.${ri}.adults.${ai}.fullName`]}>
                                    <TextInput value={adult.fullName} onChange={(e) => updateAdult(ri, ai, "fullName", e.target.value)} error={errors[`rooms.${ri}.adults.${ai}.fullName`]} />
                                </Field>
                            ))}
                            {room.children.map((child, ci) => (
                                <div key={ci} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label={`Enfant ${ci + 1}`} icon={Baby} error={errors[`rooms.${ri}.children.${ci}.firstName`]}>
                                        <TextInput placeholder="Nom de l'enfant" value={child.firstName} onChange={(e) => updateChild(ri, ci, "firstName", e.target.value)} error={errors[`rooms.${ri}.children.${ci}.firstName`]} />
                                    </Field>
                                    <Field label="Âge"><div className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 font-medium">{child.age} ans</div></Field>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader number="3" title="Mode de Paiement" gradient="from-orange-400 to-rose-500" />
                <div className="flex flex-col sm:flex-row gap-3">
                    {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => {
                        const isActive = formData.paymentMethod === id;
                        return (
                            <button key={id} type="button" disabled={id === 'online'} onClick={() => setFormData(p => ({ ...p, paymentMethod: id }))} className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl border-2 font-bold text-sm transition-all ${isActive ? "bg-orange-600 text-white border-transparent shadow-lg" : "bg-white text-gray-600 border-gray-200"}`}>
                                <Icon size={16} /> {label}
                            </button>
                        );
                    })}
                </div>
                {renderPaymentDetails()}
            </div>

            {/* Submit */}
            {errCount > 0 && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                    <AlertCircle size={16} className="text-red-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-extrabold text-red-700">Formulaire incomplet</p>
                        <p className="text-xs text-red-500">{errCount} champ(s) manquant(s).</p>
                    </div>
                </div>
            )}
            <button type="submit" disabled={isPending} className="w-full flex items-center justify-center gap-2.5 py-4 bg-linear-to-r from-orange-500 to-orange-700 text-white font-extrabold rounded-2xl shadow-lg disabled:opacity-70">
                {isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Confirmer la Réservation <ChevronRight size={18} /></>}
            </button>
        </form>
    );
}
