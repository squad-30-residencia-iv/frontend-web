import type { HomeCategory } from '../../types/home'
import './CategoryFilter.css'

export const allCategoriesId = 'all'

export interface CategoryFilterProps {
  categories: readonly HomeCategory[]
  selectedId: string
  onChange: (categoryId: string) => void
}

export function CategoryFilter({ categories, selectedId, onChange }: CategoryFilterProps) {
  const options: readonly HomeCategory[] = [{ id: allCategoriesId, label: 'Todas' }, ...categories]

  return (
    <div className="home-filter" role="group" aria-label="Filtrar campanhas por categoria">
      {options.map(option => <button
        key={option.id}
        type="button"
        className="home-filter-pill"
        aria-pressed={option.id === selectedId}
        onClick={() => onChange(option.id)}
      >{option.label}</button>)}
    </div>
  )
}
