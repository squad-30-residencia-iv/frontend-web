import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from '@heroui/react'
import { Mail, Plus } from 'lucide-react'
import { useState } from 'react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Input } from './Input'
import { Select } from './Select'
import { Modal } from './Modal'
import { ConfirmationModal, type ConfirmationAction } from './ConfirmationModal'
import { FeedbackAlert } from './FeedbackAlert'
import { FeedbackProvider } from './FeedbackProvider'
import { Loading } from './Loading'
import { EmptyState } from './EmptyState'
import { useFeedback } from './useFeedback'

// jsdom não implementa consultas de mídia nem medição de layout do Toast.
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  })
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

afterAll(() => vi.unstubAllGlobals())

afterEach(async () => {
  act(() => toast.clear())
  await waitFor(() => expect(toast.getQueue().visibleToasts).toHaveLength(0))
})

describe('Componentes base', () => {
  it('repassa interação, ícones e propriedades do botão', async () => {
    const onPress = vi.fn()
    const user = userEvent.setup()
    render(<Button startIcon={Plus} onPress={onPress}>Criar</Button>)
    await user.click(screen.getByRole('button', { name: 'Criar' }))
    expect(onPress).toHaveBeenCalledOnce()
    expect(screen.getByRole('button')).toHaveClass('button--primary')
  })

  it('bloqueia ações desabilitadas e durante carregamento', async () => {
    const onPress = vi.fn()
    const user = userEvent.setup()
    render(<><Button isDisabled onPress={onPress}>Indisponível</Button><Button isPending onPress={onPress}>Salvando</Button><Button isIconOnly aria-label="Adicionar" startIcon={Plus} /></>)
    await user.click(screen.getByRole('button', { name: 'Indisponível' }))
    await user.click(screen.getByRole('button', { name: 'Salvando' }))
    expect(onPress).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Indisponível' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Salvando' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeVisible()
  })

  it('associa rótulo, descrição, erro e repassa alterações do input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<><Input label="E-mail" icon={Mail} description="E-mail de trabalho" isRequired onChange={onChange} /><Input label="Nome" errorMessage="Nome obrigatório" /><Input label="Código" isDisabled /></>)
    const email = screen.getByRole('textbox', { name: 'E-mail' })
    expect(email).toHaveAccessibleDescription('E-mail de trabalho')
    expect(email).toBeRequired()
    await user.type(email, 'a')
    expect(onChange).toHaveBeenLastCalledWith('a')
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveAccessibleDescription('Nome obrigatório')
    expect(screen.getByRole('textbox', { name: 'Código' })).toBeDisabled()
  })

  it('seleciona uma opção tipada e repassa o valor', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Select label="Status" placeholder="Escolha" options={[{ value: 'active', label: 'Ativa' }, { value: 'inactive', label: 'Inativa' }]} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /Status/ }))
    await user.click(await screen.findByRole('option', { name: 'Ativa' }))
    expect(onChange).toHaveBeenCalledWith('active')
    expect(screen.getByRole('button', { name: /Status/ })).toHaveTextContent('Ativa')
  })

  it('apresenta erro e estado desabilitado do select', () => {
    render(<><Select label="Inválido" options={[]} errorMessage="Selecione uma opção" /><Select label="Bloqueado" options={[]} isDisabled /></>)
    expect(screen.getByText('Selecione uma opção')).toBeVisible()
    expect(screen.getByRole('button', { name: /Bloqueado/ })).toBeDisabled()
  })

  it('abre modal, fecha pelo teclado e devolve foco ao disparador', async () => {
    const user = userEvent.setup()
    function Example() {
      const [open, setOpen] = useState(false)
      return <><Button onPress={() => setOpen(true)}>Abrir</Button><Modal isOpen={open} onOpenChange={setOpen} title="Editar campanha" footer={<span>Rodapé</span>}>Conteúdo</Modal></>
    }
    render(<Example />)
    const trigger = screen.getByRole('button', { name: 'Abrir' })
    await user.click(trigger)
    expect(await screen.findByRole('dialog', { name: 'Editar campanha' })).toBeVisible()
    expect(screen.getByText('Rodapé')).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Fechar modal' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it.each<[ConfirmationAction, string]>([['delete', 'Excluir'], ['activate', 'Ativar'], ['deactivate', 'Inativar']])('confirma %s somente pela ação explícita', async (action, label) => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(<ConfirmationModal action={action} itemName="Campanha" isOpen onOpenChange={onOpenChange} onConfirm={onConfirm} />)
    const dialog = await screen.findByRole('alertdialog', { name: `${label} Campanha?` })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onConfirm).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: label }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('mostra loading, alerta permanente e ação do estado vazio', async () => {
    const user = userEvent.setup()
    const onPress = vi.fn()
    render(<><Loading message="Buscando dados" /><FeedbackAlert type="error" title="Falha" description="Tente novamente" /><EmptyState title="Sem campanhas" description="Crie uma campanha" action={<Button onPress={onPress}>Criar</Button>} /></>)
    expect(screen.getByRole('status')).toHaveTextContent('Buscando dados')
    expect(screen.getByRole('alert')).toHaveTextContent('Falha')
    expect(screen.getByRole('heading', { name: 'Sem campanhas' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Criar' }))
    expect(onPress).toHaveBeenCalledOnce()
  })
})

describe('Feedbacks oficiais HeroUI', () => {
  it.each(['success', 'error', 'warning', 'info'] as const)('dispara e exibe feedback %s com título e descrição', async (type) => {
    const user = userEvent.setup()
    function Example() {
      const feedback = useFeedback()
      return <><Button onPress={() => feedback[type]({ title: `Feedback ${type}`, description: 'Descrição da operação', timeout: 0 })}>Notificar</Button><FeedbackProvider /></>
    }
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Notificar' }))
    expect(await screen.findByText(`Feedback ${type}`)).toBeVisible()
    expect(screen.getByText('Descrição da operação')).toBeVisible()
    expect(toast.getQueue().visibleToasts[0]?.content.variant).toBe(type === 'error' ? 'danger' : type === 'info' ? 'accent' : type)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByText(`Feedback ${type}`)).not.toBeInTheDocument())
  })
})
