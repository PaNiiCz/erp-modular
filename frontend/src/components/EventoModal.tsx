import { useState } from 'react'
import type { FormEvent } from 'react'
import { agendaApi, mensagemDeErro } from '../services/agendaApi'
import type { Evento, EventoForm, Tipo, UsuarioSimples } from '../services/agendaApi'
import SelectCampo from './SelectCampo'
import ConfirmarModal from './ConfirmarModal'
import SeletorConvidados from './SeletorConvidados'
import '../pages/Agenda.css'

const TIPOS: { valor: Tipo; rotulo: string }[] = [
  { valor: 'COMPROMISSO', rotulo: 'Compromisso' },
  { valor: 'REUNIAO', rotulo: 'Reunião' },
  { valor: 'EVENTO', rotulo: 'Evento' },
  { valor: 'OUTRO', rotulo: 'Outro' },
]

const LEMBRETES = [
  { minutos: 0, rotulo: 'No horário' },
  { minutos: 10, rotulo: '10 min antes' },
  { minutos: 30, rotulo: '30 min antes' },
  { minutos: 60, rotulo: '1 hora antes' },
  { minutos: 1440, rotulo: '1 dia antes' },
]

interface Campos {
  titulo: string
  descricao: string
  local: string
  tipo: Tipo
  inicio: string
  fim: string
  dia_inteiro: boolean
  cor: string
  participantes: number[]
  lembretes: number[]
}

const doisDigitos = (n: number) => String(n).padStart(2, '0')

// Converte uma data para o formato do input datetime-local (horário local)
function paraInput(d: Date) {
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}T${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`
}

function alternar(lista: number[], valor: number) {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]
}

interface Props {
  evento: Evento | null
  dia: Date
  usuarios: UsuarioSimples[]
  onFechar: () => void
  onSalvo: () => void
}

export default function EventoModal({ evento, dia, usuarios, onFechar, onSalvo }: Props) {
  const somenteLeitura = !!evento && !evento.pode_editar
  const [enviando, setEnviando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [erro, setErro] = useState('')
  const [campos, setCampos] = useState<Campos>(() => {
    if (evento) {
      return {
        titulo: evento.titulo,
        descricao: evento.descricao,
        local: evento.local,
        tipo: evento.tipo,
        inicio: paraInput(new Date(evento.inicio)),
        fim: paraInput(new Date(evento.fim)),
        dia_inteiro: evento.dia_inteiro,
        cor: evento.cor,
        participantes: evento.participantes,
        lembretes: evento.lembretes_minutos,
      }
    }
    const ano = dia.getFullYear()
    const mes = dia.getMonth()
    const dd = dia.getDate()
    return {
      titulo: '',
      descricao: '',
      local: '',
      tipo: 'COMPROMISSO',
      inicio: paraInput(new Date(ano, mes, dd, 9, 0)),
      fim: paraInput(new Date(ano, mes, dd, 10, 0)),
      dia_inteiro: false,
      cor: '#4318ff',
      participantes: [],
      lembretes: [],
    }
  })

  function alterar<K extends keyof Campos>(campo: K, valor: Campos[K]) {
    setCampos((atual) => ({ ...atual, [campo]: valor }))
  }

  async function executar(acao: () => Promise<unknown>) {
    setEnviando(true)
    setErro('')
    try {
      await acao()
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    let { inicio, fim } = campos
    if (!inicio || !fim) {
      setErro('Informe o início e o fim.')
      return
    }
    if (campos.dia_inteiro) {
      inicio = `${inicio.slice(0, 10)}T00:00`
      fim = `${fim.slice(0, 10)}T23:59`
    }
    const dados: EventoForm = {
      titulo: campos.titulo,
      descricao: campos.descricao,
      local: campos.local,
      tipo: campos.tipo,
      inicio: new Date(inicio).toISOString(),
      fim: new Date(fim).toISOString(),
      dia_inteiro: campos.dia_inteiro,
      cor: campos.cor,
      participantes: campos.participantes,
      lembretes_minutos: campos.lembretes,
    }
    executar(() => (evento ? agendaApi.editar(evento.id, dados) : agendaApi.criar(dados)))
  }

  function confirmarExclusao() {
    setConfirmandoExclusao(false)
    if (evento) executar(() => agendaApi.excluir(evento.id))
  }

  // O dono nunca aparece como convidado do próprio evento
  const pessoas = usuarios.filter((u) => u.id !== evento?.usuario)

  return (
    <>
      <div className="ag-fundo" onClick={onFechar}>
        <form className="ag-modal" onClick={(e) => e.stopPropagation()} onSubmit={enviar}>
          <h2>{!evento ? 'Novo evento' : somenteLeitura ? 'Detalhes do evento' : 'Editar evento'}</h2>
          {evento && <p>Status: <strong>{evento.status}</strong></p>}
          {somenteLeitura && evento && (
            <p className="ag-aviso">Evento de {evento.dono_nome}. Você é convidado e não pode editar.</p>
          )}

          <fieldset disabled={somenteLeitura || enviando}>
            <label>
              Título
              <input type="text" required maxLength={150} value={campos.titulo} onChange={(e) => alterar('titulo', e.target.value)} />
            </label>
            <label>
              Descrição
              <textarea rows={3} value={campos.descricao} onChange={(e) => alterar('descricao', e.target.value)} />
            </label>
            <div className="ag-linha">
              <label>
                Local
                <input type="text" maxLength={200} value={campos.local} onChange={(e) => alterar('local', e.target.value)} />
              </label>
              <div>
                <span className="ag-titulo-campo">Tipo</span>
                <SelectCampo
                  className="w-full"
                  value={campos.tipo}
                  onChange={(e) => alterar('tipo', e.target.value as Tipo)}
                >
                  {TIPOS.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.rotulo}</option>
                  ))}
                </SelectCampo>
              </div>
            </div>
            <div className="ag-linha">
              <label>
                Início
                <input type="datetime-local" required value={campos.inicio} onChange={(e) => alterar('inicio', e.target.value)} />
              </label>
              <label>
                Fim
                <input type="datetime-local" required value={campos.fim} onChange={(e) => alterar('fim', e.target.value)} />
              </label>
            </div>
            <div className="ag-linha">
              <div className="ag-opcoes">
                <label>
                  <input type="checkbox" checked={campos.dia_inteiro} onChange={(e) => alterar('dia_inteiro', e.target.checked)} />
                  Dia inteiro
                </label>
              </div>
              <label>
                Cor
                <input type="color" value={campos.cor} onChange={(e) => alterar('cor', e.target.value)} />
              </label>
            </div>

            <div>
              <span className="ag-titulo-campo">Lembretes</span>
              <div className="ag-opcoes">
                {LEMBRETES.map((l) => (
                  <label key={l.minutos}>
                    <input
                      type="checkbox"
                      checked={campos.lembretes.includes(l.minutos)}
                      onChange={() => alterar('lembretes', alternar(campos.lembretes, l.minutos))}
                    />
                    {l.rotulo}
                  </label>
                ))}
              </div>
            </div>

            {somenteLeitura ? (
              <div>
                <span className="ag-titulo-campo">Convidados</span>
                <p>{evento?.participantes_nomes.join(', ') || 'Ninguém além do dono.'}</p>
              </div>
            ) : (
              <SeletorConvidados
                usuarios={pessoas}
                selecionados={campos.participantes}
                onChange={(ids) => alterar('participantes', ids)}
              />
            )}
          </fieldset>

          {erro && <p className="ag-erro">{erro}</p>}

          <div className="ag-acoes">
            {!somenteLeitura && (
              <button type="submit" className="ag-btn ag-btn-principal" disabled={enviando}>
                {enviando ? 'Salvando...' : 'Salvar'}
              </button>
            )}
            {evento && !somenteLeitura && evento.status === 'AGENDADO' && (
              <>
                <button type="button" className="ag-btn" disabled={enviando} onClick={() => executar(() => agendaApi.concluir(evento.id))}>
                  Concluir
                </button>
                <button type="button" className="ag-btn" disabled={enviando} onClick={() => executar(() => agendaApi.cancelar(evento.id))}>
                  Cancelar evento
                </button>
              </>
            )}
            {evento && !somenteLeitura && (
              <button type="button" className="ag-btn ag-btn-perigo" disabled={enviando} onClick={() => setConfirmandoExclusao(true)}>
                Excluir
              </button>
            )}
            <button type="button" className="ag-btn" onClick={onFechar}>Fechar</button>
          </div>
        </form>
      </div>

      {confirmandoExclusao && evento && (
        <ConfirmarModal
          titulo="Excluir evento"
          mensagem={`Tem certeza que deseja excluir "${evento.titulo}"? Essa ação não pode ser desfeita.`}
          textoConfirmar="Sim, excluir"
          onConfirmar={confirmarExclusao}
          onCancelar={() => setConfirmandoExclusao(false)}
        />
      )}
    </>
  )
}