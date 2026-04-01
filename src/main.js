/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const {discount, sale_price, quantity} = purchase;
   return sale_price * quantity * (1 - (discount ?? 0) / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const profit = Number(seller?.profit) || 0;

    if (index === 0) return profit * 15 / 100;
    if (index === 1 || index === 2) return profit * 10 / 100;
    if (index === total - 1) return 0;
    return profit * 5 / 100;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    if (!data ||
        !Array.isArray(data.sellers) ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.purchase_records) ||
        data.sellers.length === 0 ||
        data.products.length === 0 ||
        data.purchase_records.length === 0) {
        throw new Error('Неккоректные входные данные');
    }
    // @TODO: Проверка наличия опций
    const {calculateRevenue, calculateBonus} = options ?? {};
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Чего-то не хватает');
    }
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        sales_count: 0,
        profit: 0,
        bonus: 0,
        revenue: 0,
        products_sold: {},
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const productIndex = new Map(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const sellerStat = sellerStats.find(s => s.seller_id === record.seller_id);
        if (!sellerStat) {
            return;
        }

        record.items.forEach(item => {
            const product = productIndex.get(item.sku);
            if (!product) {
                return;
            }

            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, product);
            const lineGross = item.sale_price * item.quantity;
            const profit = revenue - cost;

            if (!sellerStat.products_sold[item.sku]) {
            sellerStat.products_sold[item.sku] = 0;
            }
            sellerStat.products_sold[item.sku] += item.quantity;
            if (item === record.items[0]) {
                sellerStat.sales_count += 1;
            }
            sellerStat.profit += profit;
            sellerStat.revenue += lineGross;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    
sellerStats.sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([sku, quantity]) => ({ sku, quantity }));
    }); 
   
    // @TODO: Подготовка итоговой коллекции с нужными полями
    const round2 = (n) => Math.round(n * 100) / 100;
    return sellerStats.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: round2(seller.revenue),
        profit: round2(seller.profit),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: round2(seller.bonus),
    }));
}
