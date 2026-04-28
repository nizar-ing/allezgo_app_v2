import React from 'react';
import { X, Printer, Users, Hotel, Calendar, CreditCard, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/ApiClient';

export default function VoucherModal({ isOpen, onClose, booking }) {
  const { data: fetchedHotel, isLoading: isHotelLoading } = useQuery({
    queryKey: ['hotel', booking?.hotelId],
    queryFn: async () => {
      const response = await apiClient.getHotel(booking.hotelId);
      return response?.data || response;
    },
    enabled: !!booking?.hotelId && isOpen,
    staleTime: 1000 * 60 * 60,
  });

  console.log("FETCHED HOTEL DATA:", fetchedHotel);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  // Extract directly based on booking.entity.ts
  const checkIn = booking.checkIn || "N/A";
  const checkOut = booking.checkOut || "N/A";
  const clientPhone = booking.clientPhone || "Non renseigné";
  const clientPrice = Number(booking.clientPrice) || 0;

  const nights = (checkIn !== "N/A" && checkOut !== "N/A") ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))) : 0;
  const boardBasis = booking?.boardBasis || booking?.BoardBasis || "Demi-pension"; // Placeholder fallback
  const roomType = booking?.roomType || booking?.RoomType || "Chambre Standard"; // Placeholder fallback

  // Format currency
  const formattedPrice = clientPrice > 0
    ? new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(clientPrice)
    : "Montant non spécifié";

  // Failsafe to guarantee we extract a string, even if the API returns a localization object
  const getSafeString = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      // If it's a translation object, grab French or English, otherwise grab whatever name property exists
      return val.fr || val.en || val.name || val.Name || val.CityName || "Détail complexe";
    }
    return String(val);
  };

  // Safely extract the base hotel name
  const extractedName = fetchedHotel?.Name || fetchedHotel?.name || fetchedHotel?.hotelName || fetchedHotel?.data?.Name;
  const baseHotelName = getSafeString(extractedName) || "Hôtel";

  // Safely extract the city name
  const extractedCity = fetchedHotel?.CityName || fetchedHotel?.city || fetchedHotel?.City || fetchedHotel?.location?.city || fetchedHotel?.data?.CityName;
  const cityName = getSafeString(extractedCity) || "";

  // Combine them
  const hotelName = isHotelLoading
    ? "Chargement de l'hôtel..."
    : (fetchedHotel
      ? (cityName ? `${baseHotelName}, ${cityName}` : baseHotelName)
      : (booking?.hotelId ? `Hôtel (ID: ${booking.hotelId})` : "Hôtel non spécifié"));

  // Parse iproPayload for passengers
  let adults = [];
  let children = [];
  try {
    const payloadObj = typeof booking.iproPayload === 'string' ? JSON.parse(booking.iproPayload) : (booking.iproPayload || {});
    adults = payloadObj.Adult || [];
    children = payloadObj.Child || [];
  } catch (e) {
    console.error("Failed to parse iproPayload", e);
  }
  const allPassengers = [...adults, ...children];
  const leadGuest = allPassengers.length > 0 ? `${allPassengers[0].Name} ${allPassengers[0].Surname}` : "Client";

  return (
    <div id="print-mount" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm print:bg-transparent print:backdrop-blur-none p-4">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative print:max-h-none print:shadow-none print:rounded-none print:w-full print:absolute print:inset-0">

        {/* --- NON-PRINTABLE MODAL HEADER --- */}
        <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold text-slate-800">Générateur de Voucher</h2>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-medium shadow-sm">
              <Printer size={18} /> Imprimer Voucher
            </button>
            <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* --- PRINTABLE VOUCHER CONTENT (A4 Optimized) --- */}
        <div className="p-6 md:p-6 print:p-0 bg-white text-slate-800" id="printable-voucher">

          {/* Header: Agency & Title */}
          <div className="flex justify-between items-start border-b-2 border-sky-600 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-black text-sky-800 tracking-tight">ALLEZ<span className="text-orange-500">GO</span></h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Agence de Voyage & Tourisme</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-widest">Voucher</h2>
              <p className="text-sm text-slate-500 mt-1">Réf: <span className="font-bold text-slate-800">#{booking.id?.toString().padStart(6, '0')}</span></p>
              <p className="text-sm text-slate-500">Date d'émission: {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Client & Booking Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 mb-6">
            {/* Client Details */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 flex items-center gap-2"><Users size={16} className="text-sky-600" /> Client Principal</h3>
              <p className="text-lg font-bold text-slate-900">{leadGuest}</p>
              <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" /> {clientPhone}
              </p>
              <p className="text-sm text-slate-600 mt-1">Passagers: <span className="font-bold">{allPassengers.length}</span></p>
            </div>

            {/* Hotel Details */}
            <div className="bg-sky-50 p-5 rounded-xl border border-sky-100">
              <h3 className="text-xs uppercase tracking-wider text-sky-700 font-bold mb-3 flex items-center gap-2"><Hotel size={16} className="text-sky-600" /> Hébergement</h3>
              <p className="text-xl font-bold text-sky-900 leading-tight">{hotelName}</p>
              <p className="text-sm text-sky-700 mt-2 font-medium">Statut: Confirmée</p>
              <p className="text-sm text-sky-700 mt-2 font-medium">
                {nights} Nuit(s) • {roomType} • {boardBasis}
              </p>
            </div>
          </div>

          {/* Payment Details - Full Width */}
          <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 mb-10 flex justify-between items-center print:hidden">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-orange-700 font-bold mb-1 flex items-center gap-2"><CreditCard size={16} className="text-orange-500" /> Règlement</h3>
              <p className="text-sm text-orange-600 font-medium">Montant Total Payé</p>
            </div>
            <p className="text-3xl font-black text-orange-700">{formattedPrice}</p>
          </div>

          {/* Dates Container */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden mb-10">
            <div className="flex-1 p-4 border-r border-slate-200 bg-white flex items-center gap-4">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-lg"><Calendar size={24} /></div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-bold">Check-in (Arrivée)</p>
                <p className="text-lg font-bold text-slate-900">{checkIn}</p>
              </div>
            </div>
            <div className="flex-1 p-4 bg-white flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-orange-500 rounded-lg"><Calendar size={24} /></div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-bold">Check-out (Départ)</p>
                <p className="text-lg font-bold text-slate-900">{checkOut}</p>
              </div>
            </div>
          </div>

          {/* Passengers Table */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Liste des Passagers</h3>
            {adults.length > 0 ? (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-600 uppercase mb-2">Adultes</h4>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-sm uppercase">
                      <th className="p-2 font-semibold rounded-tl-lg">Nom</th>
                      <th className="p-2 font-semibold">Prénom</th>
                      <th className="p-2 font-semibold rounded-tr-lg text-center">Civilité</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800 text-sm">
                    {adults.map((pax, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                        <td className="p-2 font-bold">{pax.Name}</td>
                        <td className="p-2">{pax.Surname}</td>
                        <td className="p-2 text-center text-slate-500">{pax.Civility || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {children.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-600 uppercase mb-2">Enfants</h4>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-sm uppercase">
                      <th className="p-2 font-semibold rounded-tl-lg">Nom</th>
                      <th className="p-2 font-semibold">Prénom</th>
                      <th className="p-2 font-semibold rounded-tr-lg text-center">Âge</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800 text-sm">
                    {children.map((pax, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                        <td className="p-2 font-bold">{pax.Name}</td>
                        <td className="p-2">{pax.Surname}</td>
                        <td className="p-2 text-center text-slate-500">{pax.Age !== undefined ? `${pax.Age} ans` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {allPassengers.length === 0 && (
              <p className="text-slate-500 italic">Aucun détail de passager disponible.</p>
            )}
          </div>

          {/* Footer / Info */}
          <div id="voucher-footer" className="mt-auto pt-6 border-t border-slate-200 text-xs text-slate-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800 text-sm">AllezGo Voyage</p>
                <p>Cité El Moustakbel Ain Beida OEB</p>
                <p>Tel: +213 770 93 25 63 / +213 670 23 02 35 | Email: contact@allezgoo.com</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-sky-600 italic">Bon Séjour !</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CSS to guarantee exactly 1 physical A4 page with an absolute bottom footer */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          /* 1. Remove all browser margins */
          @page { size: A4; margin: 0; }
          
          /* 2. Hide everything in the app */
          body * { visibility: hidden; }
          
          /* 3. Force the body to be exactly 1 physical A4 page tall and wide, no more, no less */
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          /* 4. Show the voucher */
          #printable-voucher, #printable-voucher * { visibility: visible; }
          
          /* 5. The Voucher becomes a perfect 210x297mm box */
          #printable-voucher {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 15mm !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            display: block !important;
          }

          /* 6. Lock the footer exactly 30mm from the bottom of the A4 page to avoid printer cutoff */
          #voucher-footer {
            position: absolute !important;
            bottom: 30mm !important;
            left: 15mm !important;
            right: 15mm !important;
            margin: 0 !important;
          }

          /* Force background colors to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}