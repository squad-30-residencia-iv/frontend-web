import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationsTable } from './ApplicationsTable'
import type { SatelliteApp } from '../../types/satellite'

const mockApps: SatelliteApp[] = [
  {
    id: 'sat-001',
    name: 'PDV Centro',
    clientId: 'pdv-001',
    networkId: 'net-001',
    scopes: ['vouchers:redeem', 'vouchers:issue'],
    active: true,
    createdAt: '2026-10-01',
  },
  {
    id: 'sat-002',
    name: 'Totem Inativo',
    clientId: 'totem-002',
    networkId: 'net-001',
    scopes: ['campaigns:read'],
    active: false,
    createdAt: '2026-10-02',
  },
]

describe('ApplicationsTable', () => {
  it('renderiza os dados das aplicações corretamente', () => {
    render(
      <ApplicationsTable
        applications={mockApps}
        onRotateSecret={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    )

    expect(screen.getByText('PDV Centro')).toBeVisible()
    expect(screen.getByText('pdv-001')).toBeVisible()
    expect(screen.getByText('Resgatar')).toBeVisible()
    expect(screen.getByText('Ativa')).toBeVisible()

    expect(screen.getByText('Totem Inativo')).toBeVisible()
    expect(screen.getByText('totem-002')).toBeVisible()
    expect(screen.getByText('Inativa')).toBeVisible()
  })

  it('dispara onRotateSecret ao clicar no botão correspondente', async () => {
    const user = userEvent.setup()
    const handleRotate = vi.fn()

    render(
      <ApplicationsTable
        applications={mockApps}
        onRotateSecret={handleRotate}
        onDeactivate={vi.fn()}
      />,
    )

    const rotateBtn = screen.getByRole('button', { name: /Rotacionar segredo de PDV Centro/i })
    await user.click(rotateBtn)

    expect(handleRotate).toHaveBeenCalledWith(mockApps[0])
  })

  it('dispara onDeactivate ao clicar no botão Inativar para app ativa', async () => {
    const user = userEvent.setup()
    const handleDeactivate = vi.fn()

    render(
      <ApplicationsTable
        applications={mockApps}
        onRotateSecret={vi.fn()}
        onDeactivate={handleDeactivate}
      />,
    )

    const deactivateBtn = screen.getByRole('button', { name: /Inativar aplicação PDV Centro/i })
    await user.click(deactivateBtn)

    expect(handleDeactivate).toHaveBeenCalledWith(mockApps[0])
  })

  it('não exibe botão Inativar para aplicação que já está inativa', () => {
    render(
      <ApplicationsTable
        applications={mockApps}
        onRotateSecret={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /Inativar aplicação Totem Inativo/i })).not.toBeInTheDocument()
  })
})
