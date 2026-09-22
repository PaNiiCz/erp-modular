export interface ItemVenda {
  id: number;
  produto: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: string;
  subtotal: string;
}

export interface ItemVendaForm {
  produto: number | null;
  quantidade: number;
  preco_unitario: string;
}

export type StatusVenda = 'ABERTA' | 'CONFIRMADA' | 'CANCELADA';
export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO';

export interface Venda {
  id: number;
  cliente: number;
  cliente_nome: string;
  status: StatusVenda;
  forma_pagamento: FormaPagamento;
  desconto: string;
  observacoes: string | null;
  itens: ItemVenda[];
  total: string;
  criado_em: string;
  atualizado_em: string;
}

export interface VendaForm {
  cliente: number | null;
  forma_pagamento: FormaPagamento;
  desconto: string;
  observacoes: string;
  itens: ItemVendaForm[];
}