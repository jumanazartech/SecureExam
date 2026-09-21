/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        // Fewer, calmer radii and weights: the app previously used 32-40px corners and font-black everywhere.
        borderRadius: {
            none: '0', sm: '4px', DEFAULT: '6px', md: '8px', lg: '10px', xl: '12px',
            '2xl': '14px', '3xl': '18px', full: '9999px'
        },
        fontWeight: {
            thin: '100', extralight: '200', light: '300', normal: '400', medium: '500',
            semibold: '600', bold: '700', extrabold: '700', black: '700'
        },
        fontFamily: {
            sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
            display: ['"Bricolage Grotesque"', '"Instrument Sans"', 'system-ui', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
        },
        extend: {
            colors: {
                nearblack: '#0C121C',
                offwhite: '#F5F7F8',

                // Neutral scale with a slight lapis bias (replaces Tailwind's flat greys)
                gray: {
                    50: '#F5F7F8', 100: '#ECEFF2', 200: '#DDE2E8', 300: '#C3CBD5', 400: '#8E99A8',
                    500: '#66727F', 600: '#4B5765', 700: '#363F4C', 800: '#1E2735', 900: '#141C29', 950: '#0C121C'
                },
                // Lapis blue: primary (Registan tile blue)
                blue: {
                    50: '#EEF4FD', 100: '#DAE7FB', 200: '#B9D0F6', 300: '#8DB1EE', 400: '#5A8BE2',
                    500: '#2F66CC', 600: '#1F52B4', 700: '#194190', 800: '#163670', 900: '#142C58', 950: '#0C1B3A'
                },
                indigo: {
                    50: '#EEF4FD', 100: '#DAE7FB', 200: '#B9D0F6', 300: '#8DB1EE', 400: '#5A8BE2',
                    500: '#2F66CC', 600: '#1F52B4', 700: '#194190', 800: '#163670', 900: '#142C58', 950: '#0C1B3A'
                },
                // Jade: secondary (replaces the default purple)
                purple: {
                    50: '#ECFAF6', 100: '#CFF3EA', 200: '#A2E6D5', 300: '#6CCDBD', 400: '#35B39F',
                    500: '#12907E', 600: '#0E7A6B', 700: '#0C6357', 800: '#0A4E45', 900: '#0B3F38', 950: '#062723'
                },
                // Saffron: sparing highlight
                saffron: { 300: '#F2C769', 400: '#EBB13C', 500: '#E0A526', 600: '#BF861A' },

                // Warm White System
                'warm': {
                    50: '#FFFEF9',   // Primary page background
                    100: '#FFFCF5',  // Surface/card background
                    200: '#FBF9F4',  // Secondary warm
                    300: '#F8F6F0',  // Tertiary beige
                },

                // Warm Gray System (replaces harsh grays)
                'warm-gray': {
                    50: '#F9F8F6',
                    100: '#F3F1ED',
                    200: '#E8E5DF',
                    300: '#D4CFC5',
                    400: '#B8AFA5',
                    500: '#9C9890',
                    600: '#6B6760',
                    700: '#4A4740',
                    800: '#2D2A26',
                    900: '#1A1816',
                },

                // Muted Accent Colors
                'amber-soft': {
                    light: '#E8C9A0',
                    DEFAULT: '#D4A574',
                    dark: '#B8895E',
                },
                'olive': {
                    light: '#C4D4A8',
                    DEFAULT: '#A8B48C',
                    dark: '#8C9A70',
                },
                'success-soft': '#8FAA7E',
                'warning-soft': '#D9A86C',
                'error-soft': '#C97B7B',
                'info-soft': '#8BA8C4',
            },
            backgroundColor: {
                'page': '#FFFEF9',
                'surface': '#FFFCF5',
            },
            boxShadow: {
                'warm-sm': '0 1px 2px 0 rgba(45, 42, 38, 0.05)',
                'warm-md': '0 4px 6px -1px rgba(45, 42, 38, 0.08)',
                'warm-lg': '0 10px 15px -3px rgba(45, 42, 38, 0.1)',
                'warm-xl': '0 20px 25px -5px rgba(45, 42, 38, 0.12)',
            },
        },
    },
    plugins: [],
}
