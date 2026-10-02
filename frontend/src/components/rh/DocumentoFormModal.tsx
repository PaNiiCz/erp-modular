import { useEffect, useState } from 'react';
import ModalBase from './ModalBase';
import SelectCampo from '../SelectCampo';
import { inputClasse, labelClasse, tiposDocumento, useEnvio } from './utilidades';
import { documentosApi, funcionariosApi } from '../../services/rh';
import type { Documento, Funcionario, TipoDocumento } from '../../types/rh';

interface Props {
  item: Documento | null;
  onClose: () => void;
  onSalvo: () => void;
}

const TAMANHO_MAXIMO_MB = 5;

export default function DocumentoFormModal({ item, onClose, onSalvo }: Props) {
  const [funcionario, setFuncionario] = useState(item ? String(item.funcionario) : '');
  const [tipo, setTipo] = useState<TipoDocumento>(item?.tipo ?? 'RG');
  const [titulo, setTitulo] = useState(item?.titulo ?? '');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const { salvando, erro, setErro, enviar } = useEnvio(onSalvo);

  useEffect(() => {
    funcionariosApi.listar().then(setFuncionarios).catch(() => setFuncionarios([]));
  }, []);

  const salvar = () => {
    if (!funcionario || !titulo.trim()) {
      setErro('Selecione o funcionário e informe o título do documento.');
      return;
    }
    if (!item && !arquivo) {
      setErro('Escolha o arquivo do documento.');
      return;
    }
    if (arquivo && arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setErro(`O arquivo deve ter no máximo ${TAMANHO_MAXIMO_MB} MB.`);
      return;
    }

    const dados = new FormData();
    dados.append('funcionario', funcionario);
    dados.append('tipo', tipo);
    dados.append('titulo', titulo.trim());
    if (arquivo) dados.append('arquivo', arquivo);

    enviar(() => (item ? documentosApi.atualizar(item.id, dados) : documentosApi.criar(dados)));
  };

  return (
    <ModalBase
      titulo={item ? 'Editar documento' : 'Novo documento'}
      onClose={onClose}
      onSubmit={salvar}
      salvando={salvando}
      erro={erro}
    >
      <div className="mb-3">
        <label className={labelClasse}>Funcionário</label>
        <SelectCampo className="w-full" value={funcionario} onChange={(e) => setFuncionario(e.target.value)}>
          <option value="">Selecione...</option>
          {funcionarios.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </SelectCampo>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClasse}>Tipo</label>
          <SelectCampo className="w-full" value={tipo} onChange={(e) => setTipo(e.target.value as TipoDocumento)}>
            {(Object.keys(tiposDocumento) as TipoDocumento[]).map((t) => (
              <option key={t} value={t}>
                {tiposDocumento[t]}
              </option>
            ))}
          </SelectCampo>
        </div>
        <div>
          <label className={labelClasse}>Título</label>
          <input className={inputClasse} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: RG frente" />
        </div>
      </div>
      <div>
        <label className={labelClasse}>Arquivo (PDF, JPG, PNG, DOC ou DOCX, até {TAMANHO_MAXIMO_MB} MB)</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className="text-text-secondary text-xs font-sans file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-xs file:font-semibold file:cursor-pointer hover:file:opacity-90"
        />
        {item && (
          <p className="text-text-secondary text-xs font-sans mt-1">Se não escolher um arquivo novo, o atual é mantido.</p>
        )}
      </div>
    </ModalBase>
  );
}