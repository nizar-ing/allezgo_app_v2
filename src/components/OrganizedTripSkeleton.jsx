function OrganizedTripSkeleton() {
    return (
        <section className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 animate-pulse">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12">
                {/* Hero image */}
                <div className="h-[260px] sm:h-[340px] md:h-[420px] rounded-3xl bg-gray-200 mb-8 sm:mb-10" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* About card */}
                        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-gray-100 shadow space-y-3">
                            <div className="h-6 w-48 bg-gray-200 rounded" />
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-100 rounded w-full" />
                                <div className="h-4 bg-gray-100 rounded w-5/6" />
                                <div className="h-4 bg-gray-100 rounded w-4/5" />
                            </div>
                        </div>
                        {/* Highlights card */}
                        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-gray-100 shadow space-y-3">
                            <div className="h-6 w-40 bg-gray-200 rounded" />
                            <div className="grid grid-cols-2 gap-3">
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className="h-14 bg-green-50 rounded-xl border border-green-100" />
                                ))}
                            </div>
                        </div>
                        {/* Itinerary card */}
                        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-gray-100 shadow space-y-3">
                            <div className="h-6 w-48 bg-gray-200 rounded" />
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
                            ))}
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-blue-100 shadow-xl space-y-4">
                            <div className="h-7 w-40 bg-gray-200 rounded" />
                            {/* Price rows */}
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="h-16 bg-blue-50 rounded-2xl" />
                            ))}
                            {/* Dates */}
                            <div className="space-y-2 pt-2">
                                <div className="h-4 w-32 bg-gray-200 rounded" />
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="h-10 bg-gray-100 rounded-xl" />
                                ))}
                            </div>
                            {/* Button */}
                            <div className="h-12 bg-gray-200 rounded-xl" />
                        </div>
                    </div>
                </div>
            </main>
        </section>
    );
}

export default OrganizedTripSkeleton;
