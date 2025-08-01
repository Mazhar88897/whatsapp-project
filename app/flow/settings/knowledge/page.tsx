"use client"

import { useState } from "react"

export default function KnowledgePage() {
  const [selectedWhatsApp, setSelectedWhatsApp] = useState(0)
  const [activeTab, setActiveTab] = useState<'text' | 'documents'>('documents')
  const [showModal, setShowModal] = useState(false)
  const [knowledgeText, setKnowledgeText] = useState("This is the knowledge base for Erum Saba Medical Center. We provide comprehensive medical services including general check-ups, specialist consultations, and emergency care.")
  const [documents, setDocuments] = useState([
    { id: 1, title: "Medical Guidelines", fileName: "guidelines.pdf" },
    { id: 2, title: "Patient Instructions", fileName: "instructions.pdf" }
  ])
  const [newDoc, setNewDoc] = useState({ title: "", file: null as File | null })

  const whatsAppNumbers = [
    "Erum Saba Medical Center +971506659064",
    "Dubai Clinic +971507778899"
  ]

  const handleAddDocument = () => {
    if (newDoc.title && newDoc.file) {
      setDocuments([...documents, {
        id: Date.now(),
        title: newDoc.title,
        fileName: newDoc.file.name
      }])
      setNewDoc({ title: "", file: null })
      setShowModal(false)
    }
  }

  const handleDeleteDocument = (id: number) => {
    setDocuments(documents.filter(doc => doc.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-bold text-2xl mb-2">Knowledge Base</h2>
        <p className="text-gray-600">Configure knowledge base content for your WhatsApp numbers. This content will be used for AI responses.</p>
      </div>

      {/* WhatsApp Number Selection */}
      {/* <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
        {whatsAppNumbers.map((number, index) => (
          <button
            key={index}
            onClick={() => setSelectedWhatsApp(index)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedWhatsApp === index 
                ? 'bg-gray-100 text-gray-900' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {number}
          </button>
        ))}
       
      </div> */}

      {/* Content Tabs */}
      <div className="flex border-b">
        {/* <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
            activeTab === 'text'
              ? 'border-b-2 border-green-500 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="text-lg">📖</span>
          Knowledge Base Text
        </button> */}
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
            activeTab === 'documents'
              ? 'border-b-2 border-green-500 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="text-lg">📄</span>
          Knowledge Base Documents
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg border p-6">
        {activeTab === 'text' ? (
          <div className="space-y-4">
            <textarea
              value={knowledgeText}
              onChange={(e) => setKnowledgeText(e.target.value)}
              className="w-full h-64 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your knowledge base text..."
            />
            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium transition-colors">
              Save Text
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex mb-8 justify-between items-center">
              <h3 className="font-semibold text-lg">Documents</h3>
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-800 text-white px-4 font-bold py-1 rounded-full transition-colors"
              >
                + Add Document
              </button>
            </div>
            
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-semibold">Document Title</th>
                  <th className="pb-3 font-semibold">File Name</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b">
                    <td className="py-3">{doc.title}</td>
                    <td className="py-3 text-gray-600">{doc.fileName}</td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {showModal && (
        <div className="fixed inset-0 mt-[-100px] bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Add Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Document Title</label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter document title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Upload File</label>
                <input
                  type="file"
                  onChange={(e) => setNewDoc({ ...newDoc, file: e.target.files?.[0] || null })}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  accept=".pdf,.doc,.docx"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                className="flex-1 px-2  bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors"
              >
                Add Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
