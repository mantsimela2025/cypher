import React, { useState, useRef, useEffect } from "react";
import Icon from "./icon/Icon";

// Bootstrap v5 classes are used for all styling
// NioIcon is used for all icons

const MESSAGES = [
  {
    from: "assistant",
    text: `Hello! I can help you query your security data using natural language. Ask me anything about vulnerabilities, assets, compliance, or any other data in your system.`,
    time: "07:54 AM",
    error: false,
  },
  // Example error message (uncomment to show error)
  // {
  //   from: "assistant",
  //   text: `Sorry, I encountered an error processing your query. Please try again.`,
  //   time: "07:58 AM",
  //   error: true,
  // },
];

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(MESSAGES);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([
      ...messages,
      { from: "user", text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), error: false },
      // Simulate error reply for demo:
      { from: "assistant", text: `Sorry, I encountered an error processing your query. Please try again.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), error: true },
    ]);
    setInput("");
  };

  // Icon names: chat-circle, robot, user, cross, send
  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          className="btn btn-primary rounded-circle shadow position-fixed"
          style={{ right: 24, bottom: 24, width: 56, height: 56, zIndex: 1050 }}
          onClick={() => setOpen(true)}
          aria-label="Open chat assistant"
        >
          <Icon name="chat-circle" className="fs-3" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className="card shadow-lg position-fixed d-flex flex-column"
          style={{ width: 370, maxWidth: '95vw', height: 500, right: 24, bottom: 24, zIndex: 1060, borderRadius: 24 }}
        >
          {/* Header */}
          <div className="card-header d-flex align-items-center justify-content-between bg-primary text-white rounded-top" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <div className="d-flex align-items-center gap-2">
              <Icon name="robot" className="me-2" style={{ fontSize: 22 }} />
              <span className="fw-bold">AI Assistant</span>
            </div>
            <button className="btn btn-sm btn-light rounded-circle p-1" onClick={() => setOpen(false)} aria-label="Close chat">
              <Icon name="cross" style={{ fontSize: 18 }} />
            </button>
          </div>

          {/* Messages */}
          <div className="card-body flex-grow-1 overflow-auto px-3 py-2" style={{ background: '#fff', minHeight: 0 }}>
            <div className="d-flex flex-column gap-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.from === "user" ? "align-self-end text-end" : "align-self-start text-start"}>
                  <div className="d-flex align-items-end gap-2">
                    {msg.from === "assistant" && (
                      <Icon name="robot" className="bg-primary text-white rounded-circle p-1" style={{ fontSize: 22 }} />
                    )}
                    {msg.from === "user" && (
                      <Icon name="user" className="bg-secondary text-white rounded-circle p-1" style={{ fontSize: 22 }} />
                    )}
                    <div>
                      <div
                        className={
                          "px-3 py-2 rounded-3 " +
                          (msg.from === "assistant"
                            ? msg.error
                              ? "bg-danger bg-opacity-10 text-danger border border-danger"
                              : "bg-light text-dark"
                            : "bg-primary text-white")
                        }
                        style={{ maxWidth: 220, wordBreak: "break-word" }}
                      >
                        {msg.text}
                      </div>
                      <div className="small text-muted mt-1" style={{ fontSize: 11 }}>{msg.time}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <form className="card-footer bg-white border-0 p-2" onSubmit={handleSend}>
            <div className="input-group">
              <input
                type="text"
                className="form-control border-0 bg-light rounded-pill"
                placeholder="Ask me about your security data..."
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ fontSize: 15 }}
                aria-label="Type your message"
              />
              <button className="btn btn-primary rounded-circle ms-2 d-flex align-items-center justify-content-center" type="submit" style={{ width: 40, height: 40 }} aria-label="Send">
                <Icon name="send" style={{ fontSize: 18 }} />
              </button>
            </div>
            <div className="form-text text-muted ms-2" style={{ fontSize: 12 }}>
              Ask about vulnerabilities, assets, compliance, or any security data
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
