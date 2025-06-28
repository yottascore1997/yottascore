'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Play } from 'lucide-react'

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
}

interface StoryGroup {
  user: User
  stories: Story[]
}

interface StoryBarProps {
  onAddStory?: () => void
  onViewStory?: (storyGroup: StoryGroup) => void
  refreshTrigger?: number
}

export default function StoryBar({ onAddStory, onViewStory, refreshTrigger }: StoryBarProps) {
  const [stories, setStories] = useState<StoryGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStories()
  }, [refreshTrigger])

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/student/stories', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStories(data)
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const markStoryAsViewed = async (storyId: string) => {
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

  if (loading) {
    return (
      <div className="flex space-x-4 p-4 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="w-16 h-2 bg-gray-200 rounded mt-2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex space-x-4 p-4 overflow-x-auto bg-white border-b border-gray-200">
      {/* Add Story Button */}
      <div className="flex-shrink-0 flex flex-col items-center space-y-1">
        <Button
          onClick={onAddStory}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 p-0 border-2 border-white shadow-lg"
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>
        <span className="text-xs text-gray-600 font-medium">Add Story</span>
      </div>

      {/* Story Circles */}
      {stories.map((storyGroup) => {
        const hasUnviewedStories = storyGroup.stories.some(story => !story.isViewed)
        const latestStory = storyGroup.stories[storyGroup.stories.length - 1]
        
        return (
          <div
            key={storyGroup.user.id}
            onClick={() => onViewStory?.(storyGroup)}
            className="flex-shrink-0 flex flex-col items-center space-y-1 cursor-pointer"
          >
            <div className={`relative w-16 h-16 rounded-full p-0.5 ${
              hasUnviewedStories 
                ? 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500' 
                : 'bg-gray-300'
            }`}>
              <div className="w-full h-full rounded-full bg-white p-0.5">
                <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                  {storyGroup.user.profilePhoto ? (
                    <img
                      src={storyGroup.user.profilePhoto}
                      alt={storyGroup.user.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-white font-semibold text-lg">
                      {storyGroup.user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              {latestStory.mediaType === 'VIDEO' && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                  <Play className="w-3 h-3 text-white" />
                </div>
              )}
              {/* Story count indicator */}
              {storyGroup.stories.length > 1 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{storyGroup.stories.length}</span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-600 font-medium truncate max-w-16">
              {storyGroup.user.name}
            </span>
          </div>
        )
      })}

      {stories.length === 0 && (
        <div className="flex-shrink-0 flex flex-col items-center space-y-1">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-xs text-center">No stories</span>
          </div>
          <span className="text-xs text-gray-500">No stories yet</span>
        </div>
      )}
    </div>
  )
} 