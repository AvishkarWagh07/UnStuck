/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // screen sizes, xs for small phones, 3xl for wide desktops
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1800px',
      // height based, for short landscape phones
      short: { raw: '(max-height: 560px)' }
    },
    extend: {
      colors: {
        // the palette, cobalt blue on warm cream
        paper: '#F8F1E4', // warm cream canvas
        'paper-dark': '#EFE4CE', // pressed / inset cream
        ink: '#10264F', // dark navy for text and outlines
        'ink-soft': '#455173', // secondary text
        'ink-faint': '#7D8497', // captions and meta
        line: '#E3D9C6', // hairline borders on cream
        'line-strong': '#C9BCA2', // stronger borders and dividers
        accent: '#0736B8', // primary cobalt blue
        'accent-dark': '#052A8F', // hover / pressed
        'accent-soft': '#E8EFFD', // informational surface
        sage: '#E8EFFD', // the soft surface used inside panels
        'sage-ink': '#0736B8',
        muted: '#777B87',
        // states, kept muted so nothing shouts
        success: '#1D7A54',
        'success-soft': '#E1F1E8',
        'success-ink': '#135537',
        amber: '#A86400',
        'amber-soft': '#FBEBD0',
        'amber-ink': '#7A4900',
        danger: '#A32B2B',
        'danger-soft': '#F8E3E3',
        'danger-ink': '#7A1F1F'
      },
      fontFamily: {
        // serif for headings
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        // ui text
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // wordmark only
        brand: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        // handwritten asides
        hand: ['Caveat', 'Comic Sans MS', 'cursive']
      },
      fontSize: {
        // fluid scale, no jump between breakpoints
        'fluid-hero': ['clamp(2.25rem, 6vw, 4.25rem)', { lineHeight: '1.05' }],
        'fluid-h1': ['clamp(1.75rem, 4vw, 2.75rem)', { lineHeight: '1.12' }],
        'fluid-h2': ['clamp(1.35rem, 2.6vw, 2rem)', { lineHeight: '1.2' }],
        'fluid-body': ['clamp(0.95rem, 1.6vw, 1.125rem)', { lineHeight: '1.65' }]
      },
      borderRadius: {
        card: '1.25rem',
        pill: '999px'
      },
      maxWidth: {
        prose: '46rem',
        app: '78rem'
      },
      boxShadow: {
        // used where a card lifts off the page
        lift: '0 10px 30px -18px rgba(16, 38, 79, 0.45)',
        none: 'none'
      },
      spacing: {
        // room for the notch and home bar on modern phones
        'safe-b': 'env(safe-area-inset-bottom, 0px)',
        'safe-t': 'env(safe-area-inset-top, 0px)'
      },
      keyframes: {
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' }
        }
      },
      animation: {
        riseIn: 'riseIn 260ms ease-out both',
        fadeIn: 'fadeIn 200ms ease-out both',
        wiggle: 'wiggle 1.6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
