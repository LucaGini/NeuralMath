/**
 * Highly pedagogical Text-to-Speech service using native browser window.speechSynthesis.
 * Seamlessly filters LaTeX codes to make reading aloud feel natural and organic.
 */
class VoiceServiceClass {
  private activeUtterance: SpeechSynthesisUtterance | null = null;

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
   * Finds the best matching ES or EN voice.
   */
  public speak(text: string, lang: "es" | "en", onEnd: () => void) {
    this.stop();

    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis is not supported in this browser.");
      onEnd();
      return;
    }

    const cleanText = this.cleanLaTeXForSpeech(text, lang);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.activeUtterance = utterance;

    // Map language locales
    utterance.lang = lang === "es" ? "es-ES" : "en-US";
    
    // Attempt to pick a premium/natural native voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (v) => v.lang.startsWith(utterance.lang) && (v.name.includes("Google") || v.name.includes("Natural"))
    ) || voices.find((v) => v.lang.startsWith(utterance.lang));

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    // Configure rates for comfortable pedagogy speed (slightly slower than standard)
    utterance.rate = lang === "es" ? 0.95 : 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      this.activeUtterance = null;
      onEnd();
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis error:", e);
      this.activeUtterance = null;
      onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Cancels and stops all active audio synthesis immediately.
   */
  public stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.activeUtterance = null;
  }

  /**
   * Returns whether Speech Synthesis is currently speaking.
   */
  public isCurrentlySpeaking(): boolean {
    return window.speechSynthesis ? window.speechSynthesis.speaking : false;
  }
}

export const VoiceService = new VoiceServiceClass();
