/* Incremental SSE decoding shared by the UI and its transport tests. */
async function readStoryStream(response, onEvent) {
  if (!response.body) throw new Error("Streaming is not supported in this browser.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  function drain() {
    let match;
    while ((match = /\r?\n\r?\n/.exec(buffer))) {
      const frame = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);
      let event = "message";
      const data = [];
      for (const line of frame.split(/\r?\n/)) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      if (!data.length) continue;
      const payload = JSON.parse(data.join("\n"));
      if (event === "error") throw new Error(payload.error || "The story stream stopped early.");
      if (event === "done") completed = true;
      onEvent(event, payload);
    }
  }
  try {
    while (!completed) {
      const {value, done} = await reader.read();
      if (done) {
        buffer += decoder.decode();
        drain();
        break;
      }
      buffer += decoder.decode(value, {stream: true});
      drain();
    }
    if (!completed) throw new Error("The story stream was interrupted. Please try again.");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
if (typeof module !== "undefined") module.exports = {readStoryStream};
