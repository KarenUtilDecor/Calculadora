export type Platform = 'ml' | 'shopee' | 'shein' | 'other';

export interface ProductData {
    id: string;
    name: string;
    sku: string;
    // CMV Detalhado
    productCost: number;       // Custo do produto (compra)
    purchaseTax: number;       // Imposto da compra
    purchaseShipping: number;  // Frete de compra
    packagingCost: number;     // Embalagem
    printingCost: number;      // Impressão (etiquetas, etc)
    cmvTotal: number;          // CMV Total = soma dos 5 acima
    // Legacy field - mantido para compatibilidade
    cost: number;
    fixedCost: number;
    shippingCost: number;      // Frete/Envio (venda)
    adTaxPercent: number;      // ADS %
    discountPercent: number;   // Desconto Promocional %
    taxPercent: number;        // Comissão da plataforma
    taxFixed: number;          // Taxa fixa da plataforma
    // Campos variáveis
    incomeTaxPercent?: number; // Imposto de Venda
    breakagePercent?: number;  // Perca/Quebra
    collabPercent?: number;    // Comissão Colab
    operationCostPercent?: number; // Custo Total de Operação
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
    // MC fields
    repasse?: number;          // Repasse da plataforma
    commissionValue?: number;  // Valor da comissão em R$
    fixedFeeValue?: number;    // Valor da taxa fixa em R$
    incomeTaxValue?: number;   // Valor do imposto de venda em R$
    spikeDayMode?: boolean;
    spikeDayTax?: number;
}
