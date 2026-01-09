/**
 * Custo de intervenção de frete da Shein baseado no peso cubado.
 * Peso Cubado = (A x L x C) / 6000.
 */

export const getSheinShippingFee = (height: number, width: number, length: number): number => {
    // 1. Calcular peso cubado em KG
    // Dimensões esperadas em cm
    const cubicWeight = (height * width * length) / 6000;

    // 2. Tabela de Preços (Peso em Kg -> Valor em R$)
    if (cubicWeight <= 0.3) return 4.00;
    if (cubicWeight <= 0.6) return 5.00;
    if (cubicWeight <= 0.9) return 6.00;
    if (cubicWeight <= 1.2) return 8.00;
    if (cubicWeight <= 1.5) return 10.00;
    if (cubicWeight <= 2.0) return 12.00;
    if (cubicWeight <= 5.0) return 15.00;
    if (cubicWeight <= 9.0) return 32.00;
    if (cubicWeight <= 13.0) return 63.00;
    if (cubicWeight <= 17.0) return 73.00;
    if (cubicWeight <= 23.0) return 89.00;
    if (cubicWeight <= 30.0) return 106.00;

    // Fallback para pesos muito altos (assumindo topo da tabela ou erro)
    return 106.00;
};

export const calculateCubicWeight = (height: number, width: number, length: number): number => {
    return (height * width * length) / 6000;
};
