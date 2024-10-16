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
        <iframe src="http://localhost:5173" allow="microphone;camera" />
      </div>
    </div>
  );
}

export default App;
