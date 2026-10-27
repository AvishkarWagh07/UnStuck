import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../ui/Logo.jsx';
import Footer from './Footer.jsx';
import { HomeIcon, ListIcon, PlusIcon, PowerIcon, SettingsIcon } from '../ui/Icons.jsx';

// shell for all the signed in pages - bottom bar on phone, sidebar on desktop
// links are in one array so the two navs cannot drift apart
const LINKS = [
  { to: '/app', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/history', label: 'My fixes', Icon: ListIcon, end: false },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, end: false }
];

function navClass({ isActive }) {
  const base =
    'flex items-center gap-3 rounded-pill px-3.5 py-2.5 text-sm transition-colors duration-150 ';
  return base + (isActive ? 'bg-accent-soft text-accent font-medium' : 'text-ink-soft hover:bg-ink/5 hover:text-ink');
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const initial = user && user.displayName ? user.displayName.trim().charAt(0).toUpperCase() : '?';

  // not signed in -> no sidebar, the links would go nowhere anyway
  if (!user) {
    return (
      <div className="min-h-screen bg-paper">
        <a href="#main" className="sr-only-focusable btn-primary absolute left-4 top-4 z-50">
          Skip to content
        </a>

        <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
          <div className="shell flex items-center justify-between gap-3 py-3">
            <NavLink to="/" aria-label="UnStuck, home">
              <Logo size="text-xl" />
            </NavLink>

            <nav className="flex items-center gap-2" aria-label="Sign in">
              <NavLink to="/login" className="btn-quiet btn-sm">
                Sign in
              </NavLink>
              <NavLink to="/login" state={{ mode: 'signup' }} className="btn-primary btn-sm">
                Start fixing
              </NavLink>
            </nav>
          </div>
        </header>

        <main id="main">
          <div className="shell py-6 sm:py-8">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <a href="#main" className="sr-only-focusable btn-primary absolute left-4 top-4 z-50">
        Skip to content
      </a>

      {/* sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-paper px-4 py-6 lg:flex">
        <NavLink to="/app" className="px-1.5" aria-label="UnStuck, home">
          <Logo />
        </NavLink>

        <NavLink to="/new" className="btn-primary btn-block mt-7">
          <PlusIcon className="h-4 w-4" />
          New fix
        </NavLink>

        <nav className="mt-7 flex-1 space-y-1" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
              <link.Icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line pt-4">
          <div className="flex items-center gap-3 px-1.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-accent text-sm font-semibold text-white">
              {initial}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">{user ? user.displayName : ''}</span>
              <span className="block truncate caption">{user ? user.email : ''}</span>
            </span>
          </div>

          <button type="button" className="btn-quiet btn-block mt-3 justify-start" onClick={handleLogout}>
            <PowerIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* top bar, phone only */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur lg:hidden">
        <div className="shell flex items-center justify-between gap-3 py-3">
          <NavLink to="/app" aria-label="UnStuck, home">
            <Logo size="text-xl" />
          </NavLink>

          <NavLink
            to="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-accent text-sm font-semibold text-white"
            aria-label="Your account and settings"
          >
            {initial}
          </NavLink>
        </div>
      </header>

      {/* content */}
      <div className="lg:pl-64">
        <main id="main" className="min-h-[60vh] pb-28 lg:pb-0">
          <div className="shell py-6 sm:py-8 lg:py-10">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>

      {/* bottom nav, phone only */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur lg:hidden"
        aria-label="Main"
      >
        <ul className="shell flex items-stretch justify-between gap-1 pb-safe-b pt-1.5">
          {LINKS.slice(0, 1).map((link) => (
            <li key={link.to} className="flex-1">
              <TabLink link={link} />
            </li>
          ))}

          <li className="flex-1">
            <NavLink
              to="/new"
              className={({ isActive }) =>
                'flex flex-col items-center gap-1 rounded-card px-1 pb-2 pt-1.5 text-[0.6875rem] ' +
                (isActive ? 'text-accent' : 'text-ink-soft')
              }
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-accent text-white">
                <PlusIcon className="h-5 w-5" />
              </span>
              New fix
            </NavLink>
          </li>

          {LINKS.slice(1).map((link) => (
            <li key={link.to} className="flex-1">
              <TabLink link={link} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function TabLink({ link }) {
  return (
    <NavLink
      to={link.to}
      end={link.end}
      className={({ isActive }) =>
        'flex flex-col items-center gap-1 rounded-card px-1 pb-2 pt-1.5 text-[0.6875rem] ' +
        (isActive ? 'text-accent' : 'text-ink-soft')
      }
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-pill">
        <link.Icon className="h-5 w-5" />
      </span>
      {link.label}
    </NavLink>
  );
}
