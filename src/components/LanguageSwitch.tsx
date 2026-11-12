import { useTranslation } from 'react-i18next'
import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../i18n'

export default function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  return (
    <div className="view-switch" role="radiogroup" aria-label={t('topBar.language')}>
      {LANGUAGES.map((language: Language) => (
        <button
          key={language}
          type="button"
          role="radio"
          lang={language}
          aria-checked={i18n.language === language}
          className={i18n.language === language ? 'view-switch-opt active' : 'view-switch-opt'}
          onClick={() => void i18n.changeLanguage(language)}
        >
          {LANGUAGE_NAMES[language]}
        </button>
      ))}
    </div>
  )
}
