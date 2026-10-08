import { useEffect, useId, useRef, useState } from 'react'
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { mediaUrl } from '../../utils/format'

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX = 3 * 1024 * 1024

/**
 * Image picker with preview and client-side type/size checks
 * (the API validates again, including the file signature).
 */
export default function ImageUpload({ label = 'Image', value, file, onFile, onRemove, error }) {
  const id = useId()
  const inputRef = useRef(null)
  const [preview, setPreview] = useState('')
  const [localError, setLocalError] = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!file) return setPreview('')
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = (f) => {
    if (!f) return
    if (!TYPES.includes(f.type)) return setLocalError('Please choose a JPG, PNG, WEBP or AVIF image.')
    if (f.size > MAX) return setLocalError('Image must be 3 MB or smaller.')
    setLocalError('')
    onFile(f)
  }

  const src = preview || mediaUrl(value)
  const message = localError || error

  return (
    <div>
      <p id={`${id}-label`} className="mb-2 text-[13px] font-semibold">
        {label}
      </p>
      {src ? (
        <div className="group relative overflow-hidden rounded-[20px] border border-border bg-muted">
          <img src={src} alt="Selected preview" className="aspect-[16/10] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-text/60 to-transparent p-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12px] font-semibold text-text hover:bg-secondary"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Replace
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={() => {
                  onFile(null)
                  onRemove()
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          aria-labelledby={`${id}-label`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            pick(e.dataTransfer.files?.[0])
          }}
          className={`flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed px-4 text-center transition ${
            dragging ? 'border-primary bg-secondary/50' : message ? 'border-red-300 bg-red-50/40' : 'border-border bg-muted/50 hover:border-primary hover:bg-secondary/30'
          }`}
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-primary shadow-sm">
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-[14px] font-semibold">Click to upload or drag an image here</span>
          <span className="text-[12px] text-text-soft">JPG, PNG, WEBP or AVIF &middot; max 3 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {message && (
        <p role="alert" className="mt-1.5 pl-1 text-[12px] font-medium text-red-600">
          {message}
        </p>
      )}
    </div>
  )
}
