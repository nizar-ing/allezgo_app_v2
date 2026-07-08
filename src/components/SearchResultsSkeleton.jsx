// src/components/SearchResultsSkeleton.jsx

function SidebarSkeleton() {
    const filterSection = (rows = 4) => (
        <div className="space-y-3">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-gray-200 animate-pulse flex-shrink-0" />
                    <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
                    <div className="w-6 h-4 bg-gray-100 rounded animate-pulse flex-shrink-0" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 animate-pulse flex-shrink-0" />
                <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="space-y-5">
                {/* Tarifs et disponibilités */}
                {filterSection(4)}
                <div className="border-t border-gray-200" />

                {/* Arrangements */}
                {filterSection(6)}
                <div className="border-t border-gray-200" />

                {/* Catégorie — star rows */}
                <div className="space-y-3">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-gray-200 animate-pulse flex-shrink-0" />
                            <div className="flex gap-1">
                                {Array.from({ length: 6 - i }).map((_, j) => (
                                    <div key={j} className="w-3.5 h-3.5 rounded-sm bg-amber-200 animate-pulse" />
                                ))}
                            </div>
                            <div className="w-6 h-4 bg-gray-100 rounded animate-pulse flex-shrink-0 ml-auto" />
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-200" />

                {/* Budget */}
                <div className="space-y-3">
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="flex gap-3">
                        <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                    <div className="flex justify-between">
                        <div className="h-7 w-16 bg-gray-100 rounded-full animate-pulse" />
                        <div className="h-7 w-20 bg-amber-100 rounded-full animate-pulse" />
                    </div>
                </div>
                <div className="border-t border-gray-200" />

                {/* Type de chambres */}
                {filterSection(5)}
                <div className="border-t border-gray-200" />

                {/* Services */}
                {filterSection(5)}

                {/* Apply button */}
                <div className="w-full h-11 bg-sky-200 rounded-xl animate-pulse mt-2" />
            </div>
        </div>
    );
}

function BookingHotelsSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] h-12 bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex-1 min-w-[220px] h-12 bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex-1 min-w-[200px] h-12 bg-gray-200 rounded-xl animate-pulse" />
                <div className="w-36 h-12 bg-sky-200 rounded-xl animate-pulse flex-shrink-0" />
            </div>
        </div>
    );
}

function ResultsBarSkeleton() {
    return (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                {/* Left: count */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-sky-100 rounded-lg flex-shrink-0 w-9 h-9 animate-pulse" />
                    <div className="space-y-1.5">
                        <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
                {/* Center: search input */}
                <div className="flex-1 flex justify-center">
                    <div className="w-full max-w-md min-w-[220px] h-10 bg-gray-200 rounded-xl animate-pulse" />
                </div>
                {/* Right: sort */}
                <div className="w-40 h-10 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
            </div>
        </div>
    );
}

function HotelCardSkeleton() {
    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col sm:flex-row min-h-[220px]">
            {/* Image */}
            <div className="relative sm:w-80 lg:w-[360px] h-60 sm:h-auto bg-gray-200 animate-pulse flex-shrink-0">
                {/* Discount pill top-left */}
                <div className="absolute top-3 left-3 w-12 h-6 bg-gray-300 rounded-full animate-pulse" />
                {/* Heart top-right */}
                <div className="absolute top-3 right-3 w-9 h-9 bg-gray-300 rounded-full animate-pulse" />
                {/* Stars bottom-left */}
                <div className="absolute bottom-3 left-3 flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-3.5 h-3.5 bg-gray-300 rounded-sm animate-pulse" />
                    ))}
                </div>
                {/* Price overlay bottom-right */}
                <div className="absolute bottom-3 right-3 w-28 h-14 bg-gray-300 rounded-2xl animate-pulse" />
            </div>

            {/* Content */}
            <div className="flex-1 p-5 sm:p-6 flex flex-col gap-3">
                {/* Name */}
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                {/* Location */}
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                {/* Availability badge */}
                <div className="h-4 w-1/5 bg-gray-100 rounded-full animate-pulse" />
                {/* Description lines */}
                <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
                {/* Facilities */}
                <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                    ))}
                </div>
                {/* Search params pills */}
                <div className="flex flex-wrap gap-2">
                    <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                    <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                </div>

                <div className="flex-1" />

                {/* Bottom: price + buttons */}
                <div className="flex items-end justify-between gap-3 pt-2 border-t border-gray-100">
                    <div className="space-y-1.5">
                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                        <div className="h-7 w-36 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <div className="h-10 w-36 bg-sky-200 rounded-xl animate-pulse" />
                        <div className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SearchResultsSkeleton() {
    return (
        <div className="flex gap-6 items-start w-full">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
                <SidebarSkeleton />
            </aside>

            {/* Results column */}
            <div className="flex-1 min-w-0 space-y-4">
                <BookingHotelsSkeleton />
                <ResultsBarSkeleton />
                {[1, 2, 3].map((i) => (
                    <HotelCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
