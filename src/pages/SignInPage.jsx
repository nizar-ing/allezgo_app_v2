import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdEmail,
    MdVisibility,
    MdVisibilityOff,
    MdCheckCircle,
    MdError
} from 'react-icons/md';
import {
    FaGoogle,
    FaFacebook,
    FaTwitter,
    FaLock
} from 'react-icons/fa';
import { HiLockClosed } from 'react-icons/hi';
import { RiUserFill } from 'react-icons/ri';
import toast from 'react-hot-toast';
import './SignInPage.css'; // Import the CSS file

function SignInPage() {
    const navigate = useNavigate();

    // State management
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Form validation errors
    const [errors, setErrors] = useState({});

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = "L'email est requis";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Email invalide";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Le mot de passe est requis";
        } else if (formData.password.length < 6) {
            newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
        }

        // Confirm password validation (only for sign up)
        if (isSignUp) {
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Veuillez corriger les erreurs');
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (isSignUp) {
                toast.success('Compte créé avec succès ! 🎉');
                // Here you would call your signup API
                // await apiClient.signUp(formData);
            } else {
                toast.success('Connexion réussie ! 👋');
                // Here you would call your login API
                // await apiClient.login(formData);
            }

            // Navigate to home or dashboard
            setTimeout(() => {
                navigate('/');
            }, 1000);

        } catch (error) {
            toast.error(isSignUp ? 'Erreur lors de la création du compte' : 'Erreur de connexion');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle between sign in and sign up
    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setFormData({
            email: '',
            password: '',
            confirmPassword: ''
        });
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    // Social login handler
    const handleSocialLogin = (provider) => {
        toast.success(`Connexion avec ${provider} en cours...`);
        // Implement social login logic here
    };

    return (
        <div className="signin-page-container">
            {/* Animated Background Elements */}
            <div className="signin-bg-container">
                <div className="signin-blob signin-blob-1"></div>
                <div className="signin-blob signin-blob-2"></div>
                <div className="signin-blob signin-blob-3"></div>

                {/* Floating particles */}
                <div className="signin-particle signin-particle-1"></div>
                <div className="signin-particle signin-particle-2"></div>
                <div className="signin-particle signin-particle-3"></div>
            </div>

            {/* Main Card */}
            <div className="signin-card-wrapper">
                <div className="signin-card">
                    {/* Header Section - Premium Lock Design */}
                    <div className="signin-header h-72">
                        <div className="signin-header-content">
                            {/* Big Modern Lock Icon */}
                            <div className="signin-lock-wrapper">
                                <div className="signin-lock-container">
                                    <div className="signin-lock-glow"></div>
                                    <svg
                                        className="signin-lock-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        {/* Lock body */}
                                        <rect
                                            x="5"
                                            y="11"
                                            width="14"
                                            height="10"
                                            rx="2"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            fill="none"
                                        />
                                        {/* Lock shackle */}
                                        <path
                                            d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            fill="none"
                                        />
                                        {/* Keyhole */}
                                        <circle
                                            cx="12"
                                            cy="15"
                                            r="1.5"
                                            fill="currentColor"
                                        />
                                        <rect
                                            x="11.5"
                                            y="16"
                                            width="1"
                                            height="2.5"
                                            rx="0.5"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Title and subtitle */}
                            <h1 className="signin-title">
                                {isSignUp ? 'Créer un compte' : 'Connexion sécurisée'}
                            </h1>
                            <p className="signin-subtitle">
                                {isSignUp
                                    ? 'Rejoignez notre communauté en toute sécurité'
                                    : 'Accédez à votre espace personnel'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="signin-form-container">
                        <form onSubmit={handleSubmit} className="signin-form">
                            {/* Email Input */}
                            <div className="signin-form-group">
                                <label className="signin-label">
                                    <RiUserFill className="signin-label-icon" size={18} />
                                    Adresse email
                                </label>
                                <div className="signin-input-wrapper">
                                    <div className="signin-input-icon-container">
                                        <div className="signin-input-icon-bg">
                                            <MdEmail className={`signin-input-icon ${errors.email ? 'error' : ''}`} />
                                        </div>
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`signin-input ${errors.email ? 'error' : ''}`}
                                        placeholder="exemple@email.com"
                                    />
                                    {errors.email && (
                                        <div className="signin-input-error-icon">
                                            <MdError className="signin-error-icon-pulse" />
                                        </div>
                                    )}
                                    {!errors.email && formData.email && (
                                        <div className="signin-input-success-icon">
                                            <MdCheckCircle className="signin-success-icon" />
                                        </div>
                                    )}
                                </div>
                                {errors.email && (
                                    <p className="signin-error-message">
                                        <MdError size={16} />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div className="signin-form-group">
                                <label className="signin-label">
                                    <HiLockClosed className="signin-label-icon" size={18} />
                                    Mot de passe
                                </label>
                                <div className="signin-input-wrapper">
                                    <div className="signin-input-icon-container">
                                        <div className="signin-input-icon-bg">
                                            <FaLock className={`signin-input-icon ${errors.password ? 'error' : ''}`} />
                                        </div>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`signin-input ${errors.password ? 'error' : ''}`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="signin-toggle-password"
                                    >
                                        {showPassword ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="signin-error-message">
                                        <MdError size={16} />
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password Input - Only for Sign Up */}
                            <div className={`signin-confirm-password ${isSignUp ? 'visible' : ''}`}>
                                {isSignUp && (
                                    <div className="signin-form-group signin-slide-down">
                                        <label className="signin-label">
                                            <HiLockClosed className="signin-label-icon" size={18} />
                                            Confirmer votre mot de passe
                                        </label>
                                        <div className="signin-input-wrapper">
                                            <div className="signin-input-icon-container">
                                                <div className="signin-input-icon-bg">
                                                    <FaLock className={`signin-input-icon ${errors.confirmPassword ? 'error' : ''}`} />
                                                </div>
                                            </div>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className={`signin-input ${errors.confirmPassword ? 'error' : ''}`}
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="signin-toggle-password"
                                            >
                                                {showConfirmPassword ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="signin-error-message">
                                                <MdError size={16} />
                                                {errors.confirmPassword}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Forgot Password - Only for Sign In */}
                            {!isSignUp && (
                                <div className="signin-forgot-password">
                                    <button
                                        type="button"
                                        className="signin-forgot-link"
                                    >
                                        <span>Mot de passe oublié ?</span>
                                        <svg className="signin-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="signin-submit-btn bg-gradient-to-r from-red-500 via-red-600 to-red-700"
                            >
                                <div className="signin-btn-shimmer"></div>
                                {isLoading ? (
                                    <>
                                        <div className="signin-spinner"></div>
                                        <span className="signin-loading-text">Chargement...</span>
                                    </>
                                ) : (
                                    <>
                                        {isSignUp ? (
                                            <>
                                                <MdCheckCircle size={22} className="signin-btn-icon" />
                                                <span>Créer mon compte</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Se connecter</span>
                                                <svg className="signin-btn-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </>
                                        )}
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="signin-divider">
                            <div className="signin-divider-line"></div>
                            <span className="signin-divider-text">Ou continuer avec</span>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="signin-social-buttons">
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('Google')}
                                className="signin-social-btn signin-social-google"
                            >
                                <FaGoogle className="signin-social-icon" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('Facebook')}
                                className="signin-social-btn signin-social-facebook"
                            >
                                <FaFacebook className="signin-social-icon" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('Twitter')}
                                className="signin-social-btn signin-social-twitter"
                            >
                                <FaTwitter className="signin-social-icon" />
                            </button>
                        </div>

                        {/* Toggle Sign In/Sign Up */}
                        <div className="signin-toggle">
                            <p className="signin-toggle-text">
                                {isSignUp ? 'Vous avez déjà un compte ?' : "Vous n'avez pas de compte ?"}
                                {' '}
                                <button
                                    type="button"
                                    onClick={toggleMode}
                                    className="signin-toggle-btn"
                                >
                                    <span>{isSignUp ? 'Se connecter' : "S'inscrire"}</span>
                                    <svg className="signin-toggle-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignInPage;
