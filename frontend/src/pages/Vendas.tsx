import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Check, Ban } from 'lucide-react';
import { listarVendas, criarVenda, atualizarVenda, excluirVenda, alterarStatusVenda } from '../services/vendas';
import type { Venda, VendaForm, StatusVenda } from '../types/venda';
import VendaFormModal from '../components/vendas/VendaFormModal';
import ConfirmModal from '../components/ConfirmModal';

const statusCor: Record<StatusVenda, string> = {
  ABERTA: 'bg-warning/20 text-warning',
  CONFIRMADA: 'bg-secondary/20 text-secondary',
  CANCELADA: 'bg-danger/20 text-danger',
};

const statusLabel: Record<StatusVenda, string> = {
  ABERTA: 'Aberta',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

const formaPagamentoLabel: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito',
  BOLETO: 'Boleto',
};

type AcaoStatus = { venda: Venda; novoStatus: StatusVenda } | null;

// Extrai a mensagem de erro real vinda da API (o back-end manda texto específico,
// ex: estoque insuficiente com nome do produto e quantidades). Cai num texto
// genérico só se a API não mandar nada legível.
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

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [vendaEditando, setVendaEditando] = useState<Venda | null>(null);
  const [vendaExcluindo, setVendaExcluindo] = useState<Venda | null>(null);
  const [acaoStatus, setAcaoStatus] = useState<AcaoStatus>(null);
  const [processando, setProcessando] = useState(false);
  const [erroAcao, setErroAcao] = useState('');

  const carregar = async () => {
    setCarregando(true);
    const dados = await listarVendas({ busca, status: filtroStatus || undefined });
    setVendas(dados.results);
    setCarregando(false);
  };

  useEffect(() => {
    const timeout = setTimeout(carregar, 300);
    return () => clearTimeout(timeout);
  }, [busca, filtroStatus]);

  const abrirNova = () => {
    setVendaEditando(null);
    setModalAberto(true);
  };

  const abrirEdicao = (venda: Venda) => {
    setVendaEditando(venda);
    setModalAberto(true);
  };

  const handleSalvar = async (dados: VendaForm) => {
    if (vendaEditando) {
      await atualizarVenda(vendaEditando.id, dados);
    } else {
      await criarVenda(dados);
    }
    setModalAberto(false);
    carregar();
  };

  const confirmarExclusao = async () => {
    if (!vendaExcluindo) return;
    setProcessando(true);
    setErroAcao('');
    try {
      await excluirVenda(vendaExcluindo.id);
      setVendaExcluindo(null);
      carregar();
    } catch (err) {
      setErroAcao(extrairMensagemErro(err, 'Não foi possível excluir esta venda.'));
    } finally {
      setProcessando(false);
    }
  };

  const confirmarMudancaStatus = async () => {
    if (!acaoStatus) return;
    setProcessando(true);
    setErroAcao('');
    try {
      await alterarStatusVenda(acaoStatus.venda.id, acaoStatus.novoStatus);
      setAcaoStatus(null);
      carregar();
    } catch (err) {
      setErroAcao(extrairMensagemErro(err, 'Não foi possível concluir a operação.'));
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="app-bg min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-2xl font-bold font-sans">Vendas</h1>
        <button
          onClick={abrirNova}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus size={16} />
          Nova venda
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary"
        >
          <option value="">Todos os status</option>
          <option value="ABERTA">Aberta</option>
          <option value="CONFIRMADA">Confirmada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="text-text-secondary text-left border-b border-white/10">
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Pagamento</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Criada em</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-text-secondary">Carregando...</td></tr>
            ) : vendas.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-text-secondary">Nenhuma venda encontrada.</td></tr>
            ) : (
              vendas.map((venda) => (
                <tr key={venda.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-5 py-3 text-text-primary">{venda.cliente_nome}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusCor[venda.status]}`}>
                      {statusLabel[venda.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{formaPagamentoLabel[venda.forma_pagamento]}</td>
                  <td className="px-5 py-3 text-text-secondary">
                    R$ {Number(venda.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {new Date(venda.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {venda.status === 'ABERTA' && (
                        <>
                          <button onClick={() => abrirEdicao(venda)} className="text-text-secondary hover:text-accent-blue transition" title="Editar">
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => { setErroAcao(''); setAcaoStatus({ venda, novoStatus: 'CONFIRMADA' }); }}
                            className="text-text-secondary hover:text-secondary transition"
                            title="Confirmar venda"
                          >
                            <Check size={16} />
                          </button>
                        </>
                      )}
                      {venda.status !== 'CANCELADA' && (
                        <button
                          onClick={() => { setErroAcao(''); setAcaoStatus({ venda, novoStatus: 'CANCELADA' }); }}
                          className="text-text-secondary hover:text-danger transition"
                          title="Cancelar venda"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                      {venda.status === 'ABERTA' && (
                        <button
                          onClick={() => { setErroAcao(''); setVendaExcluindo(venda); }}
                          className="text-text-secondary hover:text-danger transition"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <VendaFormModal
          venda={vendaEditando}
          onClose={() => setModalAberto(false)}
          onSalvar={handleSalvar}
        />
      )}

      {vendaExcluindo && (
        <ConfirmModal
          titulo="Excluir venda"
          mensagem={`Tem certeza que deseja excluir a venda de "${vendaExcluindo.cliente_nome}"? Esta ação não pode ser desfeita.${erroAcao ? '\n\n⚠ ' + erroAcao : ''}`}
          confirmando={processando}
          onConfirmar={confirmarExclusao}
          onCancelar={() => { setVendaExcluindo(null); setErroAcao(''); }}
        />
      )}

      {acaoStatus && (
        <ConfirmModal
          titulo={acaoStatus.novoStatus === 'CONFIRMADA' ? 'Confirmar venda' : 'Cancelar venda'}
          mensagem={
            acaoStatus.novoStatus === 'CONFIRMADA'
              ? `Confirmar a venda de "${acaoStatus.venda.cliente_nome}"? Isso vai dar baixa automática no estoque dos produtos.${erroAcao ? '\n\n⚠ ' + erroAcao : ''}`
              : `Cancelar a venda de "${acaoStatus.venda.cliente_nome}"? Se ela já estava confirmada, o estoque será estornado automaticamente.${erroAcao ? '\n\n⚠ ' + erroAcao : ''}`
          }
          confirmando={processando}
          desabilitado={acaoStatus.novoStatus === 'CONFIRMADA' && !!erroAcao}
          textoConfirmar={acaoStatus.novoStatus === 'CONFIRMADA' ? 'Confirmar' : 'Cancelar'}
          textoConfirmando={acaoStatus.novoStatus === 'CONFIRMADA' ? 'Confirmando...' : 'Cancelando...'}
          corConfirmar={acaoStatus.novoStatus === 'CONFIRMADA' ? 'sucesso' : 'danger'}
          onConfirmar={confirmarMudancaStatus}
          onCancelar={() => { setAcaoStatus(null); setErroAcao(''); }}
        />
      )}
    </div>
  );
}