"use client"

import React, { useState, useEffect, useRef } from "react"
import axios from "axios"
import ReactMarkdown from "react-markdown"

const API_URL = "https://finance-economics-agent-team-production.up.railway.app/api/v1/ask"

const Home = () => {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean; error?: boolean }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [agentStatus, setAgentStatus] = useState<"loading" | "ready" | "error">("loading")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedMessages = localStorage.getItem("chatHistory")
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages))
    }
    checkAgentStatus()
  }, [])

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages))
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const checkAgentStatus = async () => {
    setAgentStatus("loading")
    try {
      await axios.post(API_URL, { query: "Are you ready?" }, { timeout: 10000 })
      setAgentStatus("ready")
    } catch (error) {
      console.error("Error checking agent status:", error)
      setAgentStatus("error")
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading || agentStatus !== "ready") return

    const userMessage = { text: input, isUser: true }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await axios.post(API_URL, { query: input }, { timeout: 30000 })
      const botMessage = { text: response.data.response, isUser: false }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      let errorMessage = "An error occurred while fetching the response."
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = `Server error: ${error.response.status}`
        } else if (error.request) {
          errorMessage = "No response received from the server. Please check your internet connection."
        }
      }
      setMessages((prev) => [...prev, { text: errorMessage, isUser: false, error: true }])
      setAgentStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  const retryConnection = () => {
    checkAgentStatus()
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto font-sans bg-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 p-4 bg-white text-blue-900 text-center shadow">
        <h1 className="text-xl font-bold">AI Agent Team -  Research Assistant</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {agentStatus === "loading" && (
          <div className="text-center text-gray-500">
            <p>Initializing AI Agent Team...</p>
            <div className="loader mt-2"></div>
          </div>
        )}
        {agentStatus === "error" && (
          <div className="text-center text-red-500">
            <p>Failed to initialize AI Agent Team.</p>
            <button
              onClick={retryConnection}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
            <div
              className={`p-3 rounded-lg max-w-[70%] shadow ${msg.isUser ? "bg-green-100" : msg.error ? "bg-red-100 text-red-800" : "bg-white"
                }`}
            >
              {msg.isUser ? <p>{msg.text}</p> : <ReactMarkdown className="markdown-body">{msg.text}</ReactMarkdown>}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-3 rounded-lg flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white shadow-md">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isLoading && agentStatus === "ready" && handleSend()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
            disabled={isLoading || agentStatus !== "ready"}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || agentStatus !== "ready"}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        /* Markdown Styles */
        .markdown-body {
          font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;
          font-size: 16px;
          line-height: 1.5;
          word-wrap: break-word;
        }
        .markdown-body p {
          margin-top: 0;
          margin-bottom: 16px;
        }
        .markdown-body h1, .markdown-body h2 {
          padding-bottom: .3em;
          border-bottom: 1px solid #eaecef;
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
        }
        .markdown-body h1 {
          font-size: 2em;
        }
        .markdown-body h2 {
          font-size: 1.5em;
        }
        .markdown-body code {
          padding: .2em .4em;
          margin: 0;
          font-size: 85%;
          background-color: rgba(27,31,35,.05);
          border-radius: 3px;
        }
        .markdown-body pre {
          word-wrap: normal;
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background-color: #f6f8fa;
          border-radius: 3px;
        }
        .markdown-body pre code {
          display: inline;
          max-width: auto;
          padding: 0;
          margin: 0;
          overflow: visible;
          line-height: inherit;
          word-wrap: normal;
          background-color: transparent;
          border: 0;
        }
      `}</style>
    </div>
  )
}

export default Home

