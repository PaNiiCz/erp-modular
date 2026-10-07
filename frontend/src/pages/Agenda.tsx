import { useCallback, useEffect, useMemo, useState } from 'react'
import { agendaApi, mensagemDeErro } from '../services/agendaApi'
import type { Evento, UsuarioSimples } from '../services/agendaApi'
import EventoModal from '../components/EventoModal'
import NotificacoesSino from '../components/NotificacoesSino'
import './Agenda.css'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const chaveData = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// 42 dias (6 semanas) começando no domingo da semana do dia 1
function gerarGrade(mes: Date): Date[] {
  const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const inicio = new Date(primeiro.getFullYear(), primeiro.getMonth(), 1 - primeiro.getDay())
  return Array.from({ length: 42 }, (_, i) =>
    new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i),
  )
}

// Eventos que encostam em algum momento do dia (no horário local)
function eventosDoDia(eventos: Evento[], dia: Date) {
  const comeco = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate()).getTime()
  const fimDoDia = comeco + 86400000 - 1
  return eventos.filter(
    (e) => new Date(e.inicio).getTime() <= fimDoDia && new Date(e.fim).getTime() >= comeco,
  )
}

export default function Agenda() {
  const [mes, setMes] = useState(() => {
    const agora = new Date()
    return new Date(agora.getFullYear(), agora.getMonth(), 1)
  })
  const [eventos, setEventos] = useState<Evento[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioSimples[]>([])
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState<{ evento: Evento | null; dia: Date } | null>(null)

  const grade = useMemo(() => gerarGrade(mes), [mes])
  const hoje = chaveData(new Date())

  const carregar = useCallback(async () => {
    setErro('')
    try {
      // 1 dia de folga em cada ponta por causa da diferença de fuso (UTC x Brasília)
      const de = new Date(grade[0].getFullYear(), grade[0].getMonth(), grade[0].getDate() - 1)
      const ate = new Date(grade[41].getFullYear(), grade[41].getMonth(), grade[41].getDate() + 1)
      setEventos(await agendaApi.eventos(chaveData(de), chaveData(ate)))
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }, [grade])

  useEffect(() => {
    carregar()
  }, [carregar])

  useEffect(() => {
    agendaApi.usuarios().then(setUsuarios).catch(() => setUsuarios([]))
  }, [])

  function mudarMes(delta: number) {
    setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1))
  }

  function irParaHoje() {
    const agora = new Date()
    setMes(new Date(agora.getFullYear(), agora.getMonth(), 1))
  }

  return (
    <div className="ag-pagina">
      <div className="ag-topo">
        <h1>Agenda</h1>
        <div className="ag-nav">
          <button className="ag-btn" onClick={() => mudarMes(-1)}>‹</button>
          <h2>{MESES[mes.getMonth()]} {mes.getFullYear()}</h2>
          <button className="ag-btn" onClick={() => mudarMes(1)}>›</button>
          <button className="ag-btn" onClick={irParaHoje}>Hoje</button>
        </div>
        <div className="ag-nav">
          <NotificacoesSino />
          <button className="ag-btn ag-btn-principal" onClick={() => setModal({ evento: null, dia: new Date() })}>
            + Novo evento
          </button>
        </div>
      </div>

      {erro && <p className="ag-erro">{erro}</p>}

      <div className="ag-semana">
        {DIAS_SEMANA.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="ag-grade">
        {grade.map((dia) => {
          const doDia = eventosDoDia(eventos, dia)
          const classe = [
            'ag-dia',
            dia.getMonth() !== mes.getMonth() && 'ag-fora',
            chaveData(dia) === hoje && 'ag-hoje',
          ].filter(Boolean).join(' ')
          return (
            <div key={chaveData(dia)} className={classe} onClick={() => setModal({ evento: null, dia })}>
              <span className="ag-num">{dia.getDate()}</span>
              {doDia.slice(0, 3).map((e) => (
                <button
                  key={e.id}
                  className={`ag-chip ag-${e.status.toLowerCase()}`}
                  style={{ background: e.cor }}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    setModal({ evento: e, dia })
                  }}
                >
                  {e.status === 'CONCLUIDO' && <span className="ag-check">✓</span>}
                  {e.titulo}
                </button>
              ))}
              {doDia.length > 3 && <span className="ag-mais">+{doDia.length - 3} mais</span>}
            </div>
          )
        })}
      </div>

      {modal && (
        <EventoModal
          evento={modal.evento}
          dia={modal.dia}
          usuarios={usuarios}
          onFechar={() => setModal(null)}
          onSalvo={() => {
            setModal(null)
            carregar()
          }}
        />
      )}
    </div>
  )
}