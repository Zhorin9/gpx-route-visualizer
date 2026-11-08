import ColorField from '../fields/ColorField'
import IconField from '../fields/IconField'
import IconFinishField from '../fields/IconFinishField'
import RotationField from '../fields/RotationField'
import SliderField from '../fields/SliderField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import { IconTrash } from '../icons'
import { useAppStore } from '../../store/useAppStore'
import type { TextNode } from '../../types'

export default function IconEditor({ node }: { node: TextNode }) {
  const updateText = useAppStore((s) => s.updateText)
  const deleteText = useAppStore((s) => s.deleteText)
  const update = (patch: Partial<TextNode>) => updateText(node.id, patch)
  return (
    <>
      <Section title="Ikona">
        <IconField value={node.icon} onChange={(icon) => update({ icon })} />
        <IconFinishField />
        <ColorField label="Kolor" value={node.color} onChange={(color) => update({ color })} />
      </Section>

      <Section title="Układ">
        <SliderField label="Rozmiar" unit="px" min={24} max={480} value={node.fontSize} defaultValue={120} onChange={(fontSize) => update({ fontSize })} />
        <RotationField value={node.rotation} onChange={(rotation) => update({ rotation })} />
        <SliderField label="Krycie" unit="%" min={10} max={100} value={Math.round(node.opacity * 100)} defaultValue={100} onChange={(v) => update({ opacity: v / 100 })} />
      </Section>

      <Button variant="danger" icon={<IconTrash />} onClick={() => deleteText(node.id)}>
        Usuń ikonę
      </Button>
    </>
  )
}
