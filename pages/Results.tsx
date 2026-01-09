import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { CalculationResult } from '../types';
import PageHeader from '../components/PageHeader';

const PlatformCard: React.FC<{
    result: CalculationResult;
    color: string;
    icon: string;
    iconColor: string;
    platformName: string;
    subLabel: string;
    highlight?: boolean;
}> = ({ result, color, icon, iconColor, platformName, subLabel, highlight }) => {
    return (
        <div className={`relative bg-surface-card rounded-2xl p-0 border border-border shadow-lg overflow-hidden group hover:shadow-card-hover transition-all duration-300 ${highlight ? 'ring-2 ring-primary/30' : ''}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${color} shadow-[0_0_15px_rgba(0,0,0,0.3)] z-10`}></div>
            <div className="p-5 pl-7">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 ${iconColor === 'text-black' ? 'bg-white' : 'bg-black border border-white/10'} rounded-full flex items-center justify-center size-8`}>
                            <span className={`material-symbols-outlined ${iconColor} text-[18px]`}>{icon}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-white text-sm leading-none mb-0.5">{platformName}</span>
                            <span className="text-[10px] text-text-sec font-medium">{subLabel}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-success text-xs font-bold bg-success/10 px-2.5 py-1.5 rounded-lg border border-success/10">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        {result.margin.toFixed(1)}%
                    </div>
                </div>

                <div className="flex items-end gap-2 mb-5">
                    <div className="flex flex-col">
                        <span className="text-xs text-text-sec font-medium mb-0.5">Preço Sugerido</span>
                        <span className="text-2xl font-extrabold text-white tracking-tight">
                            {result.suggestedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-0 border-t border-border pt-4">
                    <div className="flex flex-col pr-2">
                        <span className="text-[10px] font-bold text-text-sec uppercase mb-1 tracking-wider">Taxas</span>
                        <span className="text-sm font-bold text-danger">
                            {result.totalTaxes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                    <div className="flex flex-col px-2 border-l border-border">
                        <span className="text-[10px] font-bold text-text-sec uppercase mb-1 tracking-wider">Lucro Líq.</span>
                        <span className="text-sm font-bold text-success">
                            {result.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                    <div className="flex flex-col pl-4 border-l border-border">
                        <span className="text-[10px] font-bold text-text-sec uppercase mb-1 tracking-wider">Margem</span>
                        <span className="text-sm font-bold text-white">{result.margin.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Results: React.FC = () => {
    const navigate = useNavigate();
    const { currentResult, setCurrentResult, saveResult } = useApp();
    const [isSpikeModalOpen, setIsSpikeModalOpen] = useState(false);
    const [spikeTax, setSpikeTax] = useState<number>(20);
    const [originalResult, setOriginalResult] = useState<CalculationResult | null>(null);

    if (!currentResult) {
        return (
            <div className="flex items-center justify-center h-[80vh] flex-col gap-4 text-center px-4">
                <span className="material-symbols-outlined text-6xl text-text-sec">calculate</span>
                <h2 className="text-xl font-bold text-white">Nenhum cálculo encontrado</h2>
                <button onClick={() => navigate('/')} className="text-primary font-bold">Voltar para calculadora</button>
            </div>
        );
    }

    const handleSave = () => {
        saveResult(currentResult);
        navigate('/saved');
    };

    const handleSpikeConfirm = () => {
        if (!currentResult) return;

        // Save original state before first simulation
        if (!originalResult) {
            setOriginalResult(currentResult);
        }

        const { product } = currentResult;
        const spikeTaxVal = spikeTax;

        // Custos totais fixos = Custo produto + Custos fixos + Frete + Taxa fixa plataforma
        const totalFixedCosts = (product.cost || 0) + (product.fixedCost || 0) + (product.shippingCost || 0) + (product.taxFixed || 0);

        // Taxas variáveis totais = Comissão + Taxa anúncio + Desconto + TAXA SPIKE
        const totalVariablePercent = (product.taxPercent || 0) + (product.adTaxPercent || 0) + (product.discountPercent || 0) + spikeTaxVal;

        let suggestedPrice = 0;
        let profit = 0;
        let actualMargin = product.marginTarget;

        if (product.calculationMode === 'margin') {
            // Modo Margem: Price = Custos / (1 - (TaxasVar + Margem)/100)
            const divisor = 1 - ((totalVariablePercent + product.marginTarget) / 100);
            if (divisor > 0) {
                suggestedPrice = totalFixedCosts / divisor;
            }
            profit = suggestedPrice - totalFixedCosts - (suggestedPrice * (totalVariablePercent / 100));
        } else if (product.calculationMode === 'profit') {
            // Modo Lucro Fixo: Price = (Custos + LucroDesejado) / (1 - TaxasVar/100)
            const divisor = 1 - (totalVariablePercent / 100);
            if (divisor > 0) {
                suggestedPrice = (totalFixedCosts + (product.targetProfit || 0)) / divisor;
            }
            profit = product.targetProfit || 0;
            // Calcular margem real
            if (suggestedPrice > 0) {
                actualMargin = (profit / suggestedPrice) * 100;
            }
        } else {
            // Modo Preço Desejado: Calcula lucro e margem a partir do preço
            suggestedPrice = product.targetPrice || 0;
            profit = suggestedPrice - totalFixedCosts - (suggestedPrice * (totalVariablePercent / 100));
            if (suggestedPrice > 0) {
                actualMargin = (profit / suggestedPrice) * 100;
            }
        }

        const totalTaxes = (suggestedPrice * (totalVariablePercent / 100)) + (product.taxFixed || 0);

        setCurrentResult({
            product: {
                ...product,
                adTaxPercent: (product.adTaxPercent || 0) + spikeTaxVal // Registramos a taxa extra no adTax para histórico
            },
            suggestedPrice,
            totalTaxes,
            profit,
            margin: actualMargin,
        });

        setIsSpikeModalOpen(false);
    };

    const handleUndoSpike = () => {
        if (originalResult) {
            setCurrentResult(originalResult);
            setOriginalResult(null);
        }
    };


    // Helper to get styling based on platform
    const getPlatformStyle = (p: string) => {
        switch (p) {
            case 'shopee': return { color: 'bg-brand-shopee', icon: 'shopping_bag', iconColor: 'text-brand-shopee', name: 'Shopee', sub: 'Frete Grátis' };
            case 'shein': return { color: 'bg-white', icon: 'checkroom', iconColor: 'text-white', name: 'Shein', sub: 'Marketplace' };
            default: return { color: 'bg-brand-ml', icon: 'handshake', iconColor: 'text-black', name: 'Mercado Livre', sub: 'Clássico' };
        }
    };

    const style = getPlatformStyle(currentResult.product.platform);

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col min-h-screen relative">
            <PageHeader
                title="Resultado"
                onBack={() => navigate('/')}
                sticky
            />

            <main className="flex flex-col gap-6 px-4 pt-6 w-full pb-32">
                {/* Product Summary */}
                <section className="bg-surface-card rounded-2xl p-5 border border-border shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-5 relative z-10">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                Produto Analisado
                            </span>
                            <h2 className="text-xl font-bold text-white leading-snug">{currentResult.product.name}</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        <div className="bg-background/50 rounded-xl p-3 border border-border">
                            <span className="text-xs text-text-sec block mb-1 font-medium">SKU</span>
                            <span className="text-sm font-bold text-white tracking-wide font-mono">{currentResult.product.sku}</span>
                        </div>
                        <div className="bg-background/50 rounded-xl p-3 border border-border">
                            <span className="text-xs text-text-sec block mb-1 font-medium">Custo (CMV)</span>
                            <span className="text-sm font-bold text-white">
                                {currentResult.product.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </div>
                </section>


                {/* Comparison */}
                <div className="flex items-center justify-between mt-1 px-1">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        Resultado Calculado
                    </h3>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 uppercase tracking-wide">1 Canal Ativo</span>
                </div>

                <PlatformCard
                    result={currentResult}
                    color={style.color}
                    icon={style.icon}
                    iconColor={style.iconColor}
                    platformName={style.name}
                    subLabel={style.sub}
                    highlight
                />
            </main>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-20 bg-background/90 backdrop-blur-xl border-t border-border z-40 lg:static lg:bg-transparent lg:border-none lg:p-0 lg:mt-8">
                <div className="max-w-md lg:max-w-4xl mx-auto flex items-center justify-center gap-3 w-full">
                    <button
                        onClick={handleSave}
                        className="bg-surface-card hover:bg-white/10 text-white text-sm font-bold py-4 px-6 rounded-xl border border-border transition-all active:scale-[0.98] flex items-center justify-center gap-2 group min-w-[140px]"
                    >
                        <span className="material-symbols-outlined text-[20px] text-text-sec group-hover:text-danger transition-colors">favorite</span>
                        <span className="text-text-sec group-hover:text-white transition-colors">Salvar</span>
                    </button>

                    <button
                        onClick={() => setIsSpikeModalOpen(true)}
                        className="bg-gradient-to-r from-primary to-primary-dark hover:brightness-110 text-white text-sm font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden min-w-[200px]"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="material-symbols-outlined text-[22px] animate-pulse filled">bolt</span>
                        Simular Spike Day
                    </button>

                    {originalResult && (
                        <button
                            onClick={handleUndoSpike}
                            className="bg-surface-card hover:bg-white/10 text-white text-sm font-bold py-4 px-6 rounded-xl border border-border transition-all active:scale-[0.98] flex items-center justify-center gap-2 group animate-in fade-in slide-in-from-left-4 min-w-[140px]"
                        >
                            <span className="material-symbols-outlined text-[20px] text-danger group-hover:text-danger/80 transition-colors">undo</span>
                            <span className="text-text-sec group-hover:text-white transition-colors">Desfazer</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Spike Day Modal */}
            {isSpikeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={() => setIsSpikeModalOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-surface-card rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-white/10 transform transition-all animate-slide-up">
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 sm:hidden"></div>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4 ring-1 ring-primary/20">
                                <span className="material-symbols-outlined text-3xl filled">bolt</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Simulação Spike Day</h3>
                            <p className="text-text-sec text-sm">Qual a taxa extra do Spike Day?</p>
                        </div>
                        <div className="mb-8">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-text-sec font-medium">%</span>
                                </div>
                                <input
                                    type="number"
                                    value={spikeTax}
                                    onChange={(e) => setSpikeTax(Number(e.target.value))}
                                    className="block w-full pl-10 pr-12 py-4 bg-background border border-border rounded-xl text-white placeholder-white/20 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-lg font-bold text-center appearance-none"
                                    placeholder="Ex: 20"
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <span className="text-xs text-text-sec font-bold bg-white/5 px-2 py-1 rounded">TAXA</span>
                                </div>
                            </div>
                            <div className="flex justify-center gap-3 mt-4">
                                {[10, 15, 20].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setSpikeTax(val)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${spikeTax === val ? 'bg-primary text-white border-primary' : 'bg-white/5 text-text-sec hover:bg-white/10 hover:text-white border-white/5'}`}
                                    >
                                        {val}%
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setIsSpikeModalOpen(false)} className="py-3.5 px-4 bg-transparent border border-white/10 rounded-xl text-text-sec font-bold text-sm hover:bg-white/5 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSpikeConfirm} className="py-3.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all active:scale-95">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Results;
