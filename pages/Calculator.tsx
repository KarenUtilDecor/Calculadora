import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Platform, ProductData } from '../types';
import { getMLShippingCost, getMLFixedFee } from '../lib/mlShipping';
import { getSheinShippingFee } from '../lib/sheinShipping';
import { getShopeeCommission, calculateShopeePriceForMargin, calculateShopeePriceForProfit, SHOPEE_BRACKETS } from '../lib/shopeeCommission';

// --- Input components with LOCAL state to prevent parent re-renders during typing ---
// Typing only re-renders this component. Parent only updates after debounce or blur.
// This is the key fix for mobile keyboards closing on every keystroke.

const DebouncedInput: React.FC<{
    value: string;
    onValueChange: (v: string) => void;
    type?: 'currency' | 'percent' | 'plain';
    label: string;
    icon?: string;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
}> = ({ value, onValueChange, type = 'plain', label, icon, placeholder, className, inputClassName }) => {
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    // Sync from parent only when input is NOT focused (e.g. platform change, reset)
    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setLocalValue(value);
        }
    }, [value]);

    const pushToParent = (v: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onValueChange(v), 400);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        if (v === '' || v === '-' || /^-?\d*[.,]?\d*$/.test(v)) {
            setLocalValue(v);
            pushToParent(v);
        }
    };

    const handleBlur = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        onValueChange(localValue);
    };

    const isCurrency = type === 'currency';
    const isPercent = type === 'percent';

    return (
        <label className={`flex flex-col gap-1 ${className || ''}`}>
            <span className="text-xs font-medium text-text-sec">{label}</span>
            <div className="relative">
                {isCurrency && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec font-semibold pointer-events-none text-xs">R$</div>}
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={localValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClassName || `w-full rounded-lg border border-border bg-input-surface py-2 ${isCurrency ? 'pl-8 pr-3' : isPercent ? 'pl-3 pr-8' : 'pl-3 pr-3'} text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold text-sm`}
                    placeholder={placeholder || (isCurrency ? '0,00' : '0')}
                />
                {isPercent && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec font-bold pointer-events-none">%</div>}
                {icon && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-text-sec pointer-events-none">
                    <span className="material-symbols-outlined text-sm">{icon}</span>
                </div>}
            </div>
        </label>
    );
};

// Convenience wrappers
const CurrencyInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; label: string; icon?: string }> =
    ({ value, onChange, placeholder, label, icon }) => (
        <DebouncedInput value={value} onValueChange={onChange} type="currency" label={label} icon={icon} placeholder={placeholder} />
    );

const PercentInput: React.FC<{ value: string; onChange: (v: string) => void; label: string; placeholder?: string }> =
    ({ value, onChange, label, placeholder }) => (
        <DebouncedInput value={value} onValueChange={onChange} type="percent" label={label} placeholder={placeholder} />
    );

const Calculator: React.FC = () => {
    const navigate = useNavigate();
    const { setCurrentProduct, setCurrentResult } = useApp();

    const [platform, setPlatform] = useState<Platform>('shopee');
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');

    // CMV Detalhado
    const [productCost, setProductCost] = useState('');
    const [purchaseTax, setPurchaseTax] = useState('');
    const [purchaseShipping, setPurchaseShipping] = useState('');
    const [packagingCost, setPackagingCost] = useState('');
    const [printingCost, setPrintingCost] = useState('');

    const cmvTotal = useMemo(() => {
        return (parseFloat(productCost) || 0) + (parseFloat(purchaseTax) || 0) +
            (parseFloat(purchaseShipping) || 0) + (parseFloat(packagingCost) || 0) +
            (parseFloat(printingCost) || 0);
    }, [productCost, purchaseTax, purchaseShipping, packagingCost, printingCost]);

    // Platform-specific (non-Shopee)
    const [commission, setCommission] = useState('');
    const [fixedTax, setFixedTax] = useState('');
    const [shippingCost, setShippingCost] = useState('');

    // Variable selling costs
    const [incomeTaxPercent, setIncomeTaxPercent] = useState('');
    const [adTaxPercent, setAdTaxPercent] = useState('');
    const [discountPercent, setDiscountPercent] = useState('');
    const [breakagePercent, setBreakagePercent] = useState('');
    const [collabPercent, setCollabPercent] = useState('');

    // Goals
    const [margin, setMargin] = useState(20);
    const [targetProfit, setTargetProfit] = useState('');
    const [desiredPrice, setDesiredPrice] = useState('');
    const [calculationMode, setCalculationMode] = useState<'margin' | 'profit' | 'price'>('price');

    // ML specific
    const [hasFreeShipping, setHasFreeShipping] = useState(false);
    const [weight, setWeight] = useState('');
    const [mlListingType, setMlListingType] = useState<'classic' | 'premium'>('classic');

    // Shein specific
    const [sheinHeight, setSheinHeight] = useState('');
    const [sheinWidth, setSheinWidth] = useState('');
    const [sheinLength, setSheinLength] = useState('');

    const handlePlatformChange = (p: Platform) => {
        setPlatform(p);
        if (p === 'shopee') {
            setCommission(''); setFixedTax(''); setShippingCost('');
        } else if (p === 'ml') {
            setCommission('12'); setFixedTax('0'); setMlListingType('classic');
        } else if (p === 'shein') {
            setCommission('20');
            recalcSheinFee(sheinHeight, sheinWidth, sheinLength);
        }
    };

    const recalcSheinFee = (h: string, w: string, l: string) => {
        const hv = parseFloat(h) || 0, wv = parseFloat(w) || 0, lv = parseFloat(l) || 0;
        if (hv > 0 && wv > 0 && lv > 0) setFixedTax(getSheinShippingFee(hv, wv, lv).toFixed(2));
        else setFixedTax('0');
    };

    // Preview
    const [previewResult, setPreviewResult] = useState<{
        price: number; profit: number; margin: number;
        commissionPercent?: number; commissionValue?: number;
        fixedFeeValue?: number; repasse?: number;
        incomeTaxValue?: number; bracketLabel?: string;
    } | null>(null);

    // Debounce ref to prevent re-renders from closing mobile keyboard
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Clear previous timeout — only calculate after user stops typing
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            const itv = parseFloat(incomeTaxPercent) || 0;
            const atv = parseFloat(adTaxPercent) || 0;
            const dv = parseFloat(discountPercent) || 0;
            const bv = parseFloat(breakagePercent) || 0;
            const cv = parseFloat(collabPercent) || 0;

            if (platform === 'shopee') {
                const otherVar = itv + atv + dv + bv + cv;
                let price = 0, mc = 0, mcP = 0, cPerc = 0, fFee = 0, bLabel = '';

                if (calculationMode === 'price') {
                    price = parseFloat(desiredPrice) || 0;
                    if (price <= 0) { setPreviewResult(null); return; }
                    const sc = getShopeeCommission(price);
                    cPerc = sc.commissionPercent; fFee = sc.fixedFee; bLabel = sc.bracket.label;
                    mc = price - (price * cPerc / 100) - fFee - (price * otherVar / 100) - cmvTotal;
                    mcP = price > 0 ? (mc / price) * 100 : 0;
                } else if (calculationMode === 'margin') {
                    if (cmvTotal === 0) { setPreviewResult(null); return; }
                    const r = calculateShopeePriceForMargin(cmvTotal, margin, otherVar);
                    if (!r) { setPreviewResult(null); return; }
                    price = r.price;
                    const sc = getShopeeCommission(price);
                    cPerc = sc.commissionPercent; fFee = sc.fixedFee; bLabel = sc.bracket.label;
                    mc = price * margin / 100; mcP = margin;
                } else {
                    const tmc = parseFloat(targetProfit) || 0;
                    if (tmc <= 0 && cmvTotal === 0) { setPreviewResult(null); return; }
                    const r = calculateShopeePriceForProfit(cmvTotal, tmc, otherVar);
                    if (!r) { setPreviewResult(null); return; }
                    price = r.price;
                    const sc = getShopeeCommission(price);
                    cPerc = sc.commissionPercent; fFee = sc.fixedFee; bLabel = sc.bracket.label;
                    mc = tmc; mcP = price > 0 ? (mc / price) * 100 : 0;
                }

                setPreviewResult({
                    price, profit: mc, margin: mcP,
                    commissionPercent: cPerc, commissionValue: price * cPerc / 100,
                    fixedFeeValue: fFee, repasse: price - (price * cPerc / 100) - fFee,
                    incomeTaxValue: price * itv / 100, bracketLabel: bLabel,
                });
            } else {
                const commV = parseFloat(commission) || 0;
                const ftV = parseFloat(fixedTax) || 0;
                const shV = parseFloat(shippingCost) || 0;
                const tpV = parseFloat(targetProfit) || 0;
                const wV = parseFloat(weight) || 0;

                if (cmvTotal === 0 && calculationMode !== 'price') { setPreviewResult(null); return; }

                const totalVarP = commV + atv + dv + itv + bv + cv;
                const calcPrice = (s: number, ft: number) => {
                    const fc = cmvTotal + s + ft;
                    if (calculationMode === 'margin') { const d = 1 - ((totalVarP + margin) / 100); return d > 0 ? fc / d : 0; }
                    if (calculationMode === 'profit') { const d = 1 - (totalVarP / 100); return d > 0 ? (fc + tpV) / d : 0; }
                    return parseFloat(desiredPrice) || 0;
                };

                let sp = 0, fs = shV;
                if (platform === 'ml') {
                    let cp = 0, cft = 0, cs = 0;
                    for (let i = 0; i < 5; i++) {
                        cft = getMLFixedFee(cp || cmvTotal * 2);
                        cs = (hasFreeShipping && wV > 0) ? getMLShippingCost(cp || cmvTotal * 2, wV) : shV;
                        cp = calcPrice(cs, cft);
                    }
                    sp = cp; fs = cs;
                } else {
                    sp = calcPrice(shV, ftV);
                }

                const eft = platform === 'ml' ? getMLFixedFee(sp) : ftV;
                const ffc = cmvTotal + fs + eft;
                const profit = sp - ffc - (sp * (totalVarP / 100));
                const am = sp > 0 ? (profit / sp) * 100 : margin;

                // Update ML fixedTax inline (avoids a separate cascading useEffect)
                if (platform === 'ml') {
                    const cf = getMLFixedFee(sp);
                    if (Math.abs(parseFloat(fixedTax || '0') - cf) > 0.01) setFixedTax(cf.toFixed(2));
                }

                setPreviewResult({ price: sp, profit, margin: am });
            }
        }, 300); // 300ms debounce

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [cmvTotal, commission, fixedTax, shippingCost, adTaxPercent, discountPercent,
        incomeTaxPercent, breakagePercent, collabPercent, targetProfit, weight, margin,
        calculationMode, desiredPrice, platform, hasFreeShipping, mlListingType]);

    const handleCalculate = () => {
        if (!previewResult) return;
        const commV = platform === 'shopee' ? (previewResult.commissionPercent || 0) : (parseFloat(commission) || 0);
        const ftV = platform === 'shopee' ? (previewResult.fixedFeeValue || 0) : (parseFloat(fixedTax) || 0);
        const shV = platform === 'shopee' ? 0 : (parseFloat(shippingCost) || 0);
        const atv = parseFloat(adTaxPercent) || 0;
        const dv = parseFloat(discountPercent) || 0;
        const itv = parseFloat(incomeTaxPercent) || 0;
        const bv = parseFloat(breakagePercent) || 0;
        const cv = parseFloat(collabPercent) || 0;
        const totalVP = commV + atv + dv + itv + bv + cv;
        const totalTaxes = (previewResult.price * (totalVP / 100)) + ftV;

        const product: ProductData = {
            id: Date.now().toString(), name: name || 'Produto Sem Nome', sku: sku || 'N/A',
            productCost: parseFloat(productCost) || 0, purchaseTax: parseFloat(purchaseTax) || 0,
            purchaseShipping: parseFloat(purchaseShipping) || 0, packagingCost: parseFloat(packagingCost) || 0,
            printingCost: parseFloat(printingCost) || 0, cmvTotal,
            cost: cmvTotal, fixedCost: 0, shippingCost: shV,
            adTaxPercent: atv, discountPercent: dv, taxPercent: commV, taxFixed: ftV,
            incomeTaxPercent: itv, breakagePercent: bv, collabPercent: cv,
            marginTarget: previewResult.margin, targetProfit: previewResult.profit,
            targetPrice: parseFloat(desiredPrice) || 0, calculationMode, platform,
            hasFreeShipping: platform === 'ml' ? hasFreeShipping : false,
            weight: parseFloat(weight) || 0,
        };

        setCurrentProduct(product);
        setCurrentResult({
            product, suggestedPrice: previewResult.price, totalTaxes,
            profit: previewResult.profit, margin: previewResult.margin,
            repasse: previewResult.repasse, commissionValue: previewResult.commissionValue,
            fixedFeeValue: previewResult.fixedFeeValue, incomeTaxValue: previewResult.incomeTaxValue,
        });
        navigate('/results');
    };

    // CurrencyInput and PercentInput are now defined outside the component (above)

    return (
        <div className="w-full max-w-7xl mx-auto px-2 py-2 lg:px-4 lg:pt-2 flex flex-col gap-2">
            <h1 className="text-xl font-bold text-white leading-tight text-center mb-2">Calculadora</h1>

            <div className="lg:grid lg:grid-cols-12 lg:gap-3 lg:items-start h-full">
                {/* LEFT COLUMN */}
                <div className="flex flex-col gap-2 lg:col-span-7">
                    {/* Platform Selection */}
                    <section className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-base">store</span>
                            Escolha a Plataforma
                        </h3>
                        <div className="bg-surface p-3 rounded-xl border border-border grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: 'ml', name: 'Mercado Livre', icon: 'storefront', color: 'bg-brand-ml', text: 'text-black' },
                                { id: 'shopee', name: 'Shopee', icon: 'shopping_bag', color: 'bg-brand-shopee', text: 'text-white' },
                                { id: 'shein', name: 'Shein', icon: 'checkroom', color: 'bg-white', text: 'text-black' },
                                { id: 'other', name: 'Outro', icon: 'add_circle', color: 'bg-surface', border: true, text: 'text-white' }
                            ].map((p: any) => (
                                <button key={p.id} onClick={() => handlePlatformChange(p.id as Platform)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 h-full group
                                        ${platform === p.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                                        ${p.border ? 'border border-border hover:border-primary' : ''} ${p.color}`}>
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
                            <DebouncedInput value={name} onValueChange={setName} label="Nome do Produto" icon="auto_fix_high" placeholder="Ex: Fone Bluetooth Pro..."
                                inputClassName="w-full rounded-lg border border-border bg-input-surface py-2 pl-3 pr-8 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm" />
                            <DebouncedInput value={sku} onValueChange={setSku} label="Código SKU" icon="qr_code_2" placeholder="Ex: SKU-001"
                                inputClassName="w-full rounded-lg border border-border bg-input-surface py-2 pl-3 pr-8 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm" />
                        </div>
                    </section>

                    {/* CMV Detalhado */}
                    <section className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-base">receipt_long</span>
                            CMV — Custo da Mercadoria Vendida
                        </h3>
                        <div className="bg-surface p-3 rounded-xl border border-border">
                            <div className="grid grid-cols-2 gap-2">
                                <CurrencyInput label="Custo do Produto" value={productCost} onChange={setProductCost} icon="shopping_cart" />
                                <CurrencyInput label="Imposto da Compra" value={purchaseTax} onChange={setPurchaseTax} icon="description" />
                                <CurrencyInput label="Frete de Compra" value={purchaseShipping} onChange={setPurchaseShipping} icon="local_shipping" />
                                <CurrencyInput label="Embalagem" value={packagingCost} onChange={setPackagingCost} icon="inventory_2" />
                                <CurrencyInput label="Impressão" value={printingCost} onChange={setPrintingCost} icon="print" />
                            </div>
                            <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">functions</span>
                                    <span className="text-sm font-bold text-primary">CMV Total</span>
                                </div>
                                <span className="text-lg font-extrabold text-white">
                                    {cmvTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* ML Specific */}
                    {platform === 'ml' && (
                        <section className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-brand-ml text-base">storefront</span>
                                Configurações Mercado Livre
                            </h3>
                            <div className="bg-surface p-3 rounded-xl border border-border flex flex-col gap-3">
                                <button onClick={() => setHasFreeShipping(p => !p)}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${hasFreeShipping ? 'bg-brand-ml/20 border-brand-ml text-brand-ml' : 'bg-background/50 border-border text-text-sec hover:border-text-sec'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined filled text-xl">local_shipping</span>
                                        <div className="flex flex-col text-left">
                                            <span className="text-sm font-bold">Oferecer Frete Grátis</span>
                                            <span className="text-[10px] opacity-80">Cálculo automático por peso e preço</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-3xl">{hasFreeShipping ? 'toggle_on' : 'toggle_off'}</span>
                                </button>
                                <div className="flex bg-background rounded-lg p-1 border border-border">
                                    <button className={`flex-1 py-1 px-2 rounded-md text-xs font-bold transition-all ${mlListingType === 'classic' ? 'bg-brand-ml text-black shadow' : 'text-text-sec hover:text-white'}`}
                                        onClick={() => { setMlListingType('classic'); setCommission('12'); }}>Clássico (12%)</button>
                                    <button className={`flex-1 py-1 px-2 rounded-md text-xs font-bold transition-all ${mlListingType === 'premium' ? 'bg-brand-ml text-black shadow' : 'text-text-sec hover:text-white'}`}
                                        onClick={() => { setMlListingType('premium'); setCommission('17'); }}>Premium (17%)</button>
                                </div>
                                {hasFreeShipping && (
                                    <label className="flex flex-col gap-2">
                                        <span className="text-sm font-medium text-text-sec">Peso do Produto (gramas)</span>
                                        <div className="relative">
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-sec font-semibold pointer-events-none">g</div>
                                            <DebouncedInput value={weight} onValueChange={setWeight} label="" placeholder="Ex: 500"
                                                inputClassName="w-full rounded-xl border border-border bg-input-surface py-3 pl-4 pr-12 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold" />
                                        </div>
                                    </label>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Shein Specific */}
                    {platform === 'shein' && (
                        <section className="flex flex-col gap-3">
                            <div className="bg-brand-shein/5 border border-brand-shein/20 rounded-xl p-4 flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-brand-shein font-bold">
                                    <span className="material-symbols-outlined">deployed_code</span>
                                    <h3>Dimensões da Embalagem (cm)</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <DebouncedInput value={sheinHeight} onValueChange={(v) => { setSheinHeight(v); recalcSheinFee(v, sheinWidth, sheinLength); }} label="Altura" placeholder="0"
                                        inputClassName="w-full rounded-lg border border-border bg-input-surface p-2 text-center text-white focus:border-brand-shein outline-none" />
                                    <DebouncedInput value={sheinWidth} onValueChange={(v) => { setSheinWidth(v); recalcSheinFee(sheinHeight, v, sheinLength); }} label="Largura" placeholder="0"
                                        inputClassName="w-full rounded-lg border border-border bg-input-surface p-2 text-center text-white focus:border-brand-shein outline-none" />
                                    <DebouncedInput value={sheinLength} onValueChange={(v) => { setSheinLength(v); recalcSheinFee(sheinHeight, sheinWidth, v); }} label="Comprimento" placeholder="0"
                                        inputClassName="w-full rounded-lg border border-border bg-input-surface p-2 text-center text-white focus:border-brand-shein outline-none" />
                                </div>
                                <div className="flex justify-between items-center text-xs text-text-sec pt-2 border-t border-border/50">
                                    <span>Peso Cubado: {((parseFloat(sheinHeight) || 0) * (parseFloat(sheinWidth) || 0) * (parseFloat(sheinLength) || 0) / 6000).toFixed(4)} kg</span>
                                    <span className="font-bold text-brand-shein">Intervenção: R$ {fixedTax}</span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Shopee Commission Table */}
                    {platform === 'shopee' && (
                        <section className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-brand-shopee text-base">info</span>
                                Tabela de Comissões Shopee (CNPJ)
                            </h3>
                            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                                <div className="grid grid-cols-3 gap-0 text-[10px] font-bold text-text-sec uppercase bg-background/60 px-3 py-2 border-b border-border">
                                    <span>Valor do Item</span><span className="text-center">Comissão</span><span className="text-right">Taxa Fixa</span>
                                </div>
                                {SHOPEE_BRACKETS.map((b, i) => {
                                    const isActive = previewResult && previewResult.bracketLabel === b.label;
                                    return (
                                        <div key={i} className={`grid grid-cols-3 gap-0 px-3 py-2 text-xs border-b border-border/50 transition-all ${isActive ? 'bg-brand-shopee/10 text-brand-shopee font-bold' : 'text-text-sec'}`}>
                                            <span>{b.label}</span>
                                            <span className="text-center">{b.commissionPercent}%</span>
                                            <span className="text-right">R$ {b.fixedFee}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col gap-2 lg:col-span-5 lg:sticky lg:top-2 mt-2 lg:mt-0">
                    {/* Custos Variáveis de Venda */}
                    <section className="flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-base">calculate</span>
                            Custos Variáveis de Venda
                        </h3>
                        <div className="bg-surface p-3 rounded-xl border border-border grid gap-2">
                            {/* Non-Shopee: Commission, Fixed Tax, Shipping */}
                            {platform !== 'shopee' && (
                                <div className="grid grid-cols-2 gap-2 pb-2 mb-2 border-b border-border/50">
                                    <PercentInput label="Comissão" value={commission} onChange={setCommission} />
                                    <CurrencyInput label="Taxa Fixa (Plat.)" value={fixedTax}
                                        onChange={(v) => { if (platform === 'other') setFixedTax(v); }} />
                                    <CurrencyInput label="Frete de Envio" value={shippingCost} onChange={setShippingCost} />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <PercentInput label="Imposto de Venda" value={incomeTaxPercent} onChange={setIncomeTaxPercent} />
                                <PercentInput label="ADS" value={adTaxPercent} onChange={setAdTaxPercent} />
                                <PercentInput label="Perca / Quebra" value={breakagePercent} onChange={setBreakagePercent} />
                                <PercentInput label="Comissão Colab" value={collabPercent} onChange={setCollabPercent} />
                                <PercentInput label="Desconto Promo." value={discountPercent} onChange={setDiscountPercent} />
                            </div>
                        </div>
                    </section>

                    {/* Metas */}
                    <section className="flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-base">tune</span>
                            Meta de Cálculo
                        </h3>
                        <div className="bg-surface p-3 rounded-xl border border-border">
                            <div className="flex gap-1 mb-2 p-1 bg-background rounded-lg overflow-x-auto no-scrollbar">
                                <button onClick={() => setCalculationMode('price')}
                                    className={`whitespace-nowrap flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${calculationMode === 'price' ? 'bg-primary text-white shadow-md' : 'text-text-sec hover:text-white'}`}>
                                    <span className="material-symbols-outlined text-sm align-middle mr-1">stylus_note</span>
                                    Preço R$
                                </button>
                                <button onClick={() => setCalculationMode('margin')}
                                    className={`whitespace-nowrap flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${calculationMode === 'margin' ? 'bg-primary text-white shadow-md' : 'text-text-sec hover:text-white'}`}>
                                    <span className="material-symbols-outlined text-sm align-middle mr-1">percent</span>
                                    MC %
                                </button>
                                <button onClick={() => setCalculationMode('profit')}
                                    className={`whitespace-nowrap flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${calculationMode === 'profit' ? 'bg-primary text-white shadow-md' : 'text-text-sec hover:text-white'}`}>
                                    <span className="material-symbols-outlined text-xs align-middle mr-1">attach_money</span>
                                    MC R$
                                </button>
                            </div>

                            {calculationMode === 'price' ? (
                                <label className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-text-sec">Preço de Venda</span>
                                        <span className="text-[10px] font-bold text-secondary bg-secondary/20 px-1 py-0.5 rounded">Cálculo Reverso</span>
                                    </div>
                                    <div className="relative flex items-center">
                                    <DebouncedInput value={desiredPrice} onValueChange={setDesiredPrice} type="currency" label="" placeholder="199,00"
                                        inputClassName="w-full rounded-lg border border-border bg-input-surface py-2 pl-9 pr-3 text-base font-bold text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                                    </div>
                                    <p className="text-[10px] text-text-sec mt-0.5">
                                        {platform === 'shopee' ? 'Descubra a MC e MC% a partir do preço desejado' : 'Descubra o lucro e a margem a partir do preço'}
                                    </p>
                                </label>
                            ) : calculationMode === 'margin' ? (
                                <label className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-text-sec">{platform === 'shopee' ? 'MC % Desejada' : 'Margem Lucro'}</span>
                                        <span className="text-[10px] font-bold text-primary bg-primary/20 px-1 py-0.5 rounded">15-25%</span>
                                    </div>
                                    <div className="relative flex items-center mb-1">
                                        <DebouncedInput value={String(margin)} onValueChange={(v) => setMargin(Number(v) || 0)} type="percent" label="" placeholder="20"
                                            inputClassName="w-full rounded-lg border border-border bg-input-surface py-2 pl-3 pr-8 text-base font-bold text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                                    </div>
                                    <input type="range" min="0" max="100" value={margin} onChange={(e) => setMargin(Number(e.target.value))}
                                        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary" />
                                </label>
                            ) : (
                                <label className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-text-sec">{platform === 'shopee' ? 'MC Desejada (R$)' : 'Lucro Desejado'}</span>
                                        <span className="text-[10px] font-bold text-success bg-success/20 px-1 py-0.5 rounded">Valor Fixo</span>
                                    </div>
                                    <div className="relative flex items-center">
                                    <DebouncedInput value={targetProfit} onValueChange={setTargetProfit} type="currency" label="" placeholder="50,00"
                                        inputClassName="w-full rounded-lg border border-border bg-input-surface py-2 pl-9 pr-3 text-base font-bold text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                                    </div>
                                    <p className="text-[10px] text-text-sec mt-0.5">
                                        {platform === 'shopee' ? 'Defina a Margem de Contribuição desejada por unidade' : 'Defina quanto quer lucrar por unidade vendida'}
                                    </p>
                                </label>
                            )}
                        </div>
                    </section>

                    {/* Preview — always in DOM to prevent layout shifts that close mobile keyboard */}
                    <div className={`mt-2 rounded-xl p-3 border bg-surface border-border transition-all duration-200 ${previewResult ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 p-0 m-0 border-0 overflow-hidden'}`}>
                        {previewResult && (<>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-text-sec">Preço de Venda</span>
                                <span className="text-xs text-text-sec">{platform === 'shopee' ? 'Margem de Contribuição' : 'Lucro Estimado'}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-bold text-white">
                                    {previewResult.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                                <div className="text-right">
                                    <span className={`text-lg font-bold ${previewResult.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {previewResult.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                    <div className="text-[10px] text-text-sec">
                                        MC: {previewResult.margin.toFixed(2)}%
                                    </div>
                                </div>
                            </div>

                            {/* Shopee Breakdown */}
                            {platform === 'shopee' && previewResult.commissionPercent !== undefined && (
                                <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-sec">Comissão ({previewResult.commissionPercent}%)</span>
                                        <span className="text-danger font-semibold">-{previewResult.commissionValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-sec">Taxa Fixa</span>
                                        <span className="text-danger font-semibold">-{previewResult.fixedFeeValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-sec font-bold">Repasse Shopee</span>
                                        <span className="text-white font-bold">{previewResult.repasse?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    {(previewResult.incomeTaxValue || 0) > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-text-sec">Imposto Venda ({incomeTaxPercent}%)</span>
                                            <span className="text-danger font-semibold">-{previewResult.incomeTaxValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-sec">CMV</span>
                                        <span className="text-danger font-semibold">-{cmvTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div className="flex justify-between text-xs pt-1.5 border-t border-border/30">
                                        <span className="text-brand-shopee font-bold text-[10px] uppercase">Faixa: {previewResult.bracketLabel}</span>
                                    </div>
                                </div>
                            )}
                        </>)}
                    </div>

                    <button onClick={handleCalculate} disabled={!previewResult}
                        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
                        <span className="material-symbols-outlined text-2xl">calculate</span>
                        {platform === 'shopee' ? 'Calcular MC' : 'Calcular Preço Ideal'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Calculator;
