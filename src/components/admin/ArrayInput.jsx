import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function ArrayInput({ label, items, setItems, placeholder }) {
    const [inputValue, setInputValue] = useState('');

    const addItem = () => {
        if (inputValue.trim()) {
            setItems([...items, inputValue.trim()]);
            setInputValue('');
        }
    };

    return (
        <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                    className="block w-full px-3 py-2 border border-sky-100 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
                    placeholder={placeholder}
                />
                <button type="button" onClick={addItem} className="px-4 py-2 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg shrink-0 font-medium transition-colors">
                    <Plus size={18} />
                </button>
            </div>
            {items.length > 0 && (
                <ul className="space-y-2">
                    {items.map((item, index) => (
                        <li key={index} className="flex justify-between items-center bg-white px-3 py-2 border border-slate-100 rounded-lg shadow-sm">
                            <span className="text-sm text-slate-700 font-medium">{item}</span>
                            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
