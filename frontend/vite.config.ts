import { defineConfig } from 'vite'
import react       from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path        from 'path'

/**
 * @description Configuration Vite — proxy /api vers Symfony en dev,
 * alias @ pour les imports absolus, Tailwind v4 en plugin natif.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  server: {
    proxy: {
      '/api': {
        target:       'http://127.0.0.1:8000',
        changeOrigin: true,
        secure:       false,
      },
    },
  },
})
