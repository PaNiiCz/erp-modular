export interface ItemCompra {
  id: number;
  produto: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: string;
  subtotal: string;
}

export interface ItemCompraForm {
  produto: number | null;
  quantidade: number;
  preco_unitario: string;
}

export type StatusCompra = 'ABERTA' | 'CONFIRMADA' | 'CANCELADA';
export type FormaPagamentoCompra = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO';

export interface Compra {
  id: number;
  fornecedor: number;
  fornecedor_nome: string;
  status: StatusCompra;
  forma_pagamento: FormaPagamentoCompra;
  desconto: string;
  observacoes: string | null;
  itens: ItemCompra[];
  total: string;
  criado_em: string;
  atualizado_em: string;
}

export interface CompraForm {
  fornecedor: number | null;
  forma_pagamento: FormaPagamentoCompra;
  desconto: string;
  observacoes: string;
  itens: ItemCompraForm[];
}