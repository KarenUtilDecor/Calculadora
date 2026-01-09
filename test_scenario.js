
const weights = [300, 500, 1000, 2000, 3000, 4000, 5000, 9000, 13000, 17000, 23000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 125000, 150000, Infinity];
// Costs from lib/mlShipping.ts (Table 1 for < 79/Free, but actually logic updates... let's allow lookup)
// If Free Shipping is ON, we use the table.
// 2700g falls into index 4 (3000g).
// If price > 79 (likely), table index depends on price.
// 2700g is usually usually 2kg-3kg range.
// Let's copy the logic from lib/mlShipping.ts exactly.

const getMLFixedFee = (price) => {
    if (price < 12.50) return 0.50;
    if (price < 29.00) return 6.25;
    if (price < 50.00) return 6.50;
    if (price <= 79.00) return 6.75;
    return 0.00;
};

const getMLShippingCost = (price, weightInGrams) => {
    // If price between 19 and 78.99, ML pays shipping (return 0).
    // BUT user says "Oferecer Frete Grátis".
    // If user offers free shipping, they pay.
    // However, the function in lib/mlShipping.ts has this logic:
    // if (price >= 19 && price <= 78.99) return 0;
    // We might need to bypass this if the user FORCES free shipping?
    // In Calculator.tsx:
    // if (platform === 'ml' && hasFreeShipping && weightVal > 0) { ... }
    // The Calculator uses `getMLShippingCost`.
    // If price falls in 19-78.99, `getMLShippingCost` returns 0.
    // This implies that for ML, if price is in that range, the seller DOES NOT pay shipping even if they check "Free Shipping"?
    // Usually, ML enforces "Seller pays" above 79. Below 79, buyer pays.
    // If seller OFFERS free shipping below 79, they pay.
    // The current `getMLShippingCost` returns 0 for 19-78.99. This might be wrong if "Free Shipping" is actively checked.
    // But let's verify what the calculator DOES.

    // Logic from lib/mlShipping.ts:
    if (price >= 19 && price <= 78.99) return 0; // This might be the "Buyer pays" logic?

    // Costs array (index 4 for <= 3000g)
    // Table indices:
    // 0: < 19
    // 1: 79 - 99.99
    // 2: 100 - 119.99
    // 3: 120 - 149.99
    // 4: 150 - 199.99
    // 5: >= 200

    let tableIndex = -1;
    if (price < 19) tableIndex = 0;
    else if (price >= 79 && price <= 99.99) tableIndex = 1;
    else if (price >= 100 && price <= 119.99) tableIndex = 2;
    else if (price >= 120 && price <= 149.99) tableIndex = 3;
    else if (price >= 150 && price <= 199.99) tableIndex = 4;
    else if (price >= 200) tableIndex = 5;
    else return 0; // Fallback (shouldn't happen with 19-78.99 logic above)

    const costs = [
        [39.9, 42.9, 44.9, 46.9, 49.9, 53.9, 56.9, 88.9, 131.9, 146.9, 171.9, 197.9, 203.9, 210.9, 224.9, 240.9, 251.9, 279.9, 319.9, 357.9, 379.9, 498.9],
        [11.97, 12.87, 13.47, 14.07, 14.97, 16.17, 17.07, 26.67, 39.57, 44.07, 51.57, 59.37, 61.17, 63.27, 67.47, 72.27, 75.57, 83.97, 95.97, 107.37, 113.97, 149.67],
        [13.97, 15.02, 15.72, 16.42, 17.47, 18.87, 19.92, 31.12, 46.17, 51.42, 60.17, 69.27, 71.37, 73.82, 78.72, 84.32, 88.17, 97.97, 111.97, 125.27, 132.97, 174.62],
        [15.96, 17.16, 17.96, 18.76, 19.96, 21.56, 22.76, 35.56, 52.76, 58.76, 68.76, 79.16, 81.56, 84.36, 89.96, 96.36, 100.76, 111.96, 127.96, 143.16, 151.96, 199.56],
        [17.96, 19.31, 20.21, 21.11, 22.46, 24.26, 25.61, 40.01, 59.36, 66.11, 77.36, 89.06, 91.76, 94.91, 101.21, 108.41, 113.36, 125.96, 143.96, 161.06, 170.96, 224.51],
        [19.95, 21.45, 22.45, 23.45, 24.95, 26.95, 28.45, 44.45, 65.95, 73.45, 85.95, 98.95, 101.95, 105.45, 112.45, 120.45, 125.95, 139.95, 159.95, 178.95, 189.95, 249.45]
    ];

    const weightIndex = weights.findIndex(w => weightInGrams <= w);
    return costs[tableIndex][weightIndex];
};

// Simulation Inputs - LOW COST SCENARIO
const costVal = 10.00;
const fixedCostVal = 5.00;
const commissionVal = 12; // Classic
const adTaxVal = 0;
const discountVal = 0;
const incomeTaxVal = 4;
const breakageVal = 0;
const collabVal = 0;
const weightVal = 300; // Light
const margin = 20;

// Total Variable Percent
const totalVariablePercent = commissionVal + adTaxVal + discountVal + incomeTaxVal + breakageVal + collabVal;

// Iterative Calculation provided in Calculator.tsx
// 1. Calculate Price based on Shipping 0
// 2. Get Shipping for Price 1
// 3. Calculate Price based on Shipping 1
// 4. Get Shipping for Price 2
// 5. Final Price

const calculateForShipping = (sVal, currentFixedTax) => {
    const totalFixedCosts = costVal + fixedCostVal + sVal + currentFixedTax;
    let price = 0;
    // Margin Mode logic: price = fixed / (1 - variable%)
    // divisor = 1 - ((36 + 20) / 100) = 1 - 0.56 = 0.44
    const divisor = 1 - ((totalVariablePercent + margin) / 100);
    if (divisor > 0) price = totalFixedCosts / divisor;
    return price;
};

// Start Loop
// Note: Calculator.tsx uses `fixedTaxVal` from state, which is also auto-updated based on price.
// But the `calculateForShipping` function inside `useEffect` logic uses `fixedTaxVal` as a passed or closed-over variable.
// In the useEffect hook, `fixedTax` is a dependency.
// But the auto-update of `fixedTax` happens in a separate useEffect.
// This might cause a "blink" or 2-step update.
// In the simulation, we should try to converge or just run the logic that determines price.

// Actually, `fixedTaxVal` (ML Fixed Fee) depends on PRICE.
// But `calculateForShipping` takes `sVal` (Shipping) and `fixedTaxVal`.
// This is a multi-variable convergence.
// Let's emulate the React cycle roughly.

let currentPrice = 0;
let currentFixedTax = 0;
let currentShipping = 0;

console.log(`Starting Simulation`);
console.log(`Cost: ${costVal}, Fixed: ${fixedCostVal}, Vars: ${totalVariablePercent}%, Margin: ${margin}%`);

// Iteration 1 (State 0)
// Fixed Tax starts at 0 or 6? Code defaults to 0 for ML.
currentFixedTax = 0;
// Shipping 0
currentShipping = 0;

let p1 = calculateForShipping(0, currentFixedTax);
console.log(`P1 (Ship 0, Tax 0): ${p1.toFixed(2)}`);

// Recalculate Shipping based on P1
let s1 = getMLShippingCost(p1, weightVal);
console.log(`S1 (for P1): ${s1.toFixed(2)}`);

// Recalculate Fixed Tax based on P1?
// The code relies on `fixedTax` state which updates via useEffect.
// So in the first render cycle, it uses the OLD fixedTax (0).
// Then `setFixedTax` updates.
// Let's assume we want the stabilized value.
// We can loop until convergence.

for (let i = 0; i < 5; i++) {
    // Determine Shipping based on current price
    currentShipping = getMLShippingCost(currentPrice, weightVal);
    // Determine Fixed Tax based on current price
    currentFixedTax = getMLFixedFee(currentPrice);

    // Calculate Price
    let newPrice = calculateForShipping(currentShipping, currentFixedTax);

    console.log(`Iter ${i}: Price ${newPrice.toFixed(2)} (Ship ${currentShipping}, Tax ${currentFixedTax})`);

    if (Math.abs(newPrice - currentPrice) < 0.01) break;
    currentPrice = newPrice;
}

console.log(`Final Price: ${currentPrice.toFixed(2)}`);
console.log(`Variables:`);
console.log(`- Shipping: ${currentShipping}`);
console.log(`- Fixed Tax: ${currentFixedTax}`);
console.log(`- Commission (17%): ${(currentPrice * 0.17).toFixed(2)}`);
console.log(`- Imposto (12%): ${(currentPrice * 0.12).toFixed(2)}`);
console.log(`- ADS (5%): ${(currentPrice * 0.05).toFixed(2)}`);
console.log(`- Collab (1.5%): ${(currentPrice * 0.015).toFixed(2)}`);
console.log(`- Perca (0.5%): ${(currentPrice * 0.005).toFixed(2)}`);

const totalDeductions = costVal + fixedCostVal + currentShipping + currentFixedTax + (currentPrice * (totalVariablePercent / 100));
const profit = currentPrice - totalDeductions;
console.log(`Profit: ${profit.toFixed(2)}`);
console.log(`Margin: ${(profit / currentPrice * 100).toFixed(2)}%`);
