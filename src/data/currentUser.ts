import type { PortalUser } from '../types/user'

// Usuário demonstrativo da Sidebar e da Home.
// Substituir pelo usuário autenticado (useAuth) quando a US-011 entrar em main.
// Para exibir foto, informe avatarUrl (ex.: um arquivo em public/).
export const currentUser: PortalUser = {
  name: 'Lucas Silva',
  role: 'Gestor de Marketing',
}
