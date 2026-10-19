const numberFormat = new Intl.NumberFormat('pt-BR')

// "2024-11-20" -> "20/11/2024"
export function formatDate(isoDate: string): string {
  return isoDate.split('-').reverse().join('/')
}

// "2024-11-20" a "2024-11-30" -> "20/11 a 30/11/2024"
export function formatPeriod(start: string, end: string): string {
  return `${formatDate(start).slice(0, 5)} a ${formatDate(end)}`
}

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}
