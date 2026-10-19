import { layoutDef } from '../../utils/layouts'
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

        if (parts.fonts) {
          statsStyle = { ...statsStyle, ...template.statsStyle, fontFamily: template.fontFamily }
          texts = texts.map((t) => ({ ...t, fontFamily: template.fontFamily }))
          waypoints = waypoints.map((w) => ({ ...w, fontFamily: template.fontFamily }))
        }
        if (parts.colors) {
          collage = { ...collage, bgColor: template.bgColor }
          statsStyle = { ...statsStyle, color: template.textColor }
          texts = texts.map((t) => ({ ...t, color: template.textColor }))
        }
        if (parts.layout) {
          const active = Math.min(s.activeSlide, slides.length - 1)
          slides = slides.map((slide, i) => (i === active ? { ...slide, layoutKey: template.layoutKey } : slide))
          collage = { ...collage, frame: { ...collage.frame, style: layoutDef(template.layoutKey).group === 'creative' ? 'polaroid' : 'equal' } }
        }
        if (parts.frame) collage = { ...collage, frame: { ...template.frame } }

        return {
          statsStyle,
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
      const template: StyleTemplate = {
        id: `custom-${Date.now()}`,
        name: name.trim() || `Własny ${s.customTemplates.length + 1}`,
        desc: 'Zapisany własny styl',
        fontFamily: s.statsStyle.fontFamily,
        statsStyle: { fontSize: s.statsStyle.fontSize, spacing: s.statsStyle.spacing },
        textColor: s.statsStyle.color,
        route,
        frame: s.collage.frame,
        bgColor: s.collage.bgColor,
        layoutKey: s.slides[Math.min(s.activeSlide, s.slides.length - 1)].layoutKey,
        preview: {
          bg: s.collage.bgColor,
          text: s.statsStyle.color,
          line: s.routeStyle.color,
          title: 'TRASA',
          titleFont: `'${s.statsStyle.fontFamily}', serif`,
          dash: s.routeStyle.dashed,
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
