/**
 * Highly pedagogical Text-to-Speech service using native browser window.speechSynthesis.
 * Seamlessly filters LaTeX codes to make reading aloud feel natural and organic.
 */
class VoiceServiceClass {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private chunksQueue: string[] = [];
  private currentChunkIndex: number = 0;
  private isStopping: boolean = false;
  private matchingVoice: SpeechSynthesisVoice | null = null;
  private lang: "es" | "en" = "es";
  private onEndCallback: (() => void) | null = null;

  /**
   * Translates common LaTeX constructs into natural-sounding speech segments.
   */
  private cleanLaTeXForSpeech(text: string, lang: "es" | "en"): string {
    let clean = text;

    // 1. Strip structural markdown headers and bullet icons
    clean = clean.replace(/#+\s+/g, "");
    clean = clean.replace(/\*\*/g, "");
    clean = clean.replace(/`([^`]+)`/g, "$1");

    // 2. Surgical replacements for LaTeX math symbols
    if (lang === "es") {
      clean = clean.replace(/\\lim_{x\s*\\to\s*([^}]+)}/g, "límite de equis cuando tiende a $1 ");
      clean = clean.replace(/\\frac{([^}]+)}{([^}]+)}/g, " $1 sobre $2 ");
      clean = clean.replace(/\\times/g, " por ");
      clean = clean.replace(/\\div/g, " dividido por ");
      clean = clean.replace(/\\pi/g, " pi ");
      clean = clean.replace(/\\infty/g, " infinito ");
      clean = clean.replace(/\\sin/g, " seno ");
      clean = clean.replace(/\\cos/g, " coseno ");
      clean = clean.replace(/\\tan/g, " tangente ");
      clean = clean.replace(/\\theta/g, " tita ");
      clean = clean.replace(/\\approx/g, " aproximadamente igual a ");
      clean = clean.replace(/f\(x\)/g, " efe de equis ");
      clean = clean.replace(/x\^2/g, " equis al cuadrado ");
      clean = clean.replace(/x\^3/g, " equis al cubo ");
      clean = clean.replace(/x\_([a-zA-Z0-9])/g, " equis sub $1 ");
    } else {
      clean = clean.replace(/\\lim_{x\s*\\to\s*([^}]+)}/g, "limit of x as it approaches $1 ");
      clean = clean.replace(/\\frac{([^}]+)}{([^}]+)}/g, " $1 over $2 ");
      clean = clean.replace(/\\times/g, " times ");
      clean = clean.replace(/\\div/g, " divided by ");
      clean = clean.replace(/\\pi/g, " pi ");
      clean = clean.replace(/\\infty/g, " infinity ");
      clean = clean.replace(/\\sin/g, " sine ");
      clean = clean.replace(/\\cos/g, " cosine ");
      clean = clean.replace(/\\tan/g, " tangent ");
      clean = clean.replace(/\\theta/g, " theta ");
      clean = clean.replace(/\\approx/g, " approximately equal to ");
      clean = clean.replace(/f\(x\)/g, " f of x ");
      clean = clean.replace(/x\^2/g, " x squared ");
      clean = clean.replace(/x\^3/g, " x cubed ");
      clean = clean.replace(/x\_([a-zA-Z0-9])/g, " x sub $1 ");
    }

    // 3. Strip remaining math delimiters ($ and $$) and backslashes
    clean = clean.replace(/\$\$/g, ", ");
    clean = clean.replace(/\$/g, "");
    clean = clean.replace(/\\/g, "");

    // 4. Strip extra spacing
    clean = clean.replace(/\s+/g, " ").trim();

    return clean;
  }

  /**
   * Speaks the given text using browser-native SpeechSynthesis.
   * Plays sentences sequentially in safe small chunks to prevent browser crashes on long texts.
   */
  public speak(text: string, lang: "es" | "en", onEnd: () => void) {
    this.stop();
    this.isStopping = false;
    this.onEndCallback = onEnd;
    this.lang = lang;

    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis is not supported in this browser.");
      onEnd();
      return;
    }

    const cleanText = this.cleanLaTeXForSpeech(text, lang);
    
    // Split into sentences using punctuation markers
    const sentences = cleanText
      .split(/([.!?\n]+)/)
      .reduce((acc: string[], val: string, idx: number) => {
        if (idx % 2 === 0) {
          if (val.trim()) acc.push(val.trim());
        } else {
          if (acc.length > 0) {
            acc[acc.length - 1] += val;
          }
        }
        return acc;
      }, []);

    // Combine sentences into chunks under 200 characters
    this.chunksQueue = [];
    let currentChunk = "";
    for (const sentence of sentences) {
      if ((currentChunk + " " + sentence).length > 200) {
        if (currentChunk.trim()) {
          this.chunksQueue.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk = currentChunk ? currentChunk + " " + sentence : sentence;
      }
    }
    if (currentChunk.trim()) {
      this.chunksQueue.push(currentChunk.trim());
    }

    if (this.chunksQueue.length === 0) {
      onEnd();
      return;
    }

    // Attempt to pick a premium/natural native voice
    const voices = window.speechSynthesis.getVoices();
    const voiceLang = lang === "es" ? "es-ES" : "en-US";
    this.matchingVoice = voices.find(
      (v) => v.lang.startsWith(voiceLang) && (v.name.includes("Google") || v.name.includes("Natural"))
    ) || voices.find((v) => v.lang.startsWith(voiceLang)) || null;

    this.currentChunkIndex = 0;
    this.playNextChunk();
  }

  private playNextChunk() {
    if (this.isStopping) return;

    if (this.currentChunkIndex >= this.chunksQueue.length) {
      this.activeUtterance = null;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
      return;
    }

    const chunkText = this.chunksQueue[this.currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    this.activeUtterance = utterance;

    utterance.lang = this.lang === "es" ? "es-ES" : "en-US";
    if (this.matchingVoice) {
      utterance.voice = this.matchingVoice;
    }

    utterance.rate = this.lang === "es" ? 0.95 : 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (this.isStopping) return;
      this.currentChunkIndex++;
      this.playNextChunk();
    };

    utterance.onerror = (e) => {
      if (e.error === "interrupted" || this.isStopping) {
        return;
      }
      console.error("Speech Synthesis chunk error:", e);
      this.activeUtterance = null;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Cancels and stops all active audio synthesis immediately.
   */
  public stop() {
    this.isStopping = true;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.activeUtterance = null;
    this.chunksQueue = [];
    this.currentChunkIndex = 0;
  }

  /**
   * Returns whether Speech Synthesis is currently speaking.
   */
  public isCurrentlySpeaking(): boolean {
    return window.speechSynthesis ? window.speechSynthesis.speaking : false;
  }
}

export const VoiceService = new VoiceServiceClass();
