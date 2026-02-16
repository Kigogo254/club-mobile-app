export interface Drink {
  id: number;
  name: string;
  bottle_icon: string;
  count_in_stock: number;
  price: number;
  max_stock: number;
  created_at: string;
  updated_at: string;
   "buying-price": number; // buying price with hyphen
}

export interface StockSummary {
  totalStockValue: number;
  totalDrinks: number;
  potentialRevenue: number;
  estimatedProfit: number;
}