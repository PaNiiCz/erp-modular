import api from './api';
import type {
  Cargo,
  CargoForm,
  Departamento,
  DepartamentoForm,
  Documento,
  Escala,
  EscalaForm,
  Ferias,
  FeriasForm,
  Funcionario,
  FuncionarioForm,
} from '../types/rh';

interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Busca todas as páginas da API (a API devolve a lista paginada)
async function listarTodos<T>(caminho: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const itens: T[] = [];
  let resposta = await api.get<Paginado<T> | T[]>(caminho, { params });

  for (let pagina = 0; pagina < 50; pagina++) {
    const dados = resposta.data;
    if (Array.isArray(dados)) return dados;
    itens.push(...dados.results);
    if (!dados.next) break;
    resposta = await api.get<Paginado<T>>(dados.next);
  }
  return itens;
}

// Cria listar / criar / atualizar / excluir para um recurso da API
function criarCrud<T, F>(caminho: string) {
  const base = `/rh/${caminho}/`;
  return {
    listar: (params: Record<string, unknown> = {}) => listarTodos<T>(base, params),
    criar: (dados: F) => api.post<T>(base, dados).then((res) => res.data),
    atualizar: (id: number, dados: Partial<F>) =>
      api.patch<T>(`${base}${id}/`, dados).then((res) => res.data),
    excluir: (id: number) => api.delete(`${base}${id}/`).then(() => undefined),
  };
}

export const departamentosApi = criarCrud<Departamento, DepartamentoForm>('departamentos');
export const cargosApi = criarCrud<Cargo, CargoForm>('cargos');
export const funcionariosApi = criarCrud<Funcionario, FuncionarioForm>('funcionarios');
export const escalasApi = criarCrud<Escala, EscalaForm>('escalas');
export const documentosApi = criarCrud<Documento, FormData>('documentos');

export const feriasApi = {
  ...criarCrud<Ferias, FeriasForm>('ferias'),
  mudarStatus: (id: number, acao: 'aprovar' | 'rejeitar' | 'cancelar') =>
    api.post<Ferias>(`/rh/ferias/${id}/${acao}/`).then((res) => res.data),
};

// Abre o documento numa nova aba. O link comum não envia o login (token),
// então o arquivo é baixado pelo axios e aberto como um blob local.
export const abrirDocumento = async (id: number) => {
  const janela = window.open('', '_blank');
  try {
    const res = await api.get<Blob>(`/rh/documentos/${id}/download/`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    if (janela) {
      janela.location.href = url;
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = '';
      link.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
  } catch (erro) {
    janela?.close();
    throw erro;
  }
};

// Controle de acesso ao módulo (guardado em memória para não repetir a chamada)
let acessoEmCache: Promise<boolean> | null = null;
let ultimoAcesso: boolean | null = null;

export const verificarAcessoRH = () => {
  if (!acessoEmCache) {
    acessoEmCache = api
      .get('/rh/acesso/')
      .then(() => {
        ultimoAcesso = true;
        return true;
      })
      .catch((erro) => {
        // Só guarda a negativa se foi mesmo "sem permissão" (403)
        if (erro?.response?.status === 403) {
          ultimoAcesso = false;
        } else {
          acessoEmCache = null;
        }
        return false;
      });
  }
  return acessoEmCache;
};

export const acessoRHConhecido = () => ultimoAcesso === true;

export const limparAcessoRH = () => {
  acessoEmCache = null;
  ultimoAcesso = null;
};

// Nomes bonitos para os campos que aparecem nas mensagens de erro
const rotulosCampos: Record<string, string> = {
  nome: 'Nome',
  cpf: 'CPF',
  email: 'E-mail',
  telefone: 'Telefone',
  data_nascimento: 'Data de nascimento',
  data_admissao: 'Data de admissão',
  data_demissao: 'Data de demissão',
  cargo: 'Cargo',
  departamento: 'Departamento',
  salario: 'Salário',
  salario_base: 'Salário base',
  status: 'Status',
  funcionario: 'Funcionário',
  data_inicio: 'Data de início',
  data_fim: 'Data final',
  hora_inicio: 'Horário de entrada',
  hora_fim: 'Horário de saída',
  dia_semana: 'Dia da semana',
  tipo: 'Tipo',
  titulo: 'Título',
  arquivo: 'Arquivo',
  descricao: 'Descrição',
  observacoes: 'Observações',
};

// Mensagens padrão do Django que chegam em inglês
const traducoes: Record<string, string> = {
  'This field is required.': 'Campo obrigatório.',
  'This field may not be blank.': 'Este campo não pode ficar vazio.',
  'This field may not be null.': 'Este campo não pode ficar vazio.',
  'Enter a valid email address.': 'Informe um e-mail válido.',
  'No file was submitted.': 'Nenhum arquivo foi enviado.',
  'A valid number is required.': 'Informe um número válido.',
  'A valid integer is required.': 'Informe um número inteiro válido.',
};

// Transforma o erro da API (formato do Django REST) em um texto legível
export function mensagemErro(erro: unknown, padrao = 'Não foi possível concluir a operação.'): string {
  const dados = (erro as { response?: { data?: unknown } })?.response?.data;
  if (dados && typeof dados === 'object') {
    const partes = Object.entries(dados as Record<string, unknown>).map(([campo, valor]) => {
      const lista = Array.isArray(valor) ? valor : [valor];
      const texto = lista.map((t) => traducoes[String(t)] ?? String(t)).join(' ');

      if (campo === 'detail' || campo === 'non_field_errors') return texto;

      const rotulo = rotulosCampos[campo] ?? campo;
      // Se a mensagem já cita o campo (ex: "...com este CPF."), não repete o nome
      return texto.toLowerCase().includes(rotulo.toLowerCase()) ? texto : `${rotulo}: ${texto}`;
    });
    if (partes.length > 0) return partes.join('\n');
  }
  return padrao;
}