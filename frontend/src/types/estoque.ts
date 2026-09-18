export interface Estoque {
  id: number;
  produto: number;
  produto_nome: string;
  produto_sku: string;
  quantidade_atual: number;
  abaixo_do_minimo: boolean;
  atualizado_em: string;
}

export type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA';

export interface MovimentacaoEstoque {
  id: number;
  produto: number;
  produto_nome: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo: string | null;
  observacoes: string | null;
  criado_em: string;
}

export interface MovimentacaoForm {
  produto: number | null;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo: string;
  observacoes: string;
}