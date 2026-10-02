import CrudTab from './CrudTab';
import type { Coluna } from './CrudTab';
import EscalaFormModal from './EscalaFormModal';
import { diasSemana, formatarHora } from './utilidades';
import { escalasApi } from '../../services/rh';
import type { Escala } from '../../types/rh';

const carregar = (busca: string, dia: string) => escalasApi.listar({ search: busca, dia_semana: dia || undefined });

const colunas: Coluna<Escala>[] = [
  { titulo: 'Funcionário', render: (e) => <span className="text-text-primary">{e.funcionario_nome}</span> },
  { titulo: 'Dia', render: (e) => e.dia_semana_nome },
  { titulo: 'Entrada', render: (e) => formatarHora(e.hora_inicio) },
  { titulo: 'Saída', render: (e) => formatarHora(e.hora_fim) },
];

const opcoesDia = diasSemana.map((nome, indice) => ({ valor: String(indice), label: nome }));

export default function EscalasTab() {
  return (
    <CrudTab
      rotuloNovo="Nova escala"
      placeholderBusca="Buscar por funcionário..."
      carregar={carregar}
      colunas={colunas}
      excluir={(e) => escalasApi.excluir(e.id)}
      nomeItem={(e) => `${e.funcionario_nome} - ${e.dia_semana_nome}`}
      Modal={EscalaFormModal}
      filtro={{ placeholderTodos: 'Todos os dias', opcoes: opcoesDia }}
    />
  );
}