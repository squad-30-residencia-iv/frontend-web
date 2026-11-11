import { KeyRound, PowerOff } from 'lucide-react'
import { Button } from '../ui/Button'
import type { SatelliteApp, SatelliteScope } from '../../types/satellite'

export interface ApplicationsTableProps {
  applications: readonly SatelliteApp[]
  onRotateSecret: (app: SatelliteApp) => void
  onDeactivate: (app: SatelliteApp) => void
}

const scopeBadgeLabels: Record<SatelliteScope, { label: string; short: string }> = {
  'voucher:redeem': { label: 'Resgatar voucher', short: 'Resgatar' },
  'voucher:read': { label: 'Consultar voucher', short: 'Consultar voucher' },
  'campaign:read': { label: 'Consultar campanha', short: 'Consultar campanha' },
}

export function ApplicationsTable({ applications, onRotateSecret, onDeactivate }: ApplicationsTableProps) {
  if (applications.length === 0) {
    return null
  }

  return (
    <div className="satellite-table-container">
      <div className="satellite-table-scroll" tabIndex={0} role="region" aria-label="Tabela de aplicações">
        <table className="satellite-table">
          <thead>
            <tr>
              <th scope="col">Aplicação</th>
              <th scope="col">Client ID</th>
              <th scope="col">Escopos autorizados</th>
              <th scope="col">Status</th>
              <th scope="col" className="satellite-table-col-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id}>
                <th scope="row">
                  <div className="satellite-app-cell">
                    <strong className="satellite-app-name">{app.name}</strong>
                    <span className="satellite-app-id">{app.id}</span>
                  </div>
                </th>
                <td>
                  <code className="satellite-client-id">{app.clientId}</code>
                </td>
                <td>
                  <div className="satellite-scopes-badges">
                    {app.scopes.map(scope => (
                      <span
                        key={scope}
                        className="satellite-scope-badge"
                        title={scopeBadgeLabels[scope]?.label ?? scope}
                      >
                        {scopeBadgeLabels[scope]?.short ?? scope}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <span
                    className={[
                      'satellite-status-badge',
                      app.active ? 'satellite-status-active' : 'satellite-status-inactive',
                    ].join(' ')}
                  >
                    <span className="satellite-status-dot" aria-hidden="true" />
                    {app.active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="satellite-table-col-actions">
                  <div className="satellite-actions-group">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="satellite-action-button"
                      startIcon={KeyRound}
                      onPress={() => onRotateSecret(app)}
                      aria-label={`Rotacionar segredo de ${app.name}`}
                    >
                      Rotacionar segredo
                    </Button>
                    {app.active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="satellite-action-button satellite-deactivate-button"
                        startIcon={PowerOff}
                        onPress={() => onDeactivate(app)}
                        aria-label={`Inativar aplicação ${app.name}`}
                      >
                        Inativar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
