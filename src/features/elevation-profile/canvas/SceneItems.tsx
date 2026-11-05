import { Circle, Line, Text } from 'react-konva'
import { SOFT_SHADOW } from '../../../core/canvas/shadows'
import { isText, type SceneItem } from './scene'

interface SceneItemsProps {
  items: SceneItem[]
  color: string
  fontFamily: string
  fontStyle: string
}

function SceneNode({ item, color, fontFamily, fontStyle }: Omit<SceneItemsProps, 'items'> & { item: SceneItem }) {
  if (item.kind === 'line') return <Line points={item.points} stroke={color} strokeWidth={item.width} opacity={item.opacity} listening={false} />
  if (item.kind === 'dot') return <Circle x={item.x} y={item.y} radius={item.radius} fill={item.fill} stroke={color} strokeWidth={3} listening={false} {...SOFT_SHADOW} />
  return (
    <Text
      text={item.text}
      x={item.x}
      y={item.y}
      fontSize={item.size}
      fontFamily={fontFamily}
      fontStyle={fontStyle}
      fill={color}
      opacity={item.opacity ?? 1}
      listening={false}
      perfectDrawEnabled={false}
      {...SOFT_SHADOW}
    />
  )
}

export default function SceneItems({ items, ...look }: SceneItemsProps) {
  const marksUnderLabels = [...items.filter((i) => !isText(i)), ...items.filter(isText)]
  return marksUnderLabels.map((item) => <SceneNode key={item.key} item={item} {...look} />)
}
