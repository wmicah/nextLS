"use client"

import { X } from "lucide-react"

interface DeleteClientModalProps {
  isOpen: boolean
  clientName: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

export default function DeleteClientModal({
  isOpen,
  clientName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteClientModalProps) {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 w-full max-w-md mx-4'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-bold text-white'>Delete Client</h3>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className='text-gray-400 hover:text-white transition'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <p className='text-gray-300 mb-6'>
          Are you sure you want to delete{" "}
          <span className='font-semibold text-white'>{clientName}</span>? This
          action cannot be undone.
        </p>

        <div className='flex gap-3'>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className='flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className='flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2'
          >
            {isDeleting ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
