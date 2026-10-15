// Preserve a navegação por pathname sem adicionar um roteador.
export function navigate(path: string) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
