// Preserve a navegação por pathname sem adicionar um roteador.
export function navigate(path: string, state: unknown = null) {
  window.history.pushState(state, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
