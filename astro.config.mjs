// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import clerk from '@clerk/astro';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    clerk({
      appearance: {
        // GPS Dental Training brand colors
        variables: {
          colorPrimary: '#13326A',
          colorBackground: '#FFFFFF',
          colorText: '#293647',
          colorTextSecondary: '#4E6E82',
          colorDanger: '#DC3545',
          colorSuccess: '#28A745',
          colorInputBackground: '#FFFFFF',
          colorInputText: '#293647',
          borderRadius: '0.5rem',
          fontFamily: 'Montserrat, sans-serif',
        },
        elements: {
          formButtonPrimary:
            'bg-[#13326A] hover:bg-[#0C2044] text-white font-semibold py-3 transition-all duration-300',
          card: 'shadow-xl border-0 rounded-xl',
          headerTitle: 'font-bold text-[#13326A] text-2xl',
          headerSubtitle: 'text-[#4E6E82]',
          socialButtonsBlockButton:
            'border border-gray-200 hover:bg-gray-50 hover:border-[#DDC89D] transition-all duration-300',
          formFieldInput:
            'border border-gray-300 focus:border-[#13326A] focus:ring-[#13326A] rounded-lg py-3',
          formFieldLabel: 'text-[#293647] font-medium',
          footerActionLink: 'text-[#13326A] hover:text-[#EA4C22] font-semibold',
          identityPreviewEditButton: 'text-[#13326A] hover:text-[#EA4C22]',
          formFieldInputShowPasswordButton: 'text-[#4E6E82] hover:text-[#13326A]',
        },
      },
    }),
  ],
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    port: 4325,
  },
  vite: {
    optimizeDeps: {
      exclude: ['@clerk/astro'],
    },
  },
});
