// Troca o histórico atual sem empilhar uma nova entrada.
export function replaceRoute(path: string, state: unknown = null) {
  window.history.replaceState(state, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
