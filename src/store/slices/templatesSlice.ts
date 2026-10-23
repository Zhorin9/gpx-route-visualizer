import { paletteFrom } from '../../features/map/model/styles'
import { frameStyleFor } from '../../utils/layouts'
import type { StyleTemplate } from '../../types'
import type { SliceContext, TemplatesSlice } from '../types'

export function createTemplatesSlice({ get, commit }: SliceContext): TemplatesSlice {
  return {
    customTemplates: [],

    applyTemplate: (template, parts) =>
      commit(`template:${template.id}`, (s) => {
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
          // A map stays the background, repainted in the template's colours; otherwise the template's gradient.
          const onMap = collage.bgKind === 'map'
          collage = { ...collage, bgKind: onMap ? 'map' : 'gradient', gradient: { ...template.gradient } }
          map = { ...map, labels: true, hillshade: false, ...template.map, palette: paletteFrom(template.gradient, template.textColor) }
          statsStyle = { ...statsStyle, color: template.textColor }
          titleStyle = { ...titleStyle, color: template.titleColor ?? template.textColor }
          texts = texts.map((t) => ({ ...t, color: template.titleColor ?? template.textColor }))
          waypoints = waypoints.map((w) => ({ ...w, color: template.textColor }))
        }
        if (parts.layout) {
          const active = Math.min(s.activeSlide, slides.length - 1)
          slides = slides.map((slide, i) => (i === active ? { ...slide, layoutKey: template.layoutKey } : slide))
          collage = { ...collage, frame: { ...collage.frame, style: frameStyleFor(template.layoutKey) } }
        }
        if (parts.frame) collage = { ...collage, frame: { ...template.frame } }

        return {
          statsStyle,
          titleStyle,
          collage,
          texts,
          waypoints,
          slides,
          map,
          ...(parts.route ? { routeStyle: { ...s.routeStyle, ...template.route } } : null),
          ...(parts.points && template.pointStyle ? { pointStyle: { ...template.pointStyle } } : null),
        }
      }),

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
        name: name.trim() || `Własny ${s.customTemplates.length + 1}`,
        desc: 'Zapisany własny styl',
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
        ...(s.collage.bgKind === 'map' ? { map: { styleId: s.map.styleId, hillshade: s.map.hillshade, labels: s.map.labels } } : null),
        custom: true,
      }
      commit('template:save', { customTemplates: [...s.customTemplates, template] })
    },

    deleteTemplate: (id) => commit('template:delete', (s) => ({ customTemplates: s.customTemplates.filter((t) => t.id !== id) })),
  }
}
