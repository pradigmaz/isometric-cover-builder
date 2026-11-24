import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const urlTheme = new URLSearchParams(window.location.search).get('theme');
      if (urlTheme === 'dark') return true;
      if (urlTheme === 'light') return false;
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return document.documentElement.classList.contains('dark');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlTheme = new URLSearchParams(window.location.search).get('theme');
      const shouldBeDark = urlTheme ? urlTheme === 'dark' : localStorage.getItem('theme') === 'dark';
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        setIsDark(true);
      } else {
        document.documentElement.classList.remove('dark');
        setIsDark(false);
      }
    } catch {
      // Safe fallback in restricted environments
    }
  }, []);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextDark = !isDark;
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const applyTheme = () => {
      document.documentElement.classList.add('theme-transitioning');
      setIsDark(nextDark);
      if (nextDark) {
        document.documentElement.classList.add('dark');
        try {
          localStorage.setItem('theme', 'dark');
        } catch {
          // Safe fallback
        }
      } else {
        document.documentElement.classList.remove('dark');
        try {
          localStorage.setItem('theme', 'light');
        } catch {
          // Safe fallback
        }
      }
    };

    const isReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!document.startViewTransition || isReducedMotion) {
      applyTheme();
      document.documentElement.classList.remove('theme-transitioning');
      return;
    }

    const transition = document.startViewTransition(() => {
      applyTheme();
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      const anim = document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 400,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
      anim.finished.finally(() => {
        document.documentElement.classList.remove('theme-transitioning');
      });
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove('theme-transitioning');
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--fg)] hover:text-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer shrink-0"
    >
      <div className="relative w-4 h-4 overflow-hidden flex items-center justify-center">
        <Sun
          className={`w-3.5 h-3.5 absolute transition-all duration-300 ease-out transform ${
            isDark
              ? 'rotate-180 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100 text-amber-500'
          }`}
        />
        <Moon
          className={`w-3.5 h-3.5 absolute transition-all duration-300 ease-out transform ${
            isDark
              ? 'rotate-0 scale-100 opacity-100 text-zinc-100'
              : '-rotate-180 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  );
};
export default ThemeToggle;
