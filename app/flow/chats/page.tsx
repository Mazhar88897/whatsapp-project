"use client"

import { useState } from "react"

const mockChats = [
  {
    id: 1,
    name: "FORTIS EASY PANELS",
    avatar: "F",
    status: "CTWA",
    messages: [
      { id: 1, text: "Hello there!", time: "12:23 PM", fromMe: false },
      { id: 2, text: "Hi! How can I help you today?", time: "12:24 PM", fromMe: true },
      { id: 3, text: "I'd like to book an appointment please.", time: "12:28 PM", fromMe: false },
      { id: 4, text: "Sure, when would you like to come in?", time: "12:33 PM", fromMe: true },
      { id: 5, text: "Would you like to book an appointment?", time: "12:38 PM", fromMe: true },
    ],
  },

  {
    id: 2,
    name: "XYZ AGENTS",
    avatar: "F",
    status: "CTWA",
    messages: [
      { id: 1, text: "Hello there!", time: "12:23 PM", fromMe: false },
      { id: 2, text: "Hi! How can I help you today?", time: "12:24 PM", fromMe: true },
      { id: 3, text: "I'd like to book an appointment please.", time: "12:28 PM", fromMe: false },
      { id: 4, text: "Sure, when would you like to come in?", time: "12:33 PM", fromMe: true },
      { id: 5, text: "Would you like to book an appointment?", time: "12:38 PM", fromMe: true },
    ],
  },
  // Add more chats if needed
]

export default function ChatsPage() {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(mockChats[0].id)
  const [input, setInput] = useState("")

  const selectedChat = mockChats.find((chat) => chat.id === selectedChatId)

  // Responsive: if mobile and a chat is selected, hide sidebar
  // We'll use a simple CSS approach for this demo

  return (
    <div className="flex h-screen bg-[#fafbfc]">
      {/* Sidebar */}
      <aside
        className={`
          w-80 max-w-full border-r bg-white flex-shrink-0 flex flex-col
          sticky top-0 left-0 h-screen z-20
          transition-transform duration-300
          md:translate-x-0
          ${selectedChatId && typeof window !== 'undefined' && window.innerWidth < 768 ? '-translate-x-full absolute' : ''}
        `}
      >
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Chats</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {mockChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors ${selectedChatId === chat.id ? 'bg-gray-100' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-white font-bold text-xl">
                {chat.avatar}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm">{chat.name}</div>
                <div className="text-xs text-gray-500">{chat.status}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Window */}
      <main className="flex-1 flex flex-col h-screen relative">
        {/* Chat header */}
        {selectedChat && (
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-white sticky top-0 z-10">
            <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-white font-bold text-xl">
              {selectedChat.avatar}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-base">{selectedChat.name}</div>
              <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{selectedChat.status}</span>
              </div>
            </div>
            {/* Icons */}
            <div className="flex gap-4 text-gray-500">
              <span className="cursor-pointer">&#10003;</span>
              <span className="cursor-pointer">&#128065;</span>
            </div>
          </div>
        )}

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col gap-6">
          {selectedChat?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-xs md:max-w-md lg:max-w-lg ${msg.fromMe ? 'ml-auto' : ''}`}
            >
              <div
                className={`rounded-xl px-5 py-3 shadow-sm text-base ${
                  msg.fromMe
                    ? 'bg-green-400 text-white text-right'
                    : 'bg-white text-gray-900 text-left border'
                }`}
              >
                {msg.text}
                <div className={`text-xs mt-2 ${msg.fromMe ? 'text-green-100' : 'text-gray-400'}`}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat input (fixed at bottom) */}
        {selectedChat && (
          <form
            className="w-full flex gap-2 p-4 bg-white border-t sticky bottom-0 z-20"
            onSubmit={e => {
              e.preventDefault()
              // Add send logic here
              setInput("")
            }}
          >
            <input
              type="text"
              className="flex-1 rounded-full border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-green-400 hover:bg-green-500 text-white font-semibold px-6 py-2 rounded-full transition-colors"
            >
              Send
            </button>
          </form>
        )}
      </main>

      {/* Responsive overlay for mobile: show chat only */}
      <style jsx global>{`
        @media (max-width: 767px) {
          aside {
            position: fixed !important;
            left: 0;
            top: 0;
            height: 100vh;
            z-index: 30;
            width: 80vw !important;
            max-width: 320px;
            background: #fff;
            transition: transform 0.3s;
          }
          main {
            width: 100vw !important;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  )
}
