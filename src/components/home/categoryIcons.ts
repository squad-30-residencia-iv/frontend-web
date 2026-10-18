import { Shirt, ShoppingCart, Sofa, Sparkles, Ticket, Tv, type LucideIcon } from 'lucide-react'

// Ícone de cada categoria da Home. Fica na interface (não no mock) para o dado continuar serializável.
const categoryIcons: Record<string, LucideIcon> = {
  supermarket: ShoppingCart,
  electronics: Tv,
  fashion: Shirt,
  home: Sofa,
  beauty: Sparkles,
}

export function getCategoryIcon(categoryId: string): LucideIcon {
  return categoryIcons[categoryId] ?? Ticket
}
