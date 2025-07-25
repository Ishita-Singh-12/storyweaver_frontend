class StoryGenerator {
  constructor() {
    this.backendURL = "https://storyweaver-backend-1-9jsi.onrender.com/generate";
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
    this.btnText = this.generateBtn.querySelector(".btn-text");
    this.btnIcon = this.generateBtn.querySelector(".btn-icon");
  }

  bindEvents() {
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

    if (loading) {
      this.generateBtn.disabled = true;
      this.storyInput.disabled = true;
      this.btnText.textContent = "Generating...";
      this.btnIcon.className = "fas fa-spinner btn-icon";
      this.btnIcon.style.animation = "spin 1s linear infinite";

      this.outputCard.classList.remove("hidden");
      this.loadingState.classList.remove("hidden");
      this.continuationText.classList.add("hidden");

      this.outputCard.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      this.generateBtn.disabled = false;
      this.storyInput.disabled = false;
      this.btnText.textContent = "Generate Continuation";
      this.btnIcon.className = "fas fa-sparkles btn-icon";
      this.btnIcon.style.animation = "";

      this.loadingState.classList.add("hidden");
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

    try {
      const response = await fetch(this.backendURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate story continuation");
      }

      const data = await response.json();
      this.displayContinuation(data.story); // Note: `data.story` matches your backend structure
    } catch (error) {
      console.error("Error generating story:", error);
      this.showError("Failed to generate story continuation. Please try again.");
      this.outputCard.classList.add("hidden");
    } finally {
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
