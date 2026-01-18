import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#F15025',
                    light: '#ff7c5c',
                    dark: '#b93a19',
                },
                surface: {
                    light: '#E6E8E6',
                    medium: '#CED0CE',
                },
                dark: {
                    DEFAULT: '#191919',
                    lighter: '#252525',
                }
            }
        },
    },
    plugins: [
        typography,
    ],
}
