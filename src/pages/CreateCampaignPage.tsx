import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Circle } from 'lucide-react'
import { PortalLayout } from '../components/layout/PortalLayout'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { FeedbackAlert } from '../components/ui/FeedbackAlert'
import { useFeedback } from '../components/ui/useFeedback'
import {
  campaignDraftStorageKey,
  loadCampaignDraft,
  validateCampaignInformation,
  validateCampaignDraft,
  type CampaignInformationErrors,
} from '../data/campaignDraft'
import { navigate } from '../navigation/navigate'
import type { CampaignDraft } from '../types/campaign'
import { CampaignBenefitsForm } from '../components/campaigns/create/CampaignBenefitsForm'
import {
  validateCampaignBenefits,
  validateDiscount,
  type CampaignBenefitsErrors,
} from '../data/campaignBenefits'
import { CampaignRulesForm } from '../components/campaigns/create/CampaignRulesForm'
import { validateCampaignRules, type CampaignRulesErrors } from '../data/campaignRules'
import { CampaignInformationForm } from '../components/campaigns/create/CampaignInformationForm'
import { CampaignScopeForm } from '../components/campaigns/create/CampaignScopeForm'
import type { CampaignScopeErrors } from '../data/campaignScope'
import { CampaignReview } from '../components/campaigns/create/CampaignReview'
import './CreateCampaignPage.css'

const steps = ['Informações', 'Alvos e benefícios', 'Regras e público', 'Escopo e canais', 'Revisão']

export function CreateCampaignPage() {
  const feedback = useFeedback()
  const [draft, setDraft] = useState(loadCampaignDraft)
  const [savedDraft, setSavedDraft] = useState(() => JSON.stringify(draft))
  const [errors, setErrors] = useState<CampaignInformationErrors>({})
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [visitedBenefits, setVisitedBenefits] = useState(false)
  const [benefitsErrors, setBenefitsErrors] = useState<CampaignBenefitsErrors>({})
  const [visitedRules, setVisitedRules] = useState(false)
  const [rulesErrors, setRulesErrors] = useState<CampaignRulesErrors>({})
  const [visitedScope, setVisitedScope] = useState(false)
  const [scopeErrors, setScopeErrors] = useState<CampaignScopeErrors>({})
  const pendingFocusRef = useRef<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const information = draft.information
  const dirty = JSON.stringify(draft) !== savedDraft
  const basicInformationComplete = Object.keys(validateCampaignInformation(draft)).length === 0

  useEffect(() => {
    const heading = formRef.current?.querySelector<HTMLElement>('h2')
    if (pendingFocusRef.current) {
      focusInvalidField(pendingFocusRef.current)
      pendingFocusRef.current = null
    } else {
      heading?.focus()
    }
    heading?.scrollIntoView?.({ block: 'nearest' })
  }, [step])

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

  function handleBenefitsChange(benefits: CampaignDraft['benefits']) {
    setDraft(current => ({ ...current, benefits }))
    setBenefitsErrors({})
  }

  function handleRulesChange(rules: CampaignDraft['rules']) {
    setDraft(current => ({ ...current, rules }))
    setRulesErrors({})
  }

  function handleScopeChange(scope: CampaignDraft['scope']) {
    setDraft(current => ({ ...current, scope }))
    setScopeErrors({})
  }

  function handleBack() {
    if (step === 5) {
      setStep(4)
      return
    }
    if (step === 4) {
      setStep(3)
      return
    }
    setStep(step === 3 ? 2 : 1)
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

  function focusInvalidField(name: string) {
    const field = formRef.current?.querySelector<HTMLElement>(`[name="${name}"]`)
    const focusTarget = field?.closest('.select')?.querySelector<HTMLElement>('button') ?? field
    focusTarget?.focus()
  }

  function handleAddBenefit() {
    const benefits = draft.benefits
    const key = benefits.discountType === 'percentage' ? 'percentage' : 'fixedAmount'
    if (!validateDiscount(benefits.discountType, benefits[key])) {
      setBenefitsErrors({ [key]: validateCampaignBenefits(benefits)[key] })
      focusInvalidField(key)
      return
    }
    setDraft(current => ({
      ...current, benefits: {
        ...current.benefits,
        addedBenefits: [...current.benefits.addedBenefits, { type: benefits.discountType, value: benefits[key] }],
      }
    }))
    feedback.success({ title: 'Benefício adicionado ao rascunho.' })
  }

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 1) {
      const validationErrors = validateCampaignInformation(draft)
      setErrors(validationErrors)
      const firstInvalidField = Object.keys(validationErrors)[0]
      if (firstInvalidField) {
        focusInvalidField(firstInvalidField)
        return
      }
      setVisitedBenefits(true)
      setStep(2)
      return
    }
    if (step === 2) {
      const validationErrors = validateCampaignBenefits(draft.benefits)
      setBenefitsErrors(validationErrors)
      const firstInvalidField = Object.keys(validationErrors)[0]
      if (firstInvalidField) {
        focusInvalidField(firstInvalidField)
        return
      }
      setVisitedRules(true)
      setStep(3)
      return
    }
    if (step === 3) {
      const validationErrors = validateCampaignRules(draft.rules)
      setRulesErrors(validationErrors)
      const firstInvalidField = Object.keys(validationErrors)[0]
      if (firstInvalidField) {
        focusInvalidField(firstInvalidField)
        return
      }
      setVisitedScope(true)
      setStep(4)
      return
    }

    const validation = validateCampaignDraft(draft)
    setErrors(validation.information)
    setBenefitsErrors(validation.benefits)
    setRulesErrors(validation.rules)
    setScopeErrors(validation.scope)

    if (validation.firstInvalid) {
      const { step: invalidStep, field } = validation.firstInvalid
      if (invalidStep === step) {
        focusInvalidField(field)
      } else {
        pendingFocusRef.current = field
        setStep(invalidStep)
      }
      return
    }

    if (step === 4) {
      setStep(5)
      return
    }

    // A conclusão é local; não há API nem persistência de campanhas criadas.
    try {
      localStorage.removeItem(campaignDraftStorageKey)
    } catch {
      feedback.error({
        title: 'Não foi possível concluir o salvamento.',
        description: 'Não foi possível limpar o rascunho local. Seus dados foram preservados; tente novamente.',
      })
      return
    }

    feedback.success({ title: 'Campanha criada com sucesso.' })
    navigate('/campanhas')
  }
  const benefitValidation = validateCampaignBenefits(draft.benefits)
  const benefitsComplete =
    visitedBenefits
    && !benefitValidation.percentage
    && !benefitValidation.fixedAmount
    && !benefitValidation.addedBenefits
    && !benefitValidation.targetIds
  const quantityComplete =
    visitedBenefits
    && !benefitValidation.maxVouchers
    && !benefitValidation.quantityPerGrant
    && !benefitValidation.limitPerCustomer
    && !benefitValidation.customerBase
    && !benefitValidation.quantityPerCustomer

  const requirements = [
    { label: 'Informações básicas', complete: basicInformationComplete },
    { label: 'Alvos e benefícios', complete: benefitsComplete },
    { label: 'Quantidade de vouchers', complete: quantityComplete },
    { label: 'Público elegível', complete: visitedRules && draft.rules.audience === 'all' },
    { label: 'Escopo organizacional', complete: visitedScope },
    { label: 'Condições de geração', complete: step === 5 && validateCampaignDraft(draft).firstInvalid === null },
  ]
  return (
    <PortalLayout onCampaignNavigate={handleReturn}>
      <div className="create-campaign-page">
        <header className="create-campaign-header">
          <nav aria-label="Caminho" className="create-campaign-breadcrumb">
            <span>Portal</span>
            <span aria-hidden="true">›</span>
            <a href="/campanhas" onClick={handleReturnLink}>Campanhas</a>
            <span aria-hidden="true">›</span>
            <span aria-current="page">Nova campanha</span>
          </nav>
          <h1>Criar nova campanha</h1>
        </header>
        <nav aria-label="Etapas da criação" className="create-campaign-steps">
          <ol>
            {steps.map((stepLabel, index) => (
              <li
                key={stepLabel}
                aria-current={index === step - 1 ? 'step' : undefined}
                className={index < step - 1 ? 'create-campaign-step-complete' : undefined}
              >
                <span aria-hidden="true">
                  {index < step - 1 ? <Check size={12} /> : index + 1}
                </span>
                {stepLabel}
                {index < step - 1 && <span className="create-campaign-sr-only">concluída</span>}
              </li>
            ))}
          </ol>
        </nav>
        <form
          ref={formRef}
          noValidate
          onSubmit={handleContinue}
          className={`create-campaign-form ${step > 1 ? 'create-campaign-form-benefits' : ''}`}
          aria-label="Informações da campanha"
        >
          {step === 1 && <CampaignInformationForm
            information={information}
            errors={errors}
            onChange={updateField}
          />}
          {step === 2 && <CampaignBenefitsForm
            value={draft.benefits}
            errors={benefitsErrors}
            onChange={handleBenefitsChange}
            onAddBenefit={handleAddBenefit}
          />}
          {step === 3 && <CampaignRulesForm
            value={draft.rules}
            errors={rulesErrors}
            onChange={handleRulesChange}
          />}
          {step === 4 && <CampaignScopeForm
            value={draft.scope}
            errors={scopeErrors}
            onChange={handleScopeChange}
          />}
          {step === 5 && <CampaignReview draft={draft} />}
          <aside className="create-campaign-summary" aria-labelledby="campaign-summary-title">
            <h2 id="campaign-summary-title">Resumo da configuração</h2>
            <p className="create-campaign-summary-label">Status</p>
            <p className="create-campaign-draft-status">Rascunho</p>
            <p className="create-campaign-summary-label">Itens obrigatórios</p>
            <ul>
              {requirements.map(({ label, complete }) => {
                const Icon = complete ? Check : Circle
                return <li key={label} className={complete ? 'create-campaign-requirement-complete' : undefined}>
                  <Icon size={10} aria-hidden="true" />
                  <span>
                    {label}
                    <span className="create-campaign-sr-only">: {' '}
                      {complete ? 'completo' : 'pendente'}
                    </span>
                  </span>
                </li>
              })}
            </ul>
            <div className="create-campaign-rule">
              <FeedbackAlert
                type="warning"
                title="Regra importante"
                description="A campanha só poderá ser ativada quando todos os itens obrigatórios estiverem completos."
              />
            </div>
          </aside>
          <footer className="create-campaign-actions">
            {step > 1 && <Button
              className="create-campaign-back"
              type="button"
              variant="secondary"
              startIcon={ArrowLeft}
              onPress={handleBack}
            >Voltar</Button>}
            <Button
              type="button"
              variant="secondary"
              onPress={handleSaveDraft}
            >Salvar rascunho</Button>
            <Button type="submit" endIcon={ArrowRight}>{step === 5 ? 'Salvar' : 'Continuar'}</Button>
          </footer>
        </form>
        <Modal
          isOpen={discardOpen}
          onOpenChange={setDiscardOpen}
          role="alertdialog"
          title="Descartar alterações?"
          secondaryAction={{ label: 'Continuar editando', autoFocus: true, onPress: () => setDiscardOpen(false) }}
          primaryAction={{ label: 'Descartar alterações', variant: 'danger', onPress: () => navigate('/campanhas') }}
        >
          As alterações não salvas serão descartadas. Deseja voltar ao Gerenciamento de Campanhas?
        </Modal>
      </div>
    </PortalLayout>
  )
}
