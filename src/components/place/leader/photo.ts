import type { Box } from '../../../utils/geometry'

export const intoPhotoMiddle = (photo: Box): [number, number] => [photo.x + photo.w / 2, photo.y + photo.h / 2]
