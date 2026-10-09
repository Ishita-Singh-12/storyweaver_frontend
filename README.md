# StoryWeaver frontend

Creative Studio interface in HTML, CSS, and JavaScript, hosted on GitHub Pages.

Story continuations appear as Gemini text chunks arrive from the Flask streaming endpoint. The browser decodes SSE frames across arbitrary network and UTF-8 byte boundaries. It shows connection, writing, completion, and interruption states. Stop generation aborts the browser request and keeps text already received. No typewriter delay is added.

The Gemini key is not sent to the browser. The old JSON endpoint remains available on the backend, but this frontend uses `/generate/stream`.

Run `node test_stream.cjs` for transport decoder tests. Open `index.html` through a local HTTP server for frontend development; local origins are not allowed by the production backend CORS policy.
