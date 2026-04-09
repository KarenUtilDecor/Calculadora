/**
 * Tabela de Comissões Shopee para vendedores CNPJ
 * Baseada na tabela oficial (sem Subsídio Pix)
 */

export interface ShopeeCommissionBracket {
    minPrice: number;
    maxPrice: number;
    commissionPercent: number;
    fixedFee: number;
    label: string;
}

export const SHOPEE_BRACKETS: ShopeeCommissionBracket[] = [
    { minPrice: 0, maxPrice: 79.99, commissionPercent: 20, fixedFee: 4, label: 'Até R$79,99' },
    { minPrice: 80, maxPrice: 99.99, commissionPercent: 14, fixedFee: 16, label: 'R$80 a R$99,99' },
    { minPrice: 100, maxPrice: 199.99, commissionPercent: 14, fixedFee: 20, label: 'R$100 a R$199,99' },
    { minPrice: 200, maxPrice: 499.99, commissionPercent: 14, fixedFee: 26, label: 'R$200 a R$499,99' },
    { minPrice: 500, maxPrice: Infinity, commissionPercent: 14, fixedFee: 26, label: 'Acima de R$500' },
];

/**
 * Retorna a comissão e taxa fixa da Shopee com base no preço de venda
 */
export function getShopeeCommission(price: number): { commissionPercent: number; fixedFee: number; bracket: ShopeeCommissionBracket } {
    const bracket = SHOPEE_BRACKETS.find(b => price >= b.minPrice && price <= b.maxPrice)
        || SHOPEE_BRACKETS[SHOPEE_BRACKETS.length - 1];

    return {
        commissionPercent: bracket.commissionPercent,
        fixedFee: bracket.fixedFee,
        bracket,
    };
}

/**
 * Calcula o preço de venda no modo "Margem" (MC%) para Shopee.
 * Tenta cada faixa e retorna o preço consistente.
 * 
 * Fórmula: Preço = (TaxaFixa + CMV) / (1 - MC%/100 - Comissão%/100 - OutrasVariáveis%/100)
 */
export function calculateShopeePriceForMargin(
    cmv: number,
    targetMCPercent: number,
    otherVariablePercent: number // Imposto venda + ADS + Desconto + Quebra + Colab
): { price: number; bracket: ShopeeCommissionBracket } | null {
    for (const bracket of SHOPEE_BRACKETS) {
        const divisor = 1 - (targetMCPercent / 100) - (bracket.commissionPercent / 100) - (otherVariablePercent / 100);
        if (divisor <= 0) continue;

        const price = (bracket.fixedFee + cmv) / divisor;

        // Verifica se o preço cai dentro da faixa
        if (price >= bracket.minPrice && price <= bracket.maxPrice) {
            return { price, bracket };
        }
        // Para a última faixa (Infinity), verificar apenas minPrice
        if (bracket.maxPrice === Infinity && price >= bracket.minPrice) {
            return { price, bracket };
        }
    }
    return null;
}

/**
 * Calcula o preço de venda no modo "Lucro" (MC em R$) para Shopee.
 * 
 * MC = Preço - Preço×Comissão% - TaxaFixa - Preço×OutrasVar% - CMV
 * MC = Preço×(1 - Comissão% - OutrasVar%) - TaxaFixa - CMV
 * Preço = (MC + TaxaFixa + CMV) / (1 - Comissão%/100 - OutrasVar%/100)
 */
export function calculateShopeePriceForProfit(
    cmv: number,
    targetMC: number,
    otherVariablePercent: number
): { price: number; bracket: ShopeeCommissionBracket } | null {
    for (const bracket of SHOPEE_BRACKETS) {
        const divisor = 1 - (bracket.commissionPercent / 100) - (otherVariablePercent / 100);
        if (divisor <= 0) continue;

        const price = (targetMC + bracket.fixedFee + cmv) / divisor;

        if (price >= bracket.minPrice && (price <= bracket.maxPrice || bracket.maxPrice === Infinity)) {
            return { price, bracket };
        }
    }
    return null;
}
