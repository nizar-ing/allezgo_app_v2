
/**
 * Loader Component - Flexible loading indicator
 *
 * @param {Object} props
 * @param {string} props.message - Main loading message
 * @param {string} props.submessage - Optional secondary message
 * @param {boolean} props.fullHeight - Use full screen height (default: true)
 * @param {string} props.size - Spinner size: 'small', 'medium', 'large' (default: 'large')
 * @param {string} props.variant - Style variant: 'default', 'minimal', 'gradient' (default: 'gradient')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showProgress - Show animated progress text (default: false)
 * @param {Array<string>} props.progressSteps - Array of progress messages to cycle through
 */
function Loader({
                    message = "Chargement...",
                    submessage = null,
                    fullHeight = true,
                    size = "large",
                    variant = "gradient",
                    className = "",
                    showProgress = false,
                    progressSteps = []
                }) {
    // Size configurations
    const sizeClasses = {
        small: "h-8 w-8 border-2",
        medium: "h-12 w-12 border-3",
        large: "h-16 w-16 border-4"
    };

    const textSizeClasses = {
        small: "text-sm",
        medium: "text-base",
        large: "text-lg"
    };

    // Variant configurations
    const variantClasses = {
        default: "bg-white",
        minimal: "bg-transparent",
        gradient: "bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100"
    };

    const containerHeight = fullHeight ? "min-h-screen" : "min-h-[300px]";

    return (
        <div className={`${containerHeight} w-full flex items-center justify-center ${variantClasses[variant]} ${className}`}>
            <div className="text-center px-4">
                {/* Spinner */}
                <div className="relative inline-flex items-center justify-center mb-6">
                    {/* Outer spinning ring */}
                    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-sky-200 border-t-sky-600`}></div>

                    {/* Inner pulsing circle */}
                    <div className="absolute">
                        <div className={`rounded-full bg-sky-100 ${
                            size === 'small' ? 'h-4 w-4' :
                                size === 'medium' ? 'h-6 w-6' :
                                    'h-8 w-8'
                        } animate-pulse`}></div>
                    </div>
                </div>

                {/* Main Message */}
                {message && (
                    <p className={`text-gray-700 font-semibold mb-2 ${textSizeClasses[size]}`}>
                        {message}
                    </p>
                )}

                {/* Submessage */}
                {submessage && (
                    <p className={`text-gray-500 ${
                        size === 'small' ? 'text-xs' :
                            size === 'medium' ? 'text-sm' :
                                'text-base'
                    } animate-pulse`}>
                        {submessage}
                    </p>
                )}

                {/* Progress Steps */}
                {showProgress && progressSteps.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {progressSteps.map((step, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-center gap-2 text-sm ${
                                    index === progressSteps.length - 1
                                        ? 'text-sky-600 animate-pulse'
                                        : 'text-gray-400'
                                }`}
                            >
                                {index < progressSteps.length - 1 ? (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <div className="animate-spin h-4 w-4 border-2 border-sky-200 border-t-sky-600 rounded-full"></div>
                                )}
                                <span>{step}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Animated dots */}
                <div className="flex items-center justify-center gap-1 mt-4">
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
}

export default Loader;