/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f7f3e9',
        foreground: '#2d1810',
        card: '#faf7f0',
        'card-foreground': '#2d1810',
        popover: '#faf7f0',
        'popover-foreground': '#2d1810',
        primary: '#8b4513',
        'primary-foreground': '#f7f3e9',
        secondary: '#d2b48c',
        'secondary-foreground': '#2d1810',
        muted: '#e6ddd4',
        'muted-foreground': '#5d4e37',
        accent: '#cd853f',
        'accent-foreground': '#2d1810',
        destructive: '#a0522d',
        'destructive-foreground': '#f7f3e9',
        border: '#d2b48c',
        input: '#f0ead6',
        ring: '#8b4513',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        body: ['Crimson Text', 'serif'],
      },
      borderRadius: {
        lg: '0.625rem',
        md: 'calc(0.625rem - 2px)',
        sm: 'calc(0.625rem - 4px)',
      },
    },
  },
  plugins: [],
}

