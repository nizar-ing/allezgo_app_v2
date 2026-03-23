// src/data/visaData.js
// Fixes: all prices normalized to numbers (no formatted strings),
//        requirements alias added for requirementsByDemande entries.

export const E_VisaData = [
    {
        country: "Armenia",
        flagUrl: "/images/flags/flag-armenia.jpg",
        durationMode: {
            duration: ["21 Jours", "120 Jours"],
            price: [8500, 18500],
        },
        processingTime: "6-11 jours ouvrables",
        description:
            "E-Visa ARMENIA 21 Jours - 8.500,00 DZD / 1 Personne. Dossier: Scan passeport, scan photo (fichier source), billet TLX.",
        requirements: ["Scan passeport", "Scan photo (fichier source)", "Billet TLX"],
        constraints:
            "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N'EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ.",
    },
    {
        country: "Azerbaijan",
        flagUrl: "/images/flags/flag-azerbaijan.jpg",
        price: 14000,
        duration: "30 jours",
        processingTime: "5-8 jours",
        description:
            "Visa Azerbaïdjan 30 jrs - 14.000,00 DZD / 1 Personne. Dossier à fournir: Scan passeport, date exacte du départ.",
        requirements: ["Scan passeport", "Date exacte du départ"],
        constraints:
            "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N'EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ.",
    },
    {
        country: "China",
        flagUrl: "/images/flags/drapeau-de-la-chine.jpg",
        durationMode: {
            duration: ["30 jours"],
            demandeOccurrence: ["Première Demande", "Renouvelement"],
            price: [15000, 12000],
        },
        processingTime: "environ 10 jours ouvrables",
        description: [
            "Visa Chine Sticker 30 jours 1ere demande - 15.000 DZD. Documents: Scan passeport, 1 photo Full HD, numéro de téléphone, attestation de travail ou RC, relevé bancaire récent (minimum 3.000€), casier judiciaire récent.",
            "Visa Chine Sticker 30 jours renouvellement - 12.000 DZD. Documents: Scan passeport, 1 photo Full HD, numéro de téléphone, attestation de travail ou RC, copie du visa avec cachets, casier judiciaire récent.",
        ],
        // Alias so validateVisaData passes — detailed requirements are in requirementsByDemande
        requirements: ["Scan passeport", "1 photo Full HD", "Numéro de téléphone", "Attestation de travail ou RC"],
        requirementsByDemande: {
            "Première Demande": [
                "Scan passeport",
                "1 photo Full HD",
                "Numéro de téléphone",
                "Attestation de travail ou RC",
                "Relevé bancaire récent (minimum 3.000€)",
                "Casier judiciaire",
            ],
            "Renouvelement": [
                "Scan passeport",
                "1 photo Full HD",
                "Numéro de téléphone",
                "Attestation de travail ou RC",
                "Copie du visa avec cachet d'entrée et de sortie",
            ],
        },
        constraints:
            "Le demandeur doit être présent le jour du dépôt. L'agence n'assume aucune responsabilité si le client achète son billet avant l'obtention du visa. À partir du 1er août 2025, uniquement cartes bancaires algériennes via TPE. Merci d'envoyer le dossier au moins un mois avant la date de départ.",
    },
    {
        country: "Egypt",
        flagUrl: "/images/flags/drapeau-de-l-egypte.jpg",
        price: 2500,
        duration: "30 jours",
        processingTime: "24H à 48H",
        description:
            "Lettre de garantie Egypte - 2.500,00 DZD / 1 Personne. Dossier: Scan passeport, scan billet pour le Caire ou Charm el cheikh.",
        requirements: ["Scan passeport", "Scan billet pour le Caire ou Charm el cheikh"],
        constraints: "N/A",
    },
    {
        country: "Indonesia",
        flagUrl: "/images/flags/drapeau-de-l-indonesie.jpg",
        price: 29000,
        duration: "60 jours",
        processingTime: "8-10 jours ouvrables",
        description:
            "E-Visa Indonésie 60 jours - 29.000,00 DZD / 1 Personne. Dossier: Scan passeport, fichier source d'une photo.",
        requirements: ["Scan passeport", "Fichier source d'une photo (à demander au photographe)"],
        constraints:
            "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h.",
    },
    {
        country: "Lebanon",
        flagUrl: "/images/flags/flag-lebanon.jpg",
        price: 21000,
        duration: "30 jours",
        processingTime: "9 jours ouvrables",
        description:
            "Visa Liban Sticker 30 jours - 21.000,00 DZD / 1 Personne. Le dossier doit être envoyé à l'agence Bright Sky Tour AIN BEIDA.",
        requirements: [
            "Passeport",
            "2 photo 5*5",
            "Acte de naissance",
            "Attestation de travail ou REG.C",
            "Relevé de compte bancaire min 1500 euro",
        ],
        constraints:
            "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES.",
    },
    {
        country: "Oman",
        flagUrl: "/images/flags/drapeau-d-oman.jpg",
        durationMode: {
            duration: ["30 Jours", "10 Jours", "30 Jours Prolongation"],
            price: [22000, 14500, 35000],
        },
        processingTime: "4-8 jours ouvrables",
        description: [
            "E-Visa Oman 30 jours - 22.000,00 DZD / 1 Personne. Le client aura 8 jours seulement pour partir à OMAN.",
            "E-Visa Oman 10 jours - 14.500,00 DZD / 1 Personne. Le client aura 8 jours seulement pour partir à OMAN.",
            "E-Visa Oman 30 jours Prolongation - 35.000,00 DZD / 1 Personne.",
        ],
        // Alias for validateVisaData — detailed requirements are in requirementsByDemande
        requirements: ["Scan passeport", "Scan photo (fichier source)"],
        requirementsByDemande: {
            "30 Jours":            ["Scan passeport", "Scan photo (fichier source)"],
            "10 Jours":            ["Scan passeport", "Scan photo (fichier source)"],
            "30 Jours Prolongation": ["Scan passeport", "Scan photo (fichier source)", "Scan visa"],
        },
        constraints:
            "Les refus des visas sont NON REMBOURSABLES. Le client aura 8 jours seulement pour partir à OMAN à compter de la date d'effet du visa.",
    },
    {
        country: "Qatar",
        flagUrl: "/images/flags/drapeau-du-qatar.jpg",
        price: 9500,
        duration: "30 jours",
        processingTime: "3-6 jours ouvrables",
        description:
            "E-Visa Qatar 30 jours touristique - 9.500,00 DZD / 1 Personne. Visa sans assurance (l'assurance est souvent demandée à l'aéroport).",
        requirements: ["Scan passeport", "Fichier source photo", "Adresse mail avec mot de passe"],
        constraints:
            "Merci de ne pas ouvrir les emails pendant la durée du traitement. Les refus des visas sont NON REMBOURSABLES.",
    },
    {
        country: "Tanzania",
        flagUrl: "/images/flags/flag-tanzania.jpg",
        price: 20000,
        duration: "30 jours",
        processingTime: "7 jours ouvrables",
        description:
            "E-Visa Tanzanie (Zanzibar) 30 jours - 20.000,00 DZD / 1 Personne.",
        requirements: ["Scan passeport", "Scan photo (fichier source)", "Billet non confirmé"],
        constraints:
            "Les refus des visas sont NON REMBOURSABLES. La demande doit être envoyée avant 15h.",
    },
    {
        country: "Thailand",
        flagUrl: "/images/flags/drapeau-de-la-thailande.jpg",
        price: 19000,
        duration: "60 jours",
        processingTime: "30 jours ouvrables",
        description:
            "E-Visa Thailande 60 jours - 19.000,00 DZD / 1 Personne.",
        requirements: [
            "Scan passeport (JPEG)",
            "Photo fond blanc (fichier source)",
            "Attestation de travail ou RC",
            "Résidence moins de 2 mois (FR + AR)",
            "Relevé de compte 1000 EUR",
        ],
        constraints:
            "Les fichiers CAM SCAN ne sont pas acceptés. Le délai officiel au consulat est un mois — toute demande pour un départ date proche risque d'être refusée.",
    },
    {
        country: "Turkey",
        flagUrl: "/images/flags/drapeau-de-la-turquie.jpg",
        price: 22000,
        duration: "B1",
        processingTime: "3 jours ouvrables",
        description:
            "E-Visa Turquie B1 - 22.000,00 DZD / 1 Personne. Dossier: Scan passeport, visa ou permis de séjour Schengen/UK/USA.",
        requirements: ["Scan passeport", "Visa ou permis de séjour Schengen/UK/USA"],
        constraints:
            "Visa disponible pour les personnes âgées de plus de 35 ans. Les refus des visas sont NON REMBOURSABLES.",
    },
    {
        country: "Vietnam",
        flagUrl: "/images/flags/flag-vietnam.jpg",
        price: 19500,
        duration: "30 jours",
        processingTime: "6-11 jours ouvrables",
        description:
            "E-Visa Vietnam 30 jours - 19.500,00 DZD / 1 Personne. En cas de fermeture du consulat, le délai sera automatiquement allongé.",
        requirements: ["Scan passeport", "Scan photo (fichier source)", "Billet d'avion"],
        constraints:
            "Les refus des visas sont NON REMBOURSABLES. Le client doit respecter le délai de son visa pour éviter les problèmes.",
    },
];
