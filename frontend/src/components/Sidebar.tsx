import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  ShoppingCart,
  Wallet,
  Truck,
  LogOut,
  Star,
} from 'lucide-react';
import { logout } from '../services/auth';

const GRADIENT_ACTIVE = 'linear-gradient(135deg, #4318ff 0%, #2dd4ff 100%)';
const GRADIENT_CARD = 'linear-gradient(160deg, #4318ff 0%, #2dd4ff 120%)';
const SHADOW_ACTIVE = '0 4px 14px rgba(67,24,255,0.4)';

const itens = [
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/produtos', label: 'Produtos', icon: Package },
  { path: '/estoque', label: 'Estoque', icon: Boxes },
  { path: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { path: '/financeiro', label: 'Financeiro', icon: Wallet },
  { path: '/compras', label: 'Compras', icon: Truck },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="fixed left-0 top-0 w-56 min-h-screen flex flex-col p-4 flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, #0b1030 0%, #1a1450 60%, #241a5e 100%)',
      }}
      role="navigation"
      aria-label="Menu principal"
    >
      <div className="flex items-center gap-2 mb-5 px-1">
        <div className="icon-badge w-7 h-7 text-white text-xs font-extrabold">E</div>
        <span className="text-white text-sm font-bold font-sans">
          ERP <span className="text-accent-blue">MODULAR</span>
        </span>
      </div>

      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-3 font-sans text-sm font-semibold transition ${
            isActive ? 'text-white' : 'text-white/70 hover:bg-white/5'
          }`
        }
        style={({ isActive }) =>
          isActive
            ? {
                background: GRADIENT_ACTIVE,
                boxShadow: SHADOW_ACTIVE,
              }
            : {}
        }
        aria-label="Dashboard"
      >
        <LayoutDashboard size={16} />
        Dashboard
      </NavLink>

      <span className="text-white/35 text-[10px] font-bold tracking-widest px-2 mb-2">
        MÓDULOS
      </span>

      <nav className="flex flex-col gap-0.5">
        {itens.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-2 py-2 font-sans text-sm transition ${
                isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
              }`
            }
            aria-label={label}
          >
            <span className="w-5 h-5 rounded-md bg-white/[0.06] flex items-center justify-center">
              <Icon size={12} />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      <div
        className="rounded-2xl p-3.5 mb-2"
        style={{ background: GRADIENT_CARD }}
      >
        <div className="w-5 h-5 rounded-md bg-white/25 flex items-center justify-center mb-1.5">
          <Star size={12} className="text-white" />
        </div>
        <p className="text-white text-xs font-bold font-sans mb-0.5">Precisa de ajuda?</p>
        <p className="text-white/85 text-[10px] font-sans mb-2.5">Veja a documentação</p>
        <div className="bg-black/25 rounded-lg text-center py-1.5 text-white text-[10px] font-semibold font-sans">
          DOCUMENTAÇÃO
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl font-sans text-sm text-danger hover:bg-white/5 transition"
        aria-label="Fazer logout"
      >
        <LogOut size={16} />
        Sair
      </button>
    </aside>
  );
}