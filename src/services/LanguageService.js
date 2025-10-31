class LanguageService {
  constructor() {
    this.supportedLanguages = {
      en: { name: 'English', code: 'en', rtl: false },
      es: { name: 'Español', code: 'es', rtl: false },
      fr: { name: 'Français', code: 'fr', rtl: false },
      de: { name: 'Deutsch', code: 'de', rtl: false },
      hi: { name: 'हिन्दी', code: 'hi', rtl: false },
      ar: { name: 'العربية', code: 'ar', rtl: true },
      zh: { name: '中文', code: 'zh', rtl: false },
      pt: { name: 'Português', code: 'pt', rtl: false },
      ru: { name: 'Русский', code: 'ru', rtl: false },
      ja: { name: '日本語', code: 'ja', rtl: false }
    };

    this.translations = {
      en: {
        greeting: "Hi! I'm your mental wellness companion. How are you feeling today? 🌟",
        sad: "I'm really sorry to hear that you're feeling down. I'm here for you. Sometimes watching some uplifting content can help brighten our mood even a little bit. Would you be open to trying some funny or heartwarming videos?",
        stressed: "I can sense you're feeling stressed. Let's take a moment together. Sometimes a short break with some calming content can help us reset. Would you like to try some peaceful videos?",
        happy: "That's wonderful to hear! It's great that you're feeling good today. I'm here to chat whenever you need a friend. What's been bringing you joy?",
        neutral: "Thank you for sharing that with me. I'm here to support you no matter how you're feeling. Sometimes when we're not sure how we feel, taking a small break can help. How can I best support you right now?",
        videoSuggestion: "I think watching some uplifting content might help brighten your mood! Would you like me to show you some funny and heartwarming videos? 😊",
        postVideoPositive: "I'm so glad to hear that the videos helped lift your mood! That's wonderful. Remember, I'm always here if you need to talk or if you'd like more uplifting content in the future. Take care of yourself!",
        postVideoNegative: "I understand that the videos didn't help as much as we'd hoped, and that's okay. Everyone's journey is different, and it's brave of you to share how you're really feeling. Sometimes professional support can make a big difference. Would you like me to suggest some mental health resources?",
        continueChat: "Thank you for being honest about how you're feeling. Whatever you're experiencing is valid. I'm here to support you through this. Is there anything specific you'd like to talk about or any other way I can help?",
        typing: "Typing...",
        welcome: "Welcome! How can I support you today?",
        languageDetected: "I notice you're speaking {language}. I can chat with you in your preferred language if you'd like!"
      },
      es: {
        greeting: "¡Hola! Soy tu compañero de bienestar mental. ¿Cómo te sientes hoy? 🌟",
        sad: "Lamento mucho que te sientas así. Estoy aquí para ti. A veces ver contenido edificante puede ayudar a animarnos un poco. ¿Te gustaría probar algunos videos divertidos o reconfortantes?",
        stressed: "Siento que estás estresado. Tomemos un momento juntos. A veces una pausa corta con contenido calmante puede ayudarnos a resetearnos. ¿Te gustaría probar algunos videos pacíficos?",
        happy: "¡Es maravilloso escuchar eso! Es genial que te sientas bien hoy. Estoy aquí para charlar cuando necesites un amigo. ¿Qué te está trayendo alegría?",
        neutral: "Gracias por compartir eso conmigo. Estoy aquí para apoyarte sin importar cómo te sientas. A veces cuando no estamos seguros de cómo nos sentimos, tomar un pequeño descanso puede ayudar. ¿Cómo puedo apoyarte mejor ahora?",
        videoSuggestion: "¡Creo que ver contenido edificante podría ayudar a animar tu estado de ánimo! ¿Te gustaría que te muestre algunos videos divertidos y reconfortantes? 😊",
        postVideoPositive: "¡Me alegra mucho escuchar que los videos ayudaron a levantar tu estado de ánimo! Eso es maravilloso. Recuerda, siempre estoy aquí si necesitas hablar o si te gustaría más contenido edificante en el futuro. ¡Cuídate!",
        postVideoNegative: "Entiendo que los videos no ayudaron tanto como esperábamos, y eso está bien. El viaje de cada persona es diferente, y es valiente de tu parte compartir cómo te sientes realmente. A veces el apoyo profesional puede marcar una gran diferencia. ¿Te gustaría que te sugiera algunos recursos de salud mental?",
        continueChat: "Gracias por ser honesto sobre cómo te sientes. Lo que estás experimentando es válido. Estoy aquí para apoyarte en esto. ¿Hay algo específico de lo que te gustaría hablar o alguna otra manera en que pueda ayudar?",
        typing: "Escribiendo...",
        welcome: "¡Bienvenido! ¿Cómo puedo apoyarte hoy?",
        languageDetected: "¡Noté que hablas {language}. Puedo chatear contigo en tu idioma preferido si te gustaría!"
      },
      fr: {
        greeting: "Salut ! Je suis votre compagnon de bien-être mental. Comment vous sentez-vous aujourd'hui ? 🌟",
        sad: "Je suis vraiment désolé d'entendre que vous vous sentez mal. Je suis là pour vous. Parfois, regarder du contenu inspirant peut aider à égayer notre humeur, même un peu. Seriez-vous ouvert à essayer des vidéos drôles ou touchantes ?",
        stressed: "Je sens que vous êtes stressé. Prenons un moment ensemble. Parfois, une courte pause avec du contenu apaisant peut nous aider à nous réinitialiser. Aimeriez-vous essayer des vidéos paisibles ?",
        happy: "C'est merveilleux à entendre ! C'est génial que vous vous sentiez bien aujourd'hui. Je suis là pour discuter chaque fois que vous avez besoin d'un ami. Qu'est-ce qui vous apporte de la joie ?",
        neutral: "Merci de partager cela avec moi. Je suis là pour vous soutenir peu importe comment vous vous sentez. Parfois, quand nous ne sommes pas sûrs de comment nous nous sentons, prendre une petite pause peut aider. Comment puis-je au mieux vous soutenir maintenant ?",
        videoSuggestion: "Je pense que regarder du contenu inspirant pourrait aider à égayer votre humeur ! Aimeriez-vous que je vous montre quelques vidéos drôles et touchantes ? 😊",
        postVideoPositive: "Je suis tellement heureux d'entendre que les vidéos ont aidé à remonter votre humeur ! C'est merveilleux. Rappelez-vous, je suis toujours là si vous avez besoin de parler ou si vous aimeriez plus de contenu inspirant à l'avenir. Prenez soin de vous !",
        postVideoNegative: "Je comprends que les vidéos n'ont pas aidé autant que nous l'espérions, et c'est correct. Le voyage de chacun est différent, et c'est courageux de votre part de partager comment vous vous sentez vraiment. Parfois, le soutien professionnel peut faire une grande différence. Aimeriez-vous que je vous suggère quelques ressources de santé mentale ?",
        continueChat: "Merci d'être honnête sur la façon dont vous vous sentez. Ce que vous expérimentez est valide. Je suis là pour vous soutenir à travers cela. Y a-t-il quelque chose de spécifique dont vous aimeriez parler ou une autre manière dont je peux aider ?",
        typing: "En train d'écrire...",
        welcome: "Bienvenue ! Comment puis-je vous soutenir aujourd'hui ?",
        languageDetected: "Je remarque que vous parlez {language}. Je peux discuter avec vous dans votre langue préférée si vous le souhaitez !"
      },
      hi: {
        greeting: "नमस्ते! मैं आपका मानसिक स्वास्थ्य साथी हूँ। आप आज कैसा महसूस कर रहे हैं? 🌟",
        sad: "मुझे बहुत खेद है कि आप उदास महसूस कर रहे हैं। मैं आपके लिए यहां हूँ। कभी-कभी प्रेरक सामग्री देखने से हमारे मूड को थोड़ा उज्ज्वल करने में मदद मिल सकती है। क्या आप कुछ मजेदार या दिल छू लेने वाले वीडियो देखने के लिए तैयार हैं?",
        stressed: "मैं महसूस कर सकता हूं कि आप तनावग्रस्त हैं। चलिए एक साथ क्षण लेते हैं। कभी-कभी शांत करने वाली सामग्री के साथ एक छोटा ब्रेक हमें रीसेट करने में मदद कर सकता है। क्या आप कुछ शांत वीडियो आजमाना चाहेंगे?",
        happy: "यह सुनकर बहुत अच्छा लगा! यह बहुत बढ़िया है कि आप आज अच्छा महसूस कर रहे हैं। जब भी आपको एक दोस्त की जरूरत हो, मैं बात करने के लिए यहां हूं। क्या आपको खुशी क्या दे रहा है?",
        neutral: "मुझे इसके साथ साझा करने के लिए धन्यवाद। चाहे आप कैसा भी महसूस कर रहे हों, मैं आपका समर्थन करने के लिए यहां हूं। कभी-कभी जब हमें नहीं पता कि हम कैसा महसूस कर रहे हैं, तो एक छोटा ब्रेक मदद कर सकता है। मैं अभी आपका सबसे अच्छा समर्थन कैसे कर सकता हूं?",
        videoSuggestion: "मुझे लगता है कि कुछ प्रेरक सामग्री देखने से आपके मूड को उज्ज्वल करने में मदद मिल सकती है! क्या आप चाहते हैं कि मैं आपको कुछ मजेदार और दिल छू लेने वाले वीडियो दिखाऊं? 😊",
        postVideoPositive: "मुझे यह सुनकर बहुत खुशी हुई कि वीडियो ने आपके मूड को ऊंचा उठाने में मदद की! यह शानदार है। याद रखें, अगर आपको बात करने की जरूरत हो या भविष्य में और प्रेरक सामग्री चाहिए, तो मैं हमेशा यहां हूं। अपना ख्याल रखें!",
        postVideoNegative: "मैं समझता हूं कि वीडियो ने उतना मदद नहीं की जितनी हमने उम्मीद की थी, और यह ठीक है। हर किसी की यात्रा अलग होती है, और यह आपकी ओर से बहादुरी है कि आपने साझा किया कि आप वास्तव में कैसा महसूस कर रहे हैं। कभी-कभी पेशेवर समर्थन बड़ा अंतर ला सकता है। क्या आप चाहेंगे कि मैं आपको कुछ मानसिक स्वास्थ्य संसाधनों का सुझाव दूं?",
        continueChat: "आपके बारे में ईमानदार होने के लिए धन्यवाद। जो भी आप अनुभव कर रहे हैं वह मान्य है। मैं आपके इस दौरान समर्थन करने के लिए यहां हूं। क्या कोई विशिष्ट बात है जिसके बारे में आप बात करना चाहेंगे या कोई अन्य तरीका है जिससे मैं मदद कर सकूं?",
        typing: "टाइप कर रहा हूं...",
        welcome: "स्वागत है! मैं आज आपका समर्थन कैसे कर सकता हूं?",
        languageDetected: "मैं देख रहा हूं कि आप {language} बोल रहे हैं। यदि आप चाहें तो मैं आपकी पसंदीदा भाषा में आपसे बात कर सकता हूं!"
      }
    };
  }

  // Detect language from text
  detectLanguage(text) {
    // Simple language detection based on character patterns
    const patterns = {
      ar: /[\u0600-\u06FF]/,
      hi: /[\u0900-\u097F]/,
      zh: /[\u4e00-\u9fff]/,
      ru: /[\u0400-\u04FF]/,
      ja: /[\u3040-\u309F\u30A0-\u30FF]/,
      es: /[ñáéíóúü]/i,
      fr: /[àâäéèêëïîôöùûüÿç]/i,
      de: /[äöüß]/i,
      pt: /[ãõáéíóúâêô]/i
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    // Check for common words in different languages
    const commonWords = {
      es: ['hola', 'gracias', 'cómo estás', 'estoy'],
      fr: ['bonjour', 'merci', 'comment allez', 'je suis'],
      de: ['hallo', 'danke', 'wie geht', 'ich bin'],
      hi: ['नमस्ते', 'धन्यवाद', 'आप कैसे', 'मैं हूँ'],
      pt: ['olá', 'obrigado', 'como está', 'estou'],
      it: ['ciao', 'grazie', 'come stai', 'sono'],
      ja: ['こんにちは', 'ありがとう', '元気ですか'],
      ru: ['привет', 'спасибо', 'как дела', 'я'],
      ar: ['مرحبا', 'شكرا', 'كيف حالك', 'أنا']
    };

    const lowerText = text.toLowerCase();
    for (const [lang, words] of Object.entries(commonWords)) {
      if (words.some(word => lowerText.includes(word))) {
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  // Get translation for a key in a specific language
  translate(key, language = 'en') {
    if (this.translations[language] && this.translations[language][key]) {
      return this.translations[language][key];
    }
    return this.translations.en[key] || key;
  }

  // Format text with language parameters
  formatTranslation(text, params = {}) {
    let formattedText = text;
    for (const [key, value] of Object.entries(params)) {
      formattedText = formattedText.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return formattedText;
  }

  // Get supported languages list
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Check if language is RTL
  isRTL(language) {
    return this.supportedLanguages[language]?.rtl || false;
  }

  // Get language info
  getLanguageInfo(language) {
    return this.supportedLanguages[language];
  }

  // Translate sentiment to appropriate response style
  getSentimentResponse(sentiment, language = 'en') {
    const responses = {
      sad: {
        en: "I understand you're feeling down. That's completely okay, and I'm here to support you.",
        es: "Entiendo que te sientas mal. Está completamente bien, y estoy aquí para apoyarte.",
        fr: "Je comprends que vous vous sentiez mal. C'est tout à fait normal, et je suis là pour vous soutenir.",
        hi: "मैं समझता हूं कि आप उदास महसूस कर रहे हैं। यह पूरी तरह से ठीक है, और मैं आपका समर्थन करने के लिए यहां हूं।"
      },
      happy: {
        en: "That's wonderful to hear! Your happiness is contagious!",
        es: "¡Es maravilloso escuchar eso! ¡Tu felicidad es contagiosa!",
        fr: "C'est merveilleux à entendre ! Votre bonheur est contagieux !",
        hi: "यह सुनकर बहुत अच्छा लगा! आपकी खुशी संक्रामक है!"
      },
      stressed: {
        en: "I can see you're feeling stressed. Let's take a moment together to breathe.",
        es: "Veo que te sientes estresado. Tomemos un momento juntos para respirar.",
        fr: "Je vois que vous vous sentez stressé. Prenons un moment ensemble pour respirer.",
        hi: "मैं देख सकता हूं कि आप तनावग्रस्त महसूस कर रहे हैं। चलिए एक साथ सांस लेने के लिए क्षण लेते हैं।"
      },
      neutral: {
        en: "Thank you for sharing that with me. I'm here to listen.",
        es: "Gracias por compartir eso conmigo. Estoy aquí para escuchar.",
        fr: "Merci de partager cela avec moi. Je suis là pour écouter.",
        hi: "इसके साथ मुझे साझा करने के लिए धन्यवाद। मैं सुनने के लिए यहां हूं।"
      }
    };

    return responses[sentiment]?.[language] || responses[sentiment]?.en || "I'm here to support you.";
  }

  // Get culturally appropriate video suggestions
  getCulturalContentPreferences(language) {
    const preferences = {
      en: { categories: ['comedy', 'animals', 'inspirational'], duration: '3-5 minutes' },
      es: { categories: ['familia', 'música', 'inspiración'], duration: '3-6 minutes' },
      fr: { categories: ['humour', 'nature', 'inspiration'], duration: '4-6 minutes' },
      hi: { categories: ['परिवार', 'संगीत', 'प्रेरणा'], duration: '5-8 minutes' },
      ar: { categories: ['عائلة', 'موسيقى', 'إلهام'], duration: '4-7 minutes' }
    };

    return preferences[language] || preferences.en;
  }

  // Generate appropriate closing based on language and culture
  getClosing(language, mood) {
    const closings = {
      en: {
        sad: "Remember, it's okay to not be okay. I'm always here for you.",
        happy: "Keep shining your light! Come back anytime.",
        stressed: "Take care of yourself. Small steps matter.",
        neutral: "Thank you for our conversation. Be well."
      },
      es: {
        sad: "Recuerda, está bien no estar bien. Siempre estoy aquí para ti.",
        happy: "¡Sigue brillando tu luz! Vuelve cuando quieras.",
        stressed: "Cuídate. Los pequeños pasos importan.",
        neutral: "Gracias por nuestra conversación. Estar bien."
      },
      hi: {
        sad: "याद रखें, ठीक न होना ठीक है। मैं हमेशा आपके लिए यहां हूं।",
        happy: "अपनी रोशनी चमकाते रहें! कभी भी वापस आएं।",
        stressed: "अपना ख्याल रखें। छोटे कदम मायने रखते हैं।",
        neutral: "हमारी बातचीत के लिए धन्यवाद। अच्छा रहें।"
      }
    };

    return closings[language]?.[mood] || closings.en[mood] || "Take care and be well.";
  }
}

export default new LanguageService();