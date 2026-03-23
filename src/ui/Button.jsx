// src/ui/Button.jsx
import { useState } from 'react';

const Button = ({
                    children,
                    variant = 'primary',
                    size = 'md',
                    disabled = false,
                    loading = false,
                    onClick,
                    className = '',
                    ...props
                }) => {
    const [isPressed, setIsPressed] = useState(false);

    const baseClasses = 'font-semibold transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden';

    const variantClasses = {
        primary: 'rounded-lg bg-gradient-to-r from-sky-500 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-lg hover:shadow-xl focus:ring-blue-300 cursor-pointer',
        pill: 'rounded-full bg-gradient-to-r from-sky-500 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-lg hover:shadow-xl focus:ring-blue-300 cursor-pointer',
        secondary: 'rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-xl focus:ring-emerald-300 cursor-pointer',
        success: 'rounded-lg bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl focus:ring-green-300 cursor-pointer',
        warning: 'rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl focus:ring-yellow-300 cursor-pointer',
        danger: 'rounded-lg bg-gradient-to-r from-red-400 to-rose-600 hover:from-red-500 hover:to-rose-700 text-white shadow-lg hover:shadow-xl focus:ring-red-300 cursor-pointer',
        outline: 'rounded-lg border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white bg-transparent shadow-md hover:shadow-lg focus:ring-orange-300 cursor-pointer',
        ghost: 'rounded-lg text-xl text-white bg-transparent hover:bg-rose-700 shadow-none hover:shadow-md focus:ring-rose-400 cursor-pointer'
    };

    const sizeClasses = {
        sm: 'px-2 py-1 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
        xl: 'px-10 py-5 text-xl'
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);
    const handleMouseLeave = () => setIsPressed(false);

    return (
        <button
            // ✅ Fixed: compare variant prop directly instead of variantClasses[variant]
            className={`${baseClasses} ${variantClasses[variant]} ${variant === 'pill' ? '' : sizeClasses[size]} ${className} ${isPressed ? 'scale-95' : ''}`}
            disabled={disabled || loading}
            onClick={onClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <span className={loading ? 'opacity-0' : 'opacity-100'}>
                {children}
            </span>
        </button>
    );
};

export default Button;