'use client'

import { useEffect, useState } from 'react'
import { History, TrendingUp, Trash2, X } from 'lucide-react'
import { ExerciseHistory as ExerciseHistoryType, ExerciseHistoryEntry } from '@/lib/types'

interface ExerciseHistoryProps {
  exerciseName: string
  onClose: () => void
  onDeleteEntry?: (entryId: string) => Promise<void>
  onAddNew?: () => void
}

export default function ExerciseHistory({
  exerciseName,
  onClose,
  onDeleteEntry,
  onAddNew,
}: ExerciseHistoryProps) {
  const [history, setHistory] = useState<ExerciseHistoryType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [exerciseName])

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `/api/performance?exerciseName=${encodeURIComponent(exerciseName)}`
      )

      if (!response.ok) {
        if (response.status === 401) {
          // User not logged in
          setHistory(null)
          return
        }
        throw new Error('Failed to fetch history')
      }

      const data = await response.json()
      setHistory(data)
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!onDeleteEntry) return

    const confirmed = confirm('Delete this performance entry?')
    if (!confirmed) return

    setDeletingId(entryId)
    try {
      await onDeleteEntry(entryId)
      // Refresh history
      await fetchHistory()
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Failed to delete entry')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="mt-3 p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          <h4 className="font-bold text-blue-400">Performance History</h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !history || history.topWeights.length === 0 ? (
        <>
          <div className="text-center py-4">
            <p className="text-sm text-gray-400">No performance data yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Log your first workout to track progress
            </p>
          </div>

          {/* Add New Entry Button */}
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-lime-400 to-lime-500 text-gray-900 rounded-lg font-bold hover:from-lime-500 hover:to-lime-600 transition-all shadow-lg"
            >
              <TrendingUp className="w-4 h-4" />
              Add New Entry
            </button>
          )}
        </>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-900 rounded-lg">
            <div>
              <p className="text-xs text-gray-400">Personal Record</p>
              <p className="text-lg font-bold text-lime-400">
                {history.personalRecord} lbs
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Sessions</p>
              <p className="text-lg font-bold text-blue-400">
                {history.totalSessions}
              </p>
            </div>
          </div>

          {/* Top 5 Weights */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-lime-400" />
              <h5 className="text-sm font-bold text-gray-200">
                Top 5 Highest Weights
              </h5>
            </div>

            <div className="space-y-2">
              {history.topWeights.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 bg-gray-900 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0
                          ? 'bg-yellow-500 text-gray-900'
                          : index === 1
                          ? 'bg-gray-400 text-gray-900'
                          : index === 2
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {entry.weight} lbs
                        <span className="text-gray-400 font-normal ml-2">
                          × {entry.reps} reps
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.sets} {entry.sets === 1 ? 'set' : 'sets'} •{' '}
                        {formatDate(entry.date)}
                      </p>
                    </div>
                  </div>
                  {onDeleteEntry && (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-1.5 hover:bg-red-600/20 hover:text-red-400 text-gray-500 rounded transition-colors disabled:opacity-50"
                      aria-label="Delete entry"
                    >
                      {deletingId === entry.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add New Entry Button */}
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-lime-400 to-lime-500 text-gray-900 rounded-lg font-bold hover:from-lime-500 hover:to-lime-600 transition-all shadow-lg"
            >
              <TrendingUp className="w-4 h-4" />
              Add New Entry
            </button>
          )}
        </>
      )}
    </div>
  )
}
