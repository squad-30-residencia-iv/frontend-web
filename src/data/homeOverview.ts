import type { HomeOverview } from '../types/home'

// Mock da Home. Os nomes, datas, vouchers e utilização seguem os registros 1 a 7
// de src/data/campaigns.ts. Descrições, categorias e benefícios são demonstrativos.
export const homeOverview: HomeOverview = {
  featured: {
    id: '1',
    title: 'Black Friday 2024',
    description: 'A maior campanha do ano: descontos de até 30% em todas as lojas e canais.',
    benefit: 'Até 30% OFF',
    start: '2024-11-20',
    end: '2024-11-30',
    ctaLabel: 'Ver campanha',
    ctaPath: '/campanhas',
  },
  categories: [
    { id: 'supermarket', label: 'Supermercado' },
    { id: 'electronics', label: 'Eletro' },
    { id: 'fashion', label: 'Moda' },
    { id: 'home', label: 'Casa' },
    { id: 'beauty', label: 'Beleza' },
  ],
  campaigns: [
    { id: '1', name: 'Black Friday 2024', description: 'Descontos progressivos em eletrônicos e eletrodomésticos.', categoryId: 'electronics', benefit: 'Até 30% OFF', start: '2024-11-20', end: '2024-11-30', status: 'active', vouchers: 15000, usage: 88 },
    { id: '2', name: 'Dia das Mães Premiado', description: 'Vouchers para presentes de beleza e cuidados pessoais.', categoryId: 'beauty', benefit: '15% OFF', start: '2024-05-01', end: '2024-05-12', status: 'scheduled', vouchers: 8500, usage: 42 },
    { id: '3', name: 'Volta às Aulas Kids', description: 'Uniformes e vestuário infantil com valor fixo de desconto.', categoryId: 'fashion', benefit: 'R$ 20 OFF', start: '2024-01-10', end: '2024-02-15', status: 'ended', vouchers: 4200, usage: 95 },
    { id: '4', name: 'Aniversário da Loja 15 Anos', description: 'Celebração com desconto em toda a linha de mercado.', categoryId: 'supermarket', benefit: '10% OFF', start: '2024-09-15', end: '2024-09-30', status: 'paused', vouchers: 20000, usage: 61 },
    { id: '5', name: 'Liquidação de Verão', description: 'Coleção de verão com preços reduzidos até acabar o estoque.', categoryId: 'fashion', benefit: 'Até 50% OFF', start: '2024-01-05', end: '2024-01-25', status: 'ended', vouchers: 5000, usage: 100 },
    { id: '6', name: 'Natal Premiado', description: 'Decoração e utilidades para a casa com vouchers de valor fixo.', categoryId: 'home', benefit: 'R$ 50 OFF', start: '2024-12-01', end: '2024-12-25', status: 'scheduled', vouchers: 25000, usage: 12 },
    { id: '7', name: 'Semana do Consumidor', description: 'Ofertas selecionadas em lojas participantes durante uma semana.', categoryId: 'supermarket', benefit: '12% OFF', start: '2024-03-10', end: '2024-03-17', status: 'active', vouchers: 12000, usage: 74 },
  ],
}

// Ponto único de troca pela chamada HTTP quando o contrato da API existir.
export function fetchHomeOverview(): Promise<HomeOverview> {
  return Promise.resolve(homeOverview)
}
