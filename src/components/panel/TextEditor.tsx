import { useTranslation } from 'react-i18next'
import SliderField from '../fields/SliderField'
import FontField from '../fields/FontField'
import RotationField from '../fields/RotationField'
import ColorField from '../fields/ColorField'
import CheckboxField from '../fields/CheckboxField'
import ShadowField from '../fields/ShadowField'
import WarpField from '../fields/WarpField'
import BadgeField from '../fields/BadgeField'
import IconEditor from './IconEditor'
import TextField from '../fields/TextField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import { IconTrash } from '../icons'
import { useAppStore } from '../../store/useAppStore'

export default function TextEditor({ id }: { id: number }) {
  const { t } = useTranslation()
  const selected = useAppStore((s) => s.texts.find((x) => x.id === id))
  const updateText = useAppStore((s) => s.updateText)
  const deleteText = useAppStore((s) => s.deleteText)

  if (!selected) return null
  if (selected.icon) return <IconEditor node={selected} />

  return (
    <>
      <Section title={t('textEditor.content')}>
        <TextField label={t('textEditor.text')} multiline value={selected.text} onChange={(text) => updateText(selected.id, { text })} />
        <FontField value={selected.fontFamily} onChange={(fontFamily) => updateText(selected.id, { fontFamily })} />
        <div className="button-row">
          <Button pressed={selected.bold} aria-label={t('textEditor.bold')} onClick={() => updateText(selected.id, { bold: !selected.bold })}>
            <strong>B</strong>
          </Button>
          <Button pressed={selected.italic} aria-label={t('textEditor.italic')} onClick={() => updateText(selected.id, { italic: !selected.italic })}>
            <em>I</em>
          </Button>
        </div>
        <ColorField label={t('textEditor.color')} value={selected.color} onChange={(color) => updateText(selected.id, { color })} />
      </Section>

      <Section title={t('textEditor.layout')}>
        <SliderField
          label={t('textEditor.size')}
          unit="px"
          min={12}
          max={160}
          value={selected.fontSize}
          defaultValue={48}
          onChange={(fontSize) => updateText(selected.id, { fontSize })}
        />
        <SliderField
          label={t('textEditor.letterSpacing')}
          unit="px"
          min={-2}
          max={30}
          value={selected.letterSpacing}
          defaultValue={0}
          onChange={(letterSpacing) => updateText(selected.id, { letterSpacing })}
        />
        <RotationField value={selected.rotation} onChange={(rotation) => updateText(selected.id, { rotation })} />
        <SliderField
          label={t('textEditor.opacity')}
          unit="%"
          min={10}
          max={100}
          value={Math.round(selected.opacity * 100)}
          defaultValue={100}
          onChange={(v) => updateText(selected.id, { opacity: v / 100 })}
        />
      </Section>

      <Section title={t('textEditor.badge')}>
        <BadgeField value={selected.badge} onChange={(badge) => updateText(selected.id, { badge })} />
      </Section>

      <Section title={t('textEditor.shapeAndTyping')}>
        <WarpField value={selected.warp} onChange={(warp) => updateText(selected.id, { warp })} />
        <CheckboxField label={t('textEditor.typing')} checked={!!selected.typing} onChange={(on) => updateText(selected.id, { typing: on ? { cps: 12 } : undefined })} />
        {selected.typing && (
          <>
            <SliderField
              label={t('textEditor.speed')}
              unit={t('textEditor.speedUnit')}
              min={2}
              max={40}
              value={selected.typing.cps}
              defaultValue={12}
              onChange={(cps) => updateText(selected.id, { typing: { cps } })}
            />
            <p className="hint">{t('textEditor.typingHint')}</p>
          </>
        )}
      </Section>

      <Section title={t('textEditor.effects')}>
        <ShadowField soft={selected.shadowEnabled} hard={selected.hardShadow} onChange={({ soft, hard }) => updateText(selected.id, { shadowEnabled: soft, hardShadow: hard })} />
        <CheckboxField
          label={t('textEditor.outline')}
          checked={selected.outlineEnabled}
          onChange={(outlineEnabled) => updateText(selected.id, { outlineEnabled })}
        />
        {selected.outlineEnabled && (
          <>
            <ColorField
              label={t('textEditor.outlineColor')}
              value={selected.outlineColor}
              onChange={(outlineColor) => updateText(selected.id, { outlineColor })}
            />
            <SliderField
              label={t('textEditor.outlineWidth')}
              unit="px"
              min={0.5}
              max={10}
              step={0.5}
              value={selected.outlineWidth}
              defaultValue={2}
              onChange={(outlineWidth) => updateText(selected.id, { outlineWidth })}
            />
          </>
        )}
      </Section>

      <Button variant="danger" icon={<IconTrash />} onClick={() => deleteText(selected.id)}>
        {t('textEditor.delete')}
      </Button>
    </>
  )
}
