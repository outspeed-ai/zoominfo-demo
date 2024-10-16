import React from "react";
import "./App.css";

function App() {
  const ref = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
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
  return (
    <div className="container">
      <div
        onClick={() => console.log("You clicked!!!!!")}
        className="zoominfo-container"
      >
        <iframe src="/zoom.htm" />
      </div>
      <div className="widget-container">
        <iframe
          ref={ref}
          src="http://localhost:5173"
          allow="microphone;camera"
        />
      </div>
    </div>
  );
}

export default App;
