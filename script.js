class StoryGenerator {
  constructor() {
    this.backendURL = "https://storyweaver-backend-1-9jsi.onrender.com/generate/stream";
    this.abortController = null;
    this.initializeElements();
    this.bindEvents();
    this.isLoading = false;
  }

  initializeElements() {
    this.storyInput = document.getElementById("storyInput");
    this.generateBtn = document.getElementById("generateBtn");
    this.outputCard = document.getElementById("outputCard");
    this.loadingState = document.getElementById("loadingState");
    this.continuationText = document.getElementById("continuationText");
    this.errorMessage = document.getElementById("errorMessage");
    this.emptyState = document.getElementById("emptyState");
    this.stopBtn = document.getElementById("stopBtn");
    this.streamStatus = document.getElementById("streamStatus");
    this.btnText = this.generateBtn.querySelector(".btn-text");
    this.btnIcon = this.generateBtn.querySelector(".btn-icon");
  }

  bindEvents() {
    this.stopBtn.addEventListener("click", () => this.abortController?.abort());
    this.generateBtn.addEventListener("click", () => this.generateStory());
    this.storyInput.addEventListener("keydown", (e) => this.handleKeyPress(e));
    this.storyInput.addEventListener("input", () => this.clearError());
  }

  handleKeyPress(event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.generateStory();
    }
  }

  clearError() {
    this.errorMessage.classList.add("hidden");
    this.errorMessage.textContent = "";
  }

  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.classList.remove("hidden");
  }

  setLoadingState(loading) {
    this.isLoading = loading;
    this.stopBtn.classList.toggle("hidden", !loading);

    if (loading) {
      this.generateBtn.disabled = true;
      this.storyInput.disabled = true;
      this.btnText.textContent = "Generating...";
      this.btnIcon.className = "loading-spinner btn-icon";
      this.btnIcon.textContent = "";
      this.btnIcon.style.animation = "spin 1s linear infinite";

      this.outputCard.classList.remove("hidden");
      this.emptyState.classList.add("hidden");
      this.loadingState.classList.remove("hidden");
      this.continuationText.textContent = "";
      this.continuationText.classList.add("hidden");
      this.streamStatus.textContent = "Connecting...";

      this.outputCard.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      this.generateBtn.disabled = false;
      this.storyInput.disabled = false;
      this.btnText.textContent = "Generate Continuation";
      this.btnIcon.className = "btn-icon";
      this.btnIcon.textContent = "✦";
      this.btnIcon.style.animation = "";

      this.loadingState.classList.add("hidden");
      this.continuationText.classList.remove("is-streaming");
    }
  }

  async generateStory() {
    const prompt = this.storyInput.value.trim();

    if (!prompt) {
      this.showError("Please enter a story prompt to continue.");
      this.storyInput.focus();
      return;
    }

    if (this.isLoading) return;

    this.clearError();
    this.setLoadingState(true);
    this.abortController = new AbortController();
    const timeout = setTimeout(() => this.abortController?.abort("timeout"), 120000);

    try {
      const response = await fetch(this.backendURL, {
        method: "POST",
        signal: this.abortController.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate story continuation");
      }

      await readStoryStream(response, (event, data) => {
        if (event === "start") this.streamStatus.textContent = "Waiting for first words...";
        if (event === "delta" && typeof data.text === "string") {
          this.loadingState.classList.add("hidden");
          this.continuationText.classList.remove("hidden");
          this.continuationText.classList.add("is-streaming");
          this.streamStatus.textContent = "Writing live...";
          this.continuationText.textContent += data.text;
        }
        if (event === "done") this.streamStatus.textContent = data.truncated ? "Length limit reached" : "Complete";
      });
    } catch (error) {
      const stopped = this.abortController.signal.aborted;
      const timedOut = this.abortController.signal.reason === "timeout";
      this.streamStatus.textContent = stopped && !timedOut ? "Stopped" : "Interrupted";
      if (!stopped || timedOut) this.showError(timedOut ? "Generation timed out. Please try again." : error.message);
      if (!this.continuationText.textContent) {
        this.outputCard.classList.add("hidden");
        this.emptyState.classList.remove("hidden");
      }
    } finally {
      clearTimeout(timeout);
      this.abortController = null;
      this.setLoadingState(false);
    }
  }

  displayContinuation(continuation) {
    if (continuation && continuation.trim()) {
      this.continuationText.textContent = continuation.trim();
      this.continuationText.classList.remove("hidden");
    } else {
      this.showError("No continuation was generated. Please try again with a different prompt.");
      this.outputCard.classList.add("hidden");
      this.emptyState.classList.remove("hidden");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new StoryGenerator();

  const style = document.createElement("style");
  style.textContent = `html { scroll-behavior: smooth; }`;
  document.head.appendChild(style);

  const storyInput = document.getElementById("storyInput");
  if (storyInput) setTimeout(() => storyInput.focus(), 100);
});
