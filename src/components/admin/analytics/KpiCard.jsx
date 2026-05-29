export default function KpiCard({ value, label, subLabel, icon: Icon, colorClass, bgClass, borderClass }) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border ${borderClass ?? 'border-sky-100/50'} p-5 flex items-start gap-4`}>
            <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`w-5 h-5 ${colorClass}`} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{label}</p>
                <p className={`text-2xl font-bold ${colorClass} mt-0.5 leading-tight`}>{value}</p>
                {subLabel && <p className="text-xs text-gray-500 mt-0.5">{subLabel}</p>}
            </div>
        </div>
    );
}
