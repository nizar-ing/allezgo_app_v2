function CardSkeleton() {
    return (
        <div className="relative w-full max-w-md mx-auto h-[600px] md:h-[660px] rounded-2xl overflow-hidden bg-white shadow-lg animate-pulse">
            {/* Image area */}
            <div className="h-48 bg-gray-200" />
            <div className="p-5 space-y-4">
                {/* Duration badge */}
                <div className="h-9 bg-gray-100 rounded-xl" />
                {/* Highlights */}
                <div className="space-y-2">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                    <div className="flex gap-2">
                        <div className="h-7 w-28 bg-gray-200 rounded-full" />
                        <div className="h-7 w-24 bg-gray-200 rounded-full" />
                    </div>
                </div>
                {/* Departure dates */}
                <div className="space-y-1.5">
                    <div className="h-3 w-28 bg-gray-200 rounded" />
                    <div className="h-8 bg-gray-100 rounded-lg" />
                    <div className="h-8 bg-gray-100 rounded-lg" />
                </div>
                {/* Pricing */}
                <div className="border-t-2 border-gray-100 pt-3 space-y-2">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                    <div className="h-8 bg-gray-100 rounded-lg" />
                    <div className="h-8 bg-gray-100 rounded-lg" />
                    <div className="h-16 bg-gray-200 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

function OrganizedTripsSkeleton() {
    return (
        <section className="relative w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="h-10 w-80 bg-gray-200 rounded-xl mx-auto animate-pulse" />
                </div>
                {/* Search bar skeleton */}
                <div className="flex flex-col sm:flex-row gap-3 mb-10 max-w-2xl mx-auto">
                    <div className="h-11 flex-1 bg-gray-200 rounded-xl animate-pulse" />
                    <div className="h-11 w-40 bg-gray-200 rounded-xl animate-pulse" />
                </div>
                {/* Card grid */}
                <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                        {[0, 1, 2].map((i) => (
                            <CardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default OrganizedTripsSkeleton;
