import SliderField from '../fields/SliderField'
import FontField from '../fields/FontField'
import RotationField from '../fields/RotationField'
import ColorField from '../fields/ColorField'
import CheckboxField from '../fields/CheckboxField'
import ShadowField from '../fields/ShadowField'
import IconEditor from './IconEditor'
import TextField from '../fields/TextField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import { IconTrash } from '../icons'
import { useAppStore } from '../../store/useAppStore'

export default function TextEditor({ id }: { id: number }) {
  const selected = useAppStore((s) => s.texts.find((t) => t.id === id))
  const updateText = useAppStore((s) => s.updateText)
  const deleteText = useAppStore((s) => s.deleteText)

  if (!selected) return null
  if (selected.icon) return <IconEditor node={selected} />

  return (
    <>
      <Section title="Treść">
        <TextField label="Tekst" multiline value={selected.text} onChange={(text) => updateText(selected.id, { text })} />
        <FontField value={selected.fontFamily} onChange={(fontFamily) => updateText(selected.id, { fontFamily })} />
        <div className="button-row">
          <Button pressed={selected.bold} aria-label="Pogrubienie" onClick={() => updateText(selected.id, { bold: !selected.bold })}>
            <strong>B</strong>
          </Button>
          <Button pressed={selected.italic} aria-label="Kursywa" onClick={() => updateText(selected.id, { italic: !selected.italic })}>
            <em>I</em>
          </Button>
        </div>
        <ColorField label="Kolor" value={selected.color} onChange={(color) => updateText(selected.id, { color })} />
      </Section>

      <Section title="Układ">
        <SliderField
          label="Rozmiar"
          unit="px"
          min={12}
          max={160}
          value={selected.fontSize}
          defaultValue={48}
          onChange={(fontSize) => updateText(selected.id, { fontSize })}
        />
        <SliderField
          label="Odstępy liter"
          unit="px"
          min={-2}
          max={30}
          value={selected.letterSpacing}
          defaultValue={0}
          onChange={(letterSpacing) => updateText(selected.id, { letterSpacing })}
        />
        <RotationField value={selected.rotation} onChange={(rotation) => updateText(selected.id, { rotation })} />
        <SliderField
          label="Krycie"
          unit="%"
          min={10}
          max={100}
          value={Math.round(selected.opacity * 100)}
          defaultValue={100}
          onChange={(v) => updateText(selected.id, { opacity: v / 100 })}
        />
      </Section>

      <Section title="Efekty">
        <ShadowField soft={selected.shadowEnabled} hard={selected.hardShadow} onChange={({ soft, hard }) => updateText(selected.id, { shadowEnabled: soft, hardShadow: hard })} />
        <CheckboxField
          label="Obrys"
          checked={selected.outlineEnabled}
          onChange={(outlineEnabled) => updateText(selected.id, { outlineEnabled })}
        />
        {selected.outlineEnabled && (
          <>
            <ColorField
              label="Kolor obrysu"
              value={selected.outlineColor}
              onChange={(outlineColor) => updateText(selected.id, { outlineColor })}
            />
            <SliderField
              label="Grubość obrysu"
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
        Usuń tekst
      </Button>
    </>
  )
}
