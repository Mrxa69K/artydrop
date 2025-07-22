'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardBody, Button, Image, Chip, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@nextui-org/react'
import { stripePromise } from '@/lib/stripe'

interface Gallery {
  id: string
  name: string
  photographer_name: string
  brand_color: string
  photo_count: number
  created_at: string
}

interface Photo {
  id: string
  filename: string
  storage_path: string
}

export default function GalleryPage() {
  const params = useParams()
  const galleryId = params.id as string
  
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const {isOpen, onOpen, onClose} = useDisclosure()

  useEffect(() => {
    loadGallery()
  }, [galleryId])

  const loadGallery = async () => {
    try {
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', galleryId)
        .single()

      if (galleryError) {
        setError('Gallery not found')
        return
      }

      setGallery(galleryData)

      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('created_at', { ascending: true })

      if (photosError) {
        console.error('Photos error:', photosError)
        return
      }

      setPhotos(photosData || [])

    } catch (error) {
      console.error('Error:', error)
      setError('Loading error')
    } finally {
      setLoading(false)
    }
  }

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(storagePath)
    return data.publicUrl
  }

// Remplacez la fonction handleDownload existante par celle-ci :
const handleDownload = async () => {
  if (!gallery) return

  try {
    const price = getPrice(photos.length)
    
    // Créer la session Stripe
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        galleryId: gallery.id,
        galleryName: gallery.name,
        photographerName: gallery.photographer_name,
        photoCount: photos.length,
        price: price,
      }),
    })

    const { sessionId, error } = await response.json()

    if (error) {
      alert('Erreur lors de la création du paiement: ' + error)
      return
    }

    // Rediriger vers Stripe Checkout
    const stripe = await stripePromise
    if (stripe) {
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      })

      if (error) {
        alert('Erreur Stripe: ' + error.message)
      }
    }
  } catch (error) {
    console.error('Payment error:', error)
    alert('Erreur lors du paiement. Veuillez réessayer.')
  }
}

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard! 📋')
  }

  const openLightbox = (photoUrl: string) => {
    setSelectedPhoto(photoUrl)
    onOpen()
  }

  const getPrice = (photoCount: number) => {
    if (photoCount <= 50) return 3
    if (photoCount <= 150) return 5
    return 8
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <Card className="p-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-0 shadow-2xl">
          <CardBody className="text-center">
            <div className="animate-spin text-6xl mb-6">📸</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Gallery</h2>
            <p className="text-gray-600 dark:text-gray-300">Preparing your photos...</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <Card className="p-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-0 shadow-2xl">
          <CardBody className="text-center">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Gallery Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300">This gallery may have been moved or deleted.</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">ArtDrop</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Professional Gallery</p>
              </div>
            </div>
            <Chip 
              color="primary" 
              variant="flat"
              className="font-semibold"
            >
              {photos.length} Photos
            </Chip>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div 
        className="relative py-24 px-6 text-center text-white overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${gallery.brand_color}dd 0%, ${gallery.brand_color} 50%, #1e293b 100%)` 
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {gallery.name}
          </h1>
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-0.5 bg-white/60"></div>
            <span className="mx-4 text-xl italic">by</span>
            <div className="w-16 h-0.5 bg-white/60"></div>
          </div>
          <p className="text-2xl font-light mb-8 opacity-90">
            {gallery.photographer_name}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Chip 
              size="lg" 
              className="bg-white/20 text-white font-semibold"
            >
              📅 {new Date(gallery.created_at).toLocaleDateString()}
            </Chip>
            <Chip 
              size="lg" 
              className="bg-white/20 text-white font-semibold"
            >
              📸 {photos.length} memories captured
            </Chip>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <Button
            onClick={handleDownload}
            color="primary"
            size="lg"
            className="font-bold text-lg h-16 px-12 shadow-2xl"
            startContent={<span className="text-2xl">💎</span>}
          >
            Download All Photos (€{getPrice(photos.length)})
          </Button>
          
          <Button
            onClick={copyLink}
            variant="bordered"
            size="lg"
            className="font-bold text-lg h-16 px-12 border-2"
            startContent={<span className="text-2xl">📤</span>}
          >
            Share Gallery
          </Button>
        </div>

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <Card className="p-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-0 shadow-xl">
            <CardBody className="text-center">
              <div className="text-8xl mb-6">📷</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Photos Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                This gallery is waiting for its first memories to be uploaded.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {photos.map((photo, index) => (
              <Card 
                key={photo.id} 
                className="group cursor-pointer hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md"
                isPressable
                onPress={() => openLightbox(getPhotoUrl(photo.storage_path))}
              >
                <CardBody className="p-0">
                  <div className="aspect-square overflow-hidden rounded-xl">
                    <Image
                      src={getPhotoUrl(photo.storage_path)}
                      alt={photo.filename}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white font-semibold text-sm truncate">
                        {photo.filename.replace(/\.[^/.]+$/, "")}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="5xl"
        classNames={{
          backdrop: "bg-black/80 backdrop-blur-sm",
          base: "bg-transparent shadow-none",
          body: "p-0",
        }}
      >
        <ModalContent>
          <ModalBody>
            {selectedPhoto && (
              <div className="relative">
                <Image
                  src={selectedPhoto}
                  alt="Full size photo"
                  className="w-full h-auto max-h-[90vh] object-contain"
                />
                <Button
                  isIconOnly
                  className="absolute top-4 right-4 bg-black/50 text-white"
                  onPress={onClose}
                >
                  ✕
                </Button>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Footer */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">ArtDrop</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Professional photo delivery platform
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            "Where every photo tells a story"
          </p>
        </div>
      </div>
    </div>
  )
}
