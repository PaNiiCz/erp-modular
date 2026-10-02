import { useCallback, useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import SelectCampo from '../SelectCampo';
import { mensagemErro } from '../../services/rh';

export interface Coluna<T> {
  titulo: string;
  render: (item: T) => ReactNode;
}

interface PropsModal<T> {
  item: T | null;
  onClose: () => void;
  onSalvo: () => void;
}

interface Props<T extends { id: number }> {
  rotuloNovo: string;
  placeholderBusca: string;
  carregar: (busca: string, filtro: string) => Promise<T[]>;
  colunas: Coluna<T>[];
  excluir: (item: T) => Promise<void>;
  nomeItem: (item: T) => string;
  Modal: ComponentType<PropsModal<T>>;
  filtro?: { placeholderTodos: string; opcoes: { valor: string; label: string }[] };
  acoes?: (item: T, ctx: { recarregar: () => void; setErro: (mensagem: string) => void }) => ReactNode;
}

export default function CrudTab<T extends { id: number }>({
  rotuloNovo,
  placeholderBusca,
  carregar,
  colunas,
  excluir,
  nomeItem,
  Modal,
  filtro,
  acoes,
}: Props<T>) {
  const [busca, setBusca] = useState('');
  const [valorFiltro, setValorFiltro] = useState('');
  const [itens, setItens] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<T | null>(null);
  const [excluindo, setExcluindo] = useState<T | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      setItens(await carregar(busca, valorFiltro));
      setErro('');
    } catch (e) {
      setItens([]);
      setErro(mensagemErro(e, 'Não foi possível carregar os dados.'));
    } finally {
      setCarregando(false);
    }
  }, [carregar, busca, valorFiltro]);

  useEffect(() => {
    const timeout = setTimeout(recarregar, 300);
    return () => clearTimeout(timeout);
  }, [recarregar]);

  const abrirNovo = () => {
    setEditando(null);
    setModalAberto(true);
  };

  const aoSalvar = () => {
    setModalAberto(false);
    setEditando(null);
    void recarregar();
  };

  const confirmarExclusao = async () => {
    if (!excluindo) return;
    setConfirmando(true);
    try {
      await excluir(excluindo);
      setExcluindo(null);
      await recarregar();
    } catch (e) {
      setExcluindo(null);
      setErro(mensagemErro(e, 'Não foi possível excluir.'));
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={placeholderBusca}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary"
          />
        </div>

        {filtro && (
          <SelectCampo className="w-48" value={valorFiltro} onChange={(e) => setValorFiltro(e.target.value)}>
            <option value="">{filtro.placeholderTodos}</option>
            {filtro.opcoes.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.label}
              </option>
            ))}
          </SelectCampo>
        )}

        <button
          onClick={abrirNovo}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus size={16} />
          {rotuloNovo}
        </button>
      </div>

      {erro && <p className="text-danger text-sm font-sans mb-3 whitespace-pre-line">{erro}</p>}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="text-text-secondary text-left border-b border-white/10">
                {colunas.map((c) => (
                  <th key={c.titulo} className="px-5 py-3 font-medium">
                    {c.titulo}
                  </th>
                ))}
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={colunas.length + 1} className="px-5 py-8 text-center text-text-secondary">
                    Carregando...
                  </td>
                </tr>
              ) : itens.length === 0 ? (
                <tr>
                  <td colSpan={colunas.length + 1} className="px-5 py-8 text-center text-text-secondary">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                itens.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    {colunas.map((c) => (
                      <td key={c.titulo} className="px-5 py-3 text-text-secondary">
                        {c.render(item)}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {acoes?.(item, {
                          recarregar: () => {
                            void recarregar();
                          },
                          setErro,
                        })}
                        <button
                          title="Editar"
                          onClick={() => {
                            setEditando(item);
                            setModalAberto(true);
                          }}
                          className="p-2 rounded-lg text-text-secondary hover:bg-white/5 hover:text-text-primary transition"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          title="Excluir"
                          onClick={() => setExcluindo(item)}
                          className="p-2 rounded-lg text-text-secondary hover:bg-white/5 hover:text-danger transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <Modal
          key={editando?.id ?? 'novo'}
          item={editando}
          onClose={() => {
            setModalAberto(false);
            setEditando(null);
          }}
          onSalvo={aoSalvar}
        />
      )}

      {excluindo && (
        <ConfirmModal
          titulo="Excluir registro"
          mensagem={`Deseja excluir "${nomeItem(excluindo)}"?\nEsta ação não pode ser desfeita.`}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setExcluindo(null)}
          confirmando={confirmando}
        />
      )}
    </div>
  );
}