import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Globe, 
  MapPin, 
  Volume2, 
  Loader2, 
  Download, 
  RefreshCw, 
  Trash2, 
  Upload, 
  Check, 
  ExternalLink,
  MessageSquare,
  Radio,
  Sliders,
  Play,
  Pause,
  LogIn
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface LocalBandiAISuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'chat' | 'voice' | 'image' | 'video' | 'music';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingChunks?: any[];
  timestamp: string;
}

export const LocalBandiAISuiteModal: React.FC<LocalBandiAISuiteModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'chat'
}) => {
  const { user, login } = useFirebase();
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'image' | 'video' | 'music'>(initialTab);

  // --- CHAT STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "👋 **Welcome to Local Bandi AI Assistant!**\n\nI can assist you with real-time hyper-local grocery shopping, checking branch coverage, searching Google for market rates, and exploring nearby stores with Google Maps.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [useMapsGrounding, setUseMapsGrounding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- VOICE (LIVE API) STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceReply, setVoiceReply] = useState('');
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  // --- IMAGE STUDIO STATE ---
  const [imagePrompt, setImagePrompt] = useState('Fresh farm organic mangoes and vegetables in a traditional Indian bamboo basket');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isImageGenerating, setIsImageGenerating] = useState(false);

  // --- VEO VIDEO STATE ---
  const [videoPrompt, setVideoPrompt] = useState('Cinematic smooth dolly shot through local Indian marketplace vegetables');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);

  // --- LYRIA MUSIC STATE ---
  const [musicPrompt, setMusicPrompt] = useState('Uplifting Indian marketplace festive morning chime with acoustic tabla and flute');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isMusicGenerating, setIsMusicGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // Handle Voice recognition
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. You can still type your questions in the Chat tab!");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceTranscript("Listening to your voice...");
      };

      recognition.onresult = async (event: any) => {
        const spoken = event.results[0][0].transcript;
        setVoiceTranscript(spoken);
        setIsRecording(false);
        setIsVoiceProcessing(true);

        try {
          const res = await fetch('/api/gemini/voice-conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ speechText: spoken })
          });
          const data = await res.json();
          setVoiceReply(data.replyText || "Voice instruction received.");

          // If raw audio base64 returned, play it
          if (data.audioData) {
            const audioBlob = new Blob([Uint8Array.from(atob(data.audioData), c => c.charCodeAt(0))], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const snd = new Audio(audioUrl);
            snd.play();
          } else {
            // Web Speech Synthesis playback
            if ('speechSynthesis' in window) {
              const utter = new SpeechSynthesisUtterance(data.replyText || spoken);
              utter.lang = 'en-IN';
              window.speechSynthesis.speak(utter);
            }
          }
        } catch (e) {
          setVoiceReply("Voice processed: " + spoken);
        } finally {
          setIsVoiceProcessing(false);
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  // Send Chat message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      // Get user coords if maps grounding is on
      let lat: number | undefined;
      let lng: number | undefined;
      if (useMapsGrounding && navigator.geolocation) {
        try {
          const pos: any = await new Promise((res, rej) => 
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (posErr) {
          // Default to Khammam center
          lat = 17.2473;
          lng = 80.1514;
        }
      }

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6).map(m => ({ role: m.role, text: m.text })),
          useSearch: useSearchGrounding,
          useMaps: useMapsGrounding,
          lat,
          lng
        })
      });

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text || "I'm here to assist with Local Bandi Multi Services.",
        groundingChunks: data.groundingChunks || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, modelMsg]);

      // Save to Firestore if user logged in
      if (user && db) {
        addDoc(collection(db, 'users', user.uid, 'ai_chats'), {
          userMessage: textToSend,
          modelReply: data.text,
          createdAt: serverTimestamp()
        }).catch(() => {});
      }
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: "I am ready to help you with store hours, local items, and order deliveries across Khammam and surrounding zones.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Generate Image
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isImageGenerating) return;
    setIsImageGenerating(true);
    try {
      const res = await fetch('/api/gemini/create-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: imageAspectRatio,
          sourceImage: sourceImageBase64
        })
      });
      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsImageGenerating(false);
    }
  };

  // Generate Video (Veo)
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || isVideoGenerating) return;
    setIsVideoGenerating(true);
    try {
      const res = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio
        })
      });
      const data = await res.json();
      if (data.videoUrl) {
        setGeneratedVideoUrl(data.videoUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVideoGenerating(false);
    }
  };

  // Generate Music (Lyria)
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || isMusicGenerating) return;
    setIsMusicGenerating(true);
    try {
      const res = await fetch('/api/gemini/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: musicPrompt })
      });
      const data = await res.json();
      if (data.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsMusicGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10005] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl h-[90vh] bg-slate-950 border border-purple-500/20 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* MODAL HEADER */}
        <header className="px-6 py-4 bg-slate-900/90 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-white">
                  Local Bandi AI Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Multimodal Suite
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Grounded Search • Live Voice • Image Studio • Veo Video • Lyria Music
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
              <button
                onClick={login}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 border border-white/10"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Sign-In</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 truncate max-w-[120px]">
                  {user.displayName || user.email || 'Verified Account'}
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* TAB NAVIGATION BAR */}
        <nav className="px-6 py-2.5 bg-slate-900/50 border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTab === 'chat' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Gemini Chat & Search</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTab === 'voice' 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Voice (gemini-3.8-live)</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTab === 'image' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Create & Edit Images</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTab === 'video' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Veo Video Animator</span>
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTab === 'music' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Lyria Music Studio</span>
          </button>
        </nav>

        {/* TAB CONTENT PANELS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          
          {/* TAB 1: GEMINI CHAT (WITH SEARCH & MAPS GROUNDING) */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col justify-between space-y-4">
              {/* Grounding Controls Pill */}
              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Grounding Tools:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setUseSearchGrounding(!useSearchGrounding);
                      if (!useSearchGrounding) setUseMapsGrounding(false);
                    }}
                    className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
                      useSearchGrounding 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Google Search</span>
                  </button>

                  <button
                    onClick={() => {
                      setUseMapsGrounding(!useMapsGrounding);
                      if (!useMapsGrounding) setUseSearchGrounding(false);
                    }}
                    className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
                      useMapsGrounding 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Google Maps</span>
                  </button>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-3xl p-4 text-xs font-medium leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Display Grounding Chunks & Citations */}
                      {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Grounded References & Locations
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.groundingChunks.map((chunk: any, i: number) => {
                              const title = chunk.web?.title || chunk.maps?.title || `Source ${i+1}`;
                              const uri = chunk.web?.uri || chunk.maps?.uri;
                              if (!uri) return null;
                              return (
                                <a
                                  key={i}
                                  href={uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-purple-300 rounded-lg text-[8.5px] font-bold flex items-center gap-1 border border-purple-500/20 transition"
                                >
                                  <span>{title}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] text-slate-500 font-bold mt-1 px-2">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2 p-3 bg-slate-900 border border-white/10 rounded-2xl text-purple-400 text-xs w-fit">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span className="font-bold text-[10px] uppercase tracking-wider">
                      Gemini is generating response...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Starter Quick Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  "What are fresh vegetable prices today?",
                  "Track my nearest Local Bandi store in Khammam",
                  "Suggest a healthy dinner recipe with local vegetables",
                  "How does 30-min hyper-local delivery work?"
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[9px] font-bold whitespace-nowrap border border-white/5 active:scale-95 transition cursor-pointer"
                  >
                    💡 {chip}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={useMapsGrounding ? "Ask about places, routes, stores..." : "Ask Gemini about grocery deals, recipes, orders..."}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isChatLoading}
                  className="px-5 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg shadow-purple-600/30 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE VOICE CONVERSATIONS (gemini-3.8-live) */}
          {activeTab === 'voice' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto py-8">
              <div className="relative">
                <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isRecording 
                    ? 'bg-rose-500/20 border-4 border-rose-500 shadow-2xl shadow-rose-500/50 scale-105' 
                    : 'bg-slate-900 border-2 border-white/10'
                }`}>
                  <button
                    onClick={toggleVoiceRecording}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white transition active:scale-95 shadow-lg ${
                      isRecording ? 'bg-rose-600 animate-pulse' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10 text-rose-400" />}
                  </button>
                </div>
                {isRecording && (
                  <div className="absolute -inset-2 rounded-full border border-rose-500/40 animate-ping" />
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wider text-white">
                  {isRecording ? "Live Listening Active..." : "Tap Microphone to Talk"}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Powered by <span className="text-rose-400 font-bold">gemini-3.8-live</span>. Speak naturally in English, Hindi, or Telugu to ask about products, check stock, or track delivery.
                </p>
              </div>

              {/* Voice Transcript Card */}
              {voiceTranscript && (
                <div className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-left space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">You Said:</span>
                  <p className="text-xs font-medium text-slate-200">{voiceTranscript}</p>
                </div>
              )}

              {/* Voice Assistant Reply */}
              {isVoiceProcessing ? (
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing voice response...</span>
                </div>
              ) : voiceReply ? (
                <div className="w-full p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl text-left space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" /> AI Response:
                  </span>
                  <p className="text-xs font-medium text-slate-100">{voiceReply}</p>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: CREATE & EDIT IMAGES (gemini-3.1-flash-image) */}
          {activeTab === 'image' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Describe the Image to Create or Edit:
                </label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                  placeholder="e.g., Delicious steaming Hyderabadi biryani in a clay pot with fresh mint garnish..."
                />
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Aspect Ratio:</span>
                <div className="flex gap-2">
                  {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setImageAspectRatio(ratio)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition ${
                        imageAspectRatio === ratio 
                          ? 'bg-amber-600 text-white shadow-md' 
                          : 'bg-slate-900 text-slate-400 border border-white/5'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGenerateImage}
                disabled={isImageGenerating || !imagePrompt.trim()}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-amber-600/30 cursor-pointer"
              >
                {isImageGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating with gemini-3.1-flash-image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create / Edit Image</span>
                  </>
                )}
              </button>

              {/* Output Preview */}
              {generatedImageUrl && (
                <div className="p-4 bg-slate-900 border border-white/10 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      Generated Creative Asset
                    </span>
                    <a
                      href={generatedImageUrl}
                      download="local-bandi-ai-asset.png"
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center max-h-[350px]">
                    <img 
                      src={generatedImageUrl} 
                      alt="AI generated artwork" 
                      className="w-full h-auto object-contain max-h-[350px]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VEO VIDEO ANIMATOR (veo-3.1-fast-generate-preview) */}
          {activeTab === 'video' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Video Animation Prompt:
                </label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  placeholder="e.g., Smooth camera pan across freshly arranged fruit baskets with golden morning sunlight..."
                />
              </div>

              {/* Aspect Ratio (16:9 Landscape or 9:16 Portrait) */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Video Orientation (16:9 Landscape or 9:16 Reels/Shorts):
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVideoAspectRatio('16:9')}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition ${
                      videoAspectRatio === '16:9' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-slate-900 text-slate-400 border border-white/5'
                    }`}
                  >
                    16:9 (Landscape)
                  </button>
                  <button
                    onClick={() => setVideoAspectRatio('9:16')}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition ${
                      videoAspectRatio === '9:16' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-slate-900 text-slate-400 border border-white/5'
                    }`}
                  >
                    9:16 (Portrait / Reels)
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerateVideo}
                disabled={isVideoGenerating || !videoPrompt.trim()}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                {isVideoGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering with veo-3.1-fast-generate-preview...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Animate Video ({videoAspectRatio})</span>
                  </>
                )}
              </button>

              {/* Video Player Output */}
              {generatedVideoUrl && (
                <div className="p-4 bg-slate-900 border border-white/10 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                      Generated Veo Animation
                    </span>
                    <a
                      href={generatedVideoUrl}
                      download="veo-animation.mp4"
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition"
                    >
                      <Download className="w-3 h-3" /> Download MP4
                    </a>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                    <video
                      src={generatedVideoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className={`max-h-[380px] w-full object-contain ${
                        videoAspectRatio === '9:16' ? 'max-w-[260px]' : ''
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LYRIA MUSIC GENERATOR (lyria-3-clip-preview) */}
          {activeTab === 'music' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Describe the Music Clip or Promotional Jingle:
                </label>
                <textarea
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  placeholder="e.g., Upbeat Diwali celebratory acoustic chime with sitar and temple bells..."
                />
              </div>

              {/* Music Presets */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Quick Audio Styles:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Festive Diwali marketplace celebratory chime",
                    "Smooth ambient chill background tune",
                    "High energy grocery morning flash sale jingle",
                    "Soothing organic farm flute melody"
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMusicPrompt(preset)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[9px] font-bold border border-white/5 active:scale-95 transition cursor-pointer"
                    >
                      🎵 {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateMusic}
                disabled={isMusicGenerating || !musicPrompt.trim()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                {isMusicGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Streaming track with lyria-3-clip-preview...</span>
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4" />
                    <span>Generate Music Track (30s)</span>
                  </>
                )}
              </button>

              {/* Audio Player Card */}
              {generatedAudioUrl && (
                <div className="p-5 bg-slate-900 border border-white/10 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        Lyria Generated Clip
                      </span>
                      <p className="text-xs font-bold text-white truncate max-w-sm mt-0.5">
                        {musicPrompt}
                      </p>
                    </div>
                    <a
                      href={generatedAudioUrl}
                      download="lyria-marketplace-clip.wav"
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition"
                    >
                      <Download className="w-3 h-3" /> Download Audio
                    </a>
                  </div>

                  <audio
                    ref={audioRef}
                    src={generatedAudioUrl}
                    controls
                    className="w-full h-11 rounded-xl"
                  />
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <footer className="px-6 py-3 bg-slate-900/90 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>AI Studio Engine 3.5 & Multimodal Runtime Active</span>
          </div>
          <span className="text-slate-500 font-mono">Ethics & Play Store Ready</span>
        </footer>
      </motion.div>
    </div>
  );
};
export default LocalBandiAISuiteModal;
