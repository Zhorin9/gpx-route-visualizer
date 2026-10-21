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
          collage = { ...collage, bgKind: 'gradient', gradient: { ...template.gradient } }
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
          ...(parts.route ? { routeStyle: { ...s.routeStyle, ...template.route } } : null),
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
        preview: {
          bg: `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})`,
          text: s.statsStyle.color,
          line: s.routeStyle.color,
          title: 'TRASA',
          titleFont: `'${titleFont}', serif`,
          titleColor,
          italic: title?.italic,
          dash: s.routeStyle.dashed,
          dotted: s.routeStyle.dotted,
          glow: s.routeStyle.glowEnabled,
          width: Math.max(1.5, s.routeStyle.coreWidth * 0.55),
          frame: s.collage.frame.enabled ? s.collage.frame.color : undefined,
        },
        custom: true,
      }
      commit('template:save', { customTemplates: [...s.customTemplates, template] })
    },

    deleteTemplate: (id) => commit('template:delete', (s) => ({ customTemplates: s.customTemplates.filter((t) => t.id !== id) })),
  }
}
