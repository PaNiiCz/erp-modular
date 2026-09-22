export interface CategoriaFinanceira {
  id: number;
  nome: string;
  tipo: 'RECEITA' | 'DESPESA';
}

export type TipoLancamento = 'RECEITA' | 'DESPESA';
export type StatusLancamento = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
export type FormaPagamentoFinanceiro =
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'TRANSFERENCIA';

export interface LancamentoFinanceiro {
  id: number;
  tipo: TipoLancamento;
  categoria: number | null;
  categoria_nome: string | null;
  cliente: number | null;
  cliente_nome: string | null;
  descricao: string;
  valor: string;
  forma_pagamento: FormaPagamentoFinanceiro;
  status: StatusLancamento;
  data_vencimento: string;
  data_pagamento: string | null;
  parcela_atual: number;
  total_parcelas: number;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface LancamentoForm {
  tipo: TipoLancamento;
  categoria: number | null;
  cliente: number | null;
  descricao: string;
  valor: string;
  forma_pagamento: FormaPagamentoFinanceiro;
  status: StatusLancamento;
  data_vencimento: string;
  data_pagamento: string | null;
  parcela_atual: number;
  total_parcelas: number;
  observacoes: string;
}

export interface ResumoFinanceiro {
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  total_pendente: number;
}