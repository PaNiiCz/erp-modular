import api from './api';

export interface UsuarioAdmin {
  id: number;
  username: string;
  nome_completo: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string;
}

export interface Atividade {
  id: number;
  usuario: number | null;
  usuario_nome: string;
  acao: string;
  descricao: string;
  alvo_tipo: string;
  alvo_id: string;
  alvo_nome: string;
  ip: string | null;
  criado_em: string;
}

export interface Resumo {
  usuarios_total: number;
  usuarios_ativos: number;
  usuarios_inativos: number;
  administradores: number;
  atividades_24h: number;
}

export interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type AcaoUsuario = 'ativar' | 'desativar' | 'tornar-admin' | 'remover-admin';

type Params = Record<string, string | number | undefined>;

export const administracaoApi = {
  resumo: () => api.get<Resumo>('/administracao/resumo/').then((res) => res.data),
  usuarios: (params: Params) =>
    api.get<Paginado<UsuarioAdmin>>('/administracao/usuarios/', { params }).then((res) => res.data),
  alterarUsuario: (id: number, acao: AcaoUsuario) =>
    api.post<UsuarioAdmin>(`/administracao/usuarios/${id}/${acao}/`).then((res) => res.data),
  atividades: (params: Params) =>
    api.get<Paginado<Atividade>>('/administracao/atividades/', { params }).then((res) => res.data),
};

// Controle de acesso (guardado em memória para não repetir a chamada)
let acessoEmCache: Promise<boolean> | null = null;
let ultimoAcesso: boolean | null = null;

export const verificarAcessoAdministracao = () => {
  if (!acessoEmCache) {
    acessoEmCache = api
      .get<{ acesso: boolean }>('/administracao/acesso/')
      .then((res) => {
        const ok = res.data.acesso === true;
        ultimoAcesso = ok;
        return ok;
      })
      .catch(() => {
        acessoEmCache = null;
        return false;
      });
  }
  return acessoEmCache;
};

export const acessoAdministracaoConhecido = () => ultimoAcesso === true;

export const limparAcessoAdministracao = () => {
  acessoEmCache = null;
  ultimoAcesso = null;
};