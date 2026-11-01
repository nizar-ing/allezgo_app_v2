import React, {useState, useEffect} from 'react';
import {
    Plane,
    FileText,
    MessageSquare,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Globe,
    MapPin,
    Pencil,
    Trash2,
    Plus,
    Users,
    CreditCard,
    Eye,
    Home,
    Landmark,
    Phone,
    XCircle,
    Ban,
    Clock,
    CheckCircle2,
    Image as ImageIcon,
    BarChart2,
    Settings as SettingsIcon,
    Server,
    DollarSign,
    GitMerge,
    Filter,
    TrendingUp,
} from 'lucide-react';

const SUPPLIER_SHORT = { ipro: 'iPro', tunisiabeds: 'TBeds' };
const fmt = (n) => new Intl.NumberFormat('fr-DZ').format(Number(n));
//import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useDestinations from '../../custom-hooks/useDestinations.js';
import useTestimonials from '../../custom-hooks/useTestimonials.js';
import useUsers from '../../custom-hooks/useUsers.js';
import PageLoader from '../../ui/PageLoader.jsx';
import CreateDestinationModal from './CreateDestinationModal.jsx';
import EditDestinationModal from './EditDestinationModal.jsx';
import CreateTestimonialModal from './CreateTestimonialModal.jsx';
import EditTestimonialModal from './EditTestimonialModal.jsx';
import CreateUserModal from './CreateUserModal.jsx';
import EditUserModal from './EditUserModal.jsx';
import useAdminBookings from '../../custom-hooks/useAdminBookings.js';
import VerifyBookingModal from '../../components/admin/VerifyBookingModal.jsx';
import VoucherModal from '../../components/admin/VoucherModal.jsx';
import CancelBookingModal from "../../components/admin/CancelBookingModal.jsx";
import CarouselAdmin from "../../components/admin/CarouselAdmin.jsx";
import BusinessStats from './BusinessStats.jsx';
import SettingsPanel from './SettingsPanel.jsx';
import SuppliersPanel from './SuppliersPanel.jsx';
import FxRatesPanel from './FxRatesPanel.jsx';
import HotelMappingPanel from './HotelMappingPanel.jsx';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({status}) {
    const config = {
        PENDING: { bg: 'bg-amber-400/15', text: 'text-amber-500', border: 'border-amber-400/30', label: 'En attente', icon: Clock },
        CONFIRMED: { bg: 'bg-emerald-400/15', text: 'text-emerald-500', border: 'border-emerald-400/30', label: 'Confirmée', icon: CheckCircle2 },
        REJECTED: { bg: 'bg-rose-400/15', text: 'text-rose-500', border: 'border-rose-400/30', label: 'Rejetée', icon: XCircle },
        CANCELLED: { bg: 'bg-slate-200', text: 'text-slate-600', border: 'border-slate-300', label: 'Annulée', icon: Ban },
    };
    const c = config[status?.toUpperCase()] || config.PENDING;
    const Icon = c.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}>
            <Icon size={12}/>
            {c.label}
        </span>
    );
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('destinations');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingDestination, setEditingDestination] = useState(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const [isCreateTestimonialOpen, setIsCreateTestimonialOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState(null);

    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    //const queryClient = useQueryClient();
    const {data: destinations, loading, removeDestination, actionLoading: destActionLoading} = useDestinations();
    const {
        data: testimonials,
        loading: testimonialsLoading,
        removeTestimonial,
        actionLoading: testActionLoading
    } = useTestimonials();
    const {data: users, loading: usersLoading, removeUser, actionLoading: userActionLoading} = useUsers();

    const {bookings, loading: bookingsLoading} = useAdminBookings();
    const [seenBookingIds, setSeenBookingIds] = useState(
        () => new Set(JSON.parse(localStorage.getItem('allez-go-admin-seen-bookings') || '[]'))
    );

    const totalCount = bookings?.length ?? 0;
    const newCount = (bookings ?? []).filter(b => !seenBookingIds.has(b.id)).length;

    useEffect(() => {
        if (activeTab !== 'bookings' || !bookings?.length) return;
        const allIds = bookings.map(b => b.id);
        const updated = new Set([...seenBookingIds, ...allIds]);
        localStorage.setItem('allez-go-admin-seen-bookings', JSON.stringify([...updated]));
        setSeenBookingIds(updated);
    }, [activeTab, bookings]);

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [bookingStatusFilter, setBookingStatusFilter] = useState('');
    const [bookingSupplierFilter, setBookingSupplierFilter] = useState('');

    // --- Premium Custom Toast with Direct Cache Mutation ---
    const confirmDelete = (destination) => {
        toast(
            (t) => (
                <div className="flex flex-col gap-3 font-sans w-full min-w-[250px]">
                    <p className="text-sm font-semibold text-slate-800">
                        Supprimer <span
                        className="text-red-600 font-bold">"{destination.city || destination.name}"</span> ?
                    </p>
                    <p className="text-xs text-slate-500">Cette action est irréversible.</p>
                    <div className="flex gap-2 justify-end mt-2">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            disabled={destActionLoading}
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toast.dismiss(t.id);
                                try {
                                    await removeDestination(destination.id);
                                } catch (error) {
                                    console.error('Delete error:', error);
                                }
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm rounded-md transition-colors disabled:opacity-50"
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            ),
            {
                duration: Infinity,
                position: 'top-center',
                style: {
                    border: '1px solid #fee2e2',
                    padding: '16px',
                },
            }
        );
    };

    const confirmDeleteTestimonial = (testimonial) => {
        toast(
            (t) => (
                <div className="flex flex-col gap-3 font-sans w-full min-w-[250px]">
                    <p className="text-sm font-semibold text-slate-800">
                        Supprimer <span className="text-red-600 font-bold">"{testimonial.name}"</span> ?
                    </p>
                    <p className="text-xs text-slate-500">Cette action est irréversible.</p>
                    <div className="flex gap-2 justify-end mt-2">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            disabled={testActionLoading}
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toast.dismiss(t.id);
                                try {
                                    await removeTestimonial(testimonial.id);
                                } catch (error) {
                                    console.error('Delete error:', error);
                                }
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm rounded-md transition-colors disabled:opacity-50"
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            ),
            {
                duration: Infinity,
                position: 'top-center',
                style: {
                    border: '1px solid #fee2e2',
                    padding: '16px',
                },
            }
        );
    };

    const confirmDeleteUser = (user) => {
        toast(
            (t) => (
                <div className="flex flex-col gap-3 font-sans w-full min-w-[250px]">
                    <p className="text-sm font-semibold text-slate-800">
                        Supprimer <span className="text-red-600 font-bold">"{user.firstName} {user.lastName}"</span> ?
                    </p>
                    <p className="text-xs text-slate-500">Cette action est irréversible.</p>
                    <div className="flex gap-2 justify-end mt-2">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            disabled={userActionLoading}
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toast.dismiss(t.id);
                                try {
                                    await removeUser(user.id);
                                } catch (error) {
                                    console.error('Delete error:', error);
                                }
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm rounded-md transition-colors disabled:opacity-50"
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            ),
            {
                duration: Infinity,
                position: 'top-center',
                style: {
                    border: '1px solid #fee2e2',
                    padding: '16px',
                },
            }
        );
    };

    const tabs = [
        {id: 'destinations', label: 'Voyages Organisés', icon: Plane},
        {id: 'evisas', label: 'E-Visas', icon: FileText},
        {id: 'bookings', label: 'Réservations', icon: CreditCard},
        {id: 'testimonials', label: 'Témoignages', icon: MessageSquare},
        {id: 'users', label: 'Utilisateurs', icon: Users},
        {id: 'carousel', label: 'Carrousel', icon: ImageIcon},
        {id: 'analytics', label: 'My Business Stats', icon: BarChart2},
        {id: 'suppliers', label: 'Fournisseurs', icon: Server},
        {id: 'fx-rates', label: 'Taux de change', icon: DollarSign},
        {id: 'hotel-mapping', label: 'Mapping hôtels', icon: GitMerge},
        {id: 'settings', label: 'Paramètres', icon: SettingsIcon},
    ];

    const renderContent = () => {
        if (activeTab === 'destinations') {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden font-sans">
                    <div
                        className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center items-start gap-4 md:gap-0 bg-white">
                        <div>
                            <h3 className="text-lg font-semibold text-sky-900 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-sky-600"/>
                                Destinations
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Gérez les destinations de voyage disponibles</p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <Plus size={18}/>
                            Ajouter une destination
                        </button>
                    </div>
                    <div className="p-0">
                        {loading ? (
                            <PageLoader compact message="Chargement des destinations..." />
                        ) : (
                            <div className="w-full overflow-x-auto scrollbar-hide">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Destination
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                    {destinations?.length > 0 ? destinations.map((dest) => (
                                        <tr key={dest.id} className="hover:bg-sky-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div
                                                        className="h-10 w-10 flex-shrink-0 bg-sky-100/70 rounded-lg flex items-center justify-center">
                                                        <MapPin className="h-5 w-5 text-sky-600"/>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div
                                                            className="text-sm font-bold text-sky-700">{dest.city || dest.name}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                          <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${dest.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {dest.isActive !== false ? 'Actif' : 'Inactif'}
                          </span>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingDestination(dest)}
                                                        className="p-2 bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-lg transition-colors shadow-sm"
                                                        title="Modifier"
                                                    >
                                                        <Pencil size={16}/>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={destActionLoading}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            confirmDelete(dest);
                                                        }}
                                                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                                                Aucune destination trouvée.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            );
        } else if (activeTab === 'testimonials') {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden font-sans">
                    <div
                        className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center items-start gap-4 md:gap-0 bg-white">
                        <div>
                            <h3 className="text-lg font-semibold text-sky-900 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-sky-600"/>
                                Témoignages
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Gérez les témoignages de vos clients</p>
                        </div>
                        <button
                            onClick={() => setIsCreateTestimonialOpen(true)}
                            className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <Plus size={18}/>
                            Ajouter un témoignage
                        </button>
                    </div>
                    <div className="p-0">
                        {testimonialsLoading ? (
                            <PageLoader compact message="Chargement des témoignages..." />
                        ) : (
                            <div className="w-full overflow-x-auto scrollbar-hide">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Client
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Citation
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                    {testimonials?.length > 0 ? testimonials.map((test) => (
                                        <tr key={test.id} className="hover:bg-sky-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div
                                                        className="h-10 w-10 flex-shrink-0 bg-sky-100/70 rounded-full flex items-center justify-center overflow-hidden">
                                                        <img src={test.imageUrl} alt={test.name}
                                                             className="h-full w-full object-cover" onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(test.name);
                                                        }}/>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div
                                                            className="text-sm font-bold text-sky-700">{test.name}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div
                                                    className="text-sm text-gray-600 line-clamp-2 max-w-md">"{test.citation}"
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingTestimonial(test)}
                                                        className="p-2 bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-lg transition-colors shadow-sm"
                                                        title="Modifier"
                                                    >
                                                        <Pencil size={16}/>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={testActionLoading}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            confirmDeleteTestimonial(test);
                                                        }}
                                                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                                                Aucun témoignage trouvé.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            );
        } else if (activeTab === 'users') {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden font-sans">
                    <div
                        className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center items-start gap-4 md:gap-0 bg-white">
                        <div>
                            <h3 className="text-lg font-semibold text-sky-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-sky-600"/>
                                Utilisateurs
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Gérez les comptes utilisateurs de
                                l'application</p>
                        </div>
                        <button
                            onClick={() => setIsCreateUserOpen(true)}
                            className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <Plus size={18}/>
                            Ajouter un utilisateur
                        </button>
                    </div>
                    <div className="p-0">
                        {usersLoading ? (
                            <PageLoader compact message="Chargement des utilisateurs..." />
                        ) : (
                            <div className="w-full overflow-x-auto scrollbar-hide">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Nom
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Rôle
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                    {users?.length > 0 ? users.map((user) => (
                                        <tr key={user.id} className="hover:bg-sky-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div
                                                    className="text-sm font-bold text-sky-700">{user.firstName} {user.lastName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                          <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {user.role === 'admin' ? 'Administrateur' : 'Client'}
                          </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingUser(user)}
                                                        className="p-2 bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-lg transition-colors shadow-sm"
                                                        title="Modifier"
                                                    >
                                                        <Pencil size={16}/>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={userActionLoading}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            confirmDeleteUser(user);
                                                        }}
                                                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                                Aucun utilisateur trouvé.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            );
        } else if (activeTab === 'bookings') {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-sky-100/50 overflow-hidden font-sans">
                    <div
                        className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center items-start gap-4 md:gap-0 bg-white">
                        <div>
                            <h3 className="text-lg font-semibold text-sky-900 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-sky-600"/>
                                Réservations
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Gérez les virements et finalisez les
                                réservations</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Filter size={14} className="text-slate-400 shrink-0"/>
                            <select
                                value={bookingStatusFilter}
                                onChange={e => setBookingStatusFilter(e.target.value)}
                                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="PENDING">En attente</option>
                                <option value="CONFIRMED">Confirmée</option>
                                <option value="REJECTED">Rejetée</option>
                                <option value="CANCELLED">Annulée</option>
                            </select>
                            <select
                                value={bookingSupplierFilter}
                                onChange={e => setBookingSupplierFilter(e.target.value)}
                                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                            >
                                <option value="">Tous les fournisseurs</option>
                                <option value="ipro">iPro</option>
                                <option value="tunisiabeds">TunisiaBeds</option>
                                <option value="legacy">Sans fournisseur</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-0">
                        {bookingsLoading ? (
                            <PageLoader compact message="Chargement des réservations..." />
                        ) : (
                            <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 z-10 bg-slate-50 border-r border-slate-100">Référence
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date de réservation
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hôtel
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-in
                                            / Out
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fournisseur
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Économie
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider sticky right-0 z-10 bg-slate-50 border-l border-slate-100 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                    {(() => {
                                        const sortedBookings = [...(bookings ?? [])]
                                            .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
                                            .filter(b => {
                                                if (bookingStatusFilter && b.status !== bookingStatusFilter) return false;
                                                if (bookingSupplierFilter === 'legacy' && b.supplier) return false;
                                                if (bookingSupplierFilter && bookingSupplierFilter !== 'legacy' && b.supplier !== bookingSupplierFilter) return false;
                                                return true;
                                            });
                                        return sortedBookings.length > 0 ? sortedBookings.map((booking) => {
                                        // --- Data Sniper: Ultra-aggressive extraction ---
                                        let parsedIpro = {};
                                        let parsedBooking = {};
                                        try {
                                            parsedIpro = typeof booking?.iproPayload === 'string' ? JSON.parse(booking.iproPayload) : (booking?.iproPayload || {});
                                        } catch (e) {
                                        }
                                        try {
                                            parsedBooking = typeof booking?.bookingData === 'string' ? JSON.parse(booking.bookingData) : (booking?.bookingData || {});
                                        } catch (e) {
                                        }

                                        const clientFullName = parsedIpro?.Adult?.[0]
                                            ? `${parsedIpro.Adult[0].Name} ${parsedIpro.Adult[0].Surname}`
                                            : (booking?.clientPhone || 'Client inconnu');

                                        const hotelDisplayName = booking?.hotelName
                                            || parsedIpro?.hotelName
                                            || parsedBooking?.hotelName
                                            || booking?.hotel?.name
                                            || `Hôtel (ID: ${booking?.hotelId || 'Inconnu'})`;

                                        const hasReceipt = Boolean(booking?.receipt || booking?.receiptFilename || booking?.receiptUrl);
                                        const paymentMethodDisplay = hasReceipt ? "Virement" : "Espèce";

                                        const clientPhone = booking?.clientPhone || parsedBooking?.clientPhone || parsedBooking?.bookingState?.passengers?.[0]?.phone || 'Non renseigné';

                                        const payIcon = hasReceipt ?
                                            <Landmark size={14} className="text-purple-500" title="Virement"/> :
                                            <Home size={14} className="text-sky-500" title="Agence"/>;

                                        const displayRef = booking?.reference || `ALG-${String(booking?.id || 0).padStart(3, '0')}`;

                                        return (
                                            <tr key={booking.id} className="hover:bg-sky-50/50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-sky-700 sticky left-0 z-10 bg-white border-r border-gray-100 group-hover:bg-sky-50/50 transition-colors">{displayRef}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {booking.createdAt
                                                        ? new Date(booking.createdAt).toLocaleString('fr-DZ', {
                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                                                            hour12: false,
                                                        })
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="text-sm font-semibold text-gray-800">{clientFullName}</span>
                                                        {payIcon}
                                                    </div>
                                                    <a href={`tel:${clientPhone}`}
                                                       className="text-xs text-sky-600 hover:underline flex items-center gap-1 mt-1">
                                                        <Phone size={10}/> {clientPhone}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{hotelDisplayName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{booking.checkIn} - {booking.checkOut}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-sky-700">{new Intl.NumberFormat("fr-DZ").format(booking.clientPrice)} DZD</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {booking.supplier ? (SUPPLIER_SHORT[booking.supplier] || booking.supplier) : <span className="text-slate-400">—</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {booking.marginDzd != null && Number(booking.marginDzd) > 0 ? (
                                                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                                            <TrendingUp size={13}/> {fmt(booking.marginDzd)} DZD
                                                        </span>
                                                    ) : <span className="text-slate-400">—</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge status={booking.status}/>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right sticky right-0 z-10 bg-white border-l border-gray-100 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] group-hover:bg-sky-50/50 transition-colors">
                                                    <div className="flex justify-end gap-2">
                                                        {booking.status === 'PENDING' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setSelectedBooking(booking);
                                                                    setIsVerifyModalOpen(true);
                                                                }}
                                                                className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors shadow-sm"
                                                                title="Vérifier"
                                                            >
                                                                <Eye size={18}/>
                                                            </button>
                                                        )}
                                                        {(booking.status === 'CANCELLED' || booking.status === 'REJECTED') && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setSelectedBooking(booking);
                                                                    setIsVerifyModalOpen(true);
                                                                }}
                                                                className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors shadow-sm"
                                                                title="Voir les détails"
                                                            >
                                                                <Eye size={18}/>
                                                            </button>
                                                        )}
                                                        {booking.status === 'CONFIRMED' && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setSelectedBooking(booking);
                                                                        setIsVoucherModalOpen(true);
                                                                    }}
                                                                    className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors shadow-sm"
                                                                    title="Consulter Voucher"
                                                                >
                                                                    <FileText size={18}/>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedBooking(booking);
                                                                        setIsCancelModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                                                    title="Annuler Réservation"
                                                                >
                                                                    <XCircle size={16}/>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="10" className="px-6 py-12 text-center text-gray-500">Aucune
                                                réservation trouvée.
                                            </td>
                                        </tr>
                                    ); })()}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            );
        } else if (activeTab === 'analytics') {
            return <BusinessStats />;
        } else if (activeTab === 'suppliers') {
            return <SuppliersPanel />;
        } else if (activeTab === 'fx-rates') {
            return <FxRatesPanel />;
        } else if (activeTab === 'hotel-mapping') {
            return <HotelMappingPanel />;
        } else if (activeTab === 'carousel') {
            return <CarouselAdmin />;
        } else if (activeTab === 'settings') {
            return <SettingsPanel />;
        }

        return (
            <div
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-sky-100/50 p-12 text-center font-sans">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Module en construction</h3>
                <p className="text-gray-500">Le module {tabs.find(t => t.id === activeTab)?.label} sera bientôt
                    disponible.</p>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row md:gap-4 font-sans">

            {/* Mobile Sidebar Toggle */}
            <div
                className="md:hidden bg-sky-950 text-white p-4 flex justify-between items-center shadow-md z-20 relative">
                <h1 className="text-xl font-bold tracking-tight">Admin<span className="text-orange-500">Panel</span>
                </h1>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-md focus:outline-none transition-colors">
                    {isSidebarOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        fixed md:static inset-y-0 left-0 ${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-sky-950 via-sky-900 to-sky-950 text-white shadow-2xl rounded-none md:rounded-xl transition-all duration-300 ease-in-out z-50 md:z-20 flex flex-col overflow-hidden relative
      `}>
                {/* Decorative brand warmth — subtle orange tint at top */}
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-orange-500/[0.07] to-transparent pointer-events-none" aria-hidden="true"/>
                {/* Header — logo + collapse toggle (desktop only) */}
                <div className={`hidden md:flex items-center border-b border-sky-800/50 min-h-[76px] ${isCollapsed ? 'flex-col justify-center gap-2 py-4 px-2' : 'justify-between px-5 py-6'}`}>
                    {isCollapsed ? (
                        <>
                            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center font-black text-xs tracking-tight shadow-lg shadow-orange-900/50 ring-2 ring-orange-400/20 ring-offset-1 ring-offset-sky-950 shrink-0">
                                AG
                            </div>
                            <button
                                onClick={() => setIsCollapsed(false)}
                                className="w-7 h-7 rounded-lg bg-sky-800/50 hover:bg-orange-500 text-sky-300 hover:text-white flex items-center justify-center transition-all duration-200 border border-sky-700/40 hover:border-orange-400/50 shadow-sm hover:shadow-md hover:shadow-orange-900/20 active:scale-95"
                                title="Développer le menu"
                            >
                                <ChevronRight size={13}/>
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight whitespace-nowrap">Admin<span className="text-orange-500">Panel</span></h1>
                                <p className="text-sky-300/80 text-xs mt-0.5 font-medium whitespace-nowrap">Gestion AllezGo</p>
                            </div>
                            <button
                                onClick={() => setIsCollapsed(true)}
                                className="shrink-0 w-7 h-7 rounded-lg bg-sky-800/50 hover:bg-orange-500 text-sky-300 hover:text-white flex items-center justify-center transition-all duration-200 border border-sky-700/40 hover:border-orange-400/50 shadow-sm hover:shadow-md hover:shadow-orange-900/20 active:scale-95"
                                title="Réduire le menu"
                            >
                                <ChevronLeft size={13}/>
                            </button>
                        </>
                    )}
                </div>

                <nav className={`flex-1 mt-4 space-y-1 px-2 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-sky-700/50 [&::-webkit-scrollbar-thumb]:rounded-full`}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setIsSidebarOpen(false);
                                }}
                                title={isCollapsed ? tab.label : undefined}
                                className={`w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 relative group
                  ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3 lg:text-base'}
                  ${isActive
                                    ? isCollapsed
                                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-900/40 ring-1 ring-orange-400/25'
                                        : 'bg-gradient-to-r from-orange-600 to-orange-500/90 text-white font-semibold tracking-tight shadow-lg shadow-orange-900/30 border-l-4 lg:border-l-[6px] border-white/80'
                                    : isCollapsed
                                        ? 'text-sky-300 hover:bg-white/[0.08] hover:text-white hover:ring-1 hover:ring-white/10'
                                        : 'text-sky-200 hover:bg-white/[0.08] hover:text-white border-l-4 border-transparent'
                                }
                `}
                            >
                                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white drop-shadow-sm' : 'text-sky-300'}`}/>
                                {!isCollapsed && <span className="flex-1 text-left truncate">{tab.label}</span>}
                                {!isCollapsed && tab.id === 'bookings' && totalCount > 0 && (
                                    <span className="ml-auto shrink-0">
                                        {newCount > 0 ? (
                                            <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 text-sm font-bold rounded-full bg-amber-400 text-white shadow-md animate-pulse">
                                                +{newCount}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 text-sm font-bold rounded-full bg-white text-sky-700 shadow-md">
                                                {totalCount}
                                            </span>
                                        )}
                                    </span>
                                )}
                                {isCollapsed && tab.id === 'bookings' && newCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]"/>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className={`px-2 pb-3 pt-2 mt-auto border-t border-sky-800/30 ${isCollapsed ? 'flex justify-center' : ''}`}>
                    <div className={`flex items-center rounded-xl transition-colors ${isCollapsed ? 'p-2 hover:bg-sky-800/40 cursor-default' : 'gap-3 px-3 py-2.5 bg-sky-900/50 border border-sky-700/20 hover:bg-sky-900/70'}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-orange-400/20 ring-offset-1 ring-offset-sky-950 shrink-0">
                            A
                        </div>
                        {!isCollapsed && (
                            <div>
                                <p className="text-sm font-semibold text-white">Administrateur</p>
                                <p className="text-xs text-sky-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]"></span>En ligne
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto rounded-xl bg-gradient-to-br from-slate-200 to-sky-900 relative">
                {/* Header */}
                <header
                    className="bg-gradient-to-br from-sky-950 via-sky-900 to-sky-950 backdrop-blur-md rounded-t-xl shadow-sm border-b border-slate-200 py-5 px-4 md:px-8 sticky top-0 z-10 flex justify-center items-center">
                    <h2 className="text-xl text-white font-bold flex items-center gap-2">
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h2>
                </header>

                {/* Content */}
                <div className="p-4 md:p-8 max-w-full mx-auto">
                    {renderContent()}
                </div>
            </main>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-sky-950/40 z-10 backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Create Destination Modal */}
            <CreateDestinationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* Edit Destination Modal */}
            <EditDestinationModal
                destination={editingDestination}
                onClose={() => setEditingDestination(null)}
            />

            {/* Create Testimonial Modal */}
            <CreateTestimonialModal
                isOpen={isCreateTestimonialOpen}
                onClose={() => setIsCreateTestimonialOpen(false)}
            />

            {/* Edit Testimonial Modal */}
            <EditTestimonialModal
                testimonial={editingTestimonial}
                onClose={() => setEditingTestimonial(null)}
            />

            {/* Create User Modal */}
            <CreateUserModal
                isOpen={isCreateUserOpen}
                onClose={() => setIsCreateUserOpen(false)}
            />

            {/* Edit User Modal */}
            <EditUserModal
                user={editingUser}
                onClose={() => setEditingUser(null)}
            />

            {/* Verify Booking Modal */}
            <VerifyBookingModal
                isOpen={isVerifyModalOpen}
                booking={selectedBooking}
                onClose={() => setIsVerifyModalOpen(false)}
            />
            <CancelBookingModal
                isOpen={isCancelModalOpen}
                booking={selectedBooking}
                onClose={() => setIsCancelModalOpen(false)}
            />

            <VoucherModal
                isOpen={isVoucherModalOpen}
                onClose={() => setIsVoucherModalOpen(false)}
                booking={selectedBooking}
            />
        </div>
    );
}
