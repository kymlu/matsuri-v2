/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic tokens — resolved from CSS variables so one class name renders
        // correctly in both themes. Values are defined in src/App.css.
        primary: 'var(--color-primary, #AB1010)',
        // backgrounds, deepest → most raised
        app: 'var(--color-app, #f9fafb)',        // page / body background
        surface: 'var(--color-surface, #ffffff)', // cards, dialogs, inputs, menus, toolbars
        subtle: 'var(--color-subtle, #e5e7eb)',   // muted fills, dividers, disabled, hairline borders
        // text, most → least prominent
        body: 'var(--color-body, #000000)',       // primary text
        muted: 'var(--color-muted, #4b5563)',     // secondary text (labels, meta)
        faint: 'var(--color-faint, #9ca3af)',     // tertiary text (hints, separators)
        // borders
        line: 'var(--color-line, #9ca3af)',              // default border colour
        'line-strong': 'var(--color-line-strong, #4b5563)', // emphasised border (grey variants)
        lightGrey: "#CDCDCD",
      },
      fontFamily: {
        icon: 'Material Symbols Rounded',
      }
    },
  },
  plugins: [],
};
