import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [isMinimized, setIsMinimized] = useState(false); // Start minimized
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data === "space" && ref.current) {
        ref.current.focus();
        ref.current.contentWindow?.focus();
      }
    }

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  const toggleChatbot = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="container">
      {/* Chatbot Popup */}
      <div
        className={`chatbot-popup ${isMinimized ? "minimized" : ""}`}
        onClick={toggleChatbot}
      >
        {isMinimized ? (
          <span className="chatbot-icon">💬</span> // Chat icon
        ) : (
          <div className="chatbot-header">
            <>
              <span>Chat with Sales Agent</span>
              <button className="toggle-button">-</button>
            </>
          </div>
        )}
        {!isMinimized && (
          <div className="chatbot-content">
            <iframe
              ref={ref}
              src="https://chatbot-embed-7ae.pages.dev"
              allow="microphone;camera"
              title="Chatbot"
            />
          </div>
        )}
      </div>

      {/* Existing Zoom Container */}
      <div className="zoominfo-container">
        <iframe src="/zoom.htm" title="ZoomInfo" />
      </div>
    </div>
  );
}

export default App;
