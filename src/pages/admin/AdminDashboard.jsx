import React, {useState} from 'react';
import {
    Plane,
    FileText,
    MessageSquare,
    Menu,
    X,
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
    XCircle
} from 'lucide-react';
//import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useDestinations from '../../custom-hooks/useDestinations.js';
import useTestimonials from '../../custom-hooks/useTestimonials.js';
import useUsers from '../../custom-hooks/useUsers.js';
import Loader from '../../ui/Loader.jsx';
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

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('destinations');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

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
                            <div className="py-12"><Loader variant="minimal" message="Chargement des destinations..."/>
                            </div>
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
                            <div className="py-12"><Loader variant="minimal" message="Chargement des témoignages..."/>
                            </div>
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
                            <div className="py-12"><Loader variant="minimal" message="Chargement des utilisateurs..."/>
                            </div>
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
                    </div>
                    <div className="p-0">
                        {bookingsLoading ? (
                            <div className="py-12"><Loader variant="minimal" message="Chargement des réservations..."/>
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto scrollbar-hide">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Référence
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
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                    {bookings?.length > 0 ? bookings.map((booking) => {
                                        let statusBadge = "";
                                        switch (booking.status) {
                                            case 'PENDING':
                                                statusBadge = 'bg-amber-100 text-amber-700';
                                                break;
                                            case 'CONFIRMED':
                                                statusBadge = 'bg-emerald-100 text-emerald-700';
                                                break;
                                            case 'REJECTED':
                                                statusBadge = 'bg-rose-100 text-rose-700';
                                                break;
                                            default:
                                                statusBadge = 'bg-slate-100 text-slate-700';
                                        }

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
                                            <tr key={booking.id} className="hover:bg-sky-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-sky-700">{displayRef}</td>
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
                                                <td className="px-6 py-4 whitespace-nowrap"><span
                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${statusBadge}`}>{booking.status}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
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
                                            <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Aucune
                                                réservation trouvée.
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
        fixed md:static inset-y-0 left-0 w-64 bg-gradient-to-b from-sky-950 via-sky-900 to-sky-950 text-white shadow-xl rounded-none md:rounded-xl transition-transform duration-300 ease-in-out z-50 md:z-20 flex flex-col
      `}>
                <div className="px-6 py-8 hidden md:block border-b border-sky-800/50">
                    <h1 className="text-2xl font-bold tracking-tight">Admin<span
                        className="text-orange-500">Panel</span></h1>
                    <p className="text-sky-200 text-sm mt-1 font-medium">Gestion AllezGo</p>
                </div>

                <nav className="flex-1 mt-6 px-4 space-y-2">
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
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm lg:text-base font-medium transition-all duration-200
                  ${isActive
                                    ? 'bg-orange-600 text-white font-semibold tracking-tight shadow-md border-l-4 lg:border-l-8 border-white'
                                    : 'text-sky-200 hover:bg-white/10 hover:text-white border-l-4 border-transparent'
                                }
                `}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white font-bold' : 'text-sky-300'}`}/>
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 rounded-xlbg-sky-950 mt-auto border-t border-sky-800/50">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                            A
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Administrateur</p>
                            <p className="text-xs text-sky-300 flex items-center gap-1">
                                <span
                                    className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span> En
                                ligne
                            </p>
                        </div>
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
                onClose={() => {
                    setIsCancelModalOpen(false);
                    setStep(1);
                }}
            />

            <VoucherModal
                isOpen={isVoucherModalOpen}
                onClose={() => setIsVoucherModalOpen(false)}
                booking={selectedBooking}
            />
        </div>
    );
}
