import React from 'react';
import { X, Printer, MapPin, Calendar, Users, Hotel } from 'lucide-react';

export default function VoucherModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  // Safe Data Extraction
  const hotelName = booking.hotelName || "Hôtel non spécifié";
  const checkIn = booking.checkIn || "N/A";
  const checkOut = booking.checkOut || "N/A";
  
  // Parse iproPayload if it exists
  let adults = [];
  let children = [];
  try {
    const payload = typeof booking.iproPayload === 'string' ? JSON.parse(booking.iproPayload) : booking.iproPayload;
    if (payload) {
      adults = payload.Adult || [];
      children = payload.Child || [];
    }
  } catch (e) {
    console.error("Failed to parse iproPayload for voucher", e);
  }
  const allPassengers = [...adults, ...children];
  const leadGuest = allPassengers.length > 0 ? `${allPassengers[0].Name} ${allPassengers[0].Surname}` : "Client";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:bg-transparent print:backdrop-blur-none p-4">
      {/* Modal Container: Scrollable on screen, full block on print */}
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative print:max-h-none print:shadow-none print:rounded-none print:w-full print:absolute print:inset-0">
        
        {/* --- NON-PRINTABLE MODAL HEADER --- */}
        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold text-gray-800">Générateur de Voucher</h2>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium shadow-sm">
              <Printer size={18} /> Imprimer Voucher
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* --- PRINTABLE VOUCHER CONTENT (A4 Optimized) --- */}
        <div className="p-8 md:p-12 print:p-0 bg-white text-gray-800" id="printable-voucher">
          
          {/* Header: Agency & Title */}
          <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-6 mb-8">
            <div>
              <h1 className="text-4xl font-black text-emerald-700 tracking-tight">ALLEZ<span className="text-sky-600">GO</span></h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Agence de Voyage & Tourisme</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-widest">Voucher</h2>
              <p className="text-gray-500 mt-1">Réf: <span className="font-bold text-gray-800">#{booking.id?.toString().padStart(6, '0')}</span></p>
              <p className="text-sm text-gray-500">Date d'émission: {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Client & Booking Summary Grid */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3 flex items-center gap-2"><Users size={16}/> Détails du Client</h3>
              <p className="text-lg font-bold text-gray-900">{leadGuest}</p>
              <p className="text-sm text-gray-600 mt-1">Contact: {booking.clientPhone || "Non renseigné"}</p>
              <p className="text-sm text-gray-600">Total passagers: <span className="font-bold">{allPassengers.length}</span></p>
            </div>
            
            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
              <h3 className="text-xs uppercase tracking-wider text-emerald-700 font-bold mb-3 flex items-center gap-2"><Hotel size={16}/> L'Hébergement</h3>
              <p className="text-xl font-bold text-emerald-900">{hotelName}</p>
              <p className="text-sm text-emerald-700 mt-1 font-medium">Statut de la réservation: Payée & Confirmée</p>
            </div>
          </div>

          {/* Dates Container */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-10">
            <div className="flex-1 p-4 border-r border-gray-200 bg-white flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={24} /></div>
              <div>
                <p className="text-xs uppercase text-gray-500 font-bold">Check-in (Arrivée)</p>
                <p className="text-lg font-bold text-gray-900">{checkIn}</p>
              </div>
            </div>
            <div className="flex-1 p-4 bg-white flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Calendar size={24} /></div>
              <div>
                <p className="text-xs uppercase text-gray-500 font-bold">Check-out (Départ)</p>
                <p className="text-lg font-bold text-gray-900">{checkOut}</p>
              </div>
            </div>
          </div>

          {/* Passengers Table */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Liste des Passagers</h3>
            {allPassengers.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                    <th className="p-3 font-semibold rounded-tl-lg">Nom</th>
                    <th className="p-3 font-semibold">Prénom</th>
                    <th className="p-3 font-semibold">Civilité</th>
                    <th className="p-3 font-semibold rounded-tr-lg text-center">Type</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {allPassengers.map((pax, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="p-3 font-medium">{pax.Name}</td>
                      <td className="p-3">{pax.Surname}</td>
                      <td className="p-3">{pax.Civility}</td>
                      <td className="p-3 text-center">
                        {pax.Age !== undefined && pax.Age < 12 ? (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">Enfant</span>
                        ) : (
                          <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded font-bold">Adulte</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 italic">Aucun détail de passager disponible.</p>
            )}
          </div>

          {/* Footer / Info */}
          <div className="mt-16 pt-6 border-t border-gray-200 flex justify-between items-end text-sm text-gray-500">
            <div>
              <p className="font-bold text-gray-700">AllezGo Voyage</p>
              <p>Adresse de l'agence</p>
              <p>contact@allezgoo.com | +213 XX XX XX XX</p>
            </div>
            <div className="text-right">
              <p className="italic">Bon séjour !</p>
            </div>
          </div>

        </div>
      </div>
      
      {/* CSS to ensure perfect printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-voucher, #printable-voucher * { visibility: visible; }
          #printable-voucher { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
          @page { size: A4; margin: 1cm; }
        }
      `}} />
    </div>
  );
}