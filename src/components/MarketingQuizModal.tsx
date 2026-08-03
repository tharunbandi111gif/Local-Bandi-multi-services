import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Timer, 
  Trophy, 
  Gift, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Copy, 
  Share2, 
  ShoppingBag, 
  X, 
  HelpCircle, 
  ChevronRight, 
  Flame, 
  Coins, 
  Clock, 
  Award, 
  Volume2, 
  VolumeX,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export const DEFAULT_LOW_PRICE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the ultra-low price for daily fresh farm milk packets on Local Bandi Multi Services?",
    options: ["₹28 per packet", "₹75 per packet", "₹120 per packet", "₹180 per packet"],
    correctIndex: 0,
    explanation: "Local Bandi guarantees daily fresh farm milk delivered at the town's lowest price of ₹28!",
    category: "Low Price Grocery"
  },
  {
    id: 2,
    question: "At what low starting price can you book expert AC & Appliance Repair Services on Local Bandi?",
    options: ["₹1,999", "Starting at ₹399", "₹3,000", "₹5,000"],
    correctIndex: 1,
    explanation: "Verified local mechanics arrive at your home for repairs starting at just ₹399!",
    category: "Low Price Services"
  },
  {
    id: 3,
    question: "What is the lowest starting base fare for local Bike & Auto Taxi booking on Local Bandi Multi Services?",
    options: ["₹25 Base Fare", "₹250 Base Fare", "₹500 Base Fare", "₹1000"],
    correctIndex: 0,
    explanation: "Book trusted local rides with transparent fare breakdown starting at just ₹25!",
    category: "Multi Services"
  },
  {
    id: 4,
    question: "What is the maximum discount offer percentage you can unlock on the 40-Sec Speed Quiz?",
    options: ["100% OFF", "Up to 25% OFF + 100% Cashback Coins", "0% OFF", "5% OFF"],
    correctIndex: 1,
    explanation: "Score 3/3 for 25% OFF, 2/3 for 15% OFF, and 8% OFF for participating + 100% Cashback Coins!",
    category: "Quiz Offers"
  },
  {
    id: 5,
    question: "What is the price for fresh daily farm eggs delivered to your door in Khammam?",
    options: ["₹18 per egg", "₹6 per egg", "₹30 per egg", "₹50 per egg"],
    correctIndex: 1,
    explanation: "Fresh protein delivered daily from local farms at wholesale prices starting at ₹6!",
    category: "Low Price Essentials"
  }
];

export function getStoredQuizQuestions(): QuizQuestion[] {
  if (typeof window === 'undefined') return DEFAULT_LOW_PRICE_QUIZ_QUESTIONS;
  try {
    const saved = localStorage.getItem('custom_quiz_questions');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Error loading custom quiz questions", e);
  }
  return DEFAULT_LOW_PRICE_QUIZ_QUESTIONS;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = DEFAULT_LOW_PRICE_QUIZ_QUESTIONS;

interface MarketingQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoupon?: (couponCode: string) => void;
  userCoins?: number;
  onAddCoins?: (amount: number) => void;
}

export const MarketingQuizModal: React.FC<MarketingQuizModalProps> = ({
  isOpen,
  onClose,
  onApplyCoupon,
  userCoins = 0,
  onAddCoins
}) => {
  const TOTAL_TIME = 40; // 40-second speed quiz
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed' | 'timeout'>('intro');
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TIME);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeQuestionList, setActiveQuestionList] = useState<QuizQuestion[]>([]);

  // Sound synthesis cue helper
  const playBeep = (freq: number = 440, type: OscillatorType = 'sine', duration: number = 0.15) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignore web audio restrictions
    }
  };

  // Load questions dynamically from localStorage / stored questions
  useEffect(() => {
    const handleUpdate = () => {
      const questions = getStoredQuizQuestions();
      setActiveQuestionList(questions);
    };
    handleUpdate();
    window.addEventListener('quiz_questions_updated', handleUpdate);
    return () => window.removeEventListener('quiz_questions_updated', handleUpdate);
  }, []);

  // Select 3 random questions when quiz starts
  const startQuiz = () => {
    const questions = getStoredQuizQuestions();
    const shuffled = [...questions].sort(() => 0.5 - Math.random()).slice(0, Math.min(3, questions.length));
    setActiveQuestionList(shuffled);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setScore(0);
    setTimeLeft(TOTAL_TIME);
    setGameState('playing');
    setCopiedCode(false);
    playBeep(880, 'triangle', 0.2);
  };

  // 40-Second Countdown Timer
  useEffect(() => {
    let timer: any;
    if (gameState === 'playing') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('timeout');
            playBeep(220, 'sawtooth', 0.4);
            return 0;
          }
          if (prev <= 10) {
            playBeep(600, 'sine', 0.08); // warning tick
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  const handleSelectOption = (optionIndex: number) => {
    if (gameState !== 'playing') return;

    const currentQ = activeQuestionList[currentQuestionIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;
    
    const updatedAnswers = [...selectedAnswers, optionIndex];
    setSelectedAnswers(updatedAnswers);

    let newScore = score;
    if (isCorrect) {
      newScore += 1;
      setScore(newScore);
      playBeep(1046.5, 'sine', 0.2); // high C note victory
    } else {
      playBeep(300, 'sawtooth', 0.25);
    }

    if (currentQuestionIndex + 1 < activeQuestionList.length) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 400);
    } else {
      // Quiz Finished!
      setTimeout(() => {
        finishQuiz(newScore);
      }, 400);
    }
  };

  const finishQuiz = (finalScore: number) => {
    setGameState('completed');
    const coinsEarned = finalScore === 3 ? 50 : finalScore === 2 ? 25 : 10;
    if (onAddCoins) {
      onAddCoins(coinsEarned);
    }
    playBeep(1318.5, 'triangle', 0.4); // E6 note triumph
  };

  // Determine Reward Code & Details (Below 25% discount rules: 3/3 => 25%, 2/3 => 15%, 1/3 => 8%)
  const getRewardDetails = () => {
    if (gameState === 'timeout' && score < 1) {
      return {
        title: "Good Effort!",
        subtitle: "You ran out of time, but here is a special participant reward!",
        couponCode: "QUIZ08OFF",
        discountText: "FLAT 8% OFF on Next Order",
        coins: 10,
        badgeColor: "bg-amber-500",
        badgeText: "Bronze Reward (8% OFF)"
      };
    }

    if (score === 3) {
      return {
        title: "🎉 PERFECT 3/3 SCORE!",
        subtitle: `Incredible speed! Solved in ${TOTAL_TIME - timeLeft}s! Unlocked Maximum 25% OFF Coupon!`,
        couponCode: "QUIZ25OFF",
        discountText: "FLAT 25% OFF on Order + 100% Cashback Coins",
        coins: 50,
        badgeColor: "bg-emerald-500",
        badgeText: "Gold Grand Winner (25% OFF)"
      };
    } else if (score === 2) {
      return {
        title: "🌟 GREAT JOB! 2/3 SCORE!",
        subtitle: "Fast thinking! You won a 15% OFF Super Saver Discount Coupon!",
        couponCode: "QUIZ15OFF",
        discountText: "FLAT 15% OFF on Order + 25 Super Coins",
        coins: 25,
        badgeColor: "bg-indigo-500",
        badgeText: "Silver Winner (15% OFF)"
      };
    } else {
      return {
        title: "🎟️ SPEED PARTICIPANT!",
        subtitle: "You won an 8% OFF Special Discount Coupon! Practice to score 3/3 tomorrow!",
        couponCode: "QUIZ08OFF",
        discountText: "FLAT 8% OFF on Order + 10 Super Coins",
        coins: 10,
        badgeColor: "bg-yellow-500",
        badgeText: "Participant Reward (8% OFF)"
      };
    }
  };

  const reward = getRewardDetails();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(reward.couponCode);
    setCopiedCode(true);
    playBeep(900, 'sine', 0.1);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleApplyAndClose = () => {
    if (onApplyCoupon) {
      onApplyCoupon(reward.couponCode);
    }
    onClose();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `⚡ I scored ${score}/3 in just ${TOTAL_TIME - timeLeft}s on the Khammam Super App 40-Sec Speed Quiz and won a ₹100 discount coupon (${reward.couponCode})! Can you beat my time? Play now on Khammam Super App!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-white my-auto">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">40-Sec Speed Quiz</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold uppercase">
                  Marketing Rewards
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400">Answer 3 questions in 40s to win instant discount coupons!</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              title={soundEnabled ? "Mute quiz audio" : "Enable quiz audio"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* INTRO SCREEN */}
        {gameState === 'intro' && (
          <div className="p-6 text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30">
                <Timer className="w-10 h-10 stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>40 Seconds on the Clock!</span>
              </span>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Low Price Trivia & Speed Challenge
              </h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Test your local low-price product knowledge & speed! Answer 3 questions in under <strong className="text-amber-400 font-black">40 seconds</strong> to win up to <strong className="text-emerald-400 font-black">25% OFF Discount Coupons</strong> + 100% Cashback Coins!
              </p>
            </div>

            {/* Prize Breakdown Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-white/5 text-center">
              <div className="p-2 bg-slate-900 rounded-xl border border-emerald-500/30">
                <Trophy className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-[11px] font-black text-emerald-400">3/3 Score</div>
                <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">25% OFF + 50 Coins</div>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl border border-indigo-500/30">
                <Sparkles className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <div className="text-[11px] font-black text-indigo-400">2/3 Score</div>
                <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">15% OFF + 25 Coins</div>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl border border-amber-500/30">
                <Gift className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-[11px] font-black text-amber-400">1/3 Score</div>
                <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">8% OFF + 10 Coins</div>
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              <span>Start 40s Quiz Challenge Now</span>
            </button>
          </div>
        )}

        {/* PLAYING SCREEN */}
        {gameState === 'playing' && activeQuestionList.length > 0 && (
          <div className="p-6 space-y-5">
            
            {/* Top Timer & Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-extrabold">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>Question {currentQuestionIndex + 1} of {activeQuestionList.length}</span>
                </span>

                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-sm border ${
                  timeLeft <= 10 
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                  <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}s</span>
                </span>
              </div>

              {/* Progress bar representing time remaining out of 40s */}
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-white/10">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 10 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                  }`}
                  style={{ width: `${(timeLeft / TOTAL_TIME) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-4 shadow-inner">
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[9.5px] font-mono font-bold uppercase tracking-wider">
                Category: {activeQuestionList[currentQuestionIndex].category}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white leading-relaxed">
                {activeQuestionList[currentQuestionIndex].question}
              </h3>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-2.5">
              {activeQuestionList[currentQuestionIndex].options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left border transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-xl bg-slate-900 border border-white/20 flex items-center justify-center text-[11px] font-mono font-bold text-amber-400 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* COMPLETED OR TIMEOUT SCREEN */}
        {(gameState === 'completed' || gameState === 'timeout') && (
          <div className="p-6 text-center space-y-5">
            <div className="space-y-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-mono font-bold uppercase tracking-wider ${reward.badgeColor}`}>
                <Award className="w-3.5 h-3.5" />
                <span>{reward.badgeText}</span>
              </span>

              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {reward.title}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                {reward.subtitle}
              </p>
            </div>

            {/* Score & Coins Summary */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-white/10">
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Questions Solved</div>
                <div className="text-lg font-black text-amber-400">{score} / 3 Correct</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Super Coins Won</div>
                <div className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1">
                  <Coins className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>+{reward.coins} Coins</span>
                </div>
              </div>
            </div>

            {/* Generated Promo Coupon Box */}
            <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-dashed border-amber-400/60 rounded-2xl p-4 space-y-3">
              <div>
                <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-amber-300">
                  Your Claimable Marketing Promo Code:
                </span>
                <div className="text-xl font-mono font-black text-amber-400 tracking-wider mt-1 select-all">
                  {reward.couponCode}
                </div>
                <p className="text-xs font-bold text-slate-200 mt-1">{reward.discountText}</p>
              </div>

              {/* Terms & Conditions Notice (Inside Modal) */}
              <div className="p-3 bg-slate-950/90 rounded-xl border border-amber-500/30 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Offer Terms &amp; Conditions</span>
                </div>
                <ul className="text-[10px] text-slate-300 space-y-1 list-disc list-inside font-medium leading-relaxed">
                  <li>Minimum order subtotal must be <strong className="text-amber-400 font-bold">₹499 or above</strong> at checkout.</li>
                  <li>Discount percentage applies to <strong className="text-emerald-400 font-bold">ONLY 1 product priced below ₹100</strong> in your cart.</li>
                  <li>Winner gets <strong className="text-yellow-400 font-bold">100% Cashback Super Coins</strong> added automatically!</li>
                </ul>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md shadow-emerald-600/30"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Score</span>
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleApplyAndClose}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Apply Coupon to Cart & Shop Now</span>
              </button>

              <button
                onClick={startQuiz}
                className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again (Retry Challenge)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// COMPACT FLOATING MARKETING BANNER FOR CUSTOMER HOME SCREEN
interface MarketingQuizFloatingBannerProps {
  onOpenQuiz: () => void;
}

export const MarketingQuizFloatingBanner: React.FC<MarketingQuizFloatingBannerProps> = ({ onOpenQuiz }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full my-3 px-4"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-0.5 shadow-xl shadow-amber-500/10">
        <div className="bg-slate-950 rounded-[22px] p-3.5 sm:p-4 flex items-center justify-between flex-wrap gap-3">
          
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shrink-0 shadow-lg shadow-amber-500/30">
              <Zap className="w-6 h-6 fill-slate-950 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-400 font-mono text-[9px] font-black px-2 py-0.5 rounded-md border border-amber-500/30 uppercase tracking-wider">
                  ⚡ 40s Speed Quiz
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Coins className="w-3 h-3 fill-emerald-400" /> +50 Super Coins
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight mt-0.5">
                Play & Get Up to 100% Cashback &amp; 25% OFF!
              </h4>
              <p className="text-[10.5px] text-slate-400 leading-tight">
                Answer 3 quick low-price product trivia questions in 40 seconds. Win 25%, 15% or 8% OFF!
              </p>
            </div>
          </div>

          <button
            onClick={onOpenQuiz}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ml-auto"
            id="open-40sec-marketing-quiz-btn"
          >
            <span>Play Quiz (40s)</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>

        </div>
      </div>
    </motion.div>
  );
};
