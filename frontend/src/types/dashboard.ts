export interface ResumoDashboard {
  faturamento_mes: string;
  lucro_mes: string;
  total_vendas_mes: number;
  contas_a_pagar: string;
  contas_a_receber: string;
  clientes_ativos: number;
}

export interface ProdutoMaisVendido {
  produto_id: number;
  nome: string;
  sku: string;
  quantidade_vendida: number;
  valor_total_vendido: string;
}

export interface VendaPorDia {
  dia: string;
  faturamento: string;
  quantidade_vendas: number;
}

export interface AtividadeRecente {
  tipo: 'venda' | 'compra' | 'estoque';
  descricao: string;
  data: string;
}