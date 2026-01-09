export type Platform = 'ml' | 'shopee' | 'shein' | 'other';

export interface ProductData {
    id: string;
    name: string;
    sku: string;
    cost: number;
    fixedCost: number;
    shippingCost: number;      // Frete/Envio
    adTaxPercent: number; // Agora será usado como ADS %
    discountPercent: number;   // Desconto Promocional %
    taxPercent: number; // Comissão da plataforma
    taxFixed: number;
    // Novos campos
    incomeTaxPercent?: number; // Imposto
    breakagePercent?: number;  // Perca/Quebra
    collabPercent?: number;    // Comissão Colab
    marginTarget: number;
    targetProfit?: number;     // Lucro desejado em R$
    targetPrice?: number;      // Preço de venda desejado em R$
    calculationMode: 'margin' | 'profit' | 'price'; // Modo de cálculo
    platform: Platform;
    hasFreeShipping?: boolean;
    weight?: number;
    dimensions?: {
        height: number;
        width: number;
        length: number;
    };
}

export interface CalculationResult {
    product: ProductData;
    suggestedPrice: number;
    totalTaxes: number;
    profit: number;
    margin: number;
    spikeDayMode?: boolean;
    spikeDayTax?: number;
}
