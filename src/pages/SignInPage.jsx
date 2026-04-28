// src/pages/SignInPage.jsx
import { useState, useActionState } from 'react';
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
import useAuth from '../custom-hooks/useAuth.js';
import './SignInPage.css'; 

function SignInPage() {
    const navigate = useNavigate();
    const { login, register } = useAuth();

    // --- React 19 UI State ---
    const [isLoginView, setIsLoginView] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // --- React 19 Action Handlers ---
    const loginAction = async (previousState, formData) => {
        try {
            const email = formData.get('email');
            const password = formData.get('password');
            
            if (!email || !password) {
                return { success: false, error: "Veuillez remplir tous les champs obligatoires." };
            }

            await login({ email, password });
            
            toast.success('Connexion réussie ! 👋', { duration: 3000 });
            navigate('/'); 
            return { success: true, error: null };
        } catch (err) {
            const errorMsg = err.message || "Échec de la connexion. Veuillez vérifier vos identifiants.";
            toast.error(errorMsg, { duration: 4000 });
            return { success: false, error: errorMsg };
        }
    };

    const registerAction = async (previousState, formData) => {
        try {
            const email = formData.get('email');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            const firstName = formData.get('firstName');
            const lastName = formData.get('lastName');

            if (!email || !password || !firstName || !lastName) {
                return { success: false, error: "Veuillez remplir tous les champs obligatoires." };
            }

            if (password !== confirmPassword) {
                return { success: false, error: "Les mots de passe ne correspondent pas." };
            }
            
            await register({ email, password, firstName, lastName });
            
            toast.success('Compte créé avec succès ! 🎉 Vous pouvez maintenant vous connecter.', { duration: 5000 });
            setIsLoginView(true); // Switch back to login view naturally
            return { success: true, error: null };
        } catch (err) {
            const errorMsg = err.message || "Erreur lors de la création du compte.";
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    // --- React 19 State Binding ---
    const [loginState, submitLogin, isLoginPending] = useActionState(loginAction, { success: false, error: null });
    const [registerState, submitRegister, isRegisterPending] = useActionState(registerAction, { success: false, error: null });

    const activeState = isLoginView ? loginState : registerState;
    const isPending = isLoginView ? isLoginPending : isRegisterPending;

    const toggleMode = () => {
        setIsLoginView(!isLoginView);
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleSocialLogin = (provider) => {
        toast.success(`Connexion avec ${provider} en cours...`);
    };

    return (
        <div className="signin-page-container">
            {/* Animated Background Elements */}
            <div className="signin-bg-container">
                <div className="signin-blob signin-blob-1"></div>
                <div className="signin-blob signin-blob-2"></div>
                <div className="signin-blob signin-blob-3"></div>
                <div className="signin-particle signin-particle-1"></div>
                <div className="signin-particle signin-particle-2"></div>
                <div className="signin-particle signin-particle-3"></div>
            </div>

            {/* Main Card */}
            <div className="signin-card-wrapper">
                <div className="signin-card">
                    {/* Header Section */}
                    <div className="signin-header h-72">
                        <div className="signin-header-content">
                            <div className="signin-lock-wrapper">
                                <div className="signin-lock-container">
                                    <div className="signin-lock-glow"></div>
                                    <svg className="signin-lock-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                                        <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                                        <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
                                        <rect x="11.5" y="16" width="1" height="2.5" rx="0.5" fill="currentColor"/>
                                    </svg>
                                </div>
                            </div>
                            <h1 className="signin-title">
                                {!isLoginView ? 'Créer un compte' : 'Connexion sécurisée'}
                            </h1>
                            <p className="signin-subtitle">
                                {!isLoginView
                                    ? 'Rejoignez notre communauté en toute sécurité'
                                    : 'Accédez à votre espace personnel'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="signin-form-container">
                        <form action={isLoginView ? submitLogin : submitRegister} className="signin-form">
                            
                            {/* React 19 Native Error Banner */}
                            {activeState?.error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm font-medium">
                                    <MdError size={20} className="shrink-0" />
                                    <span>{activeState.error}</span>
                                </div>
                            )}

                            {/* Additional Fields - Only for Sign Up */}
                            {!isLoginView && (
                                <div className="flex gap-4 mb-4">
                                    <div className="signin-form-group flex-1 !mb-0">
                                        <label className="signin-label">
                                            <RiUserFill className="signin-label-icon" size={18} />
                                            Prénom
                                        </label>
                                        <div className="signin-input-wrapper">
                                            <input type="text" name="firstName" className="signin-input" placeholder="Prénom" required />
                                        </div>
                                    </div>
                                    <div className="signin-form-group flex-1 !mb-0">
                                        <label className="signin-label">
                                            <RiUserFill className="signin-label-icon" size={18} />
                                            Nom
                                        </label>
                                        <div className="signin-input-wrapper">
                                            <input type="text" name="lastName" className="signin-input" placeholder="Nom" required />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Email Input */}
                            <div className="signin-form-group">
                                <label className="signin-label">
                                    <MdEmail className="signin-label-icon" size={18} />
                                    Adresse email
                                </label>
                                <div className="signin-input-wrapper">
                                    <div className="signin-input-icon-container">
                                        <div className="signin-input-icon-bg">
                                            <MdEmail className="signin-input-icon" />
                                        </div>
                                    </div>
                                    <input type="email" name="email" className="signin-input" placeholder="exemple@email.com" required />
                                </div>
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
                                            <FaLock className="signin-input-icon" />
                                        </div>
                                    </div>
                                    <input type={showPassword ? "text" : "password"} name="password" className="signin-input" placeholder="••••••••" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="signin-toggle-password">
                                        {showPassword ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Input - Only for Sign Up */}
                            {!isLoginView && (
                                <div className="signin-form-group signin-slide-down">
                                    <label className="signin-label">
                                        <HiLockClosed className="signin-label-icon" size={18} />
                                        Confirmer le mot de passe
                                    </label>
                                    <div className="signin-input-wrapper">
                                        <div className="signin-input-icon-container">
                                            <div className="signin-input-icon-bg">
                                                <FaLock className="signin-input-icon" />
                                            </div>
                                        </div>
                                        <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" className="signin-input" placeholder="••••••••" required />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="signin-toggle-password">
                                            {showConfirmPassword ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Forgot Password - Only for Sign In */}
                            {isLoginView && (
                                <div className="signin-forgot-password">
                                    <button type="button" className="signin-forgot-link">
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
                                disabled={isPending} 
                                className={`signin-submit-btn bg-gradient-to-r from-red-500 via-red-600 to-red-700 ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <div className="signin-btn-shimmer"></div>
                                {isPending ? (
                                    <>
                                        <div className="signin-spinner"></div>
                                        <span className="signin-loading-text">Chargement...</span>
                                    </>
                                ) : (
                                    <>
                                        {!isLoginView ? (
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
                            <button type="button" onClick={() => handleSocialLogin('Google')} className="signin-social-btn signin-social-google">
                                <FaGoogle className="signin-social-icon" />
                            </button>
                            <button type="button" onClick={() => handleSocialLogin('Facebook')} className="signin-social-btn signin-social-facebook">
                                <FaFacebook className="signin-social-icon" />
                            </button>
                            <button type="button" onClick={() => handleSocialLogin('Twitter')} className="signin-social-btn signin-social-twitter">
                                <FaTwitter className="signin-social-icon" />
                            </button>
                        </div>

                        {/* Toggle Sign In/Sign Up */}
                        <div className="signin-toggle">
                            <p className="signin-toggle-text">
                                {!isLoginView ? 'Vous avez déjà un compte ?' : "Vous n'avez pas de compte ?"}
                                {' '}
                                <button type="button" onClick={toggleMode} className="signin-toggle-btn">
                                    <span>{!isLoginView ? 'Se connecter' : "S'inscrire"}</span>
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