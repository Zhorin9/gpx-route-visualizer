import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../../components/ui/Button'
import { IconPlus, IconTrash } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { FONT_CHOICES, type FontGroup } from '../../utils/fonts'
import { addUserFont, removeUserFont, subscribeUserFonts, userFonts } from './store'
import './UserFontsPanel.css'

const letterList = (missing: string[]) => [...new Set(missing.map((l) => l.toLocaleLowerCase('pl')))].join(' ')

export function useUserFonts() {
  return useSyncExternalStore(subscribeUserFonts, userFonts)
}

export function useFontChoices(): { family: string; group: FontGroup }[] {
  const mine = useUserFonts()
  return useMemo(() => [...mine.map((f) => ({ family: f.family, group: 'user' as const })), ...FONT_CHOICES], [mine])
}

export default function UserFontsPanel({ onAdded }: { onAdded: (family: string) => void }) {
  const { t } = useTranslation()
  const mine = useUserFonts()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const showToast = useAppStore((s) => s.showToast)

  async function add(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      const font = await addUserFont(file)
      showToast(font.missing.length ? t('userFonts.addedMissing', { family: font.family, letters: letterList(font.missing) }) : t('userFonts.added', { family: font.family }))
      onAdded(font.family)
    } catch {
      showToast(t('userFonts.failed'))
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="user-fonts">
      <Button size="sm" block icon={<IconPlus />} disabled={busy} onClick={() => fileRef.current?.click()}>
        {t('userFonts.add')}
      </Button>
      <input ref={fileRef} type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" hidden onChange={(e) => add(e.target.files?.[0])} />
      {mine.map((font) => (
        <div key={font.family} className="user-font">
          <span className="user-font-name" style={{ fontFamily: `"${font.family}"` }}>
            {font.family}
          </span>
          <span className={font.missing.length ? 'tag tag-outline' : 'tag user-font-ok'}>
            {font.missing.length ? t('userFonts.missing', { letters: letterList(font.missing) }) : t('userFonts.polishOk')}
          </span>
          <Button size="icon" variant="ghost" aria-label={t('userFonts.remove', { family: font.family })} title={t('userFonts.remove', { family: font.family })} onClick={() => removeUserFont(font.family)}>
            <IconTrash />
          </Button>
        </div>
      ))}
      {mine.length > 0 && <p className="hint">{t('userFonts.hint')}</p>}
    </div>
  )
}
