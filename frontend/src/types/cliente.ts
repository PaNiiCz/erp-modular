export interface Cliente {
  id: number;
  tipo_pessoa: 'PF' | 'PJ';
  nome: string;
  nome_fantasia: string | null;
  cpf_cnpj: string;
  email: string;
  telefone_principal: string;
  telefone_secundario: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  etiquetas: string | null;
  observacoes: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export type ClienteForm = Omit<Cliente, 'id' | 'criado_em' | 'atualizado_em'>;