import { PageHeader } from '../components/shared/PageHeader'
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Circle } from 'lucide-react'
import { PortalLayout } from '../components/layout/PortalLayout'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { FeedbackAlert } from '../components/ui/FeedbackAlert'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import { useFeedback } from '../components/ui/useFeedback'
import {
  campaignDraftStorageKey,
  clearSavedCampaignId,
  loadCampaignDraft,
  newCampaignDraft,
  readSavedCampaignId,
  validateCampaignInformation,
  validateCampaignDraft,
  type CampaignInformationErrors,
  type DraftCatalog,
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
import { campaignStores, type CampaignScopeErrors } from '../data/campaignScope'
import { CampaignReview } from '../components/campaigns/create/CampaignReview'
import { categoryOptions, productOptions } from '../data/campaignBenefits'
import { createCampaign } from '../data/campaignRepository'
import { useAuth } from '../contexts/AuthContext'
import { loadPortalCatalog, type PortalCatalog } from '../services/catalog'
import {
  campaignPersistBlocker,
  campaignPersistNotices,
  fetchEditableCampaign,
  saveCampaignDraft,
  type EditableCampaign,
} from '../services/campaigns'
import './CreateCampaignPage.css'

const steps = ['Informações', 'Alvos e benefícios', 'Regras e público', 'Escopo e canais', 'Revisão']

type EditPhase = 'ready' | 'loading' | 'locked' | 'missing' | 'forbidden' | 'error'

export interface CreateCampaignPageProps {
  /** Rascunho da API reaberto em /campanhas/{id}/editar (US-021). Sem id, cria uma campanha. */
  campaignId?: string
}

export function CreateCampaignPage({ campaignId }: CreateCampaignPageProps = {}) {
  const feedback = useFeedback()
  const { user } = useAuth()
  const networkId = user?.networkId ?? null
  const editing = campaignId !== undefined
  const signedIn = user !== null
  const [draft, setDraft] = useState(() => editing ? newCampaignDraft() : loadCampaignDraft())
  const [editPhase, setEditPhase] = useState<EditPhase>(editing ? 'loading' : 'ready')
  const [editTarget, setEditTarget] = useState<EditableCampaign | null>(null)
  const [editAttempt, setEditAttempt] = useState(0)
  const [savedDraft, setSavedDraft] = useState(() => JSON.stringify(draft))
  const [errors, setErrors] = useState<CampaignInformationErrors>({})
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [visitedBenefits, setVisitedBenefits] = useState(false)
  const [benefitsErrors, setBenefitsErrors] = useState<CampaignBenefitsErrors>({})
  const [visitedRules, setVisitedRules] = useState(false)
  const [rulesErrors, setRulesErrors] = useState<CampaignRulesErrors>({})
  const [visitedScope, setVisitedScope] = useState(false)
  const [scopeErrors, setScopeErrors] = useState<CampaignScopeErrors>({})
  const [catalog, setCatalog] = useState<PortalCatalog | null>(null)
  const [saving, setSaving] = useState(false)
  const pendingFocusRef = useRef<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [leavePath, setLeavePath] = useState('/campanhas')
  const formRef = useRef<HTMLFormElement>(null)
  const returnPath = campaignId ? `/campanhas/${campaignId}` : '/campanhas'
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

  useEffect(() => {
    if (campaignId === undefined) return
    if (signedIn && !networkId) {
      setEditPhase('forbidden')
      return
    }
    let cancelled = false
    setEditPhase('loading')
    fetchEditableCampaign(campaignId)
      .then(target => {
        if (cancelled) return
        if (!target) {
          setEditPhase('missing')
          return
        }
        setEditTarget(target)
        if (target.status !== 'draft') {
          setEditPhase('locked')
          return
        }
        const loaded = JSON.stringify(target.draft)
        setDraft(target.draft)
        setSavedDraft(loaded)
        setVisitedBenefits(true)
        setVisitedRules(true)
        setVisitedScope(true)
        setEditPhase('ready')
      })
      .catch(() => { if (!cancelled) setEditPhase('error') })
    return () => { cancelled = true }
  }, [campaignId, editAttempt, signedIn, networkId])

  useEffect(() => {
    if (!networkId) return
    let cancelled = false
    loadPortalCatalog(networkId)
      .then(next => { if (!cancelled) setCatalog(next) })
      .catch(() => {
        if (cancelled) return
        setCatalog({ categories: [], products: [], stores: [] })
        feedback.error({
          title: 'Não foi possível carregar categorias, produtos e lojas.',
          description: 'Você ainda pode gravar uma campanha para toda a compra. Tente de novo mais tarde para escolher alvos e lojas.',
        })
      })
    return () => { cancelled = true }
  }, [networkId, feedback])

  const draftCatalog: DraftCatalog | undefined = networkId
    ? { categories: catalog?.categories ?? [], products: catalog?.products ?? [], stores: catalog?.stores ?? [] }
    : undefined
  const benefitChoices = draftCatalog
    ? { categories: draftCatalog.categories ?? [], products: draftCatalog.products ?? [] }
    : { categories: categoryOptions, products: productOptions }
  const storeChoices = draftCatalog?.stores ?? campaignStores

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

  function handleNavigate(path: string) {
    if (dirty) {
      setLeavePath(path)
      setDiscardOpen(true)
    } else {
      navigate(path)
    }
  }

  function handleReturn() {
    handleNavigate(returnPath)
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
      const validationErrors = validateCampaignBenefits(draft.benefits, networkId ? benefitChoices : undefined)
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

    const validation = validateCampaignDraft(draft, draftCatalog)
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
      if (networkId && !catalog) {
        feedback.error({
          title: 'Aguarde o carregamento das lojas.',
          description: 'As lojas da rede ainda estão chegando.',
        })
        return
      }
      setStep(5)
      return
    }

    if (saving) return

    if (user && !networkId) {
      feedback.error({
        title: 'Esta conta não cria campanha.',
        description: 'O administrador da plataforma não tem uma rede.',
      })
      return
    }

    if (networkId) {
      const blocker = campaignPersistBlocker(draft)
      if (blocker) {
        feedback.error({ title: 'Esta campanha não pode ser gravada assim.', description: blocker })
        return
      }
      setSaving(true)
      saveCampaignDraft(networkId, draft, campaignId ?? readSavedCampaignId(), {
        stores: catalog?.stores,
        description: editTarget?.description ?? null,
      })
        .then(({ notices }) => {
          if (campaignId) {
            setSavedDraft(JSON.stringify(draft))
            feedback.success({ title: 'Rascunho atualizado.', description: notices.join(' ') })
            navigate(returnPath)
            return
          }
          localStorage.removeItem(campaignDraftStorageKey)
          clearSavedCampaignId()
          setSavedDraft(JSON.stringify(draft))
          feedback.success({ title: 'Campanha salva como rascunho.', description: notices.join(' ') })
          navigate('/campanhas')
        })
        .catch((error: unknown) => {
          feedback.error({
            title: 'Não foi possível concluir o salvamento.',
            description: error instanceof Error ? error.message : 'Não foi possível registrar a campanha. Seus dados continuam nesta tela; tente novamente.',
          })
        })
        .finally(() => setSaving(false))
      return
    }

    // Sem sessão, os testes continuam gravando só neste navegador.
    try {
      createCampaign(draft)
    } catch {
      feedback.error({
        title: 'Não foi possível concluir o salvamento.',
        description: 'Não foi possível registrar a campanha neste navegador. Seus dados continuam nesta tela; tente novamente.',
      })
      return
    }

    feedback.success({ title: 'Campanha salva como rascunho.' })
    navigate('/campanhas')
  }
  const benefitValidation = validateCampaignBenefits(draft.benefits, networkId ? benefitChoices : undefined)
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
    { label: 'Condições de geração', complete: step === 5 && validateCampaignDraft(draft, draftCatalog).firstInvalid === null },
  ]
  const pageTitle = editing ? 'Editar rascunho' : 'Criar nova campanha'
  const breadcrumbs = [
    { label: 'Portal' },
    { label: 'Campanhas', href: '/campanhas', onClick: editing ? undefined : handleReturnLink },
    ...(editing ? [{ label: editTarget?.name ?? 'Campanha', href: returnPath }] : []),
    { label: editing ? 'Editar rascunho' : 'Nova campanha' },
  ]

  if (editPhase !== 'ready') {
    return (
      <PortalLayout activeSection="campaigns">
        <div className="create-campaign-page">
          <PageHeader title={pageTitle} breadcrumbs={breadcrumbs} />
          {editPhase === 'loading' && <Loading message="Carregando rascunho…" />}
          {editPhase === 'locked' && <EmptyState
            title="Esta campanha não pode ser editada"
            description="Fora de rascunho a configuração não muda: a mecânica congela na aprovação. Para mudar alvos, quantidades, regras ou escopo, duplique a campanha no detalhe."
            action={<Button variant="secondary" onPress={() => navigate(returnPath)}>Voltar para a campanha</Button>}
          />}
          {editPhase === 'missing' && <EmptyState
            title="Campanha não encontrada"
            description="Verifique o endereço ou volte para a listagem de campanhas."
            action={<Button variant="secondary" onPress={() => navigate('/campanhas')}>Voltar para campanhas</Button>}
          />}
          {editPhase === 'forbidden' && <EmptyState
            title="Esta conta não edita campanha"
            description="O administrador da plataforma não tem uma rede."
            action={<Button variant="secondary" onPress={() => navigate('/campanhas')}>Voltar para campanhas</Button>}
          />}
          {editPhase === 'error' && <EmptyState
            title="Não foi possível carregar o rascunho"
            description="Verifique sua conexão e tente novamente."
            action={<Button variant="secondary" onPress={() => setEditAttempt(current => current + 1)}>Tentar novamente</Button>}
          />}
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout activeSection="campaigns" onNavigate={handleNavigate}>
      <div className="create-campaign-page">
        <PageHeader title={pageTitle} breadcrumbs={breadcrumbs} />
        {editing && editTarget && editTarget.notices.length > 0 && <FeedbackAlert
          type="warning"
          title="O que esta tela não mostra"
          description={editTarget.notices.join(' ')}
        />}
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
            categories={benefitChoices.categories}
            products={benefitChoices.products}
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
            stores={storeChoices}
            onChange={handleScopeChange}
          />}
          {step === 5 && <>
            <CampaignReview draft={draft} catalog={draftCatalog} />
            {networkId && <FeedbackAlert
              type="warning"
              title="O que fica só neste navegador"
              description={campaignPersistNotices(draft).join(' ')}
            />}
          </>}
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
            {!editing && <Button
              type="button"
              variant="secondary"
              onPress={handleSaveDraft}
            >Salvar rascunho</Button>}
            <Button type="submit" endIcon={ArrowRight}>{saving ? 'Salvando…' : step === 5 ? (editing ? 'Salvar alterações' : 'Salvar campanha') : 'Continuar'}</Button>
          </footer>
        </form>
        <Modal
          isOpen={discardOpen}
          onOpenChange={setDiscardOpen}
          role="alertdialog"
          title="Descartar alterações?"
          secondaryAction={{ label: 'Continuar editando', autoFocus: true, onPress: () => setDiscardOpen(false) }}
          primaryAction={{ label: 'Descartar alterações', variant: 'danger', onPress: () => navigate(leavePath) }}
        >
          {leavePath === '/campanhas'
            ? 'As alterações não salvas serão descartadas. Deseja voltar ao Gerenciamento de Campanhas?'
            : leavePath === returnPath
              ? 'As alterações não salvas serão descartadas. Deseja voltar ao detalhe da campanha?'
              : 'As alterações não salvas serão descartadas. Deseja sair desta tela?'}
        </Modal>
      </div>
    </PortalLayout>
  )
}
