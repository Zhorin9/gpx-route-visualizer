import { useEffect, useRef } from 'react'
import useGpxImport from '../hooks/useGpxImport'
import { useAppStore } from '../store/useAppStore'

export default function PhotoPicker() {
  const request = useAppStore((s) => s.photoRequest)
  const requestPhoto = useAppStore((s) => s.requestPhoto)
  const { importFiles } = useGpxImport()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (request) inputRef.current?.click()
  }, [request])

  useEffect(() => {
    const input = inputRef.current
    const cancel = () => requestPhoto(null)
    input?.addEventListener('cancel', cancel)
    return () => input?.removeEventListener('cancel', cancel)
  }, [requestPhoto])

  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple
      hidden
      onChange={(e) => {
        if (e.target.files?.length && request) importFiles(e.target.files, request)
        requestPhoto(null)
        e.target.value = ''
      }}
    />
  )
}
