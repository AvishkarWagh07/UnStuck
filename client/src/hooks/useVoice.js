import { useEffect, useRef, useState } from 'react';

// wrapper around the browser speech api
// canSpeak stays false on browsers that do not have it
export default function useVoice(onText) {
  const [isListening, setIsListening] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const speechRef = useRef(null);
  // keep the callback in a ref so the recogniser always calls the latest one
  const handlerRef = useRef(onText);

  handlerRef.current = onText;

  useEffect(() => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;

    const recog = new Speech();
    recog.lang = 'en-IN';
    recog.continuous = false;
    recog.interimResults = false;

    recog.onresult = (event) => {
      const said = event.results[0][0].transcript;
      if (handlerRef.current) handlerRef.current(said);
      setVoiceError('');
    };

    recog.onerror = () => {
      setIsListening(false);
      setVoiceError('I could not hear that. Try again, or just type it out.');
    };

    recog.onend = () => setIsListening(false);

    speechRef.current = recog;
    setCanSpeak(true);

    return () => {
      recog.onresult = null;
      recog.onerror = null;
      recog.onend = null;
      recog.abort();
    };
  }, []);

  function toggle() {
    const recog = speechRef.current;
    if (!recog) return;

    if (isListening) {
      recog.stop();
      setIsListening(false);
      return;
    }

    setVoiceError('');
    try {
      recog.start();
      setIsListening(true);
    } catch (err) {
      // usually already running, not worth shouting about
      console.log('voice start problem', err);
      setIsListening(false);
    }
  }

  return { isListening, canSpeak, voiceError, setVoiceError, toggle };
}
