const API_BASE = location.origin; // Adjust if needed

/**
 * Submits a new iframe to the backend.
 * @param {string} embed - The iframe embed code.
 * @param {string} [creator] - Optional creator name.
 * @returns {Promise<Object>} The saved submission response.
 */
async function submitIframe(embed, creator = "") {
  const response = await fetch(`${API_BASE}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embed, creator }),
  });
  return response.json();
}

/**
 * Sets up Server-Sent Events (SSE) to listen for new iframe submissions.
 * @param {function(Object): void} callback - Function to handle new submissions.
 * @example 
 * // usage: Real-time updates for an infinite scrolling list of sketches
 * // Assuming a `renderSketches` like function that renders new submissions on the page
 * listenForUpdates((newSketch) => {
 * console.log("New sketch received:", newSketch);
 * renderSketches(newSketch);
});
 */
function listenForUpdates(callback) {
  const eventSource = new EventSource(`${API_BASE}/events`);
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callback(data);
    } catch (err) {
      console.error("Error parsing SSE data", err);
    }
  };
  eventSource.onerror = () => {
    console.error("SSE connection lost, attempting to reconnect...");
  };
}

export { submitIframe, listenForUpdates };