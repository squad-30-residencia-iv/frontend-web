import { fetchCategories, fetchProducts } from '../../services/registry'
import type { RegistryRow } from '../../types/registry'
import { RegistryColumn } from './RegistryColumn'
import { categoryRow, productRow } from './registryRows'
import type { RegistryEditorActions } from './useRegistryEditor'
import { useRegistryList } from './useRegistryList'
import './RegistryPanel.css'

interface CatalogPanelProps {
  categoryId: string | null
  onCategoryChange: (categoryId: string) => void
  refreshKey: number
  editor: RegistryEditorActions
  reactivatingId: string | null
}

/** Categorias → produtos da categoria. O catálogo é global, sem rede. */
export function CatalogPanel({ categoryId, onCategoryChange, refreshKey, editor, reactivatingId }: CatalogPanelProps) {
  const categories = useRegistryList('all', async () => (await fetchCategories()).map(categoryRow), refreshKey)
  const products = useRegistryList(categoryId, async () => categoryId ? (await fetchProducts(categoryId)).map(productRow) : [], refreshKey)
  const category = categories.rows.find(row => row.id === categoryId) ?? null
  const categoryLabel = category ? `Categoria: ${category.name}` : undefined

  function selectCategory(row: RegistryRow) {
    onCategoryChange(row.id)
  }

  return <div className="registry-columns registry-columns-two">
    <RegistryColumn
      entity="category"
      list={categories}
      selectedId={categoryId}
      onSelect={selectCategory}
      pendingRowId={reactivatingId}
      onCreate={() => editor.openCreate('category', null)}
      onEdit={row => editor.openEdit('category', row)}
      onDeactivate={row => editor.askDeactivate('category', row)}
      onReactivate={row => editor.reactivate('category', row)}
    />
    <RegistryColumn
      entity="product"
      list={products}
      subtitle={categoryLabel}
      idle={{ title: 'Escolha uma categoria', description: 'Os produtos da categoria escolhida aparecem aqui.' }}
      createBlockedReason={category && !category.isActive ? 'Reative a categoria para cadastrar produtos.' : undefined}
      pendingRowId={reactivatingId}
      onCreate={() => editor.openCreate('product', categoryId, {}, categoryLabel)}
      onEdit={row => editor.openEdit('product', row, categoryLabel)}
      onDeactivate={row => editor.askDeactivate('product', row)}
      onReactivate={row => editor.reactivate('product', row)}
    />
  </div>
}
