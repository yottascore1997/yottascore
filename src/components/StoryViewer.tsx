'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Share2, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

interface User {
  id: string
  name: string
  profilePhoto: string | null
}

interface Story {
  id: string
  mediaUrl: string
  mediaType: 'IMAGE' | 'VIDEO'
  caption?: string
  createdAt: string
  isViewed: boolean
  isLiked?: boolean
  likeCount?: number
}

interface StoryGroup {
  user: User
  stories: Story[]
}

interface StoryViewerProps {
  storyGroup: StoryGroup | null
  onClose: () => void
  onNext?: () => void
  onPrevious?: () => void
}

export default function StoryViewer({ 
  storyGroup, 
  onClose, 
  onNext, 
  onPrevious 
}: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentStory = storyGroup?.stories[currentStoryIndex]
  const totalStories = storyGroup?.stories.length || 0

  useEffect(() => {
    if (!storyGroup) return

    // Initialize like state
    if (currentStory) {
      setIsLiked(currentStory.isLiked || false)
      setLikeCount(currentStory.likeCount || 0)
    }

    // Mark current story as viewed
    markStoryAsViewed(currentStory?.id)

    // Start progress timer
    startProgressTimer()

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [storyGroup, currentStoryIndex])

  const markStoryAsViewed = async (storyId?: string) => {
    if (!storyId) return
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await fetch('/api/student/stories/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ storyId })
      })
    } catch (error) {
      console.error('Error marking story as viewed:', error)
    }
  }

  const startProgressTimer = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }

    setProgress(0)
    
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextStory()
          return 0
        }
        return prev + 2 // 5 seconds = 100% progress, so 2% every 100ms
      })
    }, 100)
  }

  const pauseProgress = () => {
    setIsPaused(true)
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  const resumeProgress = () => {
    setIsPaused(false)
    startProgressTimer()
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  const nextStory = () => {
    if (currentStoryIndex < totalStories - 1) {
      setCurrentStoryIndex(prev => prev + 1)
    } else {
      onNext?.()
    }
  }

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1)
    } else {
      onPrevious?.()
    }
  }

  const handleLike = async () => {
    if (!currentStory) return

    const newLikeState = !isLiked
    setIsLiked(newLikeState)
    setLikeCount(prev => newLikeState ? prev + 1 : prev - 1)

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const method = newLikeState ? 'POST' : 'DELETE'
      await fetch(`/api/student/stories/${currentStory.id}/like`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert on error
      setIsLiked(!newLikeState)
      setLikeCount(prev => !newLikeState ? prev + 1 : prev - 1)
    }
  }

  const handleShare = async () => {
    if (!currentStory) return

    try {
      // Copy story URL to clipboard
      const storyUrl = `${window.location.origin}/student/stories/${currentStory.id}`
      await navigator.clipboard.writeText(storyUrl)
      
      // Show success message (you can add a toast notification here)
      alert('Story link copied to clipboard!')
    } catch (error) {
      console.error('Error sharing story:', error)
    }
  }

  const handleVideoLoad = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play()
    }
  }

  const handleVideoEnded = () => {
    nextStory()
  }

  if (!storyGroup || !currentStory) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onMouseEnter={pauseProgress}
      onMouseLeave={resumeProgress}
    >
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex space-x-1">
          {storyGroup.stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-100 ${
                  index < currentStoryIndex 
                    ? 'bg-white' 
                    : index === currentStoryIndex 
                    ? 'bg-white' 
                    : 'bg-gray-400'
                }`}
                style={{
                  width: index === currentStoryIndex ? `${progress}%` : 
                         index < currentStoryIndex ? '100%' : '0%'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-16 left-4 right-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              {storyGroup.user.profilePhoto ? (
                <img
                  src={storyGroup.user.profilePhoto}
                  alt={storyGroup.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {storyGroup.user.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold">{storyGroup.user.name}</h3>
              <p className="text-gray-300 text-sm">
                {new Date(currentStory.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} • {totalStories} {totalStories === 1 ? 'story' : 'stories'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleLike}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              {likeCount > 0 && (
                <span className="ml-1 text-sm">{likeCount}</span>
              )}
            </Button>
            
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={previousStory}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full p-2"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextStory}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full p-2"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Story Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentStory.mediaType === 'IMAGE' ? (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-w-full max-h-full object-contain"
            onMouseEnter={pauseProgress}
            onMouseLeave={resumeProgress}
          />
        ) : (
          <video
            ref={videoRef}
            src={currentStory.mediaUrl}
            className="max-w-full max-h-full object-contain"
            onLoadedData={handleVideoLoad}
            onEnded={handleVideoEnded}
            onPause={pauseProgress}
            onPlay={resumeProgress}
            controls={false}
            autoPlay
            muted
          />
        )}
        
        {/* Caption Overlay */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-4 right-4">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white text-center">{currentStory.caption}</p>
            </div>
          </div>
        )}
      </div>

      {/* Story Counter */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="flex items-center space-x-2 text-white text-sm">
          <Clock className="w-4 h-4" />
          <span>{currentStoryIndex + 1} / {totalStories}</span>
        </div>
      </div>

      {/* Pause Indicator */}
      {isPaused && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <p className="text-white text-sm">Paused</p>
          </div>
        </div>
      )}
    </div>
  )
} 