import { Component } from 'react';
import { AlertCircle } from 'lucide-react';

class VisaErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Visa component error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-slate-300 via-sky-800 to-slate-300">
                    <div className="text-center p-8 bg-white rounded-xl shadow-2xl max-w-md">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Erreur de chargement
                        </h2>
                        <p className="text-slate-600 mb-4">
                            Une erreur est survenue lors du chargement des informations de visa.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-sky-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                            Recharger la page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
