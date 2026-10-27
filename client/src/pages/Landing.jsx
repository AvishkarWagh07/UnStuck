import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowRightIcon, CameraIcon, ListIcon, MicIcon, SparkIcon } from '../components/ui/Icons.jsx';

// first screen people see, splash at the top

const AUDIENCE = [
  {
    title: 'If technology is not really your thing',
    body:
      'You can see that something is wrong, but you are not sure what it is called or how to search for it. So you describe it the way you would to a friend, and the app works from there.'
  },
  {
    title: 'If you are tired of the tab hunt',
    body:
      'You could probably fix it yourself, but not after opening twenty pages and skimming steps that do not apply. One instruction at a time is simply faster.'
  }
];

const HOW_IT_WORKS = [
  {
    title: 'Describe the problem',
    body: 'Write it in plain language. You do not need the right words, or the name of the thing that is broken.'
  },
  {
    title: 'Get one step at a time',
    body:
      'A single instruction, why it may help, and what you should expect to see. Not a wall of text to guess your way through.'
  },
  {
    title: 'Say what actually happened',
    body:
      'Pick the answer that is true for you. You are never pushed into a fake answer just to move on.'
  },
  {
    title: 'Nothing failed is repeated',
    body:
      'If an action has already failed, the app remembers, and takes a different path instead of sending you in a circle.'
  },
  {
    title: 'Steps written for your problem',
    body:
      'The path comes from what you described and what you have reported, not from a list written for somebody else.'
  },
  {
    title: 'Finish honestly',
    body:
      'You decide whether the problem is really fixed. If the safe options run out, the app says so rather than pretending.'
  }
];

const PRINCIPLES = [
  {
    title: 'Driven by what you saw',
    body: 'The next step comes from your answer, not from a script that assumes every step worked.'
  },
  {
    title: 'Remembers what failed',
    body: 'An action that already failed is not offered again, however differently it is worded.'
  },
  {
    title: 'Honest about limits',
    body: 'When it cannot help safely, it stops and says so. It will never invent a fix to keep you reading.'
  }
];

const ALSO_GOOD_FOR = [
  'Flat pack furniture',
  'A recipe',
  'A medicine leaflet',
  'A bank letter',
  'A sewing pattern',
  'A school form'
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="space-y-12 sm:space-y-20">
      <section className="panel-cobalt on-cobalt rounded-card overflow-hidden">
        <div className="bg-dotty splash-body px-6 py-14 sm:px-10 sm:py-20 lg:px-14 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-pill border border-white/25 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/85">
              <SparkIcon className="h-3.5 w-3.5" />
              Adaptive troubleshooting
            </span>

            <h1 className="mt-7 font-brand text-fluid-hero font-extrabold uppercase leading-none tracking-tight text-white">
              Un<span className="text-white/70">Stuck</span>
            </h1>

            <p className="mt-6 font-display text-fluid-h2 leading-snug text-white">
              One problem. One next step.
            </p>

            <p className="mx-auto mt-5 max-w-prose leading-relaxed text-white/85">
              Say what is going wrong, in your own words. UnStuck hands you a single instruction,
              listens to what happened, and picks what comes next. If something does not work, it
              remembers, and never sends you back to a step that already failed.
            </p>

            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
              {user ? (
                <Link className="btn-on-blue btn-lg" to="/new">
                  Start fixing
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              ) : (
                <Link className="btn-on-blue btn-lg" to="/login" state={{ mode: 'signup' }}>
                  Start fixing
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              )}

              <Link
                className="btn-on-blue-outline btn-lg"
                to={user ? '/history' : '/login'}
                state={user ? undefined : { mode: 'signin' }}
              >
                <ListIcon className="h-4 w-4" />
                My fixes
              </Link>
            </div>

            <p className="mt-8 font-hand text-xl text-white/85">
              Stuck is a temporary state, not a destination.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="doors-heading">
        <h2 id="doors-heading" className="font-display text-fluid-h2 text-ink">
          Two ways in, because problems arrive in two shapes
        </h2>
        <p className="mt-3 max-w-prose leading-relaxed text-ink-soft">
          Sometimes nobody has written the fix. Sometimes somebody has, and it is useless.
        </p>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-pill bg-accent-soft text-accent">
              <SparkIcon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-xl leading-snug text-ink">
              You have a problem, and no idea where to start
            </h3>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Describe what is happening. The next step is written for your problem as you go, one
              at a time, from what you have already reported.
            </p>
            <Link className="mt-5 inline-flex link" to={user ? '/new' : '/login'}>
              Describe a problem
            </Link>
          </div>

          <div className="card p-6 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-pill bg-accent-soft text-accent">
              <CameraIcon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-xl leading-snug text-ink">
              You have the instructions, and they are unusable
            </h3>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Hand them over as a photo, paste the text, or say them out loud. Nothing is added that
              was not there, and nothing is quietly left out.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ALSO_GOOD_FOR.map((item) => (
                <span key={item} className="badge">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-ink-soft">
              <MicIcon className="h-4 w-4 text-accent" />
              Speaking works too, if your hands are full.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="problem-heading">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 id="problem-heading" className="font-display text-fluid-h2 leading-snug text-ink">
              Most help pages assume every step works
            </h2>
            <div className="mt-5 space-y-4 leading-relaxed text-ink-soft">
              <p>
                The usual troubleshooting article is one long list. It assumes you will read all of
                it, that every step will succeed, and that your device behaves like the one the
                author used.
              </p>
              <p>
                Real problems do not work that way. Step three fails, and suddenly the article has
                nothing more to say. So you open another tab and start again somewhere else.
              </p>
              <p className="text-ink">UnStuck is built around that moment instead of ignoring it.</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
            {PRINCIPLES.map((item) => (
              <div key={item.title} className="card bg-accent-soft/60 p-6">
                <h3 className="font-display text-lg leading-snug text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="audience-heading">
        <h2 id="audience-heading" className="font-display text-fluid-h2 text-ink">
          Who it is for
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {AUDIENCE.map((item) => (
            <div key={item.title} className="card p-6">
              <h3 className="font-display text-lg leading-snug text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-display text-fluid-h2 text-ink">
          How it works
        </h2>
        <p className="mt-3 max-w-prose leading-relaxed text-ink-soft">
          Six short stages, in the order you will actually meet them.
        </p>

        <ol className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {HOW_IT_WORKS.map((item, index) => (
            <li key={item.title} className="flex gap-4">
              <span className="font-display text-2xl leading-none text-accent">{index + 1}</span>
              <div>
                <h3 className="font-display text-lg leading-snug text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ai-heading" className="card bg-accent-soft/60 p-6 sm:p-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
          <h2 id="ai-heading" className="font-display text-fluid-h2 leading-snug text-ink">
            Where the AI fits, and where it does not
          </h2>
          <div className="space-y-4 leading-relaxed text-ink-soft">
            <p>
              The next step is written by an AI model reading your problem and everything you have
              reported so far. That is what lets it handle a problem nobody wrote instructions for
              in advance.
            </p>
            <p>
              The model only ever proposes; it does not decide. Every suggestion is checked on the
              server before you see it: it has to be a single low risk action, it must not ask you
              to do anything that could lose your data or weaken your security, and it must not
              repeat something you have already tried.
            </p>
            <p>
              If it suggests something that fails those checks, it is thrown away and the session
              stops with an explanation rather than passing the problem on to you. And if the app
              has no AI key configured at all, it says exactly that. It does not guess.
            </p>
          </div>
        </div>
      </section>

      <section className="card-lift p-8 sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
          <div>
            <h2 className="font-display text-fluid-h1 leading-snug text-ink">
              Bring us your annoying little problem
            </h2>
            <p className="mt-3 max-w-prose leading-relaxed text-ink-soft">
              It takes a moment to make an account, and then you can start with whatever is giving
              you trouble right now.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            {user ? (
              <Link className="btn-primary btn-lg" to="/new">
                Start fixing
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : (
              <Link className="btn-primary btn-lg" to="/login" state={{ mode: 'signup' }}>
                Start fixing
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            )}
            {!user ? (
              <Link className="btn-outline btn-lg" to="/login" state={{ mode: 'signin' }}>
                I already have an account
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
