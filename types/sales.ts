export interface Sale {
  id: number;
  drink_name: string;
  price: number;
  bottles_sold: number;
  total_amount: number;
  sale_date: string;
  created_at: string;
}

export interface DailySales {
  date: string;
  dayName: string;
  dayNumber: number;
  month: string;
  sales: Sale[];
  year: number;  
  dailyTotal: number;
  dailyBottles: number;
}

export interface DrinkSalesSummary {
  drink_name: string;
  total_bottles: number;
  total_revenue: number;
}