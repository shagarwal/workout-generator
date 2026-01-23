'use client'

import { useState } from 'react'
import { Plus, Save, X } from 'lucide-react'
import { WorkoutPerformance } from '@/lib/types'

interface PerformanceTrackerProps {
  exerciseName: string
  exerciseId?: string
  workoutId?: string
  onSave: (performance: Omit<WorkoutPerformance, 'id' | 'userId' | 'date'>) => Promise<void>
  onClose: () => void
}

export default function PerformanceTracker({
  exerciseName,
  exerciseId,
  workoutId,
  onSave,
  onClose,
}: PerformanceTrackerProps) {
  const [entries, setEntries] = useState<Array<{ weight: string; reps: string; sets: string }>>([
    { weight: '', reps: '', sets: '1' },
  ])
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const addEntry = () => {
    setEntries([...entries, { weight: '', reps: '', sets: '1' }])
  }

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index))
    }
  }

  const updateEntry = (index: number, field: 'weight' | 'reps' | 'sets', value: string) => {
    const newEntries = [...entries]
    newEntries[index][field] = value
    setEntries(newEntries)
  }

  const handleSave = async () => {
    // Filter out empty entries
    const validEntries = entries.filter(e => e.weight && e.reps)

    if (validEntries.length === 0) {
      alert('Please enter at least one weight and rep count')
      return
    }

    setIsSaving(true)

    try {
      // Save each entry as a separate performance record
      for (const entry of validEntries) {
        await onSave({
          exerciseName,
          exerciseId: exerciseId || null,
          weight: parseFloat(entry.weight),
          reps: parseInt(entry.reps),
          sets: parseInt(entry.sets) || 1,
          workoutId: workoutId || null,
          notes: notes || null,
        })
      }

      // Close tracker - parent will auto-expand history
      onClose()
    } catch (error) {
      console.error('Error saving performance:', error)
      alert('Failed to save performance data')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mt-3 p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-lime-400">Log Performance</h4>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={entry.weight}
                  onChange={(e) => updateEntry(index, 'weight', e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-lime-400"
                  placeholder="135"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Reps</label>
                <input
                  type="number"
                  value={entry.reps}
                  onChange={(e) => updateEntry(index, 'reps', e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-lime-400"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Sets</label>
                <input
                  type="number"
                  value={entry.sets}
                  onChange={(e) => updateEntry(index, 'sets', e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-lime-400"
                  placeholder="1"
                />
              </div>
            </div>
            {entries.length > 1 && (
              <button
                onClick={() => removeEntry(index)}
                className="mt-6 p-1.5 hover:bg-red-600 rounded transition-colors"
                aria-label="Remove entry"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addEntry}
        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        <Plus className="w-3 h-3" />
        Add another weight
      </button>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-lime-400 resize-none"
          rows={2}
          placeholder="Felt strong today..."
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-gray-900 font-bold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Saving to Account...' : 'Save to My Account'}
      </button>
    </div>
  )
}
