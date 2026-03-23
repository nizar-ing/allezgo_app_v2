import { useState, useCallback } from "react";
import {
    User, Mail, Phone, MapPin,
    Calendar, CreditCard, Building2,
    Home, ChevronRight, AlertCircle, Baby,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
    { id: "online", label: "Paiement en ligne",   icon: CreditCard },
    { id: "agency", label: "Paiement à l'agence", icon: Building2  },
    { id: "home",   label: "Paiement à domicile", icon: Home       },
];

// ─── Local sub-components ─────────────────────────────────────────────────────
function SectionHeader({ number, title, subtitle, gradient = "from-sky-500 to-blue-600" }) {
    return (
        <div className="flex items-start gap-3 mb-5">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shrink-0 font-extrabold text-sm shadow-md mt-0.5`}>
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
            className={`w-full border-2 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 transition-all font-medium ${
                props.readOnly
                    ? "bg-gray-50 border-gray-100 cursor-not-allowed text-gray-400"
                    : error
                        ? "bg-red-50/40 border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "bg-white border-gray-200 focus:border-sky-400 focus:ring-sky-100"
            }`}
        />
    );
}

// ─── Normalize a room's children from bookingState into { count, ages[] }
// room.children can be:
//   • a number  → e.g. 2           (from SearchResultsPage)
//   • an array  → e.g. [5, 8]      (from HotelDetails — childAges)
const normalizeChildren = (room) => {
    const raw = room.children;
    if (Array.isArray(raw)) {
        // raw is already an array of ages
        return { count: raw.length, ages: raw };
    }
    // raw is a number — ages come from childAges if present
    const count = raw ?? 0;
    const ages  = Array.isArray(room.childAges) ? room.childAges : [];
    return { count, ages };
};

// ─── Main export ──────────────────────────────────────────────────────────────
export default function GuestInfoForm({ bookingState, onSubmit }) {

    const [formData, setFormData] = useState(() => ({
        contact: { fullName: "", email: "", phone: "", address: "" },
        rooms: bookingState.rooms.map((room) => {
            const { count, ages } = normalizeChildren(room);
            return {
                adults: Array.from({ length: room.adults ?? 1 }, () => ({
                    firstName: "", lastName: ""
                })),
                children: Array.from({ length: count }, (_, ci) => ({
                    firstName: "",
                    age: ages[ci] ?? "",
                })),
            };
        }),
        paymentMethod: "agency",
    }));

    const [errors, setErrors] = useState({});

    // ── Updaters ──────────────────────────────────────────────────────────────
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

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = useCallback(() => {
        const errs = {};
        const { contact, rooms } = formData;

        if (!contact.fullName.trim())
            errs["contact.fullName"] = "Ce champ est requis";
        else if (contact.fullName.trim().length < 3)
            errs["contact.fullName"] = "Minimum 3 caractères";

        if (!contact.email.trim())
            errs["contact.email"] = "Ce champ est requis";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
            errs["contact.email"] = "Adresse email invalide";

        if (!contact.phone.trim())
            errs["contact.phone"] = "Ce champ est requis";
        else if (!/^\d[\d\s]{6,}$/.test(contact.phone.replace(/\s/g, "")))
            errs["contact.phone"] = "Numéro invalide (chiffres uniquement)";

        if (!contact.address.trim())
            errs["contact.address"] = "Ce champ est requis";

        rooms.forEach((room, ri) => {
            room.adults.forEach((adult, ai) => {
                if (!adult.firstName.trim())
                    errs[`rooms.${ri}.adults.${ai}.firstName`] = "Requis";
                if (!adult.lastName.trim())
                    errs[`rooms.${ri}.adults.${ai}.lastName`] = "Requis";
            });
            room.children.forEach((child, ci) => {
                if (!child.firstName.trim())
                    errs[`rooms.${ri}.children.${ci}.firstName`] = "Requis";
            });
        });

        return errs;
    }, [formData]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            setTimeout(() => {
                document.querySelector(".field-error")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
            return;
        }
        onSubmit(formData);
    }, [validate, formData, onSubmit]);

    const errCount = Object.keys(errors).length;

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* ══════════════════════════════════════════════════════════════
                ── SECTION 1 — Contact Principal
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader
                    number="1"
                    title="Informations Client"
                    subtitle="Contact Principal — Ces informations seront utilisées pour confirmer votre réservation"
                    gradient="from-sky-500 to-blue-600"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nom & Prénom" icon={User} error={errors["contact.fullName"]}>
                        <TextInput
                            type="text"
                            placeholder="ex: Mohamed Benali"
                            value={formData.contact.fullName}
                            onChange={(e) => updateContact("fullName", e.target.value)}
                            error={errors["contact.fullName"]}
                        />
                    </Field>
                    <Field label="Email" icon={Mail} error={errors["contact.email"]}>
                        <TextInput
                            type="email"
                            placeholder="ex: contact@email.com"
                            value={formData.contact.email}
                            onChange={(e) => updateContact("email", e.target.value)}
                            error={errors["contact.email"]}
                        />
                    </Field>
                    <Field label="Numéro de mobile" icon={Phone} error={errors["contact.phone"]}>
                        <TextInput
                            type="tel"
                            placeholder="ex: 0555 123 456"
                            value={formData.contact.phone}
                            onChange={(e) => updateContact("phone", e.target.value)}
                            error={errors["contact.phone"]}
                        />
                    </Field>
                    <Field label="Adresse" icon={MapPin} error={errors["contact.address"]}>
                        <TextInput
                            type="text"
                            placeholder="ex: 12 Rue des Fleurs, Alger"
                            value={formData.contact.address}
                            onChange={(e) => updateContact("address", e.target.value)}
                            error={errors["contact.address"]}
                        />
                    </Field>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                ── SECTION 2 — Voyageurs par chambre
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col gap-4">
                {formData.rooms.map((room, ri) => (
                    <div key={ri} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

                        {/* Room card header */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-sm shadow-md ${
                                ri === 0
                                    ? "bg-gradient-to-br from-emerald-400 to-teal-600 text-white"
                                    : "bg-gradient-to-br from-teal-400 to-cyan-600 text-white"
                            }`}>
                                {ri + 1}
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-gray-800 leading-tight">
                                    🧳 Chambre {ri + 1}
                                    <span className="text-sm font-semibold text-gray-400 ml-2">
                                        — {bookingState.rooms[ri]?.adults ?? room.adults.length} adulte{(bookingState.rooms[ri]?.adults ?? room.adults.length) > 1 ? "s" : ""}
                                        {room.children.length > 0 && (
                                            <> · {room.children.length} enfant{room.children.length > 1 ? "s" : ""}</>
                                        )}
                                    </span>
                                </h3>
                                {bookingState.rooms[ri]?.roomType && (
                                    <p className="text-xs text-sky-600 font-semibold mt-0.5">
                                        {bookingState.rooms[ri].roomType}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">

                            {/* ── Adults ── */}
                            {room.adults.map((adult, ai) => (
                                <div key={ai}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0">
                                            <User size={12} className="text-sky-600" />
                                        </div>
                                        <span className="text-xs font-extrabold text-sky-700 uppercase tracking-wide">
                                            {room.adults.length === 1 ? "Voyageur Principal" : `Adulte ${ai + 1}`}
                                        </span>
                                        {ai > 0 && <div className="flex-1 h-px bg-gray-100" />}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field
                                            label="Prénom"
                                            icon={User}
                                            error={errors[`rooms.${ri}.adults.${ai}.firstName`]}
                                        >
                                            <TextInput
                                                type="text"
                                                placeholder="Prénom"
                                                value={adult.firstName}
                                                onChange={(e) => updateAdult(ri, ai, "firstName", e.target.value)}
                                                error={errors[`rooms.${ri}.adults.${ai}.firstName`]}
                                            />
                                        </Field>
                                        <Field
                                            label="Nom"
                                            icon={User}
                                            error={errors[`rooms.${ri}.adults.${ai}.lastName`]}
                                        >
                                            <TextInput
                                                type="text"
                                                placeholder="Nom de famille"
                                                value={adult.lastName}
                                                onChange={(e) => updateAdult(ri, ai, "lastName", e.target.value)}
                                                error={errors[`rooms.${ri}.adults.${ai}.lastName`]}
                                            />
                                        </Field>
                                    </div>
                                </div>
                            ))}

                            {/* ── Children ── */}
                            {room.children.length > 0 && (
                                <>
                                    <div className="border-t border-dashed border-gray-200" />
                                    {room.children.map((child, ci) => (
                                        <div key={ci}>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                                                    <Baby size={12} className="text-amber-600" />
                                                </div>
                                                <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wide">
                                                    Enfant {ci + 1}
                                                </span>
                                                <span className="text-xs text-gray-400 font-semibold">
                                                    · {child.age} ans
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Field
                                                    label="Nom & Prénom"
                                                    icon={User}
                                                    error={errors[`rooms.${ri}.children.${ci}.firstName`]}
                                                >
                                                    <TextInput
                                                        type="text"
                                                        placeholder="Nom & Prénom de l'enfant"
                                                        value={child.firstName}
                                                        onChange={(e) => updateChild(ri, ci, "firstName", e.target.value)}
                                                        error={errors[`rooms.${ri}.children.${ci}.firstName`]}
                                                    />
                                                </Field>
                                                <Field label="Âge">
                                                    <div className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 font-medium">
                                                        {child.age} ans
                                                    </div>
                                                </Field>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                ── SECTION 3 — Mode de Paiement
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader
                    number="3"
                    title="Mode de Paiement"
                    subtitle="Sélectionnez votre méthode de règlement préférée"
                    gradient="from-orange-400 to-rose-500"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                    {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => {
                        const isActive = formData.paymentMethod === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setFormData((p) => ({ ...p, paymentMethod: id }))}
                                className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${
                                    isActive
                                        ? "bg-orange-600 text-white border-transparent shadow-lg shadow-orange-200"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-sky-700 hover:bg-orange-50"
                                }`}
                            >
                                <Icon size={16} className="shrink-0" />
                                {label}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-4 p-5 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                    <p className="text-sm text-gray-400 font-medium">
                        Les détails de paiement seront disponibles prochainement.
                    </p>
                </div>
            </div>

            {/* ── Validation error banner ── */}
            {errCount > 0 && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
                        <AlertCircle size={16} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm font-extrabold text-red-700">Formulaire incomplet</p>
                        <p className="text-xs text-red-500 mt-0.5">
                            {errCount} champ{errCount > 1 ? "s" : ""} requis manquant{errCount > 1 ? "s" : ""}.
                            Veuillez les compléter avant de continuer.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Submit button ── */}
            <button
                type="submit"
                className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white text-base font-extrabold rounded-2xl shadow-lg shadow-sky-200/60 transition-all active:scale-[0.98]"
            >
                Continuer vers la confirmation
                <ChevronRight size={18} />
            </button>
        </form>
    );
}