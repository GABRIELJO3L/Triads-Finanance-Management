import React from 'react';

export function formatINR(amount) {
  if (amount === null || amount === undefined) return '₹0';
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatINRDecimal(amount) {
  if (amount === null || amount === undefined) return '₹0.00';
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function getProfitClass(value) {
  const num = parseFloat(value) || 0;
  return num >= 0 ? 'text-money-green' : 'text-money-red';
}

export function getMonthName(yearMonth) {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  // Custom billing period: 16th of the given month to 15th of the next month
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 16);
  const endDate = new Date(parseInt(year), parseInt(month), 15);
  const startLabel = startDate.toLocaleString('en-IN', { day: 'numeric', month: 'short' });
  const endLabel = endDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

export function getProfitPercent(revenue, cost) {
  if (!revenue || revenue === 0) return 0;
  return (((revenue - cost) / revenue) * 100).toFixed(1);
}
