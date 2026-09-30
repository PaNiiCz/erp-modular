import { Children, isValidElement } from 'react';
import type { ChangeEvent, ReactElement, ReactNode } from 'react';
import Select from './Select';

interface PropsOpcao {
  value?: string | number;
  disabled?: boolean;
  children?: ReactNode;
}

interface Props {
  value?: string | number | null;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  title?: string;
  children?: ReactNode;
}

// Mantém só as classes de posição/tamanho (largura, margem, flex).
// As classes de cor e borda do select antigo são descartadas,
// porque o novo Select já tem o visual dele.
const CLASSES_LAYOUT = /^([a-z]+:)?(w-|min-w-|max-w-|flex|grow|shrink|basis-|col-span-|self-|m[trblxy]?-)/;

function soLayout(className = '') {
  return className
    .split(/\s+/)
    .filter((c) => CLASSES_LAYOUT.test(c))
    .join(' ');
}

function rotulo(conteudo: ReactNode) {
  return Children.toArray(conteudo).join('');
}

export default function SelectCampo({ value, onChange, name, className, disabled, children }: Props) {
  const opcoes = Children.toArray(children)
    .filter((c): c is ReactElement<PropsOpcao> => isValidElement(c))
    .filter((c) => !c.props.disabled)
    .map((c) => ({
      valor: String(c.props.value ?? rotulo(c.props.children)),
      label: rotulo(c.props.children),
    }));

  return (
    <div className={`${soLayout(className)} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <Select
        value={String(value ?? '')}
        onChange={(v) =>
          onChange?.({ target: { value: v, name } } as unknown as ChangeEvent<HTMLSelectElement>)
        }
        opcoes={opcoes}
      />
    </div>
  );
}