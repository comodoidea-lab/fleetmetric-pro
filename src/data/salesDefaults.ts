import type { SalesCategory } from '../types';

export const DEFAULT_SALES_CATEGORIES: SalesCategory[] = [
  { id: 'sales-category-uber', name: 'Uber', color: '#2563eb', icon: 'local_taxi' },
  { id: 'sales-category-demaekan', name: '出前館', color: '#db2777', icon: 'delivery_dining' },
  { id: 'sales-category-direct', name: '自社・直接売上', color: '#0d9488', icon: 'storefront' },
  { id: 'sales-category-other', name: 'その他', color: '#64748b', icon: 'payments' },
];
