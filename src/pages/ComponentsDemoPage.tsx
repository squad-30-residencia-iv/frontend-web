import { useState } from 'react'
import { ArrowRight, Mail, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { ConfirmationModal, type ConfirmationAction } from '../components/ui/ConfirmationModal'
import { FeedbackAlert } from '../components/ui/FeedbackAlert'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { useFeedback } from '../components/ui/useFeedback'
import './ComponentsDemoPage.css'

export function ComponentsDemoPage() {
  const [isOpen, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState<ConfirmationAction | null>(null)
  const feedback = useFeedback()

  return (
    <main className="components-demo-page">
      <header className="components-demo-header">
        <a href="/">Voltar ao login</a>
        <h1>Componentes e feedbacks</h1>
        <p>Área isolada para revisar os componentes do Portal Campanhas.</p>
      </header>
      <section className="components-demo-section" aria-labelledby="buttons-heading">
        <h2 id="buttons-heading">Botões</h2>
        <div className="components-demo-actions">
          <Button onPress={() => feedback.success({ title: 'Botão acionado' })}>Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="tertiary">Terciário</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Discreto</Button>
          <Button variant="danger">Perigo</Button>
          <Button variant="danger-soft">Perigo suave</Button>
          <Button startIcon={Plus}>Criar campanha</Button>
          <Button endIcon={ArrowRight}>Continuar</Button>
          <Button isIconOnly startIcon={Search} aria-label="Pesquisar" />
          <Button isDisabled>Desabilitado</Button>
          <Button isPending>Salvando</Button>
        </div>
      </section>
      <section className="components-demo-section" aria-labelledby="fields-heading">
        <h2 id="fields-heading">Campos e seleção</h2>
        <div className="components-demo-fields">
          <Input label="E-mail" type="email" icon={Mail} placeholder="nome@empresa.com" description="Utilize seu e-mail corporativo." isRequired />
          <Input label="Nome inválido" defaultValue="" errorMessage="Informe o nome da campanha." />
          <Input label="Campo desabilitado" defaultValue="Somente visualização" isDisabled />
          <Select label="Status" placeholder="Selecione um status" options={[{ value: 'active', label: 'Ativa' }, { value: 'inactive', label: 'Inativa' }]} />
          <Select label="Seleção inválida" placeholder="Escolha uma opção" errorMessage="Selecione um status." options={[{ value: 'active', label: 'Ativa' }]} />
          <Select label="Seleção desabilitada" isDisabled options={[{ value: 'active', label: 'Ativa' }]} defaultValue="active" />
        </div>
      </section>
      <section className="components-demo-section" aria-labelledby="dialogs-heading">
        <h2 id="dialogs-heading">Modais e confirmações</h2>
        <div className="components-demo-actions">
          <Button onPress={() => setOpen(true)}>Abrir modal</Button>
          <Button variant="danger" startIcon={Trash2} onPress={() => setConfirmation('delete')}>Excluir</Button>
          <Button variant="secondary" onPress={() => setConfirmation('activate')}>Ativar</Button>
          <Button variant="secondary" onPress={() => setConfirmation('deactivate')}>Inativar</Button>
        </div>
        <Modal isOpen={isOpen} onOpenChange={setOpen} title="Detalhes da campanha" secondaryAction={{ label: 'Cancelar', onPress: () => setOpen(false) }} primaryAction={{ label: 'Salvar', onPress: () => { setOpen(false); feedback.success({ title: 'Exemplo salvo', description: 'Nenhum dado real foi alterado.' }) } }}>
          <p>Este modal demonstra foco, navegação por teclado e ações no rodapé.</p>
        </Modal>
        <ConfirmationModal action={confirmation ?? 'delete'} itemName="Campanha de exemplo" isOpen={confirmation !== null} onOpenChange={(open) => { if (!open) setConfirmation(null) }} onConfirm={() => { setConfirmation(null); feedback.success({ title: 'Ação confirmada', description: 'Esta é apenas uma demonstração.' }) }} />
      </section>
      <section className="components-demo-section" aria-labelledby="feedback-heading">
        <h2 id="feedback-heading">Feedbacks</h2>
        <div className="components-demo-actions">
          <Button onPress={() => feedback.success({ title: 'Campanha salva', description: 'As alterações foram concluídas.' })}>Sucesso</Button>
          <Button variant="danger" onPress={() => feedback.error({ title: 'Não foi possível salvar', description: 'Tente novamente.' })}>Erro</Button>
          <Button variant="secondary" onPress={() => feedback.warning({ title: 'Revise os dados', description: 'Há campos pendentes.' })}>Aviso</Button>
          <Button variant="secondary" onPress={() => feedback.info({ title: 'Nova informação', description: 'O relatório está disponível.' })}>Informação</Button>
        </div>
        <FeedbackAlert type="info" title="Ambiente de demonstração" description="Os exemplos não enviam dados ao servidor." />
        <FeedbackAlert type="success" title="Operação concluída" />
        <FeedbackAlert type="warning" title="Atenção ao prazo" />
        <FeedbackAlert type="error" title="Falha na operação" description="Verifique os dados e tente novamente." />
      </section>
      <section className="components-demo-section" aria-labelledby="states-heading">
        <h2 id="states-heading">Carregamento e estado vazio</h2>
        <Loading message="Carregando campanhas…" />
        <EmptyState title="Nenhuma campanha encontrada" description="Crie sua primeira campanha para começar." action={<Button startIcon={Plus} onPress={() => setOpen(true)}>Criar campanha</Button>} />
      </section>
    </main>
  )
}
