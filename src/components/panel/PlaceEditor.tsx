import { useTranslation } from 'react-i18next'
import SliderField from '../fields/SliderField'
import SelectField from '../fields/SelectField'
import ColorField from '../fields/ColorField'
import CheckboxField from '../fields/CheckboxField'
import TextField from '../fields/TextField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import FileButton from '../ui/FileButton'
import { IconFit, IconImage, IconTrash } from '../icons'
import FontField from '../fields/FontField'
import KindIcon from '../place/KindIcon'
import IconField from '../fields/IconField'
import { DEFAULT_ICON_SIZE } from '../place/placeLayout'
import IconFinishField from '../fields/IconFinishField'
import { POINT_KIND_ORDER, POINT_KINDS } from '../place/pointKinds'
import { DEFAULT_SLOT_CROP } from '../../store/defaults'
import { useAppStore } from '../../store/useAppStore'
import type { PhotoMarker, PointStyle, SelectOption, Waypoint, WaypointKind } from '../../types'
import type { TKey } from '../../i18n'

const MARKER_OPTIONS: { value: PhotoMarker; label: TKey }[] = [
  { value: 'polaroid', label: 'placeEditor.markerPolaroid' },
  { value: 'circle', label: 'placeEditor.markerCircle' },
  { value: 'square', label: 'placeEditor.markerFrame' },
  { value: 'film', label: 'placeEditor.markerFilm' },
  { value: 'label', label: 'placeEditor.markerLabel' },
]

const SIZE_OPTIONS: SelectOption<PointStyle['size']>[] = [
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
]

function PointPhoto({ waypoint }: { waypoint: Waypoint }) {
  const { t } = useTranslation()
  const photos = useAppStore((s) => s.photos)
  const pointStyle = useAppStore((s) => s.pointStyle)
  const updateWaypoint = useAppStore((s) => s.updateWaypoint)
  const updatePointStyle = useAppStore((s) => s.updatePointStyle)
  const loadPhotoFiles = useAppStore((s) => s.loadPhotoFiles)
  const options: SelectOption[] = [{ value: '', label: t('placeEditor.noPhoto') }, ...photos.map((p) => ({ value: String(p.id), label: p.name }))]
  const has = photos.some((p) => p.id === waypoint.photoId)
  const crop = waypoint.photoCrop ?? DEFAULT_SLOT_CROP
  return (
    <>
      {photos.length > 0 && (
        <SelectField label={t('placeEditor.photo')} value={has ? String(waypoint.photoId) : ''} options={options} onChange={(v) => updateWaypoint(waypoint.id, { photoId: v ? Number(v) : undefined, photoCrop: undefined })} />
      )}
      <FileButton accept="image/*" icon={<IconImage />} onFiles={(files) => files?.length && void loadPhotoFiles([files[0]], { waypoint: waypoint.id })}>
        {has ? t('placeEditor.changePhoto') : t('placeEditor.addPhoto')}
      </FileButton>
      {has && (
        <>
          <Segmented
            label={t('placeEditor.shape')}
            showLabel
            value={pointStyle.marker}
            options={MARKER_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
            onChange={(marker) => updatePointStyle({ marker })}
          />
          {pointStyle.marker !== 'label' && (
            <>
              <Segmented label={t('placeEditor.photoSize')} showLabel value={pointStyle.size} options={SIZE_OPTIONS} onChange={(size) => updatePointStyle({ size })} />
              <SliderField
                label={t('placeEditor.cropZoom')}
                unit="%"
                min={100}
                max={400}
                step={10}
                value={Math.round(crop.zoom * 100)}
                defaultValue={100}
                onChange={(zoom) => updateWaypoint(waypoint.id, { photoCrop: { ...crop, zoom: zoom / 100 } })}
              />
              <p className="hint">{t('placeEditor.cropHint')}</p>
              <Button size="sm" variant="ghost" icon={<IconFit />} disabled={!waypoint.photoCrop} onClick={() => updateWaypoint(waypoint.id, { photoCrop: undefined })}>
                {t('placeEditor.centerCrop')}
              </Button>
            </>
          )}
        </>
      )}
    </>
  )
}

export default function PlaceEditor({ id }: { id: number }) {
  const { t } = useTranslation()
  const selected = useAppStore((s) => s.waypoints.find((w) => w.id === id))
  const updateWaypoint = useAppStore((s) => s.updateWaypoint)
  const deleteWaypoint = useAppStore((s) => s.deleteWaypoint)

  if (!selected) return null

  const kindOptions: SelectOption<WaypointKind>[] = POINT_KIND_ORDER.map((kind) => ({ value: kind, label: t(POINT_KINDS[kind].label), icon: <KindIcon kind={kind} /> }))

  return (
    <>
      <Section title={t('placeEditor.labelSection')}>
        <TextField label={t('placeEditor.name')} value={selected.text} onChange={(text) => updateWaypoint(selected.id, { text })} />
        <Segmented
          label={t('placeEditor.kind')}
          showLabel
          wrap
          value={selected.kind}
          options={kindOptions}
          onChange={(kind) => updateWaypoint(selected.id, { kind, ...(kind === 'icon' && !selected.icon ? { icon: 'coffee' as const } : null) })}
        />
        {selected.kind === 'icon' && (
          <>
            <IconField value={selected.icon} onChange={(icon) => updateWaypoint(selected.id, { icon })} />
            <CheckboxField
              label={t('placeEditor.iconAsLabel')}
              checked={!!selected.iconAsLabel}
              onChange={(iconAsLabel) => updateWaypoint(selected.id, { iconAsLabel })}
            />
            {selected.iconAsLabel && <p className="hint">{t('placeEditor.iconAsLabelHint')}</p>}
            <SliderField
              label={t('placeEditor.iconSize')}
              unit="px"
              min={16}
              max={200}
              value={selected.iconSize ?? DEFAULT_ICON_SIZE}
              defaultValue={DEFAULT_ICON_SIZE}
              onChange={(iconSize) => updateWaypoint(selected.id, { iconSize })}
            />
            <IconFinishField />
          </>
        )}
        <FontField value={selected.fontFamily} onChange={(fontFamily) => updateWaypoint(selected.id, { fontFamily })} />
        <SliderField
          label={t('placeEditor.textSize')}
          unit="px"
          min={10}
          max={80}
          value={selected.fontSize}
          defaultValue={26}
          onChange={(fontSize) => updateWaypoint(selected.id, { fontSize })}
        />
        <ColorField label={t('placeEditor.color')} value={selected.color} onChange={(color) => updateWaypoint(selected.id, { color })} />
        <CheckboxField label={t('placeEditor.shadow')} checked={selected.shadowEnabled ?? true} onChange={(shadowEnabled) => updateWaypoint(selected.id, { shadowEnabled })} />
        <CheckboxField label={t('placeEditor.leader')} checked={selected.leaderEnabled ?? true} onChange={(leaderEnabled) => updateWaypoint(selected.id, { leaderEnabled })} />
      </Section>
      <Section title={t('placeEditor.photoSection')}>
        <PointPhoto waypoint={selected} />
      </Section>
      <Button variant="danger" icon={<IconTrash />} onClick={() => deleteWaypoint(selected.id)}>
        {t('placeEditor.delete')}
      </Button>
    </>
  )
}
