const numberFormatter = new Intl.NumberFormat('ja-JP');

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const currencyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

export const formatNumber = (value: number): string => numberFormatter.format(value);

export const formatDate = (value: Date): string => dateFormatter.format(value);

export const formatDateTime = (value: Date): string => dateTimeFormatter.format(value);

export const formatCurrency = (value: number): string => currencyFormatter.format(value);
