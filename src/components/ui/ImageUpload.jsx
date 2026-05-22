import { useState, useRef } from 'react'
import { FiUpload, FiImage, FiX, FiLoader } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function ImageUpload({ 
  value, 
  onChange, 
  placeholder = "Chọn ảnh từ máy tính", 
  className = "",
  accept = "image/*"
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || '')
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh!')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB!')
      return
    }

    try {
      setUploading(true)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        onChange(data.imageUrl)
        setPreview(data.imageUrl)
        toast.success('Upload ảnh thành công!')
      } else {
        throw new Error(data.message || 'Lỗi upload ảnh')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Lỗi upload ảnh')
      setPreview(value || '')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview('')
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-700"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClick}
              disabled={uploading}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
              title="Thay đổi ảnh"
            >
              <FiUpload className="text-lg" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
              title="Xóa ảnh"
            >
              <FiX className="text-lg" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
              <div className="flex items-center gap-2 text-white">
                <FiLoader className="animate-spin" />
                <span className="text-sm font-medium">Đang upload...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <FiLoader className="text-2xl text-gray-400 animate-spin" />
              <span className="text-sm font-medium text-gray-500">Đang upload...</span>
            </>
          ) : (
            <>
              <FiImage className="text-3xl text-gray-400 group-hover:text-primary-500 transition-colors" />
              <div className="text-center">
                <p className="font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-500 transition-colors">
                  {placeholder}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, GIF tối đa 5MB
                </p>
              </div>
            </>
          )}
        </button>
      )}
    </div>
  )
}