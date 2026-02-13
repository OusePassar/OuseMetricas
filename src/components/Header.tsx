import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, BarChart3, PlusCircle } from 'lucide-react';
import logoBranca from '../images/logo_branca.png';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Links de navegação
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <BarChart3 size={16} /> },
    { name: 'Novo Relatório', path: '/novo', icon: <PlusCircle size={16} /> },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuOpen(false); // Fecha o menu mobile ao navegar
  };

  return (
    <header className="w-full bg-[#0F0F0F] border-b border-white/10 sticky top-0 z-[100] shadow-2xl">
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        
        <div className="flex items-center gap-10">
          {/* Logo Ouse */}
          <img 
            src={logoBranca} 
            alt="Logo Ouse" 
            className="h-6 md:h-7 cursor-pointer hover:opacity-80 transition-all active:scale-95"
            onClick={() => handleNavigate('/')} 
          />

          {/* Navegação Desktop */}
          <nav className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
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

        {/* Direita: Versão (Desktop) e Menu Mobile */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end leading-none mr-4">
            <span className="text-[10px] font-black uppercase text-yellow-500 italic tracking-tighter">
              CEO Dashboard
            </span>
            <span className="text-[8px] text-white/20 uppercase font-bold mt-1 tracking-widest">
              v2.0 Beta
            </span>
          </div>

          {/* Botão Menu Mobile */}
          <button 
            className="md:hidden text-white/50 hover:text-yellow-500 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Overlay do Menu Mobile */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#161616] border-b border-white/10 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`flex items-center gap-3 w-full p-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  location.pathname === item.path 
                  ? 'bg-yellow-500 text-black' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
            
            {/* Versão no Mobile (dentro do menu) */}
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center px-4">
              <span className="text-[9px] font-black uppercase text-yellow-500 italic">CEO Dashboard</span>
              <span className="text-[8px] text-white/20 uppercase font-bold">v2.0 Beta</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}