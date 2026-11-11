import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplicationsPage } from './ApplicationsPage'
import type { SatelliteApp } from '../types/satellite'

const mockApps: SatelliteApp[] = [
  {
    id: 'sat-001',
    name: 'PDV Centro',
    clientId: 'pdv-centro-001',
    networkId: 'net-001',
    scopes: ['voucher:redeem', 'voucher:read'],
    active: true,
    createdAt: '2026-10-01',
  },
  {
    id: 'sat-002',
    name: 'Totem Inativo',
    clientId: 'totem-002',
    networkId: 'net-001',
    scopes: ['campaign:read'],
    active: false,
    createdAt: '2026-10-02',
  },
]

describe('ApplicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe estado de carregamento e depois lista as aplicações da rede', async () => {
    const loadApps = vi.fn().mockResolvedValue(mockApps)

    render(<ApplicationsPage loadApps={loadApps} />)

    expect(screen.getByText(/Carregando aplicações da rede…/i)).toBeVisible()

    await waitFor(() => {
      expect(screen.getByText('PDV Centro')).toBeVisible()
    })

    expect(screen.getByText('pdv-centro-001')).toBeVisible()
    // Por padrão "Exibir apenas aplicações ativas" está marcado
    expect(screen.queryByText('Totem Inativo')).not.toBeInTheDocument()

    // Indicadores
    expect(screen.getByText('Total na Rede Centro-Sul')).toBeVisible()
  })

  it('permite alternar para exibir aplicações inativas', async () => {
    const user = userEvent.setup()
    const loadApps = vi.fn().mockResolvedValue(mockApps)

    render(<ApplicationsPage loadApps={loadApps} />)

    await waitFor(() => {
      expect(screen.getByText('PDV Centro')).toBeVisible()
    })

    const toggle = screen.getByRole('checkbox', { name: /Exibir apenas aplicações ativas/i })
    await user.click(toggle)

    expect(screen.getByText('Totem Inativo')).toBeVisible()
  })

  it('exibe empty state com opção de tentar novamente em caso de erro', async () => {
    const user = userEvent.setup()
    const loadApps = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockApps)

    render(<ApplicationsPage loadApps={loadApps} />)

    await waitFor(() => {
      expect(screen.getByText('Não foi possível carregar as aplicações')).toBeVisible()
    })

    const retryBtn = screen.getByRole('button', { name: 'Tentar novamente' })
    await user.click(retryBtn)

    await waitFor(() => {
      expect(screen.getByText('PDV Centro')).toBeVisible()
    })
  })

  it('abre o formulário de cadastro ao clicar em "Nova aplicação"', async () => {
    const user = userEvent.setup()
    const loadApps = vi.fn().mockResolvedValue(mockApps)

    render(<ApplicationsPage loadApps={loadApps} />)

    await waitFor(() => {
      expect(screen.getByText('PDV Centro')).toBeVisible()
    })

    const newBtn = screen.getByRole('button', { name: 'Cadastrar nova aplicação satélite' })
    await user.click(newBtn)

    expect(screen.getByRole('dialog', { name: 'Nova aplicação satélite' })).toBeVisible()
    expect(screen.getByLabelText(/Nome da aplicação/i)).toBeVisible()
    expect(screen.getByLabelText(/Client ID/i)).toBeVisible()
  })
})
