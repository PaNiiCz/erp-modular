import { useState } from 'react';
import CardRelatorio from '../components/relatorios/CardRelatorio';
import { baixarRelatorioVendas, baixarRelatorioFinanceiro, baixarRelatorioProdutos } from '../services/relatorios';
import type { FormatoRelatorio } from '../types/relatorio';

export default function Relatorios() {
  // Vendas
  const [vendasInicio, setVendasInicio] = useState('');
  const [vendasFim, setVendasFim] = useState('');
  const [vendasStatus, setVendasStatus] = useState('');

  // Financeiro
  const [financeiroInicio, setFinanceiroInicio] = useState('');
  const [financeiroFim, setFinanceiroFim] = useState('');
  const [financeiroTipo, setFinanceiroTipo] = useState('');
  const [financeiroStatus, setFinanceiroStatus] = useState('');

  // Produtos mais vendidos
  const [produtosInicio, setProdutosInicio] = useState('');
  const [produtosFim, setProdutosFim] = useState('');

  return (
    <div className="app-bg min-h-screen p-8">
      <h1 className="text-text-primary text-2xl font-bold font-sans mb-6">Relatórios</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CardRelatorio
          titulo="Vendas"
          descricao="Lista de vendas no período, com status e forma de pagamento."
          dataInicio={vendasInicio}
          dataFim={vendasFim}
          onChangeDataInicio={setVendasInicio}
          onChangeDataFim={setVendasFim}
          filtrosExtras={[
            {
              label: 'Status',
              tipo: 'select',
              valor: vendasStatus,
              onChange: setVendasStatus,
              opcoes: [
                { valor: '', label: 'Todos' },
                { valor: 'ABERTA', label: 'Aberta' },
                { valor: 'CONFIRMADA', label: 'Confirmada' },
                { valor: 'CANCELADA', label: 'Cancelada' },
              ],
            },
          ]}
          onBaixar={(formato: FormatoRelatorio) =>
            baixarRelatorioVendas(
              { data_inicio: vendasInicio || undefined, data_fim: vendasFim || undefined, status: vendasStatus || undefined },
              formato
            )
          }
        />

        <CardRelatorio
          titulo="Financeiro"
          descricao="Lançamentos financeiros no período, com tipo e status."
          dataInicio={financeiroInicio}
          dataFim={financeiroFim}
          onChangeDataInicio={setFinanceiroInicio}
          onChangeDataFim={setFinanceiroFim}
          filtrosExtras={[
            {
              label: 'Tipo',
              tipo: 'select',
              valor: financeiroTipo,
              onChange: setFinanceiroTipo,
              opcoes: [
                { valor: '', label: 'Todos' },
                { valor: 'RECEITA', label: 'Receita' },
                { valor: 'DESPESA', label: 'Despesa' },
              ],
            },
            {
              label: 'Status',
              tipo: 'select',
              valor: financeiroStatus,
              onChange: setFinanceiroStatus,
              opcoes: [
                { valor: '', label: 'Todos' },
                { valor: 'PENDENTE', label: 'Pendente' },
                { valor: 'PAGO', label: 'Pago' },
                { valor: 'ATRASADO', label: 'Atrasado' },
                { valor: 'CANCELADO', label: 'Cancelado' },
              ],
            },
          ]}
          onBaixar={(formato: FormatoRelatorio) =>
            baixarRelatorioFinanceiro(
              {
                data_inicio: financeiroInicio || undefined,
                data_fim: financeiroFim || undefined,
                tipo: financeiroTipo || undefined,
                status: financeiroStatus || undefined,
              },
              formato
            )
          }
        />

        <CardRelatorio
          titulo="Produtos mais vendidos"
          descricao="Ranking de produtos por quantidade vendida no período."
          dataInicio={produtosInicio}
          dataFim={produtosFim}
          onChangeDataInicio={setProdutosInicio}
          onChangeDataFim={setProdutosFim}
          onBaixar={(formato: FormatoRelatorio) =>
            baixarRelatorioProdutos(
              { data_inicio: produtosInicio || undefined, data_fim: produtosFim || undefined },
              formato
            )
          }
        />
      </div>
    </div>
  );
}