let currentPopup = null;

document.addEventListener("dblclick", async (e) => {
    const selection = window.getSelection().toString().trim();
    if (!selection || selection.split(" ").length > 1) return;

    // Remove existing popup
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
    }

    // Create popup immediately
    currentPopup = createLoadingPopup(e.clientX, e.clientY, selection);
    document.body.appendChild(currentPopup);

    // Add click-away handler
    setTimeout(() => {
        document.addEventListener("click", clickAwayHandler);
    }, 10);

    try {
        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
                selection
            )}`
        );

        if (!response.ok) {
            const errorData = await response.json();
            showErrorMessage(errorData);
            return;
        }

        const data = await response.json();
        updatePopupWithData(data[0], selection);
    } catch (error) {
        console.error("Dictionary fetch failed:", error);
        showErrorMessage({
            title: "Connection Error",
            message: "Failed to connect to the dictionary service.",
        });
    }
});

function createLoadingPopup(x, y, word) {
    const popup = document.createElement("div");
    const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

    popup.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: ${darkMode ? "#2d2d2d" : "#fff"};
    color: ${darkMode ? "#e0e0e0" : "#333"};
    border: 1px solid ${darkMode ? "#444" : "#ccc"};
    border-radius: 8px;
    padding: 12px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 300px;
    min-width: 200px;
  `;

    popup.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <h3 style="margin: 0; font-size: 1.2em;">${word}</h3>
        <div class="loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
      <button style="
        background: none;
        border: none;
        cursor: pointer;
        color: ${darkMode ? "#e0e0e0" : "#333"};
        font-size: 1.2em;
        padding: 0 4px;
      " onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <style>
      .loading-dots span {
        animation: dot-pulse 1.4s infinite;
        opacity: 0;
      }
      .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
      .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes dot-pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    </style>
  `;

    return popup;
}

function updatePopupWithData(entry, word) {
    if (!currentPopup) return;

    const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || "";
    const definition = entry.meanings[0].definitions[0].definition;
    const audio = entry.phonetics.find((p) => p.audio)?.audio;

    currentPopup.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
      <h3 style="margin: 0; font-size: 1.2em; color: ${
          darkMode ? "#fff" : "#333"
      }">${entry.word}</h3>
      <span style="font-size: 0.9em; color: ${
          darkMode ? "#a0a0a0" : "#666"
      }">${phonetic}</span>
      ${
          audio
              ? `<button style="cursor:pointer; background: none; border: none; color: ${
                    darkMode ? "#e0e0e0" : "#333"
                }" 
                onclick="new Audio('${audio}').play()">▶</button>`
              : ""
      }
    </div>
    <div style="line-height: 1.4; margin-bottom: 12px; color: ${
        darkMode ? "#e0e0e0" : "#333"
    }">${definition}</div>
    <div style="display: flex; gap: 8px; justify-content: space-between;">
      <button style="
        padding: 4px 12px;
        border-radius: 4px;
        border: 1px solid ${darkMode ? "#555" : "#ddd"};
        background: ${darkMode ? "#3d3d3d" : "#f5f5f5"};
        color: ${darkMode ? "#e0e0e0" : "#333"};
        cursor: pointer;
        font-size: 0.9em;
      " onclick="window.open('https://duckduckgo.com/?q=${encodeURIComponent(
          word
      )}', '_blank')">
        More
      </button>
      <button style="
        position: absolute;
        top: 4px;
        right: 4px;
        background: none;
        border: none;
        cursor: pointer;
        color: ${darkMode ? "#e0e0e0" : "#333"};
        font-size: 1.2em;
        padding: 0 4px;
      " onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
}

function showErrorMessage(errorData) {
    if (!currentPopup) return;

    const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const word = currentPopup.querySelector("h3")?.textContent || "";

    currentPopup.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
      <h3 style="margin: 0; font-size: 1.2em; color: ${
          darkMode ? "#fff" : "#333"
      }">${word}</h3>
      <button style="
        background: none;
        border: none;
        cursor: pointer;
        color: ${darkMode ? "#e0e0e0" : "#333"};
        font-size: 1.2em;
        padding: 0 4px;
      " onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div style="color: ${darkMode ? "#ff8080" : "#d33"}; margin-bottom: 12px;">
      ${errorData.message || "No definition found"}
    </div>
    <button style="
      padding: 4px 12px;
      border-radius: 4px;
      border: 1px solid ${darkMode ? "#555" : "#ddd"};
      background: ${darkMode ? "#3d3d3d" : "#f5f5f5"};
      color: ${darkMode ? "#e0e0e0" : "#333"};
      cursor: pointer;
      font-size: 0.9em;
    " onclick="window.open('https://duckduckgo.com/?q=${encodeURIComponent(
        word
    )}', '_blank')">
      Search Web
    </button>
  `;
}

function clickAwayHandler(e) {
    if (currentPopup && !currentPopup.contains(e.target)) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
        document.removeEventListener("click", clickAwayHandler);
    }
}
