import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SecretRevealModal } from './SecretRevealModal'

describe('SecretRevealModal', () => {
  it('renderiza o título, o segredo e o aviso de exibição única', () => {
    render(
      <SecretRevealModal
        isOpen={true}
        onOpenChange={vi.fn()}
        clientSecret="sec_abcdef123456789"
        title="Segredo de cliente gerado"
        warning="Este segredo só será exibido esta única vez."
      />,
    )

    expect(screen.getByText('Segredo de cliente gerado')).toBeVisible()
    expect(screen.getByText('sec_abcdef123456789')).toBeVisible()
    expect(screen.getByText('Este segredo só será exibido esta única vez.')).toBeVisible()
  })

  it('permite copiar o segredo com navigator.clipboard', async () => {
    const user = userEvent.setup()
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    })

    render(
      <SecretRevealModal
        isOpen={true}
        onOpenChange={vi.fn()}
        clientSecret="sec_test_secret_copy"
        title="Segredo gerado"
        warning="Aviso de segurança."
      />,
    )

    const copyBtn = screen.getByRole('button', { name: /copiar/i })
    await user.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledWith('sec_test_secret_copy')
  })

  it('chama onOpenChange(false) ao clicar em Entendi', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(
      <SecretRevealModal
        isOpen={true}
        onOpenChange={handleClose}
        clientSecret="sec_test"
        title="Segredo gerado"
        warning="Aviso"
      />,
    )

    const closeBtn = screen.getByRole('button', { name: 'Entendi' })
    await user.click(closeBtn)

    expect(handleClose).toHaveBeenCalledWith(false)
  })
})
