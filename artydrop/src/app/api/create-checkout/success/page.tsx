'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardBody, Button, Chip } from '@nextui-org/react'
import Link from 'next/link'

interface Gallery {
  id: string
  name: string
  photographer_name: string
  photo_count: number
}

interface Photo {
  id: string
  storage_path: string
  filename: string
}

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const galleryId = searchParams.get('gallery_id')
  const sessionId = searchParams.get('session_id')
  
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (galleryId) {
      loadGalleryData()
      markAsPaid()
    }
  }, [galleryId])

  const loadGalleryData = async () => {
    try {
      const { data: galleryData } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', galleryId)
        .single()

      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryId)

      setGallery(galleryData)
      setPhotos(photosData || [])
    } catch (error) {
      console.error('Error loading gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async () => {
    try {
      await supabase
        .from('galleries')
        .update({ price_paid: true })
        .eq('id', galleryId)
    } catch (error) {
      console.error('Error marking as paid:', error)
    }
  }

  const downloadAllPhotos = async () => {
    setDownloading(true)
    
    try {
      // Créer un zip avec toutes les photos
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      for (const photo of photos) {
        try {
          const { data } = supabase.storage
            .from('photos')
            .getPublicUrl(photo.storage_path)
          
          const response = await fetch(data.publicUrl)
          const blob = await response.blob()
          zip.file(photo.filename, blob)
        } catch (error) {
          console.error(`Error downloading ${photo.filename}:`, error)
        }
      }

      const content = await zip.generateAsync({ type: 'blob' })
      
      // Télécharger le zip
      const url = window.URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${gallery?.name || 'gallery'}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Error creating zip:', error)
      alert('Erreur lors du téléchargement. Veuillez réessayer.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <Card className="p-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-0 shadow-2xl">
          <CardBody className="text-center">
            <div className="animate-spin text-6xl mb-6">⏳</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Processing Payment...</h2>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      {/* Header */}
      <div className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">ArtDrop</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Payment Successful</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Success Message */}
        <Card className="p-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-0 shadow-2xl mb-12">
          <CardBody className="text-center">
            <div className="text-8xl mb-6">🎉</div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              Thank you for your purchase. Your photos are ready for download.
            </p>
            
            {gallery && (
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Chip size="lg" color="primary" variant="flat">
                  📸 {gallery.name}
                </Chip>
                <Chip size="lg" color="secondary" variant="flat">
                  👨‍🎨 {gallery.photographer_name}
                </Chip>
                <Chip size="lg" color="success" variant="flat">
                  ✅ {photos.length} photos
                </Chip>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={downloadAllPhotos}
                color="primary"
                size="lg"
                className="font-bold text-lg h-16 px-12"
                isLoading={downloading}
                startContent={!downloading ? <span className="text-2xl">📥</span> : undefined}
              >
                {downloading ? 'Creating Download...' : 'Download All Photos'}
              </Button>
              
              <Button
                as={Link}
                href={`/gallery/${galleryId}`}
                variant="bordered"
                size="lg"
                className="font-bold text-lg h-16 px-12"
                startContent={<span className="text-2xl">👁️</span>}
              >
                View Gallery Again
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Transaction Details */}
        <Card className="p-8 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-0">
          <CardBody>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Transaction Details
            </h3>
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <p><strong>Session ID:</strong> {sessionId}</p>
              <p><strong>Gallery ID:</strong> {galleryId}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
