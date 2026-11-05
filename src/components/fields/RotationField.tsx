import SliderField from './SliderField'

export default function RotationField({ value, onChange }: { value: number; onChange: (degrees: number) => void }) {
  return <SliderField label="Obrót" unit="°" min={-180} max={180} value={value} defaultValue={0} snapPoints={[0, -90, 90]} onChange={onChange} />
}
