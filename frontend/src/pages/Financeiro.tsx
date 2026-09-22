import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, TrendingUp, TrendingDown, Wallet, Clock } from 'lucide-react';
import { listarLancamentos, buscarResumo, criarLancamento, atualizarLancamento, excluirLancamento } from '../services/financeiro';
import type { LancamentoFinanceiro, LancamentoForm, ResumoFinanceiro, StatusLancamento, TipoLancamento } from '../types/financeiro';
import LancamentoFormModal from '../components/financeiro/LancamentoFormModal';
import ConfirmModal from '../components/ConfirmModal';

const statusCor: Record<StatusLancamento, string> = {
  PENDENTE: 'bg-warning/20 text-warning',
  PAGO: 'bg-secondary/20 text-secondary',
  ATRASADO: 'bg-danger/20 text-danger',
  CANCELADO: 'bg-white/10 text-text-secondary',
};

const statusLabel: Record<StatusLancamento, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  ATRASADO: 'Atrasado',
  CANCELADO: 'Cancelado',
};

const tipoCor: Record<TipoLancamento, string> = {
  RECEITA: 'bg-secondary/20 text-secondary',
  DESPESA: 'bg-danger/20 text-danger',
};

const tipoLabel: Record<TipoLancamento, string> = {
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
};

function formatarValor(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function extrairMensagemErro(err: unknown, padrao: string): string {
  const resposta = (err as { response?: { data?: unknown } })?.response?.data;
  if (!resposta) return padrao;
  if (typeof resposta === 'string') return resposta;
  if (Array.isArray(resposta)) return resposta.join(' ');
  if (typeof resposta === 'object') {
    const valores = Object.values(resposta as Record<string, unknown>);
    const partes = valores.flatMap((v) => (Array.isArray(v) ? v : [v]));
    if (partes.length > 0) return partes.join(' ');
  }
  return padrao;
}

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [lancamentoEditando, setLancamentoEditando] = useState<LancamentoFinanceiro | null>(null);
  const [lancamentoExcluindo, setLancamentoExcluindo] = useState<LancamentoFinanceiro | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erroAcao, setErroAcao] = useState('');

  const carregar = async () => {
    setCarregando(true);
    const [dadosLancamentos, dadosResumo] = await Promise.all([
      listarLancamentos({ busca, tipo: filtroTipo || undefined, status: filtroStatus || undefined }),
      buscarResumo(),
    ]);
    setLancamentos(dadosLancamentos.results);
    setResumo(dadosResumo);
    setCarregando(false);
  };

  useEffect(() => {
    const timeout = setTimeout(carregar, 300);
    return () => clearTimeout(timeout);
  }, [busca, filtroTipo, filtroStatus]);

  const abrirNovo = () => {
    setLancamentoEditando(null);
    setModalAberto(true);
  };

  const abrirEdicao = (lancamento: LancamentoFinanceiro) => {
    setLancamentoEditando(lancamento);
    setModalAberto(true);
  };

  const handleSalvar = async (dados: LancamentoForm) => {
    if (lancamentoEditando) {
      await atualizarLancamento(lancamentoEditando.id, dados);
    } else {
      await criarLancamento(dados);
    }
    setModalAberto(false);
    carregar();
  };

  const confirmarExclusao = async () => {
    if (!lancamentoExcluindo) return;
    setProcessando(true);
    setErroAcao('');
    try {
      await excluirLancamento(lancamentoExcluindo.id);
      setLancamentoExcluindo(null);
      carregar();
    } catch (err) {
      setErroAcao(extrairMensagemErro(err, 'Não foi possível excluir este lançamento.'));
    } finally {
      setProcessando(false);
    }
  };

  const cards = resumo
    ? [
        { titulo: 'Total recebido', valor: resumo.total_receitas, icone: TrendingUp, cor: 'text-secondary' },
        { titulo: 'Total pago', valor: resumo.total_despesas, icone: TrendingDown, cor: 'text-danger' },
        { titulo: 'Saldo', valor: resumo.saldo, icone: Wallet, cor: resumo.saldo >= 0 ? 'text-secondary' : 'text-danger' },
        { titulo: 'Pendente', valor: resumo.total_pendente, icone: Clock, cor: 'text-warning' },
      ]
    : [];

  return (
    <div className="app-bg min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-2xl font-bold font-sans">Financeiro</h1>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus size={16} />
          Novo lançamento
        </button>
      </div>

      {resumo && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {cards.map(({ titulo, valor, icone: Icone, cor }) => (
            <div key={titulo} className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary text-xs font-sans">{titulo}</span>
                <Icone size={16} className={cor} />
              </div>
              <span className={`text-lg font-bold font-sans ${cor}`}>R$ {formatarValor(valor)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por descrição, cliente..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary"
        >
          <option value="">Todos os tipos</option>
          <option value="RECEITA">Receita</option>
          <option value="DESPESA">Despesa</option>
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary"
        >
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Pago</option>
          <option value="ATRASADO">Atrasado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="text-text-secondary text-left border-b border-white/10">
              <th className="px-5 py-3 font-medium">Descrição</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Categoria</th>
              <th className="px-5 py-3 font-medium">Vencimento</th>
              <th className="px-5 py-3 font-medium">Valor</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-text-secondary">Carregando...</td></tr>
            ) : lancamentos.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-text-secondary">Nenhum lançamento encontrado.</td></tr>
            ) : (
              lancamentos.map((lanc) => (
                <tr key={lanc.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-5 py-3 text-text-primary">
                    {lanc.descricao}
                    {lanc.total_parcelas > 1 && (
                      <span className="text-text-secondary text-xs ml-1">({lanc.parcela_atual}/{lanc.total_parcelas})</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${tipoCor[lanc.tipo]}`}>{tipoLabel[lanc.tipo]}</span>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{lanc.categoria_nome || '—'}</td>
                  <td className="px-5 py-3 text-text-secondary">
                    {new Date(lanc.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">R$ {formatarValor(lanc.valor)}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusCor[lanc.status]}`}>{statusLabel[lanc.status]}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => abrirEdicao(lanc)} className="text-text-secondary hover:text-accent-blue transition" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => { setErroAcao(''); setLancamentoExcluindo(lanc); }}
                        className="text-text-secondary hover:text-danger transition"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <LancamentoFormModal
          lancamento={lancamentoEditando}
          onClose={() => setModalAberto(false)}
          onSalvar={handleSalvar}
        />
      )}

      {lancamentoExcluindo && (
        <ConfirmModal
          titulo="Excluir lançamento"
          mensagem={`Tem certeza que deseja excluir "${lancamentoExcluindo.descricao}"? Esta ação não pode ser desfeita.${erroAcao ? '\n\n⚠ ' + erroAcao : ''}`}
          confirmando={processando}
          onConfirmar={confirmarExclusao}
          onCancelar={() => { setLancamentoExcluindo(null); setErroAcao(''); }}
        />
      )}
    </div>
  );
}