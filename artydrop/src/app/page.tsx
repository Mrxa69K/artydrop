'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Button, Input, Progress } from '@nextui-org/react'

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [galleryName, setGalleryName] = useState('')
  const [photographerName, setPhotographerName] = useState('')
  const [brandColor, setBrandColor] = useState('#0070f3')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files))
    }
  }

  const createGallery = async () => {
    if (!galleryName || !photographerName || files.length === 0) {
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Créer la galerie
      const { data: gallery, error: galleryError } = await supabase
        .from('galleries')
        .insert({
          name: galleryName,
          photographer_name: photographerName,
          brand_color: brandColor,
          photo_count: files.length
        })
        .select()
        .single()

      if (galleryError) throw galleryError

      // Upload des photos avec progress
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = `${gallery.id}/${Date.now()}-${i}-${file.name}`
        
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        await supabase.from('photos').insert({
          gallery_id: gallery.id,
          filename: file.name,
          storage_path: fileName
        })

        setUploadProgress(((i + 1) / files.length) * 100)
      }

      router.push(`/gallery/${gallery.id}`)

    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      {/* Header */}
      <div className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ArtDrop</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Professional Gallery Platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Create Beautiful
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Photo Galleries</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Professional photo delivery platform for photographers. Upload, customize, and share your work with clients seamlessly.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Upload Section */}
          <Card className="p-8 shadow-2xl border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md">
            <CardHeader className="pb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Your Photos</h2>
                <p className="text-gray-600 dark:text-gray-300">Drag and drop your images or click to select</p>
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Drop Zone */}
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 cursor-pointer group"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📸</div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Drop your photos here
                </p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">or</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input">
                  <Button 
                    as="span"
                    color="primary" 
                    size="lg" 
                    className="cursor-pointer font-semibold"
                  >
                    Select Files
                  </Button>
                </label>
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 dark:text-white mb-3">
                    {files.length} files selected
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {files.slice(0, 8).map((file, index) => (
                      <div key={index} className="aspect-square bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 p-2 text-center">
                        {file.name.substring(0, 8)}...
                      </div>
                    ))}
                    {files.length > 8 && (
                      <div className="aspect-square bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                        +{files.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Configuration Section */}
          <Card className="p-8 shadow-2xl border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md">
            <CardHeader className="pb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gallery Settings</h2>
                <p className="text-gray-600 dark:text-gray-300">Customize your gallery appearance</p>
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              <Input
                label="Gallery Name"
                placeholder="e.g., Sarah & Tom Wedding"
                value={galleryName}
                onChange={(e) => setGalleryName(e.target.value)}
                size="lg"
                classNames={{
                  input: "text-lg",
                  label: "text-gray-700 dark:text-gray-300 font-medium"
                }}
              />

              <Input
                label="Photographer Name"
                placeholder="e.g., John Smith Photography"
                value={photographerName}
                onChange={(e) => setPhotographerName(e.target.value)}
                size="lg"
                classNames={{
                  input: "text-lg",
                  label: "text-gray-700 dark:text-gray-300 font-medium"
                }}
              />

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-3">
                  Brand Color
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-16 h-16 rounded-xl border-4 border-gray-200 dark:border-gray-600 cursor-pointer"
                  />
                  <div 
                    className="flex-1 h-16 rounded-xl border-4 border-gray-200 dark:border-gray-600"
                    style={{ backgroundColor: brandColor }}
                  ></div>
                </div>
              </div>

              {uploading && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Uploading...</span>
                    <span className="text-gray-600 dark:text-gray-300">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress 
                    value={uploadProgress} 
                    color="primary"
                    className="w-full"
                  />
                </div>
              )}

              <Button
                onClick={createGallery}
                disabled={uploading || !galleryName || !photographerName || files.length === 0}
                color="primary"
                size="lg"
                className="w-full font-semibold text-lg h-14"
                isLoading={uploading}
              >
                {uploading ? 'Creating Gallery...' : 'Create Professional Gallery'}
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-24">
          <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Choose ArtDrop?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-0">
              <CardBody className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lightning Fast</h4>
                <p className="text-gray-600 dark:text-gray-300">Create galleries in under 3 minutes</p>
              </CardBody>
            </Card>
            <Card className="p-6 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-0">
              <CardBody className="text-center">
                <div className="text-4xl mb-4">🎨</div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Professional Design</h4>
                <p className="text-gray-600 dark:text-gray-300">Beautiful, branded galleries for your clients</p>
              </CardBody>
            </Card>
            <Card className="p-6 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-0">
              <CardBody className="text-center">
                <div className="text-4xl mb-4">💰</div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pay Per Use</h4>
                <p className="text-gray-600 dark:text-gray-300">No monthly fees, pay only when you deliver</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
