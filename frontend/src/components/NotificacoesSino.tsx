import { useCallback, useEffect, useState } from 'react'
import { agendaApi } from '../services/agendaApi'
import type { Notificacao } from '../services/agendaApi'
import '../pages/Agenda.css'

export default function NotificacoesSino() {
  const [aberto, setAberto] = useState(false)
  const [naoLidas, setNaoLidas] = useState(0)
  const [itens, setItens] = useState<Notificacao[]>([])

  const atualizarContador = useCallback(async () => {
    try {
      setNaoLidas((await agendaApi.contador()).nao_lidas)
    } catch {
      // sem sessão ou servidor fora do ar: ignora
    }
  }, [])

  // Consultar o contador também dispara os lembretes no back-end
  useEffect(() => {
    atualizarContador()
    const timer = setInterval(atualizarContador, 60000)
    return () => clearInterval(timer)
  }, [atualizarContador])

  async function alternarPainel() {
    const vaiAbrir = !aberto
    setAberto(vaiAbrir)
    if (!vaiAbrir) return
    try {
      setItens(await agendaApi.notificacoes())
      atualizarContador()
    } catch {
      setItens([])
    }
  }

  async function marcarLida(n: Notificacao) {
    if (n.lida) return
    try {
      await agendaApi.marcarLida(n.id)
      setItens((lista) => lista.map((i) => (i.id === n.id ? { ...i, lida: true } : i)))
      atualizarContador()
    } catch {
      // ignora
    }
  }

  async function marcarTodas() {
    try {
      await agendaApi.marcarTodasLidas()
      setItens((lista) => lista.map((i) => ({ ...i, lida: true })))
      setNaoLidas(0)
    } catch {
      // ignora
    }
  }

  return (
    <div className="ag-sino">
      <button className="ag-btn" onClick={alternarPainel} aria-label="Notificações">
        🔔
        {naoLidas > 0 && <span className="ag-badge">{naoLidas}</span>}
      </button>
      {aberto && (
        <div className="ag-painel">
          <button className="ag-btn" style={{ width: '100%', marginBottom: 8 }} onClick={marcarTodas}>
            Marcar todas como lidas
          </button>
          {itens.length === 0 && <p style={{ textAlign: 'center' }}>Nenhuma notificação.</p>}
          {itens.map((n) => (
            <div
              key={n.id}
              className={`ag-notif ${n.lida ? '' : 'ag-notif-nova'}`}
              onClick={() => marcarLida(n)}
            >
              <strong>{n.titulo}</strong>
              <span>{n.mensagem}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}