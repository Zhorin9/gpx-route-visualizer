import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import IconSvg from '../place/IconSvg'
import { ICON_CATEGORIES, ICONS, iconById, type IconCategory, type IconId } from '../place/icons'
import { IconSearch } from '../icons'
import { foldText } from '../../utils/foldText'
import './IconField.css'

type Filter = IconCategory | 'all'

export default function IconField({ value, onChange }: { value: IconId | undefined; onChange: (icon: IconId) => void }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const current = value && iconById(value)

  const shown = useMemo(() => {
    const wanted = foldText(query.trim())
    return ICONS.filter((icon) => (filter === 'all' || icon.category === filter) && (!wanted || foldText(t(icon.label)).includes(wanted) || foldText(t(`iconCategories.${icon.category}`)).includes(wanted)))
  }, [query, filter, t])

  const sections = filter === 'all' && !query.trim() ? ICON_CATEGORIES.map((category) => ({ category, icons: shown.filter((i) => i.category === category) })) : [{ category: null, icons: shown }]

  return (
    <div className="field icon-field">
      <span className="field-label">
        {t('iconField.icon')}
        {current && <span className="icon-field-current"> · {t(current.label)}</span>}
      </span>

      <label className="icon-field-search">
        <IconSearch className="icon-field-search-icon" />
        <input type="search" placeholder={t('iconField.search')} aria-label={t('iconField.search')} autoComplete="off" spellCheck={false} value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      <div className="filter-chips" role="radiogroup" aria-label={t('iconField.categories')}>
        {(['all', ...ICON_CATEGORIES] as Filter[]).map((key) => (
          <button key={key} type="button" role="radio" aria-checked={filter === key} className="filter-chip" onClick={() => setFilter(key)}>
            {key === 'all' ? t('iconField.all') : t(`iconCategories.${key}`)}
          </button>
        ))}
      </div>

      {shown.length ? (
        <div className="icon-field-scroll" role="radiogroup" aria-label={t('iconField.icon')}>
          {sections.map(({ category, icons }) => (
            <section key={category ?? 'found'} className="icon-field-section">
              {category && <h4 className="icon-field-heading">{t(`iconCategories.${category}`)}</h4>}
              <div className="icon-grid">
                {icons.map((icon) => (
                  <button key={icon.id} type="button" role="radio" aria-checked={icon.id === value} aria-label={t(icon.label)} title={t(icon.label)} className={icon.id === value ? 'icon-option active' : 'icon-option'} onClick={() => onChange(icon.id)}>
                    <IconSvg icon={icon.id} size={24} />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="hint" role="status">
          {t('iconField.noMatch', { query: query.trim() })}
        </p>
      )}
    </div>
  )
}
