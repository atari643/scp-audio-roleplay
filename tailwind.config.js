/** @type {import('tailwindcss').Config} */
//
// Les valeurs vivent dans `src/styles/_variables.scss` et sont exposées en
// variables CSS par `_scp-theme.scss`. Tailwind ne fait que les nommer, pour
// que les composants cessent d'écrire `bg-slate-950` ou `text-red-400` en dur.
//
// Les anciens noms `scp-*` restent définis et pointent sur les mêmes jetons :
// les composants pas encore migrés continuent de s'afficher correctement.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        fond: 'rgb(var(--fond-c) / <alpha-value>)',
        surface: {
          1: 'rgb(var(--surface-1-c) / <alpha-value>)',
          2: 'rgb(var(--surface-2-c) / <alpha-value>)',
          3: 'rgb(var(--surface-3-c) / <alpha-value>)',
          // Dernier niveau : il ne porte que du texte neutre. Voir la règle de
          // surface porteuse en tête de `_variables.scss`.
          4: 'rgb(var(--surface-4-c) / <alpha-value>)',
        },
        // Bordures — `border-bordure-faible`, `border-bordure`, `border-bordure-forte`.
        // Les formes courtes `faible` / `forte` sont acceptées aussi.
        bordure: {
          DEFAULT: 'rgb(var(--bordure-c) / <alpha-value>)',
          faible: 'rgb(var(--bordure-faible-c) / <alpha-value>)',
          forte: 'rgb(var(--bordure-forte-c) / <alpha-value>)',
        },
        faible: 'rgb(var(--bordure-faible-c) / <alpha-value>)',
        forte: 'rgb(var(--bordure-forte-c) / <alpha-value>)',
        // Texte
        texte: {
          DEFAULT: 'rgb(var(--texte-c) / <alpha-value>)',
          second: 'rgb(var(--texte-second-c) / <alpha-value>)',
          attenue: 'rgb(var(--texte-attenue-c) / <alpha-value>)',
        },
        // Accent — le seul de l'application
        accent: {
          DEFAULT: 'rgb(var(--accent-c) / <alpha-value>)',
          fort: 'rgb(var(--accent-fort-c) / <alpha-value>)',
          texte: 'rgb(var(--accent-texte-c) / <alpha-value>)',
        },
        // Système — le second ton de commandement : données, réseau, horodatage,
        // télémétrie. Tout ce qui est machine plutôt qu'éditorial.
        systeme: {
          DEFAULT: 'rgb(var(--systeme-c) / <alpha-value>)',
          fort: 'rgb(var(--systeme-fort-c) / <alpha-value>)',
        },
        // Classification — à n'employer que sur un badge ou un liseré de classe
        classe: {
          safe: 'rgb(var(--classe-safe-c) / <alpha-value>)',
          euclid: 'rgb(var(--classe-euclid-c) / <alpha-value>)',
          keter: 'rgb(var(--classe-keter-c) / <alpha-value>)',
          thaumiel: 'rgb(var(--classe-thaumiel-c) / <alpha-value>)',
          apollyon: 'rgb(var(--classe-apollyon-c) / <alpha-value>)',
          archon: 'rgb(var(--classe-archon-c) / <alpha-value>)',
          neutralisee: 'rgb(var(--classe-neutralisee-c) / <alpha-value>)',
        },
        // Rôles de lecture
        role: {
          narrateur: 'rgb(var(--role-narrateur-c) / <alpha-value>)',
          chercheur: 'rgb(var(--role-chercheur-c) / <alpha-value>)',
          anomalie: 'rgb(var(--role-anomalie-c) / <alpha-value>)',
          classed: 'rgb(var(--role-classed-c) / <alpha-value>)',
          agent: 'rgb(var(--role-agent-c) / <alpha-value>)',
          commandant: 'rgb(var(--role-commandant-c) / <alpha-value>)',
          intercom: 'rgb(var(--role-intercom-c) / <alpha-value>)',
        },
        // Alias de compatibilité avec l'ancienne nomenclature
        scp: {
          bg: 'rgb(var(--fond-c) / <alpha-value>)',
          surface: 'rgb(var(--surface-1-c) / <alpha-value>)',
          card: 'rgb(var(--surface-2-c) / <alpha-value>)',
          cardHover: 'rgb(var(--surface-3-c) / <alpha-value>)',
          border: 'rgb(var(--bordure-c) / <alpha-value>)',
          red: 'rgb(var(--accent-c) / <alpha-value>)',
          amber: 'rgb(var(--classe-euclid-c) / <alpha-value>)',
          green: 'rgb(var(--classe-safe-c) / <alpha-value>)',
          cyan: 'rgb(var(--systeme-c) / <alpha-value>)',
          blue: 'rgb(var(--role-narrateur-c) / <alpha-value>)',
          purple: 'rgb(var(--classe-thaumiel-c) / <alpha-value>)',
          text: 'rgb(var(--texte-c) / <alpha-value>)',
          muted: 'rgb(var(--texte-attenue-c) / <alpha-value>)',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', '"Iowan Old Style"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Plancher à 12 px : en dessous, une étiquette ne dit plus rien.
        xs: ['12px', { lineHeight: '1.35' }],
        sm: ['13px', { lineHeight: '1.45' }],
        base: ['15px', { lineHeight: '1.5' }],
        md: ['16px', { lineHeight: '1.7' }],
        lg: ['18px', { lineHeight: '1.4' }],
        xl: ['21px', { lineHeight: '1.3' }],
        '2xl': ['26px', { lineHeight: '1.2' }],
        '3xl': ['32px', { lineHeight: '1.15' }],
      },
      borderRadius: {
        // Un document classifié a des angles droits.
        DEFAULT: '3px',
        sm: '2px',
        md: '3px',
        lg: '3px',
        xl: '3px',
        '2xl': '4px',
        '3xl': '4px',
      },
      // Trois niveaux neutres. Les alias de Tailwind sont remappés dessus :
      // les `shadow-2xl` teintés de rouge disséminés dans les composants
      // retombent ainsi sur une ombre sobre sans qu'on touche à chaque fichier.
      boxShadow: {
        relief: 'inset 0 1px 0 rgba(255, 255, 255, 0.045)',
        1: '0 1px 2px rgba(0, 0, 0, 0.45)',
        2: '0 2px 8px rgba(0, 0, 0, 0.5)',
        3: '0 8px 28px rgba(0, 0, 0, 0.6)',
        lecture: '0 0 0 1px rgba(240, 112, 106, 0.4), 0 4px 18px rgba(0, 0, 0, 0.55)',
        DEFAULT: '0 1px 2px rgba(0, 0, 0, 0.45)',
        sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
        md: '0 2px 8px rgba(0, 0, 0, 0.5)',
        lg: '0 2px 8px rgba(0, 0, 0, 0.5)',
        xl: '0 8px 28px rgba(0, 0, 0, 0.6)',
        '2xl': '0 8px 28px rgba(0, 0, 0, 0.6)',
      },
      maxWidth: {
        lecture: '68ch',
      },
      letterSpacing: {
        technique: '0.08em',
      },
    },
  },
  plugins: [],
}
