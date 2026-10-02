import { useEffect, useState } from 'react';
import ModalBase, { CampoMoeda } from './ModalBase';
import SelectCampo from '../SelectCampo';
import { inputClasse, labelClasse, useEnvio } from './utilidades';
import { cargosApi, departamentosApi } from '../../services/rh';
import type { Cargo, Departamento } from '../../types/rh';

interface Props {
  item: Cargo | null;
  onClose: () => void;
  onSalvo: () => void;
}

export default function CargoFormModal({ item, onClose, onSalvo }: Props) {
  const [nome, setNome] = useState(item?.nome ?? '');
  const [departamento, setDepartamento] = useState(item?.departamento ? String(item.departamento) : '');
  const [salarioBase, setSalarioBase] = useState(item?.salario_base ?? '');
  const [descricao, setDescricao] = useState(item?.descricao ?? '');
  const [ativo, setAtivo] = useState(item?.ativo ?? true);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const { salvando, erro, setErro, enviar } = useEnvio(onSalvo);

  useEffect(() => {
    departamentosApi.listar().then(setDepartamentos).catch(() => setDepartamentos([]));
  }, []);

  const salvar = () => {
    if (!nome.trim()) {
      setErro('Informe o nome do cargo.');
      return;
    }
    const dados = {
      nome: nome.trim(),
      departamento: departamento ? Number(departamento) : null,
      descricao,
      salario_base: salarioBase || '0.00',
      ativo,
    };
    enviar(() => (item ? cargosApi.atualizar(item.id, dados) : cargosApi.criar(dados)));
  };

  return (
    <ModalBase
      titulo={item ? 'Editar cargo' : 'Novo cargo'}
      onClose={onClose}
      onSubmit={salvar}
      salvando={salvando}
      erro={erro}
    >
      <div className="mb-3">
        <label className={labelClasse}>Nome</label>
        <input className={inputClasse} value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClasse}>Departamento</label>
          <SelectCampo className="w-full" value={departamento} onChange={(e) => setDepartamento(e.target.value)}>
            <option value="">Nenhum (cargo geral)</option>
            {departamentos
              .filter((d) => d.ativo || String(d.id) === departamento)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
          </SelectCampo>
        </div>
        <div>
          <label className={labelClasse}>Salário base</label>
          <CampoMoeda valor={salarioBase} onChange={setSalarioBase} />
        </div>
      </div>
      <div className="mb-3">
        <label className={labelClasse}>Descrição</label>
        <textarea className={inputClasse} rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-text-secondary text-sm font-sans">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
        Cargo ativo
      </label>
    </ModalBase>
  );
}