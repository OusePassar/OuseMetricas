import { useNavigate, useLocation } from 'react-router-dom';
import logoBranca from '../images/logo_branca.png';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // Links de navegação para o app de métricas
  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Novo Relatório', path: '/novo' },
  ];

  return (
    <header className="w-full bg-[#0F0F0F] border-b border-white/10 px-8 py-5 flex items-center justify-between shadow-2xl">
      <div className="flex items-center gap-10">
        {/* Logo Ouse com navegação */}
        <img 
          src={logoBranca} 
          alt="Logo Ouse" 
          className="h-7 cursor-pointer hover:opacity-80 transition-all active:scale-95"
          onClick={() => navigate('/')} 
        />

        {/* Menu de Navegação */}
        <nav className="flex gap-8">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative pb-1 ${
                location.pathname === item.path 
                ? 'text-yellow-500' 
                : 'text-white/30 hover:text-white'
              }`}
            >
              {item.name}
              {location.pathname === item.path && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-yellow-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Identificador de Versão/Área */}
      <div className="flex flex-col items-end leading-none">
        <span className="text-[12px] font-black uppercase text-yellow-500 italic tracking-tighter">
          CEO Dashboard
        </span>
        <span className="text-[9px] text-white/20 uppercase font-bold mt-1 tracking-widest">
          v2.0 Beta
        </span>
      </div>
    </header>
  );
}