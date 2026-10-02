export interface Departamento {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
  total_funcionarios: number;
  criado_em: string;
}

export interface DepartamentoForm {
  nome: string;
  descricao: string;
  ativo: boolean;
}

export interface Cargo {
  id: number;
  nome: string;
  departamento: number | null;
  departamento_nome: string | null;
  descricao: string;
  salario_base: string;
  ativo: boolean;
  criado_em: string;
}

export interface CargoForm {
  nome: string;
  departamento: number | null;
  descricao: string;
  salario_base: string;
  ativo: boolean;
}

export type StatusFuncionario = 'ATIVO' | 'FERIAS' | 'AFASTADO' | 'DESLIGADO';

export interface Funcionario {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  data_nascimento: string | null;
  data_admissao: string;
  data_demissao: string | null;
  cargo: number;
  cargo_nome: string;
  departamento: number;
  departamento_nome: string;
  salario: string;
  status: StatusFuncionario;
  usuario: number | null;
  criado_em: string;
  atualizado_em: string;
}

export interface FuncionarioForm {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  data_nascimento: string | null;
  data_admissao: string;
  data_demissao: string | null;
  cargo: number;
  departamento: number;
  salario?: string;
  status: StatusFuncionario;
}

export type StatusFerias = 'SOLICITADA' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';

export interface Ferias {
  id: number;
  funcionario: number;
  funcionario_nome: string;
  data_inicio: string;
  data_fim: string;
  dias: number;
  status: StatusFerias;
  observacoes: string;
  criado_em: string;
}

export interface FeriasForm {
  funcionario: number;
  data_inicio: string;
  data_fim: string;
  observacoes: string;
}

export interface Escala {
  id: number;
  funcionario: number;
  funcionario_nome: string;
  dia_semana: number;
  dia_semana_nome: string;
  hora_inicio: string;
  hora_fim: string;
}

export interface EscalaForm {
  funcionario: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
}

export type TipoDocumento = 'RG' | 'CPF' | 'CTPS' | 'CONTRATO' | 'ASO' | 'COMPROVANTE' | 'OUTRO';

export interface Documento {
  id: number;
  funcionario: number;
  funcionario_nome: string;
  tipo: TipoDocumento;
  tipo_nome: string;
  titulo: string;
  arquivo_url: string;
  criado_em: string;
}