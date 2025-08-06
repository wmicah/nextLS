import { useState } from "react"
import { X } from "lucide-react"

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onAddClient: (client: { name: string; email: string; phone?: string }) => void
}

export default function AddClientModal({
  isOpen,
  onClose,
  onAddClient,
}: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddClient(formData)
    setFormData({ name: "", email: "", phone: "" })
    onClose()
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-gray-800 rounded-lg p-6 w-full max-w-md'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-white'>Add New Client</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='space-y-4'
        >
          <div>
            <label className='block text-sm text-gray-400 mb-1'>Name</label>
            <input
              type='text'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className='w-full p-2 bg-gray-700 border border-gray-600 rounded text-white'
              required
            />
          </div>

          <div>
            <label className='block text-sm text-gray-400 mb-1'>Email</label>
            <input
              type='email'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className='w-full p-2 bg-gray-700 border border-gray-600 rounded text-white'
              required
            />
          </div>

          <div>
            <label className='block text-sm text-gray-400 mb-1'>
              Phone (optional)
            </label>
            <input
              type='tel'
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className='w-full p-2 bg-gray-700 border border-gray-600 rounded text-white'
            />
          </div>

          <div className='flex gap-2 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 py-2 bg-gray-600 text-white rounded hover:bg-gray-500'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='flex-1 py-2 bg-orange-500 text-white rounded hover:bg-orange-600'
            >
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
