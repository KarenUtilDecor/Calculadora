import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { CalculationResult } from '../types';
import PageHeader from '../components/PageHeader';

const SavedProducts: React.FC = () => {
    const navigate = useNavigate();
    const { savedResults, deleteResult, setCurrentResult } = useApp();
    const [filter, setFilter] = useState<'all' | 'ml' | 'shopee' | 'shein'>('all');

    const filtered = savedResults.filter(r => filter === 'all' || r.product.platform === filter);

    const handleEdit = (result: CalculationResult) => {
        setCurrentResult(result);
        navigate('/results');
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col min-h-screen">
            <PageHeader
                title="Produtos Salvos"
                onBack={() => navigate('/')}
                sticky
            />

            <main className="flex-1 overflow-y-auto px-4 pt-4 space-y-6 pb-32">
                <section className="space-y-4">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-sec group-focus-within:text-primary transition-colors">search</span>
                        <input
                            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-surface border border-border shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm text-white placeholder-text-sec outline-none transition-all"
                            placeholder="Buscar por nome ou SKU..."
                            type="text"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'ml', label: 'Mercado Livre' },
                            { id: 'shopee', label: 'Shopee' },
                            { id: 'shein', label: 'Shein' },
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setFilter(btn.id as any)}
                                className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95 border ${filter === btn.id ? 'bg-primary text-white shadow-md shadow-primary/20 border-transparent' : 'bg-surface text-text-sec border-border hover:bg-surface-card'}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-text-sec">
                            <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                            <p>Nenhum produto salvo.</p>
                        </div>
                    ) : (
                        filtered.map((item) => {
                            let colorClass = 'bg-brand-ml';
                            let iconClass = 'handshake';
                            let platformLabel = 'Mercado Livre';

                            if (item.product.platform === 'shopee') {
                                colorClass = 'bg-brand-shopee';
                                iconClass = 'shopping_bag';
                                platformLabel = 'Shopee';
                            } else if (item.product.platform === 'shein') {
                                colorClass = 'bg-white';
                                iconClass = 'checkroom';
                                platformLabel = 'Shein';
                            }

                            return (
                                <article key={item.product.id} className="group relative bg-surface rounded-xl p-0 shadow-sm border border-border hover:shadow-md transition-all overflow-hidden">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass} z-10`}></div>
                                    <div className="p-4 flex flex-col h-full pl-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-white text-base leading-tight">{item.product.name}</h3>
                                                <p className="text-xs font-medium text-text-sec mt-1">SKU: {item.product.sku}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEdit(item)} className="size-8 flex items-center justify-center text-text-sec hover:text-white hover:bg-white/5 rounded-full transition-colors">
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                                                </button>
                                                <button onClick={() => deleteResult(item.product.id)} className="size-8 flex items-center justify-center text-text-sec hover:text-danger hover:bg-danger/10 rounded-full transition-colors">
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-text-sec mb-0.5">Melhor Opção</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`material-symbols-outlined ${item.product.platform === 'ml' ? 'text-brand-ml' : item.product.platform === 'shopee' ? 'text-brand-shopee' : 'text-white'}`} style={{ fontSize: 18 }}>{iconClass}</span>
                                                    <span className="text-sm font-bold text-gray-200">{platformLabel}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-extrabold text-white">
                                                    {item.suggestedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                                <p className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded inline-block">+{item.margin.toFixed(0)}% Margem</p>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </section>
            </main>

            <div className="fixed bottom-24 right-6 z-50 lg:hidden">
                <button onClick={() => navigate('/')} className="bg-primary hover:bg-primary-dark text-white shadow-xl shadow-primary/30 rounded-2xl w-14 h-14 flex items-center justify-center transition-transform active:scale-95 group">
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300" style={{ fontSize: 28 }}>add</span>
                </button>
            </div>
        </div>
    );
};

export default SavedProducts;
