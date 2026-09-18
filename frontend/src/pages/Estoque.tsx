import { useEffect, useState } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { listarEstoque, listarAlertas, listarMovimentacoes, criarMovimentacao } from '../services/estoque';
import type { Estoque, MovimentacaoEstoque, MovimentacaoForm, TipoMovimentacao } from '../types/estoque';
import MovimentacaoFormModal from '../components/estoque/MovimentacaoFormModal';

const tipoCor: Record<TipoMovimentacao, string> = {
  ENTRADA: 'bg-secondary/20 text-secondary',
  SAIDA: 'bg-danger/20 text-danger',
  AJUSTE: 'bg-accent-blue/20 text-accent-blue',
  TRANSFERENCIA: 'bg-warning/20 text-warning',
};

const tipoLabel: Record<TipoMovimentacao, string> = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  AJUSTE: 'Ajuste',
  TRANSFERENCIA: 'Transferência',
};

export default function EstoquePage() {
  const [aba, setAba] = useState<'estoque' | 'movimentacoes'>('estoque');
  const [busca, setBusca] = useState('');
  const [somenteAlertas, setSomenteAlertas] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');

  const [estoque, setEstoque] = useState<Estoque[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const carregarEstoque = async () => {
    setCarregando(true);
    const dados = somenteAlertas ? await listarAlertas() : await listarEstoque(busca);
    setEstoque(dados);
    setCarregando(false);
  };

  const carregarMovimentacoes = async () => {
    setCarregando(true);
    const dados = await listarMovimentacoes({ busca, tipo: filtroTipo || undefined });
    setMovimentacoes(dados.results);
    setCarregando(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (aba === 'estoque') carregarEstoque();
      else carregarMovimentacoes();
    }, 300);
    return () => clearTimeout(timeout);
  }, [aba, busca, somenteAlertas, filtroTipo]);

  const handleSalvarMovimentacao = async (dados: MovimentacaoForm) => {
    await criarMovimentacao(dados);
    setModalAberto(false);
    if (aba === 'estoque') carregarEstoque();
    else carregarMovimentacoes();
  };

  return (
    <div className="app-bg min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-2xl font-bold font-sans">Estoque</h1>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus size={16} />
          Nova movimentação
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setAba('estoque')}
          className={`px-4 py-2 rounded-xl text-sm font-sans font-semibold transition ${
            aba === 'estoque' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/5'
          }`}
        >
          Estoque atual
        </button>
        <button
          onClick={() => setAba('movimentacoes')}
          className={`px-4 py-2 rounded-xl text-sm font-sans font-semibold transition ${
            aba === 'movimentacoes' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/5'
          }`}
        >
          Movimentações
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, SKU..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary"
          />
        </div>

        {aba === 'estoque' && (
          <button
            onClick={() => setSomenteAlertas((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-sans transition ${
              somenteAlertas ? 'bg-danger/20 text-danger' : 'text-text-secondary hover:bg-white/5 border border-white/10'
            }`}
          >
            <AlertTriangle size={16} />
            Só estoque baixo
          </button>
        )}

        {aba === 'movimentacoes' && (
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary"
          >
            <option value="">Todos os tipos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
            <option value="AJUSTE">Ajuste</option>
            <option value="TRANSFERENCIA">Transferência</option>
          </select>
        )}
      </div>

      {aba === 'estoque' ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="text-text-secondary text-left border-b border-white/10">
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Produto</th>
                <th className="px-5 py-3 font-medium">Quantidade atual</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Atualizado em</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-text-secondary">Carregando...</td></tr>
              ) : estoque.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-text-secondary">Nenhum produto encontrado.</td></tr>
              ) : (
                estoque.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-5 py-3 text-text-secondary">{item.produto_sku}</td>
                    <td className="px-5 py-3 text-text-primary">{item.produto_nome}</td>
                    <td className="px-5 py-3 text-text-secondary">{item.quantidade_atual}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.abaixo_do_minimo ? 'bg-danger/20 text-danger' : 'bg-secondary/20 text-secondary'}`}>
                        {item.abaixo_do_minimo ? 'Estoque baixo' : 'OK'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">
                      {new Date(item.atualizado_em).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="text-text-secondary text-left border-b border-white/10">
                <th className="px-5 py-3 font-medium">Produto</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Quantidade</th>
                <th className="px-5 py-3 font-medium">Motivo</th>
                <th className="px-5 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-text-secondary">Carregando...</td></tr>
              ) : movimentacoes.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-text-secondary">Nenhuma movimentação encontrada.</td></tr>
              ) : (
                movimentacoes.map((mov) => (
                  <tr key={mov.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-5 py-3 text-text-primary">{mov.produto_nome}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${tipoCor[mov.tipo]}`}>
                        {tipoLabel[mov.tipo]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{mov.quantidade}</td>
                    <td className="px-5 py-3 text-text-secondary">{mov.motivo || '—'}</td>
                    <td className="px-5 py-3 text-text-secondary">
                      {new Date(mov.criado_em).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <MovimentacaoFormModal
          onClose={() => setModalAberto(false)}
          onSalvar={handleSalvarMovimentacao}
        />
      )}
    </div>
  );
}