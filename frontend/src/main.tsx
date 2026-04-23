import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/i18n'
import './index.css'
import App from './App'

/**
 * @module main
 * @description Point d'entrée de l'application React.
 * L'import de i18n en premier garantit que les traductions sont
 * chargées avant le premier rendu des composants.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

const root = document.getElementById('root')
if (!root) throw new Error('Element #root introuvable dans le DOM.')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
