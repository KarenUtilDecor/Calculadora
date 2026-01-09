/**
 * Custo de envio do Mercado Livre baseado no preço e peso.
 * Baseado nas tabelas fornecidas pelo usuário.
 */

// Tabela de Custo Fixo do ML baseada no preço de venda
export const getMLFixedFee = (price: number): number => {
    if (price < 12.50) return 0.50; // R$ 0.50 (User specified) - Usually ML min is higher but following prompt
    if (price < 29.00) return 6.25;
    if (price < 50.00) return 6.50;
    if (price <= 79.00) return 6.75;
    return 0.00; // Acima de 79 is free
};

export const getMLShippingCost = (price: number, weightInGrams: number): number => {
    // Caso especial: Preço entre 19 e 78,99 o ML paga o frete (custo zero para o vendedor)
    if (price >= 19 && price <= 78.99) {
        return 0;
    }

    const weights = [300, 500, 1000, 2000, 3000, 4000, 5000, 9000, 13000, 17000, 23000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 125000, 150000, Infinity];

    let tableIndex = -1;
    if (price < 19) {
        tableIndex = 0; // Tabela 1: < 79 (usada aqui para < 19 conforme regra)
    } else if (price >= 79 && price <= 99.99) {
        tableIndex = 1; // Tabela 2
    } else if (price >= 100 && price <= 119.99) {
        tableIndex = 2; // Tabela 3
    } else if (price >= 120 && price <= 149.99) {
        tableIndex = 3; // Tabela 4
    } else if (price >= 150 && price <= 199.99) {
        tableIndex = 4; // Tabela 5
    } else if (price >= 200) {
        tableIndex = 5; // Tabela 6
    } else {
        // Fallback para segurança caso algo escape das faixas
        return 0;
    }

    const costs = [
        // Tabela 1: Produtos novos < 79 (usado para < 19), usados e Grátis
        [39.9, 42.9, 44.9, 46.9, 49.9, 53.9, 56.9, 88.9, 131.9, 146.9, 171.9, 197.9, 203.9, 210.9, 224.9, 240.9, 251.9, 279.9, 319.9, 357.9, 379.9, 498.9],
        // Tabela 2: 79 a 99,99
        [11.97, 12.87, 13.47, 14.07, 14.97, 16.17, 17.07, 26.67, 39.57, 44.07, 51.57, 59.37, 61.17, 63.27, 67.47, 72.27, 75.57, 83.97, 95.97, 107.37, 113.97, 149.67],
        // Tabela 3: 100 a 119,99
        [13.97, 15.02, 15.72, 16.42, 17.47, 18.87, 19.92, 31.12, 46.17, 51.42, 60.17, 69.27, 71.37, 73.82, 78.72, 84.32, 88.17, 97.97, 111.97, 125.27, 132.97, 174.62],
        // Tabela 4: 120 a 149,99
        [15.96, 17.16, 17.96, 18.76, 19.96, 21.56, 22.76, 35.56, 52.76, 58.76, 68.76, 79.16, 81.56, 84.36, 89.96, 96.36, 100.76, 111.96, 127.96, 143.16, 151.96, 199.56],
        // Tabela 5: 150 a 199,99
        [17.96, 19.31, 20.21, 21.11, 22.46, 24.26, 25.61, 40.01, 59.36, 66.11, 77.36, 89.06, 91.76, 94.91, 101.21, 108.41, 113.36, 125.96, 143.96, 161.06, 170.96, 224.51],
        // Tabela 6: > 200
        [19.95, 21.45, 22.45, 23.45, 24.95, 26.95, 28.45, 44.45, 65.95, 73.45, 85.95, 98.95, 101.95, 105.45, 112.45, 120.45, 125.95, 139.95, 159.95, 178.95, 189.95, 249.45]
    ];

    const weightIndex = weights.findIndex(w => weightInGrams <= w);
    return costs[tableIndex][weightIndex];
};
