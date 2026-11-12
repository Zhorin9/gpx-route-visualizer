import { paletteFrom } from '../../features/map/model/styles'
import { frameStyleFor } from '../../utils/layouts'
import { routeFields } from '../../utils/wrappers'
import { joinTrack } from '../derived'
import { pickDocument } from '../document'
import { NO_PHOTO_LOOK } from '../../utils/photoLook'
import { BUILT_IN_TEMPLATES } from '../../utils/templates'
import i18n from '../../i18n'
import type { GradientStyle, StyleTemplate, TemplateParts, TextNode, WrapperField } from '../../types'
import type { AppState, DocumentState, SliceContext, TemplatesSlice } from '../types'

type Look = Pick<AppState, 'collage' | 'map' | 'statsStyle' | 'titleStyle' | 'texts' | 'waypoints'>
type TemplateTarget = DocumentState & Pick<AppState, 'activeSlide'>

// A map stays the background, repainted in these colours; otherwise the gradient. Titles take `title`, the rest `text`.
function recolor(s: Look, gradient: GradientStyle, text: string, title = text): Look {
  return {
    collage: { ...s.collage, bgKind: s.collage.bgKind === 'map' ? 'map' : 'gradient', gradient },
    map: { ...s.map, palette: paletteFrom(gradient, text) },
    statsStyle: { ...s.statsStyle, color: text },
    titleStyle: { ...s.titleStyle, color: title },
    texts: s.texts.map((t) => ({ ...t, color: title })),
    waypoints: s.waypoints.map((w) => ({ ...w, color: text })),
  }
}

export const FONTS_AND_EFFECTS: TemplateParts = { fonts: true, effects: true, route: false, frame: false, colors: false, layout: false, points: false, photo: false }

export const appliedTemplate = (s: Pick<AppState, 'templateId' | 'customTemplates'>): StyleTemplate | undefined =>
  s.templateId ? [...BUILT_IN_TEMPLATES, ...s.customTemplates].find((t) => t.id === s.templateId) : undefined

// A badge, an icon or a bent caption carries its own outline and shadow, which a style's text effects leave alone.
export const isStickerPiece = (t: TextNode) => t.role !== 'title' && Boolean(t.badge || t.icon || t.warp)

// The look a template gives the document; everything else is left as it is.
export function withTemplate(s: TemplateTarget, template: StyleTemplate, parts: TemplateParts): Partial<DocumentState> {
  let statsStyle = s.statsStyle
  let collage = s.collage
  let texts = s.texts
  let waypoints = s.waypoints
  let slides = s.slides
  let titleStyle = s.titleStyle
  let map = s.map

  if (parts.fonts) {
    statsStyle = { ...statsStyle, ...template.statsStyle, fontFamily: template.fonts.data }
    titleStyle = { ...titleStyle, fontFamily: template.fonts.title, italic: template.titleItalic ?? false, uppercase: template.titleUppercase ?? false }
    texts = texts.map((t) => ({
      ...t,
      fontFamily: template.fonts.title,
      italic: template.titleItalic ?? false,
      ...(t.role === 'title' ? { uppercase: titleStyle.uppercase } : null),
    }))
    waypoints = waypoints.map((w) => ({ ...w, fontFamily: template.fonts.note }))
  }
  if (parts.colors) {
    const look = { collage, map: { ...map, labels: true, hillshade: false, ...template.map }, statsStyle, titleStyle, texts, waypoints }
    ;({ collage, map, statsStyle, titleStyle, texts, waypoints } = recolor(look, { ...template.gradient }, template.textColor, template.titleColor))
  }
  if (parts.layout) {
    const active = Math.min(s.activeSlide, slides.length - 1)
    slides = slides.map((slide, i) => (i === active ? { ...slide, layoutKey: template.layoutKey } : slide))
    collage = { ...collage, frame: { ...collage.frame, style: frameStyleFor(template.layoutKey) } }
  }
  if (parts.frame) collage = { ...collage, frame: { ...template.frame } }
  if (parts.effects) {
    const { outline, hardShadow, warp, typing } = template.titleEffect ?? {}
    texts = texts.map((t) =>
      isStickerPiece(t)
        ? t
        : {
            ...t,
            outlineEnabled: !!outline,
            ...(outline ? { outlineColor: outline.color, outlineWidth: outline.width } : null),
            hardShadow,
            typing,
            ...(t.role === 'title' ? { warp } : null),
          },
    )
    statsStyle = { ...statsStyle, hardShadow: template.statsEffect?.hardShadow, outline: template.statsEffect?.outline }
  }

  return {
    statsStyle,
    titleStyle,
    collage,
    texts,
    waypoints,
    slides,
    map,
    ...(parts.route ? { mapSticker: template.mapSticker ? { ...template.mapSticker, size: s.mapSticker.size, shown: true } : { ...s.mapSticker, shown: false } } : null),
    ...(parts.route ? { routeStyle: { ...s.routeStyle, ...template.route, casing: template.route.casing, pen: template.route.pen, echo: template.route.echo } } : null),
    ...(parts.effects ? { iconFinish: template.iconFinish ?? 'sticker', stamp: !!template.stamp, kicker: { ...s.kicker, shown: !!template.kicker } } : null),
    ...(parts.colors ? { sticker: template.sticker ? { ...template.sticker } : null } : null),
    ...(parts.photo ? { photoLook: { ...(template.photoLook ?? NO_PHOTO_LOOK) } } : null),
    ...(parts.points && template.pointStyle ? { pointStyle: { ...template.pointStyle } } : null),
  }
}

const sameValue = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b)

// Whether the look differs from what the template would give it. The layout went to one slide only,
// so the slides are left out: moving to another slide is not a change of look.
export function lookChanged(s: TemplateTarget, template: StyleTemplate, parts: TemplateParts): boolean {
  return Object.entries(withTemplate(s, template, parts)).some(([key, value]) => key !== 'slides' && !sameValue(value, s[key as keyof DocumentState]))
}

const RECENT_LIMIT = 6

export function createTemplatesSlice({ set, get, commit }: SliceContext): TemplatesSlice {
  return {
    customTemplates: [],

    templateParts: { fonts: true, route: true, frame: true, colors: true, layout: false, points: true, effects: true, photo: false },
    styleNewElements: true,
    recentTemplates: [],
    favoriteTemplates: [],
    templatePreview: null,

    applyTemplate: (template, parts) => {
      commit(`template:${template.id}`, (s) => ({ ...withTemplate(s, template, parts), templateId: template.id }))
      set((s) => ({ recentTemplates: [template.id, ...s.recentTemplates.filter((id) => id !== template.id)].slice(0, RECENT_LIMIT) }))
    },

    previewTemplate: (template) => {
      const s = get()
      const base = s.templatePreview?.base ?? pickDocument(s)
      set({ ...base, ...withTemplate({ ...s, ...base }, template, s.templateParts), templatePreview: { template, base } })
    },

    keepPreview: () => {
      const { templatePreview: preview, templateParts } = get()
      if (!preview) return
      set({ ...preview.base, templatePreview: null })
      // With no part ticked the template gives nothing, so there is nothing to keep.
      if (Object.values(templateParts).some(Boolean)) get().applyTemplate(preview.template, templateParts)
    },

    endPreview: () => {
      const preview = get().templatePreview
      if (preview) set({ ...preview.base, templatePreview: null })
    },

    setStyleNewElements: (styleNewElements) => set({ styleNewElements }),

    applyStyleEverywhere: () => {
      const template = appliedTemplate(get())
      if (template) commit(`template:${template.id}:everywhere`, (s) => withTemplate(s, template, FONTS_AND_EFFECTS))
    },

    setTemplateParts: (templateParts) => {
      set({ templateParts })
      const preview = get().templatePreview
      if (preview) get().previewTemplate(preview.template)
    },

    toggleFavoriteTemplate: (id) =>
      set((s) => ({ favoriteTemplates: s.favoriteTemplates.includes(id) ? s.favoriteTemplates.filter((f) => f !== id) : [...s.favoriteTemplates, id] })),

    // Captures the current look; photos, routes and texts are not part of it.
    saveTemplate: (name) => {
      const s = get()
      const { shape: _shape, schematicSimplify: _simplify, ...route } = s.routeStyle
      const title = s.texts.find((t) => t.role === 'title') ?? s.texts[0]
      const titleFont = title?.fontFamily ?? s.statsStyle.fontFamily
      const titleColor = title && title.color !== s.statsStyle.color ? title.color : undefined
      // Templates always carry a gradient; a plain colour background is saved as a flat one.
      const gradient = s.collage.bgKind === 'gradient' ? s.collage.gradient : { ...s.collage.gradient, from: s.collage.bgColor, to: s.collage.bgColor, grain: 0 }
      const template: StyleTemplate = {
        id: `custom-${Date.now()}`,
        name: name.trim() || i18n.t('templatesSlice.customName', { n: s.customTemplates.length + 1 }),
        desc: 'templatesSlice.customDesc',
        fonts: { title: titleFont, data: s.statsStyle.fontFamily, note: s.waypoints[0]?.fontFamily ?? s.statsStyle.fontFamily },
        titleItalic: title?.italic ?? s.titleStyle.italic,
        titleUppercase: s.titleStyle.uppercase,
        titleColor,
        statsStyle: {
          arrangement: s.statsStyle.arrangement,
          stretch: s.statsStyle.stretch,
          labels: s.statsStyle.labels,
          dividers: s.statsStyle.dividers,
          fontSize: s.statsStyle.fontSize,
          spacing: s.statsStyle.spacing,
          heroKey: s.statsStyle.heroKey,
          heroSecondary: s.statsStyle.heroSecondary,
        },
        textColor: s.statsStyle.color,
        route,
        frame: s.collage.frame,
        gradient,
        layoutKey: s.slides[Math.min(s.activeSlide, s.slides.length - 1)].layoutKey,
        pointStyle: s.pointStyle,
        titleEffect: title && {
          outline: title.outlineEnabled ? { color: title.outlineColor, width: title.outlineWidth } : undefined,
          hardShadow: title.hardShadow,
          warp: title.warp,
          typing: title.typing,
        },
        statsEffect: { outline: s.statsStyle.outline, hardShadow: s.statsStyle.hardShadow },
        iconFinish: s.iconFinish,
        photoLook: s.photoLook,
        ...(s.sticker ? { sticker: s.sticker } : null),
        ...(s.collage.bgKind === 'map' ? { map: { styleId: s.map.styleId, hillshade: s.map.hillshade, labels: s.map.labels } } : null),
        custom: true,
      }
      set({ customTemplates: [...s.customTemplates, template] })
    },

    // The accent outlines the route (the glow decides whether the outline shows) and is the map's water.
    applyPhotoTheme: (theme) =>
      commit('photoTheme', (s) => {
        const look = recolor(s, { ...s.collage.gradient, from: theme.bg, to: theme.bg }, theme.text)
        return {
          ...look,
          map: { ...look.map, palette: look.map.palette && { ...look.map.palette, water: theme.accent } },
          routeStyle: { ...s.routeStyle, color: theme.route, glowColor: theme.accent },
        }
      }),

    setWrapper: (id) =>
      commit('wrapper:id', (s) => {
        const joined = joinTrack(s.routeSource, s.trackCache)
        const auto = routeFields(s.routeSource?.name ?? null, joined?.track.points ?? null, joined?.parts ?? [], s.waypoints)
        const fields = { ...s.wrapper.fields }
        for (const key of Object.keys(fields) as WrapperField[]) fields[key] ||= auto[key]
        return { wrapper: { ...s.wrapper, id, fields } }
      }),

    updateWrapper: ({ fields, postmark }) =>
      commit('wrapper', (s) => ({ wrapper: { ...s.wrapper, fields: { ...s.wrapper.fields, ...fields }, postmark: { ...s.wrapper.postmark, ...postmark } } })),

    deleteTemplate: (id) => set((s) => ({ customTemplates: s.customTemplates.filter((t) => t.id !== id) })),
  }
}
