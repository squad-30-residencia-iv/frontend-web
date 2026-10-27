import { z } from 'zod'

const count = z.number().int().min(0)
const percent = z.number().min(0).max(100).nullable()

export const reportPeriodSchema = z.enum(['30d', '90d', '6m'])

export const reportFiltersSchema = z.object({
  period: reportPeriodSchema,
  campaign: z.string().min(1),
  category: z.string().min(1),
  network: z.string().min(1),
  region: z.string().min(1),
  establishment: z.string().min(1),
  customerType: z.string().min(1),
})

export const reportKpisSchema = z.object({
  issued: count,
  redeemed: count,
  expired: count,
  available: count,
  cancelled: count,
  utilizationRate: percent,
}).refine(
  kpis => kpis.issued === kpis.redeemed + kpis.expired + kpis.available + kpis.cancelled,
  { message: 'Emitidos deve ser igual a resgatados + expirados + disponíveis + cancelados.' },
)

export const reportDataSchema = z.object({
  kpis: reportKpisSchema,
  monthly: z.array(z.object({ month: z.string(), issued: count, redeemed: count, expired: count })),
  statusDistribution: z.array(z.object({ status: z.enum(['redeemed', 'available', 'expired', 'cancelled']), count })),
  topCampaigns: z.array(z.object({ campaignId: z.string(), name: z.string(), issued: count, redeemed: count, rate: percent })),
  regions: z.array(z.object({ regionId: z.string(), name: z.string(), vouchers: count, rate: percent, averageTicket: z.number().min(0).nullable() })),
})
