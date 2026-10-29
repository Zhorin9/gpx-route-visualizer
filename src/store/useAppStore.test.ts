import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerCanvasElement } from '../core/canvas/registry'
import { BUILT_IN_TEMPLATES } from '../utils/templates'
import { selectRouteDays, selectTrack } from './derived'
import { DOCUMENT_KEYS, pickDocument } from './document'
import { useAppStore } from './useAppStore'

const initial = useAppStore.getState()

beforeEach(() => {
  vi.useFakeTimers()
  useAppStore.setState(initial, true)
})

const get = () => useAppStore.getState()

const fakePhoto = (id: number) => ({ id, name: 'p' + id, image: {} as HTMLCanvasElement, thumb: '' })

describe('history', () => {
  it('snapshots every document field and nothing else', () => {
    const doc = pickDocument(get())
    expect(Object.keys(doc).sort()).toEqual([...DOCUMENT_KEYS].sort())
    for (const key of DOCUMENT_KEYS) expect(doc[key]).toBe(get()[key])
    expect(doc).not.toHaveProperty('past')
  })

  it('coalesces repeats of the same action into one undo step', () => {
    get().updateRouteStyle({ coreWidth: 6 })
    get().updateRouteStyle({ coreWidth: 7 })
    get().updateRouteStyle({ coreWidth: 8 })
    expect(get().past).toHaveLength(1)
    get().undo()
    expect(get().routeStyle.coreWidth).toBe(initial.routeStyle.coreWidth)
  })

  it('starts a new step for a different action even within the coalescing window', () => {
    get().updateRouteStyle({ coreWidth: 6 })
    get().updateStatsStyle({ fontSize: 50 })
    expect(get().past).toHaveLength(2)
  })

  it('redo re-applies an undone change and a new change clears redo', () => {
    get().updateRouteStyle({ color: '#ff0000' })
    get().undo()
    get().redo()
    expect(get().routeStyle.color).toBe('#ff0000')
    get().undo()
    get().updateStatsStyle({ fontSize: 50 })
    expect(get().future).toHaveLength(0)
  })

  it('drops a selection that no longer exists after undo', () => {
    const id = get().addText()
    expect(get().selection).toEqual({ kind: 'text', id })
    get().undo()
    expect(get().texts).toHaveLength(0)
    expect(get().selection).toBeNull()
  })
})

describe('elements', () => {
  it('delete shows an undoable toast and undo restores the text', () => {
    const id = get().addText()
    vi.advanceTimersByTime(1000)
    get().deleteText(id)
    expect(get().toast).toMatchObject({ message: 'Usunięto tekst', action: 'undo' })
    get().undo()
    expect(get().texts.map((t) => t.id)).toEqual([id])
    expect(get().toast).toMatchObject({ message: 'Cofnięto: usunięcie tekstu', action: 'redo' })
  })

  it('assigns ids that stay unique after undo', () => {
    const a = get().addText()
    vi.advanceTimersByTime(1000)
    const b = get().addText()
    expect(b).not.toBe(a)
  })

  it('scales vertical positions when the aspect ratio changes', () => {
    get().addText()
    const y = get().texts[0].y
    get().setAspectKey('1:1')
    expect(get().texts[0].y).toBeCloseTo(y * (1080 / 1920))
  })
})

describe('photo layouts', () => {
  it('keeps assigned photos when the layout changes and can undo it', () => {
    useAppStore.setState({ photos: [fakePhoto(1), fakePhoto(2)] })
    get().assignPhoto(0, 0, 1)
    get().assignPhoto(0, 1, 2)
    get().setLayout(0, 'g22')
    expect(get().slides[0].layoutKey).toBe('g22')
    expect(Object.keys(get().slides[0].slots)).toHaveLength(2)
    get().undo()
    expect(get().slides[0].layoutKey).toBe('g1')
  })

  it('switches the frame style with the layout group', () => {
    get().setLayout(0, 'c4')
    expect(get().collage.frame.style).toBe('polaroid')
    get().setLayout(0, 'g2h')
    expect(get().collage.frame.style).toBe('equal')
  })

  it('updates the crop of an assigned slot only', () => {
    useAppStore.setState({ photos: [fakePhoto(1)] })
    get().assignPhoto(0, 0, 1)
    get().updateSlot(0, 0, { zoom: 2 })
    get().updateSlot(0, 3, { zoom: 3 })
    expect(get().slides[0].slots[0].zoom).toBe(2)
    expect(get().slides[0].slots[3]).toBeUndefined()
    get().resetSlotCrop(0, 0)
    expect(get().slides[0].slots[0].zoom).toBe(1)
  })

  it('clears a slot and drops its selection after undo restores an older state', () => {
    useAppStore.setState({ photos: [fakePhoto(1)] })
    get().assignPhoto(0, 0, 1)
    get().clearSlot(0, 0)
    expect(get().slides[0].slots[0]).toBeUndefined()
    get().undo()
    expect(get().slides[0].slots[0]?.photoId).toBe(1)
  })

  it('adds a caption text under a framed slot', () => {
    useAppStore.setState({ photos: [fakePhoto(1)] })
    get().setLayout(0, 'c1')
    get().assignPhoto(0, 1, 1)
    get().addCaption(0, 1)
    const caption = get().texts[0]
    expect(caption.fontFamily).toBe('Caveat')
    expect(get().selection).toEqual({ kind: 'text', id: caption.id })
  })
})

describe('carousel', () => {
  it('switches between a single frame and two slides', () => {
    get().setCarousel(true)
    expect(get().slides).toHaveLength(2)
    expect(get().carouselKind).toBe('panorama')
    get().setCarousel(false)
    expect(get().slides).toHaveLength(1)
  })

  it('splits one photo over a chosen number of slides', () => {
    useAppStore.setState({ photos: [fakePhoto(1), fakePhoto(2)] })
    get().setCarousel(true)
    get().setSlideCount(4)
    expect(get().slides).toHaveLength(4)
    get().assignPhoto(0, 0, 1)
    get().updateSlot(0, 0, { zoom: 2 })
    get().setSlideCount(3)
    expect(get().slides[0].slots[0]).toMatchObject({ photoId: 1, zoom: 1 })
    get().setSlideCount(99)
    expect(get().slides).toHaveLength(5)
  })

  it('starts a panorama with empty slides and can switch to separate layouts', () => {
    useAppStore.setState({ photos: [fakePhoto(1), fakePhoto(2)] })
    get().setCarousel(true)
    expect(Object.keys(get().slides[1].slots)).toHaveLength(0)
    get().setCarouselKind('slides')
    expect(get().carouselKind).toBe('slides')
  })

  it('grows a series slide by slide, in 4:5, up to 20 exported slides', () => {
    get().setAspectKey('16:9')
    get().addSeriesSlide('photos')
    expect([get().aspectKey, get().carouselKind, get().slides.length, get().activeSlide]).toEqual(['4:5', 'slides', 2, 1])
    get().addSeriesSlide('summary')
    get().setActiveSlide(2)
    get().addSeriesSlide('collage')
    expect(get().slides.map((s) => s.kind)).toEqual([undefined, 'photos', 'photos', 'summary'])
    for (let i = 0; i < 20; i++) get().addSeriesSlide('photos')
    expect(get().slides).toHaveLength(20)
    get().toggleSkipSlide(5)
    get().addSeriesSlide('photos')
    expect(get().slides).toHaveLength(21)
    get().toggleSkipSlide(5)
    expect(get().slides[5].skipped).toBe(true)
  })

  it('moves, copies and removes slides with their texts; the first slide stays', () => {
    get().addSeriesSlide('photos')
    get().addSeriesSlide('profile')
    get().addText()
    get().updateText(get().texts[0].id, { x: 1080 + 50 })
    get().moveSlide(1, 2)
    expect(get().slides.map((s) => s.kind)).toEqual([undefined, 'profile', 'photos'])
    expect(get().texts[0].x).toBe(2160 + 50)
    get().removeSlide(0)
    expect(get().slides).toHaveLength(3)
    get().duplicateSlide(2)
    get().removeSlide(2)
    expect(get().slides).toHaveLength(3)
    expect(get().texts).toHaveLength(0)
    get().undo()
    expect(get().texts[0].x).toBe(2160 + 50)
  })

  it('gives each slide its own layout and photos', () => {
    useAppStore.setState({ photos: [fakePhoto(1)] })
    get().setCarousel(true)
    get().setCarouselKind('slides')
    get().setLayout(1, 'g2h')
    get().assignPhoto(1, 1, 1)
    expect(get().slides.map((s) => s.layoutKey)).toEqual(['g1', 'g2h'])
    expect(get().slides[1].slots[1]?.photoId).toBe(1)
    expect(get().slides[0].slots).toEqual({})
  })

  it('undoes removing a slide and clamps texts when the ribbon shrinks', () => {
    get().setCarousel(true)
    get().setSlideCount(3)
    get().addText()
    get().updateText(get().texts[0].id, { x: 3000 })
    get().setSlideCount(2)
    expect(get().texts[0].x).toBeLessThan(2160)
    get().undo()
    expect(get().slides).toHaveLength(3)
  })
})

describe('style templates', () => {
  const papier = BUILT_IN_TEMPLATES.find((t) => t.id === 'papier')!
  const all = { fonts: true, route: true, frame: true, colors: true, layout: false, points: true }

  it('applies only the chosen parts and never touches texts content or photos', () => {
    useAppStore.setState({ photos: [fakePhoto(1)] })
    get().assignPhoto(0, 0, 1)
    get().addText()
    const before = get().texts[0].text
    get().applyTemplate(papier, { ...all, layout: false, colors: false })
    expect(get().routeStyle).toMatchObject({ color: '#8a3b24', glowColor: '#8a3b24', glowOpacity: 0.18 })
    expect(get().statsStyle.fontFamily).toBe('Lora')
    expect(get().texts[0].fontFamily).toBe('Cinzel')
    expect(get().pointStyle.marker).toBe('polaroid')
    expect(get().texts[0].text).toBe(before)
    expect(get().collage.frame.enabled).toBe(true)
    expect(get().collage.bgKind).toBe(initial.collage.bgKind)
    expect(get().slides[0].slots[0].photoId).toBe(1)
    expect(get().slides[0].layoutKey).toBe('g1')
  })

  it('changes the layout only when asked and can be undone', () => {
    vi.advanceTimersByTime(1000)
    get().applyTemplate(papier, { ...all, layout: true })
    expect(get().slides[0].layoutKey).toBe('c1')
    get().undo()
    expect(get().slides[0].layoutKey).toBe('g1')
    expect(get().routeStyle.color).toBe(initial.routeStyle.color)
  })

  it('saves the current look as a custom template', () => {
    get().updateRouteStyle({ color: '#ff0000', dotted: true })
    get().saveTemplate('Mój')
    const saved = get().customTemplates[0]
    expect(saved).toMatchObject({ name: 'Mój', custom: true })
    expect(saved.route.color).toBe('#ff0000')
    get().deleteTemplate(saved.id)
    expect(get().customTemplates).toHaveLength(0)
  })
})

describe('format layouts', () => {
  it('reflows texts between formats and keeps hand-placed ones', () => {
    get().setAspectKey('4:5')
    get().addText()
    const id = get().texts[0].id
    get().updateText(id, { x: 100, y: 1000 })

    get().setAspectKey('9:16')
    expect(get().texts[0].y).toBeCloseTo(1000 * (1920 / 1350), 0)

    get().updateText(id, { y: 900 })
    get().setAspectKey('1:1')
    expect(get().texts[0].y).toBeCloseTo(800, 0)

    get().setAspectKey('9:16')
    expect(get().texts[0].y).toBe(900)

    get().setAspectKey('4:5')
    expect(get().texts[0].y).toBe(1000)
  })

  it('keeps story elements out of the safe zones', () => {
    get().setAspectKey('4:5')
    get().addText()
    get().updateText(get().texts[0].id, { y: 20 })
    get().setAspectKey('9:16')
    expect(get().texts[0].y).toBeGreaterThanOrEqual(250)
  })

  it('returns to the automatic layout on reset', () => {
    get().setAspectKey('4:5')
    get().addText()
    const id = get().texts[0].id
    get().updateText(id, { y: 700 })
    get().setAspectKey('9:16')
    const auto = get().texts[0].y
    get().updateText(id, { y: auto + 200 })
    get().resetFormatLayout()
    expect(get().texts[0].y).toBeCloseTo(auto, 0)
  })
})

describe('multi-day routes', () => {
  const gpx = (lat: number, name: string) =>
    new File(
      [
        `<gpx><trk><name>${name}</name><trkseg>${[0, 1, 2].map((i) => `<trkpt lat="${lat + i * 0.01}" lon="19"><ele>10</ele></trkpt>`).join('')}</trkseg></trk></gpx>`,
      ],
      `${name}.gpx`,
    )

  it('joins files into one track with a day each and removes a day again', async () => {
    vi.useRealTimers()
    await get().loadGpxFile(gpx(50, 'Pierwszy'))
    expect(selectRouteDays(get())).toHaveLength(0)
    await get().loadGpxFile(gpx(51, 'Drugi'), true)
    await get().loadGpxFile(gpx(52, 'Trzeci'), true)
    expect(selectRouteDays(get()).map((d) => [d.startIdx, d.endIdx])).toEqual([[0, 2], [3, 5], [6, 8]])
    expect(new Set(selectRouteDays(get()).map((d) => d.color)).size).toBe(3)
    expect(selectTrack(get())?.points).toHaveLength(9)

    get().addWaypoint(4)
    get().removePart(selectRouteDays(get())[1].id)
    expect(selectTrack(get())?.points).toHaveLength(6)
    expect(selectRouteDays(get()).map((d) => [d.startIdx, d.endIdx])).toEqual([[0, 2], [3, 5]])
    expect(get().waypoints).toHaveLength(0)

    get().removePart(selectRouteDays(get())[0].id)
    expect(selectRouteDays(get())).toHaveLength(0)
    expect(selectTrack(get())?.points).toHaveLength(3)
  })

  it('keeps the places of the other days where they were when a day is removed', async () => {
    vi.useRealTimers()
    await get().loadGpxFile(gpx(50, 'A'))
    await get().loadGpxFile(gpx(51, 'B'), true)
    await get().loadGpxFile(gpx(52, 'C'), true)
    get().addWaypoint(1)
    get().addWaypoint(7.5)
    const before = get().waypoints.map((w) => selectTrack(get())!.points[Math.floor(w.trackPos)].lat)
    get().removePart(selectRouteDays(get())[1].id)
    expect(get().waypoints.map((w) => selectTrack(get())!.points[Math.floor(w.trackPos)].lat)).toEqual(before)
    expect(get().waypoints[1].trackPos).toBe(4.5)
  })

  it('undoes appending a day: the track and its range go back together', async () => {
    vi.useRealTimers()
    await get().loadGpxFile(gpx(50, 'A'))
    get().setRange({ start: 0, end: 1 })
    await get().loadGpxFile(gpx(51, 'B'), true)
    get().undo()
    expect(selectTrack(get())?.points).toHaveLength(3)
    expect(get().range).toEqual({ start: 0, end: 1 })
  })

  it('undoes loading another file: the previous route comes back with its places', async () => {
    vi.useRealTimers()
    await get().loadGpxFile(gpx(50, 'A'))
    get().addWaypoint(1)
    await get().loadGpxFile(gpx(60, 'B'))
    expect(selectTrack(get())?.points[0].lat).toBe(60)
    expect(get().waypoints).toHaveLength(0)
    get().undo()
    expect(selectTrack(get())?.points[0].lat).toBe(50)
    expect(get().waypoints).toHaveLength(1)
    expect(get().texts.find((t) => t.role === 'title')?.text).toBe('A')
  })

  it('undoes removing a day', async () => {
    vi.useRealTimers()
    await get().loadGpxFile(gpx(50, 'A'))
    await get().loadGpxFile(gpx(51, 'B'), true)
    get().removePart(selectRouteDays(get())[1].id)
    expect(selectTrack(get())?.points).toHaveLength(3)
    get().undo()
    expect(selectTrack(get())?.points).toHaveLength(6)
    expect(selectRouteDays(get())).toHaveLength(2)
  })

  it('undoes a change of a day colour', async () => {
    vi.useRealTimers()
    await get().loadGpxFile(gpx(50, 'A'))
    await get().loadGpxFile(gpx(51, 'B'), true)
    const color = selectRouteDays(get())[1].color
    get().updatePart(selectRouteDays(get())[1].id, { color: '#123456' })
    expect(selectRouteDays(get())[1].color).toBe('#123456')
    get().undo()
    expect(selectRouteDays(get())[1].color).toBe(color)
  })

  it('replaces the whole route when a file is loaded without append', async () => {
    vi.useRealTimers()
    await get().loadGpxFile(gpx(50, 'A'))
    await get().loadGpxFile(gpx(51, 'B'), true)
    await get().loadGpxFile(gpx(52, 'C'))
    expect(selectRouteDays(get())).toHaveLength(0)
    expect(selectTrack(get())?.points).toHaveLength(3)
  })

  it('turns the track name into one centred title, styled by the template', async () => {
    vi.useRealTimers()
    const plakat = BUILT_IN_TEMPLATES.find((t) => t.id === 'plakat')!
    get().applyTemplate(plakat, { fonts: true, route: false, frame: false, colors: true, layout: false, points: false })
    await get().loadGpxFile(gpx(50, 'Sardynia'))
    await get().loadGpxFile(gpx(51, 'Dzień 2'), true)
    const titles = get().texts.filter((t) => t.role === 'title')
    expect(titles).toHaveLength(1)
    expect(titles[0]).toMatchObject({ text: 'Sardynia', x: 0, fontFamily: 'Cinzel', color: plakat.textColor, uppercase: true })

    await get().loadGpxFile(gpx(52, 'Korsyka'))
    expect(get().texts.filter((t) => t.role === 'title').map((t) => t.text)).toEqual(['Korsyka'])
  })
})

describe('photo library', () => {
  it('removes a photo and empties the slots that used it', () => {
    useAppStore.setState({ photos: [fakePhoto(1), fakePhoto(2)] })
    get().setLayout(0, 'g2h')
    get().assignPhoto(0, 0, 1)
    get().assignPhoto(0, 1, 2)
    get().removePhoto(1)
    expect(get().photos.map((p) => p.id)).toEqual([2])
    expect(get().slides[0].slots[0]).toBeUndefined()
    expect(get().slides[0].slots[1]?.photoId).toBe(2)
  })
})

describe('sub-tabs', () => {
  it('opens the page a registered element names, and the Linia page for a waypoint', () => {
    registerCanvasElement({
      kind: 'probe',
      label: 'Probe',
      meta: '',
      icon: null,
      order: 99,
      useIsAvailable: () => true,
      Node: () => null,
      Editor: () => null,
      tab: 'route',
      subTab: 'stats',
    })
    get().select({ kind: 'element', element: 'probe' })
    expect(get().activeTab).toBe('route')
    expect(get().subTabs.route).toBe('stats')
    get().addWaypoint(0)
    get().setActiveTab('media')
    get().select({ kind: 'waypoint', id: get().waypoints[0].id })
    expect(get().subTabs.route).toBe('line')
  })

  it('remembers the open page per tab', () => {
    get().setSubTab('export', 'video')
    get().setActiveTab('route')
    expect(get().subTabs.export).toBe('video')
  })
})

describe('tab switching on selection', () => {
  it('keeps a waypoint selected from Napisy in Napisy, and opens Trasa from the canvas', () => {
    get().addWaypoint(0)
    const id = get().waypoints[0].id
    get().setActiveTab('texts')
    get().select({ kind: 'waypoint', id })
    expect(get().activeTab).toBe('texts')
    get().setActiveTab('media')
    get().select({ kind: 'waypoint', id })
    expect(get().activeTab).toBe('route')
  })

  it('stays on the open tab when a photo is picked or dragged', () => {
    get().setActiveTab('route')
    get().select({ kind: 'slot', slide: 0, index: 0 })
    expect([get().activeTab, get().selection?.kind]).toEqual(['route', 'slot'])
  })
})

describe('gradient background', () => {
  it('flips text and route to dark on a light gradient and back, only when asked to', () => {
    get().updateBackground({ bgKind: 'gradient', gradient: { from: '#f8f4f4', to: '#d7d3d3' } })
    expect(get().statsStyle.color).toBe('#2d2b2b')
    expect(get().routeStyle.color).toBe('#2d2b2b')
    get().updateBackground({ gradient: { from: '#2f5a47', to: '#17302a' } })
    expect(get().statsStyle.color).toBe('#f3f2f2')
  })

  it('leaves text and route colours alone when photos cover the background', () => {
    useAppStore.setState({ photos: [fakePhoto(1)] })
    get().assignPhoto(0, 0, 1)
    const route = get().routeStyle.color
    get().updateBackground({ bgKind: 'gradient', gradient: { from: '#f8f4f4', to: '#d7d3d3' } })
    get().updateBackground({ bgKind: 'color', bgColor: '#111111' })
    expect(get().routeStyle.color).toBe(route)
  })

  it('leaves colours alone with auto contrast off', () => {
    get().updateBackground({ autoContrast: false })
    get().updateBackground({ bgKind: 'gradient', gradient: { from: '#f8f4f4', to: '#d7d3d3' } })
    expect(get().statsStyle.color).toBe(initial.statsStyle.color)
  })

  it('applies a template background', () => {
    const topo = BUILT_IN_TEMPLATES.find((t) => t.id === 'topo')!
    get().applyTemplate(topo, { fonts: false, route: false, frame: false, colors: true, layout: false, points: false })
    expect(get().collage.bgKind).toBe('gradient')
    expect(get().collage.gradient).toMatchObject({ from: topo.gradient.from, pattern: 'contours' })
  })
})

describe('persisted state migration', () => {
  const migrate = useAppStore.persist.getOptions().migrate!

  it('upgrades v2 custom templates and keeps the one-row stats header', async () => {
    const legacy = { ...BUILT_IN_TEMPLATES[0], fonts: undefined, gradient: undefined, fontFamily: 'Lora', bgColor: '#123456', statsStyle: { fontSize: 30, spacing: 40 } }
    const out = (await migrate({ statsStyle: { ...initial.statsStyle }, customTemplates: [legacy] }, 2)) as Partial<typeof initial>
    expect(out.statsStyle?.arrangement).toBe('row')
    const t = out.customTemplates![0]
    expect(t.fonts).toEqual({ title: 'Lora', data: 'Lora', note: 'Lora' })
    expect(t.gradient).toMatchObject({ from: '#123456', to: '#123456', grain: 0 })
    expect(t.statsStyle.arrangement).toBe('row')
  })
})

describe('stats header rotation', () => {
  it('is not remembered, and a rotation saved by an older version is dropped', async () => {
    get().updateStatsStyle({ rotation: 90 })
    const saved = useAppStore.persist.getOptions().partialize!(get()) as { statsStyle: Record<string, unknown> }
    expect(saved.statsStyle).not.toHaveProperty('rotation')
    const migrate = useAppStore.persist.getOptions().migrate!
    const old = (await migrate({ statsStyle: { ...initial.statsStyle, rotation: 90 } }, 3)) as { statsStyle: Record<string, unknown> }
    expect(old.statsStyle).not.toHaveProperty('rotation')
    const merged = useAppStore.persist.getOptions().merge!(old, initial) as typeof initial
    expect(merged.statsStyle.rotation).toBe(0)
  })
})

describe('stats saved before the new stats existed', () => {
  it('keeps the saved order and visibility and adds the new stats hidden at the end', () => {
    const merge = useAppStore.persist.getOptions().merge!
    const saved = { statsContent: { dayLabel: 'D', visible: { day: false, distance: true, elevation: true, time: true }, order: ['time', 'distance'] } }
    const out = merge(saved, get()) as typeof initial
    expect(out.statsContent.order).toEqual(['time', 'distance', 'day', 'elevation', 'movingTime', 'avgSpeed', 'maxElevation'])
    // A stat the saved data doesn't know takes its default: average speed is shown, moving time isn't.
    expect(out.statsContent.visible).toMatchObject({ day: false, movingTime: false, avgSpeed: true })
    expect(out.statsContent.units).toBe('metric')
  })

  it('moves a stat in the display order and can undo it', () => {
    get().moveStat('time', 0)
    expect(get().statsContent.order.slice(0, 2)).toEqual(['time', 'day'])
    get().undo()
    expect(get().statsContent.order[0]).toBe('day')
  })
})

describe('saving a template with a colour background', () => {
  it('stores the colour as a flat gradient', () => {
    get().updateBackground({ bgKind: 'color', bgColor: '#336699' })
    get().saveTemplate('Płaski')
    expect(get().customTemplates[0].gradient).toMatchObject({ from: '#336699', to: '#336699', grain: 0 })
  })
})

describe('project modes', () => {
  it('opens each mode on the tab it starts from', () => {
    get().startProject('collage')
    expect([get().mode, get().activeTab]).toEqual(['collage', 'media'])
    get().startProject('map')
    expect(get().activeTab).toBe('route')
    expect(get().subTabs.route).toBeUndefined()
    get().startProject('map', 'stops')
    expect([get().activeTab, get().subTabs.route]).toEqual(['route', 'stops'])
  })

  it('crops one selected photo, or all of them, and filling centres the photo again', () => {
    useAppStore.setState({ photos: [fakePhoto(1), fakePhoto(2)] })
    get().setLayout(0, 'g2h')
    get().assignPhoto(0, 0, 1)
    get().assignPhoto(0, 1, 2)
    get().updateSlot(0, 0, { zoom: 2, offsetX: 10 })
    get().setCrop('fit', { slide: 0, index: 1 })
    expect([get().slides[0].slots[0].crop, get().slides[0].slots[1].crop]).toEqual([undefined, 'fit'])
    get().setCrop('fill', null)
    expect(get().slides[0].slots[0]).toMatchObject({ crop: 'fill', zoom: 1, offsetX: 0 })
    expect(get().slides[0].slots[1].crop).toBe('fill')
  })
})

describe('changing the project type', () => {
  const file = new File([`<gpx><trk><name>Pętla</name><trkseg>${[0, 1, 2].map((i) => `<trkpt lat="${50 + i * 0.01}" lon="19"><ele>10</ele></trkpt>`).join('')}</trkseg></trk></gpx>`], 'petla.gpx')

  it('drops the route and its places in a collage, and one undo brings them back', async () => {
    vi.useRealTimers()
    get().startProject('map')
    await get().loadGpxFile(file)
    get().addWaypoint(1)
    get().changeMode('collage')
    expect([get().mode, get().activeTab, selectTrack(get()), get().waypoints]).toEqual(['collage', 'media', null, []])
    get().undo()
    expect([get().mode, selectTrack(get()) !== null, get().waypoints.length]).toEqual(['map', true, 1])
  })
})
