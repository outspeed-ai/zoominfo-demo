import { useState } from "react";
import "./App.css";

function App() {
  const [isOpen, setOpen] = useState(0);

  return (
    <div className="container">
      <div className="zoominfo-container">
        <iframe src="/zoom.htm" />
      </div>
      <div className="widget-container">
        <iframe
          src="http://localhost:5173?functionURL=https://us0-dev.outspeed.com/run/333fede65db918130ca947074ddb3a43"
          allow="microphone;camera"
        />
      </div>
    </div>
  );
}

export default App;
