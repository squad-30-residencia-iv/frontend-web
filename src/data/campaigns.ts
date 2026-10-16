import type { Campaign, CampaignStatus } from '../types/campaign'

const referenceCampaigns: Campaign[] = [
  { id: '1', name: 'Black Friday 2024', start: '2024-11-20', end: '2024-11-30', scope: 'Nacional (Todas as Lojas)', vouchers: 15000, usage: 88, status: 'active' },
  { id: '2', name: 'Dia das Mães Premiado', start: '2024-05-01', end: '2024-05-12', scope: 'Sudeste & Sul', vouchers: 8500, usage: 42, status: 'scheduled' },
  { id: '3', name: 'Volta às Aulas Kids', start: '2024-01-10', end: '2024-02-15', scope: 'Lojas de Shopping', vouchers: 4200, usage: 95, status: 'ended' },
  { id: '4', name: 'Aniversário da Loja 15 Anos', start: '2024-09-15', end: '2024-09-30', scope: 'Nacional (Franquias)', vouchers: 20000, usage: 61, status: 'paused' },
  { id: '5', name: 'Liquidação de Verão', start: '2024-01-05', end: '2024-01-25', scope: 'Lojas de Rua', vouchers: 5000, usage: 100, status: 'ended' },
  { id: '6', name: 'Natal Premiado', start: '2024-12-01', end: '2024-12-25', scope: 'Nacional (Todas as Lojas)', vouchers: 25000, usage: 12, status: 'scheduled' },
  { id: '7', name: 'Semana do Consumidor', start: '2024-03-10', end: '2024-03-17', scope: 'Lojas Selecionadas', vouchers: 12000, usage: 74, status: 'active' },
]
const remainingStatuses: CampaignStatus[] = [...Array<CampaignStatus>(22).fill('active'), ...Array<CampaignStatus>(6).fill('scheduled'), ...Array<CampaignStatus>(2).fill('paused'), ...Array<CampaignStatus>(43).fill('ended')]
// Complemento demonstrativo para permitir navegar pelas 12 páginas da referência.
export const campaigns: Campaign[] = [...referenceCampaigns, ...Array.from({ length: 73 }, (_, index) => ({
  ...referenceCampaigns[index % referenceCampaigns.length], status: remainingStatuses[index], id: String(index + 8), name: `Campanha demonstrativa ${String(index + 8).padStart(2, '0')}`,
}))]

