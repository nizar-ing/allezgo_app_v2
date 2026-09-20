import {useState, useEffect} from "react";
import {
    X, ShieldCheck, Home, Landmark,
    CheckCircle2, XCircle, Ban,
    ImageOff, Loader2, Phone, Mail,
    Calendar, Hotel, User, CreditCard,
    Clock, BadgeDollarSign, FileText, ZoomIn,
    Users, Baby, CalendarCheck, UserCheck
} from "lucide-react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import useAdminBookings from "../../custom-hooks/useAdminBookings.js";
import AllezGoApi from "../../services/allezgo-api/allezGoApi.js";
import apiClient from "../../services/ApiClient.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizeCivility = (civ) => {
    if (!civ) return 'M.';
    const c = String(civ).toUpperCase();
    if (c === 'MS' || c === 'MDE' || c === '2') return 'Mme';
    return 'M.';
};

const getInitials = (name, surname) => {
    const n = (name || '').trim()[0] || '';
    const s = (surname || '').trim()[0] || '';
    return (n + s).toUpperCase() || '?';
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({status}) {
    const config = {
        PENDING:   { bg: 'bg-amber-400/15',   text: 'text-amber-500',   border: 'border-amber-400/30',   label: 'En attente', icon: Clock },
        CONFIRMED: { bg: 'bg-emerald-400/15', text: 'text-emerald-500', border: 'border-emerald-400/30', label: 'Confirmée',  icon: CheckCircle2 },
        REJECTED:  { bg: 'bg-rose-400/15',    text: 'text-rose-500',    border: 'border-rose-400/30',    label: 'Rejetée',   icon: XCircle },
        CANCELLED: { bg: 'bg-slate-200',       text: 'text-slate-600',   border: 'border-slate-300',      label: 'Annulée',   icon: Ban },
    };
    const c = config[status?.toUpperCase()] || config.PENDING;
    const Icon = c.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}>
            <Icon size={12}/>
            {c.label}
        </span>
    );
}

// ─── Receipt Image (fetched securely via Bearer token → blob URL) ─────────────
function ReceiptImage({filename, isOpen}) {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let objectUrl = null;
        const fetchBlob = async () => {
            if (!filename) return;
            setLoading(true);
            setHasError(false);
            try {
                const response = await AllezGoApi.client.get(
                    `/api/bookings/receipt/${filename}`,
                    {responseType: "blob"}
                );
                objectUrl = URL.createObjectURL(response.data ?? response);
                setBlobUrl(objectUrl);
            } catch (err) {
                console.error("Receipt load failed:", err);
                setHasError(true);
            } finally {
                setLoading(false);
            }
        };
        if (isOpen && filename) fetchBlob();
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            setBlobUrl(null);
            setHasError(false);
        };
    }, [isOpen, filename]);

    if (!filename) {
        return (
            <div className="w-full h-48 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                <ImageOff size={26}/>
                <p className="text-sm font-medium">Aucun reçu fourni</p>
            </div>
        );
    }
    if (loading) {
        return (
            <div className="w-full h-48 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-2 text-sky-600">
                <Loader2 size={26} className="animate-spin"/>
                <p className="text-sm font-medium">Chargement du reçu...</p>
            </div>
        );
    }
    if (hasError || !blobUrl) {
        return (
            <div className="w-full h-48 rounded-xl bg-red-50 border-2 border-dashed border-red-200 flex flex-col items-center justify-center gap-2 text-red-400">
                <ImageOff size={26}/>
                <p className="text-sm font-medium">Impossible de charger le reçu</p>
            </div>
        );
    }
    return (
        <div className="mt-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Reçu de paiement :</p>
            <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group block rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                title="Ouvrir en plein écran"
            >
                <img
                    src={blobUrl}
                    alt="Reçu de paiement"
                    className="w-full h-auto max-h-96 object-contain bg-slate-50"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 text-slate-800 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                        <ZoomIn size={18}/> Agrandir le reçu
                    </span>
                </div>
            </a>
        </div>
    );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────
function DetailRow({icon: Icon, label, children, href, accent = "sky"}) {
    const accentMap = {
        sky:    { bg: 'bg-sky-100/70',    icon: 'text-sky-600' },
        amber:  { bg: 'bg-amber-100/70',  icon: 'text-amber-600' },
        emerald:{ bg: 'bg-emerald-100/70',icon: 'text-emerald-600' },
    };
    const ac = accentMap[accent] || accentMap.sky;
    return (
        <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-8 h-8 rounded-lg ${ac.bg} flex items-center justify-center shrink-0`}>
                <Icon size={15} className={ac.icon}/>
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
                {href ? (
                    <a href={href} className="text-sm font-semibold text-sky-700 hover:underline underline-offset-2 transition-colors">
                        {children}
                    </a>
                ) : (
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{children}</p>
                )}
            </div>
        </div>
    );
}

// ─── Passenger Card ───────────────────────────────────────────────────────────
function PassengerCard({adults, children: childPax}) {
    const hasAdults   = adults.length > 0;
    const hasChildren = childPax.length > 0;

    if (!hasAdults && !hasChildren) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users size={14} className="text-slate-400"/>
                    Voyageurs
                </h4>
                <p className="text-sm text-slate-400 italic">Aucun voyageur enregistré</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-indigo-100/60 rounded-xl p-4">
            <h4 className="text-xs font-extrabold text-sky-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users size={14} className="text-indigo-500"/>
                Voyageurs
                <span className="ml-auto text-xs font-bold text-slate-400 normal-case tracking-normal">
                    {adults.length + childPax.length} personne{adults.length + childPax.length > 1 ? 's' : ''}
                </span>
            </h4>

            {hasAdults && (
                <div className="flex flex-col gap-2 mb-3">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck size={11}/> Adultes
                    </p>
                    {adults.map((adult, i) => {
                        const civ      = normalizeCivility(adult.Civility);
                        const civColor = civ === 'Mme'
                            ? 'bg-pink-100 text-pink-700 border-pink-200'
                            : 'bg-sky-100 text-sky-700 border-sky-200';
                        const initials = getInitials(adult.Name, adult.Surname);
                        const isHolder = i === 0;

                        return (
                            <div key={i} className="flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                                    isHolder
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 leading-none">
                                        {adult.Name} {adult.Surname}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${civColor}`}>
                                    {civ}
                                </span>
                                {isHolder && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                        Titulaire
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {hasChildren && (
                <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Baby size={11}/> Enfants
                    </p>
                    {childPax.map((child, i) => {
                        const initials = getInitials(child.Name, child.Surname);
                        return (
                            <div key={i} className="flex items-center gap-3 py-2 px-3 bg-orange-50/60 rounded-lg border border-orange-100">
                                <div className="w-8 h-8 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-xs font-extrabold shrink-0">
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 leading-none">
                                        {child.Name} {child.Surname}
                                    </p>
                                </div>
                                {child.Age != null && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                                        {child.Age} ans
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function VerifyBookingModal({isOpen, booking, onClose}) {
    const [isPending, setIsPending] = useState(false);
    const queryClient = useQueryClient();
    const {updateBookingStatus} = useAdminBookings();

    const toStr = (val) => (val == null ? "" : String(val));
    const toInt = (val) => parseInt(val, 10);

    const resolveBoardingId = (rawBoarding) => {
        if (typeof rawBoarding === 'object' && rawBoarding?.Id) return rawBoarding.Id.toString();
        const b = (rawBoarding || "").toString().toUpperCase();
        if (b.includes("LPD") || b === "BB") return "2";
        if (b.includes("DP")  || b === "HB") return "3";
        if (b.includes("PC")  || b === "FB") return "4";
        if (b.includes("ALL") || b === "AI") return "5";
        return b || "1";
    };

    const buildIProPayload = (bookingEntity) => {
        const bData    = typeof bookingEntity.bookingData  === 'string' ? JSON.parse(bookingEntity.bookingData)  : (bookingEntity.bookingData  || {});
        const iPayload = typeof bookingEntity.iproPayload  === 'string' ? JSON.parse(bookingEntity.iproPayload)  : (bookingEntity.iproPayload  || {});
        const token    = iPayload.Token || iPayload.token || bData.Token || bData.token;

        const mappedAdults = (iPayload.Adult || []).map((a, index) => ({
            Civility: a.Civility === 2 || a.Civility === "2" || a.Civility === "Ms" ? "Ms" : "Mr",
            Name:    a.Name    || "Client",
            Surname: a.Surname || "Client",
            Holder:  index === 0
        }));

        const mappedChildren = (iPayload.Child || []).map(c => ({
            Name:    c.Name    || "Child",
            Surname: c.Surname || "Child",
            Age:     c.Age?.toString() || "5"
        }));

        const rawRooms    = bData.selectedRooms || bData.rooms || iPayload.rawRooms || [];
        const mappedRooms = rawRooms.map((room, index) => {
            const extractedBoarding = room.Boarding || bData.boardingType || iPayload.boardingType || "1";
            return {
                Id:          (index + 1).toString(),
                Boarding:    resolveBoardingId(extractedBoarding),
                View:        room.View        || [],
                Supplement:  room.Supplement  || [],
                Pax: {
                    Adult: mappedAdults,
                    ...(mappedChildren.length > 0 ? {Child: mappedChildren} : {})
                }
            };
        });

        return {
            Token:     token,
            PreBooking: true,
            City:      (bData.City || bData.hotel?.City?.Id || iPayload.City || 10),
            Hotel:     parseInt(bData.Hotel || bookingEntity.hotelId || bData.hotelId || bData.hotel?.Id, 10),
            CheckIn:   (bookingEntity.checkIn  || bData.CheckIn  || bData.checkIn).substring(0, 10),
            CheckOut:  (bookingEntity.checkOut || bData.CheckOut || bData.checkOut).substring(0, 10),
            Source:    iPayload.Source || bData.Source || bData.source,
            Rooms:     mappedRooms
        };
    };

    const handleAction = async (newStatus) => {
        if (!booking) return;
        try {
            setIsPending(true);
            let iProResponseId = null;

            if (newStatus === "CONFIRMED") {
                const bData    = typeof booking.bookingData  === 'string' ? JSON.parse(booking.bookingData)  : (booking.bookingData  || {});
                const iPayload = typeof booking.iproPayload  === 'string' ? JSON.parse(booking.iproPayload)  : (booking.iproPayload  || {});

                const payloadToIpro = {
                    Credential: {
                        Login:    import.meta.env.VITE_API_LOGIN,
                        Password: import.meta.env.VITE_API_PASSWORD
                    },
                    HotelBooking: {
                        Token:    iPayload.Token || bData.Token || bData.token,
                        PreBooking: false,
                        City:     toStr(iPayload.City  || bData.City),
                        Hotel:    toInt(iPayload.Hotel || bData.Hotel || booking.hotelId),
                        CheckIn:  toStr(iPayload.CheckIn  || bData.CheckIn  || booking.checkIn).substring(0, 10),
                        CheckOut: toStr(iPayload.CheckOut || bData.CheckOut || booking.checkOut).substring(0, 10),
                        Source:   toStr(iPayload.Source || bData.Source || bData.source),
                        Rooms: (iPayload.rawRooms || iPayload.Rooms || bData.rooms || []).map((room, index) => ({
                            Id:         toStr(room.Id || room.roomId || (index + 1)),
                            Boarding:   resolveBoardingId(room.Boarding || iPayload.boardingType || "1"),
                            View:       Array.isArray(room.View)        ? room.View.map(v => toInt(v))       : [],
                            Supplement: Array.isArray(room.Supplement)  ? room.Supplement.map(s => toInt(s)) : [],
                            Pax: {
                                Adult: (room.Adult || iPayload.Adult || []).map((pax, i) => ({
                                    Civility: toStr(pax.Civility || "Mr"),
                                    Name:     pax.Name    || "Client",
                                    Surname:  pax.Surname || "Traveler",
                                    Holder:   i === 0
                                })),
                                ...((room.Child || iPayload.Child || []).length > 0 && {
                                    Child: (room.Child || iPayload.Child || []).map(pax => ({
                                        Name:    pax.Name    || "Child",
                                        Surname: pax.Surname || "Traveler",
                                        Age:     String(pax.Age || "5")
                                    }))
                                })
                            }
                        }))
                    }
                };

                const refreshToastId = "token-refresh";
                toast.loading("Actualisation de la disponibilité…", {id: refreshToastId});
                try {
                    const cityIdNum  = Number(payloadToIpro.HotelBooking.City);
                    const hotelIdNum = payloadToIpro.HotelBooking.Hotel;
                    const roomsForRefresh = payloadToIpro.HotelBooking.Rooms.map(room => ({
                        adults:    (room.Pax?.Adult || []).length || 1,
                        childAges: (room.Pax?.Child || []).map(c => Number(c.Age) || 5),
                    }));

                    const freshSearch = await apiClient.searchRoomAvailability({
                        checkIn:  payloadToIpro.HotelBooking.CheckIn,
                        checkOut: payloadToIpro.HotelBooking.CheckOut,
                        hotelId:  hotelIdNum,
                        cityId:   cityIdNum,
                        rooms:    roomsForRefresh,
                    });

                    if (freshSearch.rooms?.length) {
                        const storedRoomId     = String(payloadToIpro.HotelBooking.Rooms[0]?.Id ?? "");
                        const storedBoardingId = String(payloadToIpro.HotelBooking.Rooms[0]?.Boarding ?? "");

                        const matched =
                            (storedRoomId     && freshSearch.rooms.find(r => String(r.id)        === storedRoomId))
                            || freshSearch.rooms.find(r => String(r.boardingId) === storedBoardingId)
                            || freshSearch.rooms[0];

                        if (matched?.id) {
                            payloadToIpro.HotelBooking.Rooms[0].Id = String(matched.id);
                            payloadToIpro.HotelBooking.Token       = matched._token  || freshSearch.token;
                            payloadToIpro.HotelBooking.Source      = matched._source || freshSearch.source;
                        }
                    }
                } catch (refreshErr) {
                    console.warn("Token refresh failed, using stored token:", refreshErr.message);
                } finally {
                    toast.dismiss(refreshToastId);
                }

                const iProResponse = await apiClient.createBooking(payloadToIpro);
                iProResponseId = iProResponse.Id || iProResponse.BookingCreation?.Id || iProResponse.BookingCreation?.[0]?.Id;

                if (!iProResponseId) throw new Error("La réservation a été acceptée mais aucun ID n'a été retourné.");
                toast.success("Réservation externe iPro confirmée !");

            } else if (newStatus === "REJECTED") {
                const externalId = booking.externalId || booking.bookingData?.iProId;
                if (booking.status === "CONFIRMED" || externalId) {
                    if (!externalId) {
                        toast.error("Impossible d'annuler côté iPro : ID externe introuvable.");
                        setIsPending(false);
                        return;
                    }
                    await apiClient.cancelBooking(externalId, false);
                    toast.success("Réservation externe iPro annulée avec succès !");
                }
            }

            const updatePayload = newStatus === "CONFIRMED" && iProResponseId
                ? {status: newStatus, externalId: iProResponseId}
                : {status: newStatus};

            await AllezGoApi.client.patch(`/api/bookings/${booking.id}`, updatePayload);
            toast.success(`Statut mis à jour : ${newStatus}`);
            queryClient.invalidateQueries({queryKey: ["admin-bookings"]});
            onClose();

        } catch (error) {
            console.error("Booking Orchestration Failed:", error);
            toast.error(error.message || "Erreur lors de la synchronisation de la réservation.");
        } finally {
            setIsPending(false);
        }
    };

    // ── Parse JSON blobs ──────────────────────────────────────────────────────
    let parsedIpro = {};
    let parsedBooking = {};
    try { parsedIpro    = typeof booking?.iproPayload  === 'string' ? JSON.parse(booking.iproPayload)  : (booking?.iproPayload  || {}); } catch (_) {}
    try { parsedBooking = typeof booking?.bookingData  === 'string' ? JSON.parse(booking.bookingData)  : (booking?.bookingData  || {}); } catch (_) {}

    // ── Passenger arrays ──────────────────────────────────────────────────────
    const adults = parsedIpro.Adult?.length
        ? parsedIpro.Adult
        : (parsedBooking.passengers ?? []).filter(p => (p.Age ?? 30) >= 12);

    const childPax = parsedIpro.Child?.length
        ? parsedIpro.Child
        : (parsedBooking.passengers ?? []).filter(p => (p.Age ?? 30) < 12);

    // ── Hotel name ────────────────────────────────────────────────────────────
    const hotelDisplayName = booking?.hotelName
        || parsedIpro?.hotelName
        || parsedBooking?.hotelName
        || booking?.hotel?.name
        || `Hôtel (ID: ${booking?.hotelId || 'Inconnu'})`;

    const isNameMissing = hotelDisplayName?.startsWith('Hôtel (ID:');

    const {data: fetchedHotel, isLoading: isFetchingHotel} = useQuery({
        queryKey: ['ipro-hotel', booking?.hotelId],
        queryFn:  () => apiClient.getHotel(booking?.hotelId),
        enabled:  !!isOpen && !!booking?.hotelId && isNameMissing,
        staleTime: 1000 * 60 * 60,
    });

    const finalHotelName = isNameMissing && fetchedHotel?.Name ? fetchedHotel.Name : hotelDisplayName;

    if (!isOpen || !booking) return null;

    // ── Derived display values ────────────────────────────────────────────────
    const hasReceipt = Boolean(booking?.receipt || booking?.receiptFilename || booking?.receiptUrl);

    let clientFullName = booking?.clientName || parsedBooking?.clientName;
    if (!clientFullName && parsedIpro?.Adult?.[0]) {
        const p = parsedIpro.Adult[0];
        clientFullName = `${p.Name} ${p.Surname}`;
    }
    clientFullName = clientFullName || 'Client inconnu';

    const clientPhone = booking?.clientPhone
        || parsedBooking?.clientPhone
        || parsedBooking?.bookingState?.passengers?.[0]?.phone
        || 'Non renseigné';

    const clientEmail = booking?.clientEmail
        || parsedBooking?.clientEmail
        || parsedBooking?.bookingState?.passengers?.[0]?.email
        || null;

    const displayRef    = booking?.reference || `ALG-${String(booking?.id || 0).padStart(3, '0')}`;
    const formattedPrice = new Intl.NumberFormat("fr-DZ").format(booking.clientPrice);

    const checkIn  = booking?.checkIn  || "N/A";
    const checkOut = booking?.checkOut || "N/A";
    const nights   = (checkIn !== "N/A" && checkOut !== "N/A")
        ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
        : 0;

    const BOARDING_DISPLAY_LABELS = {
        RO: "Chambre Seule", BB: "Petit-Déjeuner", HB: "Demi-Pension",
        FB: "Pension Complète", AI: "Tout Inclus", SC: "Self Catering",
    };
    const rawBoardingCode = parsedBooking?.boardingType || parsedIpro?.boardingType || null;
    const rawBoardingName = parsedBooking?.rooms?.[0]?.boardingName
        || parsedBooking?.selectedRooms?.[0]?.boardingName
        || parsedIpro?.rawRooms?.[0]?.boardingName
        || null;
    const boardBasis = rawBoardingName
        || BOARDING_DISPLAY_LABELS[rawBoardingCode?.toUpperCase?.()]
        || rawBoardingCode
        || "Non spécifié";

    const roomType = parsedBooking?.rooms?.[0]?.roomType
        || parsedBooking?.selectedRooms?.[0]?.roomType
        || parsedIpro?.rawRooms?.[0]?.roomType
        || parsedIpro?.rawRooms?.[0]?.name
        || "Non spécifié";

    const bookingDate = booking.createdAt
        ? new Date(booking.createdAt).toLocaleString('fr-DZ', {
            day:    '2-digit', month: '2-digit', year:   'numeric',
            hour:   '2-digit', minute: '2-digit', hour12: false,
          }).replace(',', ' à')
        : null;

    const derivedPaymentMethod = hasReceipt ? "Virement bancaire" : "Espèce (En agence)";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/60 backdrop-blur-sm font-sans"
            onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="relative px-4 py-4 sm:px-6 sm:py-5 border-b border-sky-800/30 bg-gradient-to-r from-sky-950 via-sky-900 to-sky-950">
                    {/* Left accent stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-orange-400 to-amber-500"/>
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center shrink-0 mt-0.5">
                                <ShieldCheck size={18} className="text-orange-400"/>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-white font-extrabold text-sm sm:text-base leading-tight tracking-tight truncate">
                                    Vérification — {displayRef}
                                </h2>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                    <p className="text-sky-300 text-xs font-medium truncate max-w-35 sm:max-w-none">{clientFullName}</p>
                                    {bookingDate && (
                                        <span className="text-sky-400 text-xs font-medium flex items-center gap-1 shrink-0">
                                            <CalendarCheck size={10}/>
                                            <span className="hidden sm:inline">Réservé le </span>{bookingDate}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={booking.status}/>
                            <button
                                onClick={onClose}
                                disabled={isPending}
                                className="p-1.5 rounded-lg text-sky-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
                                title="Fermer"
                            >
                                <X size={18}/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Scrollable body ───────────────────────────────────────── */}
                <div className="px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-4 overflow-y-auto flex-1">

                    {/* Client + Séjour */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-slate-50 to-sky-50/50 border border-sky-100 rounded-xl p-4">
                            <h4 className="text-xs font-extrabold text-sky-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <User size={14} className="text-sky-600"/>
                                Détails du Client
                            </h4>
                            <div className="flex flex-col gap-3">
                                <DetailRow icon={User} label="Nom complet">
                                    {clientFullName}
                                </DetailRow>
                                <DetailRow icon={Phone} label="Téléphone" href={`tel:${clientPhone}`}>
                                    {clientPhone}
                                </DetailRow>
                                {clientEmail && (
                                    <DetailRow icon={Mail} label="Email" href={`mailto:${clientEmail}`}>
                                        {clientEmail}
                                    </DetailRow>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-sky-50/50 border border-sky-100 rounded-xl p-4">
                            <h4 className="text-xs font-extrabold text-sky-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileText size={14} className="text-sky-600"/>
                                Détails du Séjour
                            </h4>
                            <div className="flex flex-col gap-3">
                                <DetailRow icon={Hotel} label="Hôtel">
                                    {isFetchingHotel ? 'Chargement...' : finalHotelName}
                                </DetailRow>
                                <DetailRow icon={Calendar} label="Check-in / Check-out">
                                    {booking.checkIn} → {booking.checkOut}
                                </DetailRow>
                                <DetailRow icon={Clock} label="Informations Réservation">
                                    {nights} Nuit(s) • {roomType} • {boardBasis}
                                </DetailRow>
                                <DetailRow icon={BadgeDollarSign} label="Total à payer">
                                    <span className="text-sky-700 font-extrabold text-base">
                                        {formattedPrice} DZD
                                    </span>
                                </DetailRow>
                            </div>
                        </div>
                    </div>

                    {/* Voyageurs */}
                    <PassengerCard adults={adults} children={childPax}/>

                    {/* Payment method */}
                    <DetailRow icon={CreditCard} label="Mode de Paiement">
                        {derivedPaymentMethod}
                    </DetailRow>

                    {/* Receipt */}
                    {hasReceipt && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl">
                                <Landmark size={16} className="text-purple-500 shrink-0"/>
                                <span className="text-sm font-bold text-purple-700">Virement Bancaire</span>
                            </div>
                            <ReceiptImage filename={booking.receiptFilename} isOpen={isOpen}/>
                        </div>
                    )}

                    {!hasReceipt && (
                        <div className="flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-xl">
                            <Home size={18} className="text-sky-500 shrink-0 mt-0.5"/>
                            <div>
                                <p className="text-sm font-bold text-sky-800 mb-1">Paiement à l'agence</p>
                                <p className="text-sm text-sky-700 leading-relaxed">
                                    Le client a choisi de payer à l'agence. Confirmez-vous avoir reçu
                                    l'argent en main propre&nbsp;?
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer actions ────────────────────────────────────────── */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 bg-slate-50">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                        <button
                            onClick={onClose}
                            disabled={isPending}
                            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-40"
                        >
                            Annuler
                        </button>

                        <button
                            onClick={() => handleAction("REJECTED")}
                            disabled={isPending}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                        >
                            {isPending ? <Loader2 size={15} className="animate-spin"/> : <XCircle size={15}/>}
                            Rejeter
                        </button>

                        <button
                            onClick={() => handleAction("CONFIRMED")}
                            disabled={isPending}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md disabled:opacity-50"
                        >
                            {isPending ? <Loader2 size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>}
                            Valider &amp; Réserver
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
