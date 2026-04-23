import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

/**
 * @module components/ui/Input
 * @description Champs de formulaire (Input, Textarea, Select) avec gestion d'erreur intégrée.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

const BASE = 'w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'
const NORMAL  = 'border-slate-300 dark:border-slate-600'
const ERROR   = 'border-red-400 bg-red-50 dark:bg-red-900/20'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:    string
  error?:    string
  required?: boolean
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:    string
  error?:    string
  required?: boolean
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:    string
  error?:    string
  required?: boolean
  children:  React.ReactNode
}

/**
 * @function Input
 * @description Champ de saisie avec label, gestion d'erreur et accessibilité.
 *
 * @param {InputProps} props
 * @returns {JSX.Element}
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, id, className = '', ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500" aria-hidden>*</span>}
        </label>
      )}
      <input ref={ref} id={id} aria-invalid={!!error}
        className={`${BASE} ${error ? ERROR : NORMAL} ${className}`} {...props} />
      {error && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

/**
 * @function Textarea
 * @description Zone de texte multiligne avec label et gestion d'erreur.
 *
 * @param {TextareaProps} props
 * @returns {JSX.Element}
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, required, id, className = '', ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500" aria-hidden>*</span>}
        </label>
      )}
      <textarea ref={ref} id={id} aria-invalid={!!error}
        className={`${BASE} ${error ? ERROR : NORMAL} resize-none ${className}`} {...props} />
      {error && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

/**
 * @function Select
 * @description Menu déroulant avec label et gestion d'erreur.
 *
 * @param {SelectProps} props
 * @returns {JSX.Element}
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, id, children, className = '', ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500" aria-hidden>*</span>}
        </label>
      )}
      <select ref={ref} id={id} aria-invalid={!!error}
        className={`${BASE} ${error ? ERROR : NORMAL} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'
