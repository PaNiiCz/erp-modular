const API_URL = 'http://127.0.0.1:8000/api/agenda'

// Nomes mais comuns de chave onde o login pode guardar o token de acesso
const CHAVES_TOKEN = ['access', 'access_token', 'accessToken', 'token', 'jwt', 'authToken']

function lerToken(): string | null {
  for (const armazenamento of [localStorage, sessionStorage]) {
    for (const chave of CHAVES_TOKEN) {
      const valor = armazenamento.getItem(chave)
      if (!valor) continue
      // Se o valor estiver salvo como JSON (ex.: {"access": "..."}), pega o campo certo
      try {
        const lido = JSON.parse(valor)
        if (typeof lido === 'string') return lido
        if (lido && typeof lido.access === 'string') return lido.access
      } catch {
        return valor
      }
    }
  }
  return null
}

export type Tipo = 'COMPROMISSO' | 'REUNIAO' | 'EVENTO' | 'OUTRO'
export type Status = 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO'

export interface Evento {
  id: number
  titulo: string
  descricao: string
  local: string
  tipo: Tipo
  status: Status
  inicio: string
  fim: string
  dia_inteiro: boolean
  cor: string
  usuario: number
  dono_nome: string
  participantes: number[]
  participantes_nomes: string[]
  lembretes_minutos: number[]
  pode_editar: boolean
}

export type EventoForm = Pick<
  Evento,
  'titulo' | 'descricao' | 'local' | 'tipo' | 'inicio' | 'fim' | 'dia_inteiro' | 'cor' | 'participantes' | 'lembretes_minutos'
>

export interface Notificacao {
  id: number
  titulo: string
  mensagem: string
  lida: boolean
  evento: number | null
  criada_em: string
}

export interface UsuarioSimples {
  id: number
  nome: string
  area: string
}

interface Pagina<T> {
  next: string | null
  results: T[]
}

async function request<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const url = caminho.startsWith('http') ? caminho : `${API_URL}${caminho}`
  const token = lerToken()
  const resposta = await fetch(url, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (resposta.status === 204) return undefined as T
  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) throw dados ?? { detail: 'Erro inesperado no servidor.' }
  return dados as T
}

// A API pagina de 10 em 10; aqui seguimos o "next" até acabar
async function buscarTodas<T>(caminho: string): Promise<T[]> {
  const itens: T[] = []
  let proxima: string | null = caminho
  while (proxima) {
    const pagina: Pagina<T> = await request<Pagina<T>>(proxima)
    itens.push(...pagina.results)
    proxima = pagina.next
  }
  return itens
}

export const agendaApi = {
  eventos: (de: string, ate: string) => buscarTodas<Evento>(`/eventos/?de=${de}&ate=${ate}`),
  proximos: () => request<Evento[]>('/eventos/proximos/'),
  criar: (dados: EventoForm) =>
    request<Evento>('/eventos/', { method: 'POST', body: JSON.stringify(dados) }),
  editar: (id: number, dados: EventoForm) =>
    request<Evento>(`/eventos/${id}/`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluir: (id: number) => request<void>(`/eventos/${id}/`, { method: 'DELETE' }),
  concluir: (id: number) => request<Evento>(`/eventos/${id}/concluir/`, { method: 'POST' }),
  cancelar: (id: number) => request<Evento>(`/eventos/${id}/cancelar/`, { method: 'POST' }),
  usuarios: () => request<UsuarioSimples[]>('/usuarios/'),
  notificacoes: async () => (await request<Pagina<Notificacao>>('/notificacoes/')).results,
  contador: () => request<{ nao_lidas: number }>('/notificacoes/contador/'),
  marcarLida: (id: number) =>
    request<Notificacao>(`/notificacoes/${id}/marcar-lida/`, { method: 'POST' }),
  marcarTodasLidas: () =>
    request<{ atualizadas: number }>('/notificacoes/marcar-todas-lidas/', { method: 'POST' }),
}

function textoDe(valor: unknown): string {
  if (Array.isArray(valor)) return valor.map(textoDe).join(' ')
  if (typeof valor === 'object' && valor !== null) {
    const objeto = valor as Record<string, unknown>
    if (typeof objeto.message === 'string') return objeto.message
    return Object.values(objeto).map(textoDe).join(' ')
  }
  return String(valor)
}

// Transforma o erro do Django ({campo: ["msg"]} ou {detail: "msg"}) em texto
export function mensagemDeErro(erro: unknown): string {
  if (typeof erro === 'object' && erro !== null) {
    const registro = erro as Record<string, unknown>
    if (registro.code === 'token_not_valid') {
      return 'Sessão inválida ou expirada. Faça login novamente.'
    }
    const textos = Object.entries(registro).map(([campo, valor]) => {
      const msg = textoDe(valor)
      return campo === 'detail' || campo === 'non_field_errors' ? msg : `${campo}: ${msg}`
    })
    if (textos.length) return textos.join(' | ')
  }
  return 'Não foi possível concluir a ação.'
}