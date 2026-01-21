/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // GPS Dental Official Brand Colors
        'gps-navy-darkest': '#0C2044',  // Darkest navy
        'gps-navy-dark': '#13326A',      // Dark navy
        'gps-navy': '#173D84',           // Primary navy
        'gps-navy-medium': '#0B52AC',    // Medium blue
        'gps-blue': '#26ACF5',           // Light blue / accent
        'gps-blue-gray': '#A2B1CE',      // Light blue-gray
        'gps-gold': '#DDC89D',           // Primary gold
        'gps-gold-dark': '#BFAC87',      // Dark gold
        'gps-bg': '#F2F2F2',             // Background
        'gps-white': '#FFFFFF',          // White
        'gps-text': '#333333',           // Text
        'gps-cta': '#0B52AC',            // CTA blue (same as navy-medium)
        'gps-success': '#28A745',        // Success green
        'gps-warning': '#FFC107',        // Warning yellow
        'gps-danger': '#DC3545',         // Danger red
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Open Sans', 'sans-serif'],
      },
      fontSize: {
        xs: '13px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '42px',
      },
    },
  },
  plugins: [],
};
