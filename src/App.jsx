import './App.css'
import { useChatViewModel } from './viewmodels/useChatViewModel'

function App() {
  const {
    messages,
    input,
    setInput,
    isSending,
    error,
    status,
    canSend,
    sendMessage,
    resetChat,
    listRef,
    hasApiKey,
  } = useChatViewModel()

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="app">
      <div className="window">
        <header className="window__chrome">
          <div className="window__controls" aria-hidden="true">
            <span className="window__control"></span>
            <span className="window__control"></span>
            <span className="window__control"></span>
          </div>
          <div className="window__title">LabChat</div>
          <div className="window__badge">Alex</div>
        </header>

        <nav className="window__menu" aria-label="Menu">
          <button type="button">File</button>
          <button type="button">Edit</button>
          <button type="button">Search</button>
          <button type="button">Help</button>
        </nav>

        <section className="window__body">
          <div className="window__meta">
            <div className="meta__status">
              <span
                className={`status-dot ${hasApiKey ? 'is-on' : 'is-off'}`}
                aria-hidden="true"
              ></span>
              <span>{status}</span>
            </div>
          </div>

          <div className="chat">
            <div className="chat__screen" ref={listRef} aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message message--${message.role}`}
                >
                  <div className="message__role">
                    {message.role === 'user'
                      ? 'You'
                      : message.role === 'assistant'
                        ? 'Gemini'
                        : 'System'}
                  </div>
                  <div className="message__content">{message.content}</div>
                </div>
              ))}
              {isSending && (
                <div className="message message--system">
                  <div className="message__role">System</div>
                  <div className="message__content">Sending to Gemini...</div>
                </div>
              )}
            </div>

            <div className="chat__composer">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message and press Enter"
                rows={3}
              />
              <div className="chat__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={sendMessage}
                  disabled={!canSend}
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={resetChat}
                >
                  New chat
                </button>
              </div>
            </div>
          </div>

          <footer className="window__status" aria-live="polite">
            {error ? <span className="status__error">{error}</span> : null}
          </footer>
        </section>
      </div>
    </div>
  )
}

export default App
