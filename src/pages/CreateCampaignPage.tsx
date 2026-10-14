import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { ArrowRight, Check, Circle } from 'lucide-react'
import { PortalLayout } from '../components/layout/PortalLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { FeedbackAlert } from '../components/ui/FeedbackAlert'
import { useFeedback } from '../components/ui/useFeedback'
import { campaignDraftStorageKey, loadCampaignDraft, validateCampaignInformation, type CampaignInformationErrors } from '../data/campaignDraft'
import { navigate } from '../navigation/navigate'
import type { CampaignDraft } from '../types/campaign'
import './CreateCampaignPage.css'

const steps = ['Informações', 'Alvos e benefícios', 'Regras e público', 'Escopo e canais', 'Revisão']
const requirements = ['Informações básicas', 'Alvos e benefícios', 'Quantidade de vouchers', 'Público elegível', 'Escopo organizacional', 'Condições de geração']
const modelOptions = [{ value: 'relative', label: 'Prazo relativo' }]
const capOptions = [{ value: 'unlimited', label: 'Sem teto' }]

export function CreateCampaignPage() {
  const feedback = useFeedback()
  const [draft, setDraft] = useState(loadCampaignDraft)
  const [savedDraft, setSavedDraft] = useState(() => JSON.stringify(draft))
  const [errors, setErrors] = useState<CampaignInformationErrors>({})
  const [discardOpen, setDiscardOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const information = draft.information
  const dirty = JSON.stringify(draft) !== savedDraft
  const basicInformationComplete = Object.keys(validateCampaignInformation(draft)).length === 0

  useEffect(() => {
    if (!dirty) return
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  function updateField<Key extends keyof CampaignDraft['information']>(key: Key, value: CampaignDraft['information'][Key]) {
    setDraft(current => ({ ...current, information: { ...current.information, [key]: value } }))
    setErrors(current => ({ ...current, [key]: undefined, ...(key === 'start' ? { end: undefined } : {}) }))
  }

  function handleReturn() {
    if (dirty) setDiscardOpen(true)
    else navigate('/campanhas')
  }

  function handleReturnLink(event: MouseEvent<HTMLAnchorElement>) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    handleReturn()
  }

  function handleSaveDraft() {
    try {
      localStorage.setItem(campaignDraftStorageKey, JSON.stringify(draft))
      setSavedDraft(JSON.stringify(draft))
      feedback.success({ title: 'Rascunho salvo neste navegador.', description: 'Você pode voltar e continuar preenchendo depois.' })
    } catch {
      feedback.error({ title: 'Não foi possível salvar o rascunho.', description: 'Seus dados continuam nesta tela. Verifique o armazenamento do navegador e tente novamente.' })
    }
  }

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateCampaignInformation(draft)
    setErrors(validationErrors)
    const firstInvalidField = Object.keys(validationErrors)[0]
    if (firstInvalidField) {
      const field = formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
      const focusTarget = field?.closest('.select')?.querySelector<HTMLElement>('button') ?? field
      focusTarget?.focus()
      return
    }
    // Ponto de conexão para a próxima etapa, mantendo o rascunho estruturado.
    feedback.info({ title: 'Informações básicas validadas.', description: 'A etapa Alvos e benefícios será implementada na próxima etapa. Seus dados permanecem nesta tela.' })
  }

  return (
    <PortalLayout onCampaignNavigate={handleReturn}>
      <div className="create-campaign-page">
        <header className="create-campaign-header">
          <nav aria-label="Caminho" className="create-campaign-breadcrumb">
            <span>Portal</span><span aria-hidden="true">›</span>
            <a href="/campanhas" onClick={handleReturnLink}>Campanhas</a><span aria-hidden="true">›</span>
            <span aria-current="page">Nova campanha</span>
          </nav>
          <h1>Criar nova campanha</h1>
        </header>

        <nav aria-label="Etapas da criação" className="create-campaign-steps">
          <ol>{steps.map((step, index) => (
            <li key={step} aria-current={index === 0 ? 'step' : undefined}>
              <span>{index + 1}</span> {step}
            </li>
          ))}</ol>
        </nav>

        <form ref={formRef} noValidate onSubmit={handleContinue} className="create-campaign-form" aria-label="Informações da campanha">
          <section className="create-campaign-information" aria-labelledby="campaign-information-title">
            <h2 id="campaign-information-title">Informações básicas</h2>
            <p className="create-campaign-description">Identifique a campanha e defina quando ela poderá emitir vouchers.</p>
            <Input label="Nome da campanha" name="name" placeholder="Ex.: Volta às Aulas 2026" value={information.name} onChange={value => updateField('name', value)} isRequired validationBehavior="aria" errorMessage={errors.name} />
            <div className="create-campaign-dates">
              <Input label="Início da vigência" name="start" type="datetime-local" value={information.start} onChange={value => updateField('start', value)} isRequired validationBehavior="aria" errorMessage={errors.start} />
              <Input label="Fim da vigência" name="end" type="datetime-local" value={information.end} onChange={value => updateField('end', value)} isRequired validationBehavior="aria" errorMessage={errors.end} />
            </div>
            <section className="create-campaign-validity" aria-labelledby="voucher-validity-title">
              <h3 id="voucher-validity-title">Validade do voucher</h3>
              <p>Independente da vigência da campanha</p>
              <div className="create-campaign-validity-fields">
                <Select label="Modelo" name="voucherModel" options={modelOptions} value={information.voucherModel || null} onChange={value => updateField('voucherModel', value === 'relative' ? 'relative' : '')} isRequired validationBehavior="aria" errorMessage={errors.voucherModel} />
                <div className="create-campaign-duration">
                  <Input label="Duração" name="voucherDurationDays" type="number" value={information.voucherDurationDays} onChange={value => updateField('voucherDurationDays', value)} isRequired validationBehavior="aria" inputProps={{ min: 1, step: 1, 'aria-describedby': 'voucher-duration-unit' }} errorMessage={errors.voucherDurationDays} />
                  <span id="voucher-duration-unit" className="create-campaign-duration-unit">dias após a emissão</span>
                </div>
                <Select label="Teto máximo" name="voucherCap" options={capOptions} value={information.voucherCap || null} onChange={value => updateField('voucherCap', value === 'unlimited' ? 'unlimited' : '')} isRequired validationBehavior="aria" errorMessage={errors.voucherCap} />
              </div>
            </section>
          </section>

          <aside className="create-campaign-summary" aria-labelledby="campaign-summary-title">
            <h2 id="campaign-summary-title">Resumo da configuração</h2>
            <p className="create-campaign-summary-label">Status</p>
            <p className="create-campaign-draft-status">Rascunho</p>
            <p className="create-campaign-summary-label">Itens obrigatórios</p>
            <ul>{requirements.map((requirement, index) => {
              const complete = index === 0 && basicInformationComplete
              const Icon = complete ? Check : Circle
              return <li key={requirement} className={complete ? 'create-campaign-requirement-complete' : undefined}>
                <Icon size={10} aria-hidden="true" />
                <span>{requirement}<span className="create-campaign-sr-only">: {complete ? 'completo' : 'pendente'}</span></span>
              </li>
            })}</ul>
            <div className="create-campaign-rule">
              <FeedbackAlert type="warning" title="Regra importante" description="A campanha só poderá ser ativada quando todos os itens obrigatórios estiverem completos." />
            </div>
          </aside>

          <footer className="create-campaign-actions">
            <Button type="button" variant="secondary" onPress={handleSaveDraft}>Salvar rascunho</Button>
            <Button type="submit" endIcon={ArrowRight}>Continuar</Button>
          </footer>
        </form>

        <Modal isOpen={discardOpen} onOpenChange={setDiscardOpen} role="alertdialog" title="Descartar alterações?"
          secondaryAction={{ label: 'Continuar editando', autoFocus: true, onPress: () => setDiscardOpen(false) }}
          primaryAction={{ label: 'Descartar alterações', variant: 'danger', onPress: () => navigate('/campanhas') }}>
          As alterações não salvas serão descartadas. Deseja voltar ao Gerenciamento de Campanhas?
        </Modal>
      </div>
    </PortalLayout>
  )
}
