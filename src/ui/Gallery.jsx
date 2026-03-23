// src/ui/Gallery.jsx
import React from 'react';

function Gallery() {
    // PERFECT LAYOUT: Every grid cell filled, no white space
    const imageLayouts = [
        // Row 1 (spans 1-2): 4+3+3+2 = 12 columns
        { id: 1, colSpan: 'col-span-4', rowSpan: 'row-span-3' },  // Big
        { id: 2, colSpan: 'col-span-3', rowSpan: 'row-span-2' },  // Big
        { id: 3, colSpan: 'col-span-3', rowSpan: 'row-span-2' },  // Big
        { id: 4, colSpan: 'col-span-2', rowSpan: 'row-span-2' },  // Medium

        // Row 3: 4+3+3+2 = 12 columns (continues from above)
        { id: 5, colSpan: 'col-span-3', rowSpan: 'row-span-2' },  // Medium
        { id: 6, colSpan: 'col-span-3', rowSpan: 'row-span-2' },  // Medium
        { id: 7, colSpan: 'col-span-2', rowSpan: 'row-span-2' },  // Medium

        // Row 4: Complete (continues + 4 = 12)
        { id: 8, colSpan: 'col-span-4', rowSpan: 'row-span-3' },  // Big

        // Row 5: 4+3+3+2 = 12 columns
        { id: 9,  colSpan: 'col-span-3', rowSpan: 'row-span-2' }, // Medium
        { id: 10, colSpan: 'col-span-3', rowSpan: 'row-span-2' }, // Medium
        { id: 11, colSpan: 'col-span-2', rowSpan: 'row-span-2' }, // Medium

        // Row 6: Complete
        { id: 12, colSpan: 'col-span-4', rowSpan: 'row-span-3' }, // Big

        // Row 7: 4+3+3+2 = 12 columns
        { id: 13, colSpan: 'col-span-3', rowSpan: 'row-span-2' }, // Medium
        { id: 14, colSpan: 'col-span-3', rowSpan: 'row-span-2' }, // Medium
        { id: 15, colSpan: 'col-span-2', rowSpan: 'row-span-2' }, // Medium

        // Row 8: Complete
        { id: 16, colSpan: 'col-span-4', rowSpan: 'row-span-2' }, // Big-wide

        // Row 9: 4+2+3+3 = 12 columns
        { id: 17, colSpan: 'col-span-2', rowSpan: 'row-span-2' }, // Medium
        { id: 18, colSpan: 'col-span-2', rowSpan: 'row-span-2' }, // Medium
        { id: 19, colSpan: 'col-span-4', rowSpan: 'row-span-3' }, // Medium

        // Row 10: Final row 6+6 = 12
        { id: 20, colSpan: 'col-span-5', rowSpan: 'row-span-2' }, // Wide
        { id: 21, colSpan: 'col-span-3', rowSpan: 'row-span-2' }, // Wide
    ];

    return (
        <section className="hidden lg:block w-full bg-slate-100 py-8 px-4">
            <div className="grid grid-cols-12 auto-rows-[100px] gap-3 w-full">
                {imageLayouts.map((layout, index) => (
                    <div
                        key={layout.id}
                        className={`${layout.colSpan} ${layout.rowSpan} 
                            relative overflow-hidden rounded-xl group cursor-pointer`}
                        style={{
                            animation: `fadeIn 0.5s ease-out ${index * 0.04}s both`
                        }}
                    >
                        {/* Main Image */}
                        <img
                            src={`/images/gallery/img${layout.id}.jpg`}
                            alt={`Gallery image ${layout.id}`}
                            className="w-full h-full object-cover
                                transition-all duration-700 ease-out
                                group-hover:scale-110"
                            loading="lazy"
                        />

                        {/* Diagonal Moving Light Effect */}
                        <div className="absolute top-0 left-0 w-[200%] h-[200%]
                            bg-gradient-to-tr from-white/0 via-white/50 to-white/0
                            transform -translate-x-full -translate-y-full
                            group-hover:translate-x-[10%] group-hover:translate-y-[10%]
                            transition-transform duration-1000 ease-out
                            pointer-events-none opacity-0 group-hover:opacity-100
                            blur-sm">
                        </div>

                        {/* Secondary Shine Layer */}
                        <div className="absolute inset-0
                            bg-gradient-to-br from-transparent via-white/30 to-transparent
                            transform scale-0 rotate-45
                            group-hover:scale-150
                            transition-all duration-1000 ease-out
                            pointer-events-none opacity-0 group-hover:opacity-100
                            mix-blend-overlay">
                        </div>

                        {/* Subtle Enhancement */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5
                            transition-all duration-500 ease-out pointer-events-none">
                        </div>

                        {/* Inner Glow Border */}
                        <div className="absolute inset-0 rounded-xl
                            shadow-[inset_0_0_0_1px_rgba(255,255,255,0)]
                            group-hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]
                            transition-all duration-700 ease-out pointer-events-none">
                        </div>
                    </div>
                ))}
            </div>

            {/* ✅ Fixed: removed jsx attribute — not supported in plain React + Vite */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </section>
    );
}

export default Gallery;