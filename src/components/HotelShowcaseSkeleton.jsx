// src/components/HotelShowcaseSkeleton.jsx

function HotelCardShowcaseSkeleton() {
    return (
        <article className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 shadow-md h-full flex flex-col w-full mx-auto">
            {/* Image */}
            <div className="relative h-48 sm:h-52 md:h-60 lg:h-72 bg-gray-200 animate-pulse">
                <div className="absolute top-2 left-2 h-6 w-20 bg-gray-300 rounded-full animate-pulse" />
                <div className="absolute top-2 right-2 h-12 w-24 bg-gray-300 rounded-lg animate-pulse" />
                <div className="absolute bottom-2 left-2 h-7 w-28 bg-gray-300 rounded-lg animate-pulse" />
                <div className="absolute bottom-2 right-2 h-6 w-20 bg-gray-300 rounded-full animate-pulse" />
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-5 lg:p-6 flex flex-col">
                {/* Hotel name */}
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />

                {/* Location */}
                <div className="flex items-start gap-2 mb-3">
                    <div className="w-7 h-7 bg-sky-100 rounded-lg animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>

                {/* Boarding box */}
                <div className="mb-3 h-14 bg-emerald-50 border-2 border-emerald-200 rounded-lg animate-pulse" />

                {/* Facilities */}
                <div className="mb-3">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-8 w-24 bg-gray-100 border-2 border-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>

                {/* Themes — hidden on mobile, matches real HotelCard */}
                <div className="mb-3 hidden sm:block">
                    <div className="h-3 w-14 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-7 w-20 bg-gray-100 border-2 border-gray-200 rounded-full animate-pulse" />
                        ))}
                    </div>
                </div>

                <div className="flex-1 min-h-[8px]" />

                {/* CTA button */}
                <div className="w-full h-11 bg-sky-200 rounded-xl animate-pulse" />
            </div>
        </article>
    );
}

function SectionSkeleton() {
    return (
        <div className="relative">
            {/* Section header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl animate-pulse flex-shrink-0" />
                    <div className="space-y-2">
                        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse self-start sm:self-auto" />
            </div>

            {/* Divider accent */}
            <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-px flex-1 bg-gray-100" />
            </div>

            {/* 3-column card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <HotelCardShowcaseSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

export default function HotelShowcaseSkeleton({ className = "" }) {
    return (
        <section className={`w-full py-8 ${className}`}>
            {/* Header */}
            <div className="max-w-screen-2xl mx-auto text-center mb-16 px-4">
                <div className="inline-flex items-center justify-center h-8 w-44 bg-sky-100 rounded-full animate-pulse mb-5" />

                <div className="h-10 md:h-14 max-w-lg mx-auto bg-gray-200 rounded animate-pulse mb-4" />

                {/* Underline accent */}
                <div className="flex items-center justify-center gap-2 mb-5">
                    <div className="h-px w-16 bg-gray-200" />
                    <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
                    <div className="h-1 w-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
                    <div className="h-px w-16 bg-gray-200" />
                </div>

                <div className="h-4 w-80 max-w-full mx-auto bg-gray-100 rounded animate-pulse" />
            </div>

            {/* 2 section stubs */}
            <div className="max-w-screen-2xl mx-auto space-y-20 px-4 md:px-8 lg:px-12">
                <SectionSkeleton />
                <SectionSkeleton />
            </div>
        </section>
    );
}
