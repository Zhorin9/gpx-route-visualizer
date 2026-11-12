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
import type { TextNode } from '../../types'

export default function TextEditor({ id }: { id: number }) {
  const { t } = useTranslation()
  const selected = useAppStore((s) => s.texts.find((x) => x.id === id))
  const updateText = useAppStore((s) => s.updateText)
  const deleteText = useAppStore((s) => s.deleteText)

  if (!selected) return null
  if (selected.icon) return <IconEditor node={selected} />
  const update = (patch: Partial<TextNode>) => updateText(selected.id, patch)

  return (
    <>
      <Section title={t('textEditor.content')}>
        <TextField label={t('textEditor.text')} multiline value={selected.text} onChange={(text) => update({ text })} />
        <FontField value={selected.fontFamily} onChange={(fontFamily) => update({ fontFamily })} />
        <div className="button-row">
          <Button pressed={selected.bold} aria-label={t('textEditor.bold')} onClick={() => update({ bold: !selected.bold })}>
            <strong>B</strong>
          </Button>
          <Button pressed={selected.italic} aria-label={t('textEditor.italic')} onClick={() => update({ italic: !selected.italic })}>
            <em>I</em>
          </Button>
        </div>
        <ColorField label={t('textEditor.color')} value={selected.color} onChange={(color) => update({ color })} />
      </Section>

      <Section title={t('textEditor.layout')}>
        <SliderField
          label={t('textEditor.size')}
          unit="px"
          min={12}
          max={160}
          value={selected.fontSize}
          defaultValue={48}
          onChange={(fontSize) => update({ fontSize })}
        />
        <SliderField
          label={t('textEditor.letterSpacing')}
          unit="px"
          min={-2}
          max={30}
          value={selected.letterSpacing}
          defaultValue={0}
          onChange={(letterSpacing) => update({ letterSpacing })}
        />
        <RotationField value={selected.rotation} onChange={(rotation) => update({ rotation })} />
        <SliderField
          label={t('textEditor.opacity')}
          unit="%"
          min={10}
          max={100}
          value={Math.round(selected.opacity * 100)}
          defaultValue={100}
          onChange={(v) => update({ opacity: v / 100 })}
        />
      </Section>

      <Section title={t('textEditor.badge')}>
        <BadgeField value={selected.badge} onChange={(badge) => update({ badge })} />
      </Section>

      <Section title={t('textEditor.shapeAndTyping')}>
        <WarpField value={selected.warp} onChange={(warp) => update({ warp })} />
        <CheckboxField label={t('textEditor.typing')} checked={!!selected.typing} onChange={(on) => update({ typing: on ? { cps: 12 } : undefined })} />
        {selected.typing && (
          <>
            <SliderField
              label={t('textEditor.speed')}
              unit={t('textEditor.speedUnit')}
              min={2}
              max={40}
              value={selected.typing.cps}
              defaultValue={12}
              onChange={(cps) => update({ typing: { cps } })}
            />
            <p className="hint">{t('textEditor.typingHint')}</p>
          </>
        )}
      </Section>

      <Section title={t('textEditor.effects')}>
        <ShadowField soft={selected.shadowEnabled} hard={selected.hardShadow} onChange={({ soft, hard }) => update({ shadowEnabled: soft, hardShadow: hard })} />
        <CheckboxField
          label={t('textEditor.outline')}
          checked={selected.outlineEnabled}
          onChange={(outlineEnabled) => update({ outlineEnabled })}
        />
        {selected.outlineEnabled && (
          <>
            <ColorField
              label={t('textEditor.outlineColor')}
              value={selected.outlineColor}
              onChange={(outlineColor) => update({ outlineColor })}
            />
            <SliderField
              label={t('textEditor.outlineWidth')}
              unit="px"
              min={0.5}
              max={10}
              step={0.5}
              value={selected.outlineWidth}
              defaultValue={2}
              onChange={(outlineWidth) => update({ outlineWidth })}
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
