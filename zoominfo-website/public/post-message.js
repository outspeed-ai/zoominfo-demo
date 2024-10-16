function onKeyDown(event) {
  if (event.code === "Space") {
    event.preventDefault();
    window.parent.postMessage("space");
  }
}

window.addEventListener("keydown", onKeyDown);
