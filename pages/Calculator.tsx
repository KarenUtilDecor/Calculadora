import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Platform, ProductData } from '../types';
import { getMLShippingCost, getMLFixedFee } from '../lib/mlShipping';
import { getSheinShippingFee, calculateCubicWeight } from '../lib/sheinShipping';
import PageHeader from '../components/PageHeader';

const Calculator: React.FC = () => {
    const navigate = useNavigate();
    const { setCurrentProduct, setCurrentResult } = useApp();

    const [platform, setPlatform] = useState<Platform>('ml');
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [cost, setCost] = useState('');
    const [fixedCost, setFixedCost] = useState('');
    const [commission, setCommission] = useState('');
    const [fixedTax, setFixedTax] = useState('');

    // Novos estados para Cálculos Variáveis
    const [shippingCost, setShippingCost] = useState('');
    const [adTaxPercent, setAdTaxPercent] = useState(''); // ADS %
    const [discountPercent, setDiscountPercent] = useState('');
    const [incomeTaxPercent, setIncomeTaxPercent] = useState(''); // Imposto
    const [breakagePercent, setBreakagePercent] = useState(''); // Quebra
    const [collabPercent, setCollabPercent] = useState(''); // Comissao Colab

    // Estados para Metas expandidas
    const [margin, setMargin] = useState(20);
    const [targetProfit, setTargetProfit] = useState('');
    const [desiredPrice, setDesiredPrice] = useState('');
    const [calculationMode, setCalculationMode] = useState<'margin' | 'profit' | 'price'>('margin');
    const [hasFreeShipping, setHasFreeShipping] = useState(false);
    const [weight, setWeight] = useState('');
    // Shein States
    const [sheinHeight, setSheinHeight] = useState('');
    const [sheinWidth, setSheinWidth] = useState('');
    const [sheinLength, setSheinLength] = useState('');
    // ML listing type
    const [mlListingType, setMlListingType] = useState<'classic' | 'premium'>('classic');

    const handlePlatformChange = (p: Platform) => {
        setPlatform(p);
        if (p === 'shopee') {
            setCommission(hasFreeShipping ? '20' : '14');
            setFixedTax('4');
        } else if (p === 'ml') {
            setCommission('12'); // Clássico padrão
            setFixedTax('0'); // Será calculado automaticamente
            setMlListingType('classic');
        } else if (p === 'shein') {
            setCommission('20');
            // Recalcula se já tiver dimensões
            recalculateSheinFee(sheinHeight, sheinWidth, sheinLength);
        }
    };

    const recalculateSheinFee = (h: string, w: string, l: string) => {
        const heightVal = parseFloat(h) || 0;
        const widthVal = parseFloat(w) || 0;
        const lengthVal = parseFloat(l) || 0;

        if (heightVal > 0 && widthVal > 0 && lengthVal > 0) {
            const fee = getSheinShippingFee(heightVal, widthVal, lengthVal);
            setFixedTax(fee.toFixed(2));
        } else {
            setFixedTax('0');
        }
    };

    const toggleFreeShipping = () => {
        const nextValue = !hasFreeShipping;
        setHasFreeShipping(nextValue);
        if (platform === 'shopee') {
            setCommission(nextValue ? '20' : '14');
            setFixedTax('4');
        }
    };


    const [previewResult, setPreviewResult] = useState<{ price: number, profit: number, margin: number } | null>(null);

    React.useEffect(() => {
        const costVal = parseFloat(cost) || 0;
        const fixedCostVal = parseFloat(fixedCost) || 0;
        const commissionVal = parseFloat(commission) || 0;
        const fixedTaxVal = parseFloat(fixedTax) || 0;
        const shippingVal = parseFloat(shippingCost) || 0;
        const adTaxVal = parseFloat(adTaxPercent) || 0;
        const discountVal = parseFloat(discountPercent) || 0;
        const targetProfitVal = parseFloat(targetProfit) || 0;
        const weightVal = parseFloat(weight) || 0;

        // Se não houver custo, não pré-visualiza
        if (costVal === 0) {
            setPreviewResult(null);
            return;
        }

        let suggestedPrice = 0;
        let finalShipping = shippingVal;
        const incomeTaxVal = parseFloat(incomeTaxPercent) || 0;
        const breakageVal = parseFloat(breakagePercent) || 0;
        const collabVal = parseFloat(collabPercent) || 0;
        const totalVariablePercent = commissionVal + adTaxVal + discountVal + incomeTaxVal + breakageVal + collabVal;

        const calculateForShipping = (sVal: number, currentFixedTax: number) => {
            const totalFixedCosts = costVal + fixedCostVal + sVal + currentFixedTax;
            let price = 0;
            if (calculationMode === 'margin') {
                const divisor = 1 - ((totalVariablePercent + margin) / 100);
                if (divisor > 0) price = totalFixedCosts / divisor;
            } else if (calculationMode === 'profit') {
                const divisor = 1 - (totalVariablePercent / 100);
                if (divisor > 0) price = (totalFixedCosts + targetProfitVal) / divisor;
            } else {
                price = parseFloat(desiredPrice) || 0;
            }
            return price;
        };

        if (platform === 'ml') {
            // For ML, we calculate fixedTax internally to avoid state loops
            // Iterative approach to find stable price
            let currentPrice = 0;
            let currentFixedTax = 0;
            let currentShipping = 0;

            // Initial guess
            const initialFixedTax = hasFreeShipping ? 0 : (parseFloat(fixedTax) || 0); // Start with state or 0

            // Loop for convergence (max 5 iterations)
            for (let i = 0; i < 5; i++) {
                currentFixedTax = getMLFixedFee(currentPrice || costVal * 2); // Use cost*2 as better initial guess if price 0

                // If Free shipping, shipping depends on price too
                if (hasFreeShipping && weightVal > 0) {
                    currentShipping = getMLShippingCost(currentPrice || costVal * 2, weightVal);
                } else {
                    currentShipping = shippingVal;
                }

                currentPrice = calculateForShipping(currentShipping, currentFixedTax);

                // Breaking condition handled implicitly by convergence or max iter
            }

            suggestedPrice = currentPrice;
            finalShipping = currentShipping;
            // For profit calc, use the Converged Fixed Tax
            // Note: We need to use the variable `currentFixedTax` for the final profit calc below,
            // NOT `fixedTaxVal` from state.
        } else {
            // Standard calc for other platforms
            suggestedPrice = calculateForShipping(shippingVal, fixedTaxVal);
        }

        // Finalize values
        // If ML, we need to use the internally calculated fixed tax
        const effectiveFixedTax = platform === 'ml' ? getMLFixedFee(suggestedPrice) : fixedTaxVal;

        const finalFixedCosts = costVal + fixedCostVal + finalShipping + effectiveFixedTax;
        const profit = suggestedPrice - finalFixedCosts - (suggestedPrice * (totalVariablePercent / 100));
        let actualMargin = margin;
        if (suggestedPrice > 0) {
            actualMargin = (profit / suggestedPrice) * 100;
        }

        setPreviewResult({
            price: suggestedPrice,
            profit: profit,
            margin: actualMargin
        });
    }, [cost, fixedCost, commission, fixedTax, shippingCost, adTaxPercent, discountPercent, incomeTaxPercent, breakagePercent, collabPercent, targetProfit, weight, margin, calculationMode, desiredPrice, platform, hasFreeShipping, mlListingType]);

    // Auto-update ML commission and fixed fee UI state for consistency
    // This is now purely for display/DB sync, not for calculation logic
    React.useEffect(() => {
        if (platform === 'ml' && previewResult) {
            const calculatedFixedFee = getMLFixedFee(previewResult.price);
            // Only update if significantly different to avoid loops
            if (Math.abs(parseFloat(fixedTax || '0') - calculatedFixedFee) > 0.01) {
                setFixedTax(calculatedFixedFee.toFixed(2));
            }
        }
    }, [previewResult, platform, fixedTax]);


    const handleCalculate = () => {
        if (!previewResult) return;

        const costVal = parseFloat(cost) || 0;
        const fixedCostVal = parseFloat(fixedCost) || 0;
        const commissionVal = parseFloat(commission) || 0;
        const fixedTaxVal = parseFloat(fixedTax) || 0;
        const shippingVal = parseFloat(shippingCost) || 0;
        const adTaxVal = parseFloat(adTaxPercent) || 0;
        const discountVal = parseFloat(discountPercent) || 0;
        const incomeTaxVal = parseFloat(incomeTaxPercent) || 0;
        const breakageVal = parseFloat(breakagePercent) || 0;
        const collabVal = parseFloat(collabPercent) || 0;
        const weightVal = parseFloat(weight) || 0;

        const totalVariablePercent = commissionVal + adTaxVal + discountVal + incomeTaxVal + breakageVal + collabVal;

        // Recalcular shipping final para salvar corretamente no objeto
        // (Lógica simplificada pois já temos o previewResult, 
        // mas precisamos do shipping exato se for ML)
        let finalShipping = shippingVal;
        if (platform === 'ml' && hasFreeShipping && weightVal > 0) {
            // Re-executa lógica rápida para pegar o shipping correto
            // Idealmente refatorar tudo para uma função pura, mas manteremos assim por segurança
            const calculateForShipping = (sVal: number) => {
                const totalFixedCosts = costVal + fixedCostVal + sVal + fixedTaxVal;
                let price = 0;
                if (calculationMode === 'margin') {
                    const divisor = 1 - ((totalVariablePercent + margin) / 100);
                    if (divisor > 0) price = totalFixedCosts / divisor;
                } else if (calculationMode === 'profit') {
                    const divisor = 1 - (totalVariablePercent / 100);
                    if (divisor > 0) price = (totalFixedCosts + parseFloat(targetProfit) || 0) / divisor;
                } else {
                    price = parseFloat(desiredPrice) || 0;
                }
                return price;
            };
            let p1 = calculateForShipping(0);
            let s1 = getMLShippingCost(p1, weightVal);
            let p2 = calculateForShipping(s1);
            let s2 = getMLShippingCost(p2, weightVal);
            finalShipping = s2;
        }

        const suggestedPrice = previewResult.price;
        const profit = previewResult.profit;
        const actualMargin = previewResult.margin;
        const totalTaxes = (suggestedPrice * (totalVariablePercent / 100)) + fixedTaxVal;

        const product: ProductData = {
            id: Date.now().toString(),
            name: name || 'Produto Sem Nome',
            sku: sku || 'N/A',
            cost: costVal,
            fixedCost: fixedCostVal,
            shippingCost: finalShipping,
            adTaxPercent: adTaxVal,
            discountPercent: discountVal,
            taxPercent: commissionVal,
            taxFixed: fixedTaxVal,
            incomeTaxPercent: incomeTaxVal,
            breakagePercent: breakageVal,
            collabPercent: collabVal,
            marginTarget: actualMargin,
            targetProfit: profit,
            targetPrice: parseFloat(desiredPrice) || 0,
            calculationMode,
            platform,
            hasFreeShipping,
            weight: weightVal
        };

        setCurrentProduct(product);
        setCurrentResult({
            product,
            suggestedPrice,
            totalTaxes,
            profit,
            margin: actualMargin,
        });

        navigate('/results');
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-2 py-2 lg:px-4 lg:pt-2 flex flex-col gap-2 h-screen overflow-hidden">
            <h1 className="text-xl font-bold text-white leading-tight text-center mb-2">Calculadora</h1>

            <div className="lg:grid lg:grid-cols-12 lg:gap-3 lg:items-start h-full">
                <div className="flex flex-col gap-2 lg:col-span-7">
                    {/* Platform Selection */}
                    <section className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-base">store</span>
                            Escolha a Plataforma
                        </h3>
                        <div className="bg-surface dark:bg-surface p-3 rounded-xl border border-border grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: 'ml', name: 'Mercado Livre', icon: 'storefront', color: 'bg-brand-ml', text: 'text-black' },
                                { id: 'shopee', name: 'Shopee', icon: 'shopping_bag', color: 'bg-brand-shopee', text: 'text-white' },
                                { id: 'shein', name: 'Shein', icon: 'checkroom', color: 'bg-white', text: 'text-black' },
                                { id: 'other', name: 'Outro', icon: 'add_circle', color: 'bg-surface', border: true, text: 'text-white' }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handlePlatformChange(p.id as Platform)}
                                    className={`
                                        flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 h-full group
                                        ${platform === p.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                                        ${p.border ? 'border border-border hover:border-primary' : ''}
                                        ${p.color}
                                    `}
                                >
                                    <span className={`material-symbols-outlined text-2xl mb-1 group-hover:scale-110 transition-transform ${p.text}`}>{p.icon}</span>
                                    <span className={`text-xs font-bold text-center ${p.text}`}>{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Product Details */}
                    <section className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-base">inventory_2</span>
                            Detalhes do Produto
                        </h3>
                        <div className="bg-surface p-3 rounded-xl border border-border grid gap-2">
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-text-sec">Nome do Produto</span>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-input-surface py-2 pl-3 pr-8 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                        placeholder="Ex: Fone Bluetooth Pro..."
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                                        <span className="material-symbols-outlined text-base">auto_fix_high</span>
                                    </div>
                                </div>
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-text-sec">Código SKU</span>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-input-surface py-2 pl-3 pr-8 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                        placeholder="Ex: SKU-001"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec pointer-events-none">
                                        <span className="material-symbols-outlined text-base">qr_code_2</span>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </section>

                    {/* Custos Base */}
                    <section className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-base">payments</span>
                            Custos Base
                        </h3>
                        <div className="bg-surface p-3 rounded-xl border border-border grid gap-2">
                            {platform === 'shopee' && (
                                <button
                                    onClick={toggleFreeShipping}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${hasFreeShipping
                                        ? 'bg-brand-shopee/10 border-brand-shopee text-brand-shopee'
                                        : 'bg-background/50 border-border text-text-sec hover:border-text-sec'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined filled text-xl">local_shipping</span>
                                        <div className="flex flex-col text-left">
                                            <span className="text-sm font-bold">Programa Frete Grátis</span>
                                            <span className="text-[10px] opacity-80">Comissão 18% + Taxa 2% + R$4</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-3xl">
                                        {hasFreeShipping ? 'toggle_on' : 'toggle_off'}
                                    </span>
                                </button>
                            )}

                            {platform === 'ml' && (
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={toggleFreeShipping}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${hasFreeShipping
                                            ? 'bg-brand-ml/20 border-brand-ml text-brand-ml'
                                            : 'bg-background/50 border-border text-text-sec hover:border-text-sec'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined filled text-xl">local_shipping</span>
                                            <div className="flex flex-col text-left">
                                                <span className="text-sm font-bold">Oferecer Frete Grátis</span>
                                                <span className="text-[10px] opacity-80">Cálculo automático por peso e preço</span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-3xl">
                                            {hasFreeShipping ? 'toggle_on' : 'toggle_off'}
                                        </span>
                                    </button>

                                    {/* ML Listing Type Toggle */}
                                    <div className="flex bg-background rounded-lg p-1 border border-border">
                                        <button
                                            className={`flex-1 py-1 px-2 rounded-md text-xs font-bold transition-all ${mlListingType === 'classic'
                                                ? 'bg-brand-ml text-black shadow'
                                                : 'text-text-sec hover:text-white'
                                                }`}
                                            onClick={() => {
                                                setMlListingType('classic');
                                                setCommission('12');
                                            }}
                                        >
                                            Clássico (12%)
                                        </button>
                                        <button
                                            className={`flex-1 py-1 px-2 rounded-md text-xs font-bold transition-all ${mlListingType === 'premium'
                                                ? 'bg-brand-ml text-black shadow'
                                                : 'text-text-sec hover:text-white'
                                                }`}
                                            onClick={() => {
                                                setMlListingType('premium');
                                                setCommission('17');
                                            }}
                                        >
                                            Premium (17%)
                                        </button>
                                    </div>

                                    {hasFreeShipping && (
                                        <label className="flex flex-col gap-2">
                                            <span className="text-sm font-medium text-text-sec">Peso do Produto (em gramas)</span>
                                            <div className="relative group">
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-sec font-semibold pointer-events-none">g</div>
                                                <input
                                                    type="number"
                                                    value={weight}
                                                    onChange={(e) => setWeight(e.target.value)}
                                                    className="w-full rounded-xl border border-border bg-input-surface py-3 pl-4 pr-12 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold"
                                                    placeholder="Ex: 500"
                                                />
                                            </div>
                                        </label>
                                    )}
                                </div>
                            )}

                            {platform === 'shein' && (
                                <div className="bg-brand-shein/5 border border-brand-shein/20 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-brand-shein font-bold">
                                        <span className="material-symbols-outlined">deployed_code</span>
                                        <h3>Dimensões da Embalagem (cm)</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <label className="flex flex-col gap-1">
                                            <span className="text-xs text-text-sec">Altura</span>
                                            <input
                                                type="number"
                                                value={sheinHeight}
                                                onChange={(e) => {
                                                    setSheinHeight(e.target.value);
                                                    recalculateSheinFee(e.target.value, sheinWidth, sheinLength);
                                                }}
                                                className="w-full rounded-lg border border-border bg-input-surface p-2 text-center text-white focus:border-brand-shein outline-none"
                                                placeholder="0"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-xs text-text-sec">Largura</span>
                                            <input
                                                type="number"
                                                value={sheinWidth}
                                                onChange={(e) => {
                                                    setSheinWidth(e.target.value);
                                                    recalculateSheinFee(sheinHeight, e.target.value, sheinLength);
                                                }}
                                                className="w-full rounded-lg border border-border bg-input-surface p-2 text-center text-white focus:border-brand-shein outline-none"
                                                placeholder="0"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-xs text-text-sec">Comprimento</span>
                                            <input
                                                type="number"
                                                value={sheinLength}
                                                onChange={(e) => {
                                                    setSheinLength(e.target.value);
                                                    recalculateSheinFee(sheinHeight, sheinWidth, e.target.value);
                                                }}
                                                className="w-full rounded-lg border border-border bg-input-surface p-2 text-center text-white focus:border-brand-shein outline-none"
                                                placeholder="0"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-text-sec pt-2 border-t border-border/50">
                                        <span>Peso Cubado: {((parseFloat(sheinHeight) || 0) * (parseFloat(sheinWidth) || 0) * (parseFloat(sheinLength) || 0) / 6000).toFixed(4)} kg</span>
                                        <span className="font-bold text-brand-shein">Intervenção: R$ {fixedTax}</span>
                                    </div>
                                </div>
                            )}
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-text-sec">Custo do Produto (CMV)</span>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec font-semibold pointer-events-none">R$</div>
                                    <input
                                        type="number"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-input-surface py-2 pl-9 pr-3 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold text-sm"
                                        placeholder="0,00"
                                    />
                                </div>
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-text-sec">Custos Fixos (Embalagem, etc)</span>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec font-semibold pointer-events-none">R$</div>
                                    <input
                                        type="number"
                                        value={fixedCost}
                                        onChange={(e) => setFixedCost(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-input-surface py-2 pl-9 pr-3 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold text-sm"
                                        placeholder="0,00"
                                    />
                                </div>
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-text-sec">Taxa Fixa (Plat.)</span>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec font-semibold pointer-events-none">R$</div>
                                    <input
                                        type="number"
                                        value={fixedTax}
                                        readOnly={platform === 'shopee' || platform === 'ml' || platform === 'shein'}
                                        onChange={(e) => setFixedTax(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-input-surface py-2 pl-9 pr-3 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold text-sm opacity-80"
                                        placeholder="0,00"
                                    />
                                </div>
                            </label>
                        </div>
                    </section>
                </div>

                <div className="flex flex-col gap-2 lg:col-span-5 lg:sticky lg:top-2 mt-2 lg:mt-0">
                    {/* Cálculos Variáveis - NOVA SEÇÃO */}
                    <section className="flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-base">calculate</span>
                            Cálculos Variáveis
                        </h3>
                        <div className="bg-surface p-3 rounded-xl border border-border grid gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-text-sec">Imposto</span>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={incomeTaxPercent}
                                            onChange={(e) => setIncomeTaxPercent(e.target.value)}
                                            className="w-full rounded-lg border border-border bg-input-surface py-2 pl-3 pr-8 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold text-sm"
                                            placeholder="0"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec font-bold pointer-events-none">%</div>
                                    </div>
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-text-sec">ADS</span>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={adTaxPercent}
                                            onChange={(e) => setAdTaxPercent(e.target.value)}
                                            className="w-full rounded-lg border border-border bg-input-surface py-2 pl-3 pr-8 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold text-sm"
                                            placeholder="0"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec font-bold pointer-events-none">%</div>
                                    </div>
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-text-sec">Perca / Quebra</span>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={breakagePercent}
                                            onChange={(e) => setBreakagePercent(e.target.value)}
                                            className="w-full rounded-lg border border-border bg-input-surface py-2 pl-3 pr-8 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold text-sm"
                                            placeholder="0"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec font-bold pointer-events-none">%</div>
                                    </div>
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-text-sec">Comissão Colab</span>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={collabPercent}
                                            onChange={(e) => setCollabPercent(e.target.value)}
                                            className="w-full rounded-lg border border-border bg-input-surface py-2 pl-3 pr-8 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold text-sm"
                                            placeholder="0"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec font-bold pointer-events-none">%</div>
                                    </div>
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-text-sec">Desconto Promo.</span>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={discountPercent}
                                            onChange={(e) => setDiscountPercent(e.target.value)}
                                            className="w-full rounded-lg border border-border bg-input-surface py-2 pl-3 pr-8 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold text-sm"
                                            placeholder="0"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec font-bold pointer-events-none">%</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Metas - SEÇÃO EXPANDIDA */}
                    <section className="flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-base">tune</span>
                            Metas
                        </h3>
                        <div className="bg-surface p-3 rounded-xl border border-border">
                            {/* Toggle de Modo de Cálculo */}
                            <div className="flex gap-1 mb-2 p-1 bg-background rounded-lg overflow-x-auto no-scrollbar">
                                <button
                                    onClick={() => setCalculationMode('margin')}
                                    className={`whitespace-nowrap flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${calculationMode === 'margin'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-text-sec hover:text-white'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-sm align-middle mr-1">percent</span>
                                    Margem %
                                </button>
                                <button
                                    onClick={() => setCalculationMode('profit')}
                                    className={`whitespace-nowrap flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${calculationMode === 'profit'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-text-sec hover:text-white'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-xs align-middle mr-1">attach_money</span>
                                    Lucro R$
                                </button>
                                <button
                                    onClick={() => setCalculationMode('price')}
                                    className={`whitespace-nowrap flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${calculationMode === 'price'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-text-sec hover:text-white'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-sm align-middle mr-1">stylus_note</span>
                                    Preço R$
                                </button>
                            </div>

                            {calculationMode === 'margin' ? (
                                <label className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-text-sec">Margem Lucro</span>
                                        <span className="text-[10px] font-bold text-primary bg-primary/20 px-1 py-0.5 rounded">15-25%</span>
                                    </div>
                                    <div className="relative flex items-center group mb-1">
                                        <input
                                            type="number"
                                            value={margin}
                                            onChange={(e) => setMargin(Number(e.target.value))}
                                            className="w-full rounded-lg border border-border bg-input-surface py-2 pl-3 pr-8 text-base font-bold text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder="20"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec font-bold pointer-events-none">%</div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={margin}
                                        onChange={(e) => setMargin(Number(e.target.value))}
                                        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </label>
                            ) : calculationMode === 'profit' ? (
                                <label className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-text-sec">Lucro Desejado</span>
                                        <span className="text-[10px] font-bold text-success bg-success/20 px-1 py-0.5 rounded">Valor Fixo</span>
                                    </div>
                                    <div className="relative flex items-center group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec font-semibold pointer-events-none">R$</div>
                                        <input
                                            type="number"
                                            value={targetProfit}
                                            onChange={(e) => setTargetProfit(e.target.value)}
                                            className="w-full rounded-lg border border-border bg-input-surface py-2 pl-9 pr-3 text-base font-bold text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder="50,00"
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-sec mt-0.5">
                                        Defina quanto você quer lucrar por unidade vendida
                                    </p>
                                </label>
                            ) : (
                                <label className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-text-sec">Preço de Venda</span>
                                        <span className="text-[10px] font-bold text-secondary bg-secondary/20 px-1 py-0.5 rounded">Cálculo Reverso</span>
                                    </div>
                                    <div className="relative flex items-center group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec font-semibold pointer-events-none">R$</div>
                                        <input
                                            type="number"
                                            value={desiredPrice}
                                            onChange={(e) => setDesiredPrice(e.target.value)}
                                            className="w-full rounded-lg border border-border bg-input-surface py-2 pl-9 pr-3 text-base font-bold text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder="199,00"
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-sec mt-0.5">
                                        Descubra o lucro e a margem a partir do preço que você quer cobrar
                                    </p>
                                </label>
                            )}
                        </div>
                    </section>

                    {previewResult && (
                        <div className={`mt-2 rounded-xl p-3 border ${platform === 'ml' && (
                            (previewResult.price > 99 && mlListingType === 'classic') ||
                            (previewResult.price < 98.99 && mlListingType === 'premium')
                        ) ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-surface border-border'
                            }`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-text-sec">Preço Sugerido</span>
                                <span className="text-xs text-text-sec">Lucro Estimado</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-bold text-white">
                                    {previewResult.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                                <div className="text-right">
                                    <span className={`text-lg font-bold ${previewResult.profit >= 0 ? 'text-success' : 'text-error'}`}>
                                        {previewResult.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                    <div className="text-[10px] text-text-sec">
                                        Margem: {previewResult.margin.toFixed(2)}%
                                    </div>
                                </div>
                            </div>

                            {/* ML Recommendation Alert */}
                            {platform === 'ml' && previewResult.price > 99 && mlListingType === 'classic' && (
                                <div className="mt-2 pt-2 border-t border-yellow-500/20 flex items-start gap-2">
                                    <span className="material-symbols-outlined text-yellow-500 text-lg">lightbulb</span>
                                    <div className="text-[11px] text-yellow-200">
                                        <span className="font-bold">Dica:</span> Acima de R$99, compensa mudar para <span className="font-bold">Premium</span> para oferecer parcelamento sem juros e vender mais!
                                    </div>
                                </div>
                            )}
                            {platform === 'ml' && previewResult.price < 98.99 && mlListingType === 'premium' && (
                                <div className="mt-2 pt-2 border-t border-yellow-500/20 flex items-start gap-2">
                                    <span className="material-symbols-outlined text-yellow-500 text-lg">savings</span>
                                    <div className="text-[11px] text-yellow-200">
                                        <span className="font-bold">Economia:</span> Abaixo de R$99, o <span className="font-bold">Clássico</span> geralmente é mais vantajoso.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleCalculate}
                        disabled={!previewResult}
                        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                    >
                        <span className="material-symbols-outlined text-2xl">calculate</span>
                        Calcular Preço Ideal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Calculator;
