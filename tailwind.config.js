/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,js,ejs}"],
    theme: {
        colors: {
            'pantone': {
                300: '#0062a6',
                803: '#ffe500',
                485: '#e12626',
                288: '#002c73',
            },
            black: '#000',
            white: '#fff',
        },
        extend: {},
    },
    plugins: [],
}