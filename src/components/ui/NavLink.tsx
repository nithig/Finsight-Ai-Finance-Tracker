import { ReactNode } from 'react';

interface NavLinkProps {
  to: string;
  children: ReactNode;
  onClick?: () => void;
}

export function NavLink({ to, children, onClick }: NavLinkProps) {
  const isActive = window.location.pathname === to || window.location.pathname.startsWith(to + '/');

  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
        onClick?.();
      }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
      }`}
    >
      {children}
    </a>
  );
}
