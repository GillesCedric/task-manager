import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal }  from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'

/**
 * @module components/layout/CreateListModal
 * @description Formulaire de création d'une liste — nom, couleur, description.
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
]

interface CreateListModalProps {
  isOpen:    boolean
  onClose:   () => void
  onSubmit:  (name: string, color: string, description: string) => Promise<void>
  isLoading: boolean
}

export function CreateListModal({ isOpen, onClose, onSubmit, isLoading }: CreateListModalProps) {
  const { t } = useTranslation()
  const [name,        setName]        = useState('')
  const [color,       setColor]       = useState(COLORS[0])
  const [description, setDescription] = useState('')
  const [error,       setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError(t('validation.required')); return }
    setError('')
    await onSubmit(name.trim(), color, description.trim())
    setName(''); setColor(COLORS[0]); setDescription('')
  }

  const handleClose = () => {
    setName(''); setColor(COLORS[0]); setDescription(''); setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('list.create')} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="list-name"
          label={t('list.nameLabel')}
          required
          autoFocus
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          error={error}
          placeholder={t('list.namePlaceholder')}
        />

        {/* Sélecteur couleur */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('list.colorLabel')}
          </p>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={[
                  'w-8 h-8 rounded-full transition-all duration-200',
                  color === c
                    ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800 scale-125 shadow-lg'
                    : 'hover:scale-110 opacity-75 hover:opacity-100 hover:shadow-md',
                ].join(' ')}
                style={{ backgroundColor: c }}
                aria-label={c}
                aria-pressed={color === c}
              />
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="list-desc" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t('list.descriptionLabel')}
          </label>
          <textarea
            id="list-desc"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('list.descriptionPlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Aperçu */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
            {name || t('list.namePlaceholder')}
          </span>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {t('list.create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
