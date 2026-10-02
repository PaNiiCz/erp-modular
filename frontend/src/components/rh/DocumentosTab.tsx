import CrudTab from './CrudTab';
import type { Coluna } from './CrudTab';
import DocumentoFormModal from './DocumentoFormModal';
import { tiposDocumento } from './utilidades';
import { abrirDocumento, documentosApi, mensagemErro } from '../../services/rh';
import type { Documento } from '../../types/rh';

const carregar = (busca: string, tipo: string) => documentosApi.listar({ search: busca, tipo: tipo || undefined });

const colunas: Coluna<Documento>[] = [
  { titulo: 'Funcionário', render: (d) => <span className="text-text-primary">{d.funcionario_nome}</span> },
  { titulo: 'Tipo', render: (d) => d.tipo_nome },
  { titulo: 'Título', render: (d) => d.titulo },
  { titulo: 'Enviado em', render: (d) => new Date(d.criado_em).toLocaleDateString('pt-BR') },
];

const opcoesTipo = Object.entries(tiposDocumento).map(([valor, label]) => ({ valor, label }));

export default function DocumentosTab() {
  return (
    <CrudTab
      rotuloNovo="Novo documento"
      placeholderBusca="Buscar por título ou funcionário..."
      carregar={carregar}
      colunas={colunas}
      excluir={(d) => documentosApi.excluir(d.id)}
      nomeItem={(d) => `${d.titulo} (${d.funcionario_nome})`}
      Modal={DocumentoFormModal}
      filtro={{ placeholderTodos: 'Todos os tipos', opcoes: opcoesTipo }}
      acoes={(d, { setErro }) => (
        <button
          className="px-2 py-1 rounded-lg text-xs font-sans text-accent-blue transition hover:bg-white/5"
          onClick={() => abrirDocumento(d.id).catch((e) => setErro(mensagemErro(e, 'Não foi possível abrir o documento.')))}
        >
          Ver
        </button>
      )}
    />
  );
}