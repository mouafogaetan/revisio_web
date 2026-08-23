import React, { useEffect, useState } from 'react'
import { getContact } from '@/services/api'
import { Contact } from '@/types/classeTypes'
import { Loader2, Mail, Phone } from 'lucide-react'

export const ContactScreen: React.FC = () => {
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContact = async () => {
      try {
        setLoading(true)
        const data = await getContact()
        setContact(data)
      } catch (err) {
        setError('Impossible de charger les contacts')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadContact()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement des contacts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Contactez-nous</h2>
      <p className="text-gray-600 mb-6">
        Contactez nous pour tout vos besoins de{' '}
        <span className="text-primary font-semibold">cours de répétitions à domicile</span>
      </p>

      {contact && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 space-y-4 max-w-md">
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Mail className="w-6 h-6 text-primary mr-3" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-800">{contact.email}</p>
            </div>
          </a>

          <a
            href={`https://wa.me/${contact.whatsapp.replace(/\s/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Phone className="w-6 h-6 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">WhatsApp</p>
              <p className="text-gray-800">{contact.whatsapp}</p>
            </div>
          </a>
        </div>
      )}
    </div>
  )
}