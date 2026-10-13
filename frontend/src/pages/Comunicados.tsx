import { useCallback, useEffect, useState } from 'react';
import { Plus, X, Trash2, Pin, Check, Pencil, Eye } from 'lucide-react';
import type { Comunicado, Categoria, Leitura } from '../services/comunicadosApi';
import * as api from '../services/comunicadosApi';
import { obterEu } from '../services/tarefasApi';
import type { Eu } from '../services/tarefasApi';
import { mensagemErro as msg } from '../services/http';
import SelectCampo from '../components/SelectCampo';
import ConfirmModal from '../components/ConfirmModal';

const CATEGORIAS: { id: Categoria; nome: string; cor: string }[] = [
  { id: 'ENTRADA', nome: 'Entrada', cor: 'bg-secondary/20 text-secondary' },
  { id: 'SAIDA', nome: 'Saída', cor: 'bg-amber-400/20 text-amber-300' },
  { id: 'ENTREGA', nome: 'Entrega', cor: 'bg-accent-blue/20 text-accent-blue' },
  { id: 'GERAL', nome: 'Geral', cor: 'bg-white/10 text-text-secondary' },
];

const campo =
  'w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary [color-scheme:dark]';
const botaoPrincipal =
  'flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition';
const botaoSecundario =
  'px-4 py-2 rounded-xl text-text-secondary font-sans text-sm font-semibold hover:bg-white/5 transition';
const fundoModal = { background: '#141a4a' };

const quando = (d: string) =>
  new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function Comunicados() {
  const [itens, setItens] = useState<Comunicado[]>([]);
  const [eu, setEu] = useState<Eu | null>(null);
  const [filtro, setFiltro] = useState<Categoria | ''>('');
  const [modal, setModal] = useState<Comunicado | 'novo' | null>(null);
  const [leituras, setLeituras] = useState<{ id: number; lista: Leitura[] } | null>(null);
  const [excluindo, setExcluindo] = useState<Comunicado | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([api.listarComunicados(), obterEu()]);
      setItens(c);
      setEu(e);
      setErro('');
    } catch (e) {
      setErro(msg(e));
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function agir(fn: () => Promise<unknown>) {
    try {
      await fn();
      await carregar();
    } catch (e) {
      setErro(msg(e));
    }
  }

  async function verLeituras(id: number) {
    if (leituras?.id === id) return setLeituras(null);
    try {
      setLeituras({ id, lista: await api.listarLeituras(id) });
    } catch (e) {
      setErro(msg(e));
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    setProcessando(true);
    try {
      await api.excluirComunicado(excluindo.id);
      setExcluindo(null);
      await carregar();
    } catch (e) {
      setErro(msg(e));
      setExcluindo(null);
    } finally {
      setProcessando(false);
    }
  }

  const visiveis = itens.filter((c) => !filtro || c.categoria === filtro);
  const naoLidos = itens.filter((c) => !c.lido).length;
  const chefia = !!eu?.is_staff;

  return (
    <div className="app-bg min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold font-sans">Comunicados</h1>
          {naoLidos > 0 && (
            <p className="text-text-secondary text-sm font-sans mt-1">{naoLidos} não lido(s)</p>
          )}
        </div>
        {chefia && (
          <button onClick={() => setModal('novo')} className={botaoPrincipal}>
            <Plus size={16} />
            Novo comunicado
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setFiltro('')}
          className={`px-4 py-2 rounded-xl text-sm font-sans font-semibold transition ${
            !filtro ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/5'
          }`}
        >
          Todos
        </button>
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            onClick={() => setFiltro(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-sans font-semibold transition ${
              filtro === c.id ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/5'
            }`}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {erro && <p className="text-danger text-sm font-sans mb-4">{erro}</p>}

      <div className="space-y-3">
        {visiveis.length === 0 && !erro && (
          <div className="glass-card rounded-2xl px-5 py-8 text-center text-text-secondary text-sm font-sans">
            Nenhum comunicado.
          </div>
        )}
        {visiveis.map((c) => {
          const cat = CATEGORIAS.find((x) => x.id === c.categoria);
          return (
            <div
              key={c.id}
              className={`glass-card rounded-2xl p-5 space-y-2 ${c.fixado ? 'border border-amber-400/50' : ''}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {c.fixado && <Pin size={14} className="text-amber-300" />}
                <span className={`px-2 py-1 rounded-full text-xs font-sans ${cat?.cor}`}>{cat?.nome}</span>
                {!c.lido && <span className="h-2 w-2 rounded-full bg-accent-blue" title="Não lido" />}
                <h3 className="text-text-primary font-sans font-semibold">{c.titulo}</h3>
                <span className="ml-auto text-xs font-sans text-text-secondary">
                  {c.autor_nome} · {quando(c.criado_em)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm font-sans text-text-secondary">{c.texto}</p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-sm font-sans">
                {c.lido ? (
                  <span className="flex items-center gap-1 text-secondary">
                    <Check size={14} /> Lido
                  </span>
                ) : (
                  <button
                    onClick={() => agir(() => api.marcarLido(c.id))}
                    className="px-3 py-1 rounded-xl bg-white/10 text-text-primary hover:bg-white/15 transition"
                  >
                    Marcar como lido
                  </button>
                )}
                {chefia && (
                  <>
                    <button
                      onClick={() => verLeituras(c.id)}
                      className="flex items-center gap-1 text-text-secondary hover:text-accent-blue transition"
                    >
                      <Eye size={14} /> Quem leu ({c.total_leituras})
                    </button>
                    <button
                      onClick={() => agir(() => api.salvarComunicado(c.id, { fixado: !c.fixado }))}
                      className="flex items-center gap-1 text-text-secondary hover:text-accent-blue transition"
                    >
                      <Pin size={14} /> {c.fixado ? 'Desafixar' : 'Fixar'}
                    </button>
                    <button
                      onClick={() => setModal(c)}
                      className="flex items-center gap-1 text-text-secondary hover:text-accent-blue transition"
                    >
                      <Pencil size={14} /> Editar
                    </button>
                    <button
                      onClick={() => setExcluindo(c)}
                      className="flex items-center gap-1 text-text-secondary hover:text-danger transition"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  </>
                )}
              </div>

              {leituras?.id === c.id && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-sans text-text-secondary">
                  {leituras.lista.length === 0
                    ? 'Ninguém leu ainda.'
                    : leituras.lista.map((l) => (
                        <div key={l.usuario}>
                          {l.usuario_nome} · {quando(l.lida_em)}
                        </div>
                      ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <ComunicadoModal
          comunicado={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
          onSalvo={() => {
            setModal(null);
            carregar();
          }}
        />
      )}

      {excluindo && (
        <ConfirmModal
          titulo="Excluir comunicado"
          mensagem={`Tem certeza que deseja excluir "${excluindo.titulo}"? Esta ação não pode ser desfeita.`}
          confirmando={processando}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setExcluindo(null)}
        />
      )}
    </div>
  );
}

function ComunicadoModal(props: { comunicado: Comunicado | null; onClose: () => void; onSalvo: () => void }) {
  const { comunicado, onClose, onSalvo } = props;
  const [titulo, setTitulo] = useState(comunicado?.titulo ?? '');
  const [texto, setTexto] = useState(comunicado?.texto ?? '');
  const [categoria, setCategoria] = useState<string>(comunicado?.categoria ?? 'GERAL');
  const [fixado, setFixado] = useState(comunicado?.fixado ?? false);
  const [erro, setErro] = useState('');

  async function salvar() {
    if (!titulo.trim() || !texto.trim()) return setErro('Preencha título e texto.');
    try {
      await api.salvarComunicado(comunicado?.id ?? null, { titulo: titulo.trim(), texto, categoria, fixado });
      onSalvo();
    } catch (e) {
      setErro(msg(e));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div style={fundoModal} className="glass-card w-full max-w-lg space-y-3 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-text-primary text-xl font-bold font-sans">
            {comunicado ? 'Editar comunicado' : 'Novo comunicado'}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition">
            <X size={20} />
          </button>
        </div>
        <input className={campo} placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <SelectCampo className="w-full" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {CATEGORIAS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </SelectCampo>
        <textarea
          className={campo}
          rows={5}
          placeholder="Texto do aviso"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm font-sans text-text-primary">
          <input type="checkbox" checked={fixado} onChange={(e) => setFixado(e.target.checked)} />
          Fixar no topo do mural
        </label>
        {erro && <p className="text-danger text-sm font-sans">{erro}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={salvar} className={botaoPrincipal}>
            Publicar
          </button>
          <button onClick={onClose} className={botaoSecundario}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}