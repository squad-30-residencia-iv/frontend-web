/** Taxa de utilização em % (resgatados ÷ emitidos). Sem emitidos retorna null (exibido como "—"). */
export function calculateUtilizationRate(redeemed: number, issued: number): number | null {
  if (issued <= 0) return null
  return (redeemed / issued) * 100
}
