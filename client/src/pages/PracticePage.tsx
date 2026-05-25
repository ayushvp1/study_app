import React, { useState, useEffect, useRef } from "react";
import { client } from "../lib/api";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "../components/ui/minimal";
import { 
  BookOpen, 
  ChevronDown, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  VolumeX, 
  Grid, 
  HelpCircle, 
  Trophy, 
  RefreshCw, 
  ArrowRight, 
  Play, 
  ArrowLeft,
  Mic,
  LogOut,
  Keyboard,
  Star
} from "lucide-react";

type PracticeTopic = {
  id: string;
  topic: string;
  content: string | null;
  totalQuestions: number;
  latestCreatedAt: string;
  questions: Array<{
    id: string;
    type: string;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation: string | null;
    status: string;
    createdAt: string;
  }>;
};

// Conversational English numbers converter for robust voice matching
const numberToWords = (num: number): string => {
  const ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
  if (num < 1000) {
    const hundredPart = ones[Math.floor(num / 100)] + " hundred";
    const remainder = num % 100;
    return remainder !== 0 ? hundredPart + " and " + numberToWords(remainder) : hundredPart;
  }
  return String(num);
};

const normalizeSpokenText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\band\b/g, " ")
    .replace(/\bhundread\b/g, "hundred")
    .replace(/\ba hundred\b/g, "one hundred")
    .replace(/\bone hundred\b/g, "one hundred")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

type MasteryLevel = {
  name: string;
  badge: string;
  color: string;
  glow: string;
  min: number;
};

const getMasteryLevel = (count: number): MasteryLevel => {
  if (count >= 10000) {
    return { name: "Transcender", badge: "🌌", color: "text-indigo-400 bg-indigo-950 border-indigo-800", glow: "shadow-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.3)]", min: 10000 };
  }
  if (count >= 1000) {
    return { name: "Conqueror", badge: "👑", color: "text-amber-400 bg-yellow-950 border-yellow-800", glow: "shadow-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]", min: 1000 };
  }
  if (count >= 500) {
    return { name: "Elder", badge: "🛡️", color: "text-slate-300 bg-slate-900 border-slate-700", glow: "shadow-slate-400/30 shadow-[0_0_10px_rgba(148,163,184,0.2)]", min: 500 };
  }
  if (count >= 100) {
    return { name: "Commoner", badge: "🏅", color: "text-orange-400 bg-amber-950 border-amber-800", glow: "shadow-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]", min: 100 };
  }
  if (count >= 10) {
    return { name: "Novice", badge: "🌱", color: "text-emerald-400 bg-zinc-800 border-zinc-700", glow: "shadow-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]", min: 10 };
  }
  return { name: "Initiate", badge: "🌾", color: "text-slate-400 bg-slate-900 border-white/5", glow: "", min: 0 };
};

const getNextLevelInfo = (count: number) => {
  if (count >= 10000) {
    return { nextName: "Ultimate Mastery", target: count, progressPercent: 100, remaining: 0 };
  }
  
  let currentMin = 0;
  let target = 10;
  let nextName = "Novice";
  
  if (count >= 1000) {
    currentMin = 1000;
    target = 10000;
    nextName = "Transcender";
  } else if (count >= 500) {
    currentMin = 500;
    target = 1000;
    nextName = "Conqueror";
  } else if (count >= 100) {
    currentMin = 100;
    target = 500;
    nextName = "Elder";
  } else if (count >= 10) {
    currentMin = 10;
    target = 100;
    nextName = "Commoner";
  }
  
  const range = target - currentMin;
  const currentProgress = count - currentMin;
  const progressPercent = Math.min(100, Math.max(0, (currentProgress / range) * 100));
  const remaining = target - count;
  
  return { nextName, target, progressPercent, remaining };
};

interface TableFact {
  trick: string;
  pattern: string;
  fact: string;
}

type PracticeTab = "tables" | "squares" | "cubes" | "modules";

const getDecadeStart = (num: number): number => {
  if (num <= 10) return 1;
  if (num <= 20) return 11;
  if (num <= 30) return 21;
  if (num <= 40) return 31;
  return 41;
};

const getCubeRangeStart = (num: number): number => {
  if (num <= 10) return 1;
  if (num <= 20) return 11;
  return 21;
};

const getTypeStars = (timeMs: number, isSquares: boolean): number => {
  const limit3 = isSquares ? 15000 : 30000;
  const limit2 = isSquares ? 30000 : 60000;
  if (timeMs <= limit3) return 3;
  if (timeMs <= limit2) return 2;
  return 1;
};

const getSquareFacts = (num: number): TableFact => {
  // Ending in 5 trick
  if (num % 10 === 5) {
    const tens = Math.floor(num / 10);
    return {
      trick: `For numbers ending in 5, multiply the tens digit by (tens digit + 1) and append 25! E.g. ${num}²: ${tens} × ${tens + 1} = ${tens * (tens + 1)} ➔ ${num * num}.`,
      pattern: `All perfect squares of numbers ending in 5 always end in exactly 25.`,
      fact: `${num} is a semi-prime multiple of 5, making its square properties highly symmetrical.`
    };
  }

  // Close to 50 trick
  if (num >= 40 && num <= 50) {
    const d = 50 - num;
    const firstPart = 25 - d;
    const secondPart = String(d * d).padStart(2, "0");
    return {
      trick: `For numbers close to 50, subtract the difference (50 - N) from 25, then append the square of that difference! E.g. ${num}² (diff ${d}): 25 - ${d} = ${firstPart}, and ${d}² = ${d*d} ➔ ${num*num}.`,
      pattern: `Squares of numbers in the 40s all start with a prefix between 16 and 24, ending with the squared difference from 50.`,
      fact: `${num} squared is ${num*num}, which is extremely close to the landmark value of 50² = 2500.`
    };
  }

  // Close to 10
  if (num <= 10) {
    return {
      trick: `Add the odd numbers! The square of N is the sum of the first N odd numbers. E.g. ${num}² = ${Array.from({length: num}, (_, i) => 2*i + 1).join(" + ")} = ${num*num}.`,
      pattern: `The difference between consecutive perfect squares increases by consecutive odd numbers: (N+1)² - N² = 2N + 1.`,
      fact: `${num} is one of the single-digit units that forms the baseline for all perfect squares.`
    };
  }

  // Base rounding identity trick: (N - d)(N + d) + d²
  const nearestTen = Math.round(num / 10) * 10;
  const d = Math.abs(num - nearestTen);
  const low = num - d;
  const high = num + d;
  return {
    trick: `Use the algebraic round-off trick: (N - d)(N + d) + d²! Choose d to round to ${nearestTen}. E.g. ${num}²: (${num} - ${d}) × (${num} + ${d}) + ${d}² = ${low} × ${high} + ${d*d} = ${low * high} + ${d*d} = ${num*num}.`,
    pattern: `The last digit of any perfect square can only ever be 0, 1, 4, 5, 6, or 9. It can never end in 2, 3, 7, or 8!`,
    fact: `Perfect squares like ${num}² = ${num*num} have an odd number of total mathematical divisors.`
  };
};

const getCubeFacts = (num: number): TableFact => {
  if (num <= 10) {
    return {
      trick: `Build cubes by multiplying the square first: ${num}^3 = ${num} x ${num} x ${num} = ${num * num} x ${num} = ${num * num * num}.`,
      pattern: `Small cubes grow fast: 1, 8, 27, 64, 125, 216... and the gap between them keeps increasing.`,
      fact: `${num} cubed represents the volume of a ${num} by ${num} by ${num} cube.`
    };
  }

  if (num % 10 === 5) {
    return {
      trick: `Numbers ending in 5 have easy cubes if you square first: ${num}^2 = ${num * num}, then multiply by ${num} again to get ${num * num * num}.`,
      pattern: `Cubes of numbers ending in 5 always end in 125 or 875 depending on the preceding digits.`,
      fact: `${num}^3 = ${num * num * num}, which makes ${num} a strong benchmark for mental volume calculations.`
    };
  }

  const nearestTen = Math.round(num / 10) * 10;
  const delta = num - nearestTen;
  return {
    trick: `Anchor to ${nearestTen} first: compute ${num}^2 = ${num * num}, then multiply by ${num}. Since ${num} is only ${Math.abs(delta)} away from ${nearestTen}, it is easier to estimate and verify ${num * num * num}.`,
    pattern: `The last digit of a cube tells you the last digit of its root uniquely: cubes ending in 1, 8, 7, 4, 5, 6, 3, 2, 9, 0 come from roots ending in 1-0 respectively.`,
    fact: `${num}^3 = ${num * num * num}, and cubes are the third-power numbers used in volume and 3D geometry.`
  };
};

const getPracticeMaxRows = (tab: PracticeTab): number => tab === "tables" ? 20 : 10;

const getPracticeRangeStart = (tab: PracticeTab, selectedNumber: number): number => {
  if (tab === "squares") return getDecadeStart(selectedNumber);
  if (tab === "cubes") return getCubeRangeStart(selectedNumber);
  return 1;
};

const getPracticeRowNumber = (tab: PracticeTab, selectedNumber: number, rowIndex: number): number => {
  if (tab === "tables") return selectedNumber;
  return getPracticeRangeStart(tab, selectedNumber) + rowIndex;
};

const getPracticeResult = (tab: PracticeTab, selectedNumber: number, rowIndex: number): number => {
  const value = getPracticeRowNumber(tab, selectedNumber, rowIndex);
  if (tab === "squares") return value * value;
  if (tab === "cubes") return value * value * value;
  return selectedNumber * (rowIndex + 1);
};

const getRecitationKey = (tab: PracticeTab, selectedNumber: number): number => {
  if (tab === "squares") return 100 + getDecadeStart(selectedNumber);
  if (tab === "cubes") return 200 + getCubeRangeStart(selectedNumber);
  return selectedNumber;
};

const getTableFacts = (num: number): TableFact => {
  const facts: Record<number, TableFact> = {
    12: {
      trick: "Multiply by 10 and add 2 times the number! E.g. 12 × 7 = 70 + 14 = 84.",
      pattern: "The units digits repeat in a perfect loop of five even numbers: 2, 4, 6, 8, 0.",
      fact: "A group of 12 is called a Dozen. A dozen dozens (12 × 12 = 144) is known as a Gross!"
    },
    13: {
      trick: "Multiply by 10 and add 3 times the number! E.g. 13 × 6 = 60 + 18 = 78.",
      pattern: "The sum of the digits follows a repeating sequence: 4, 8, 3, 7, 2, 6, 1, 5, 9...",
      fact: "13 is a prime number, meaning its products only share factors with the numbers you multiply them by."
    },
    14: {
      trick: "Think of it as doubling the Table of 7! E.g. 14 × 6 = (7 × 6) × 2 = 42 × 2 = 84.",
      pattern: "The last digits repeat in the sequence: 4, 8, 2, 6, 0.",
      fact: "14 is a companion number in geometry representing the vertices of a tetradecagon."
    },
    15: {
      trick: "Multiply by 10, then add half of that result! E.g. 15 × 8 = 80 + 40 = 120.",
      pattern: "The last digits alternate perfectly: 5, 0, 5, 0, 5, 0...",
      fact: "15 is a triangular number (sum of 1 to 5) and represents a quarter of an hour in clock mathematics."
    },
    16: {
      trick: "Double the number four times! E.g. 16 × 5: 5 ➔ 10 ➔ 20 ➔ 40 ➔ 80.",
      pattern: "The units digits follow a repeating five-step pattern: 6, 2, 8, 4, 0.",
      fact: "16 is the base of the Hexadecimal number system, widely used in computer programming and HTML colors."
    },
    17: {
      trick: "Multiply by 20 and subtract 3 times the number! E.g. 17 × 5 = 100 - 15 = 85.",
      pattern: "Being prime, its units digits will cycle through all numbers 0-9 before repeating.",
      fact: "17 is a Fermat Prime. Karl Friedrich Gauss proved a regular 17-sided polygon can be constructed with only a ruler and compass!"
    },
    18: {
      trick: "Think of it as doubling the Table of 9! E.g. 18 × 5 = (9 × 5) × 2 = 45 × 2 = 90.",
      pattern: "The digits of all products of 18 up to 9 always sum to 9! E.g. 1 + 8 = 9, 3 + 6 = 9, 5 + 4 = 9.",
      fact: "The units digit of the products decreases by exactly 2 each step: 8, 6, 4, 2, 0."
    },
    19: {
      trick: "Multiply by 20 and subtract the multiplier! E.g. 19 × 6 = (20 × 6) - 6 = 120 - 6 = 114.",
      pattern: "The tens digits go up by 2 (1, 3, 5, 7...) while the units digits go down by 1 (9, 8, 7, 6...).",
      fact: "19 is a prime number and is the atomic number of Potassium (K) on the periodic table."
    },
    20: {
      trick: "Double the number and append a zero! E.g. 20 × 8: 8 × 2 = 16 ➔ 160.",
      pattern: "The units digit is always 0, and the tens digits are always even numbers.",
      fact: "Our modern base-10 system was historically a base-20 vigesimal system in Mayan and Celtic cultures."
    },
    21: {
      trick: "Multiply by 20 and add the multiplier! E.g. 21 × 6 = 120 + 6 = 126.",
      pattern: "The units digit corresponds exactly to the multiplier! E.g. 21 × 3 = 63, 21 × 4 = 84.",
      fact: "21 is a Fibonacci number and represents the total sum of dots on a standard six-sided die."
    },
    22: {
      trick: "Think of it as doubling the Table of 11! E.g. 22 × 5 = 110.",
      pattern: "The digits repeat in pairs for single digits! E.g. 22 × 2 = 44, 22 × 3 = 66, 22 × 4 = 88.",
      fact: "22 divided by 7 (22/7) is widely used as a simple fraction approximation of Pi (π)."
    },
    23: {
      trick: "Multiply by 20 and add 3 times the multiplier! E.g. 23 × 5 = 100 + 15 = 115.",
      pattern: "The units digit alternates in a prime-based cycle through all digits.",
      fact: "23 is a prime number and humans have exactly 23 pairs of chromosomes in each cell."
    },
    24: {
      trick: "Think of it as doubling the Table of 12! E.g. 24 × 5 = 120.",
      pattern: "The last digits repeat in the sequence: 4, 8, 2, 6, 0.",
      fact: "There are exactly 24 hours in a standard day, making this table extremely useful for time calculations."
    },
    25: {
      trick: "Think of money quarters! Every 4 groups of 25 is exactly 100. E.g. 25 × 7 quarters = 175.",
      pattern: "The last two digits alternate in a beautiful four-step cycle: 25, 50, 75, 00.",
      fact: "25 is a square number (5 × 5) and is the smallest square that is the sum of two other squares ($3^2 + 4^2 = 5^2$)."
    },
    26: {
      trick: "Double the Table of 13! E.g. 26 × 4 = (13 × 4) × 2 = 52 × 2 = 104.",
      pattern: "The units digits cycle through: 6, 2, 8, 4, 0.",
      fact: "There are exactly 26 letters in the English alphabet, and 26 is the only number between a square (25) and a cube (27)."
    },
    27: {
      trick: "Multiply by 30 and subtract 3 times the multiplier! E.g. 27 × 5 = 150 - 15 = 135.",
      pattern: "The sum of the digits of the products is always 9 or 18! E.g. 2 + 7 = 9, 8 + 1 = 9, 1 + 3 + 5 = 9.",
      fact: "27 is a perfect cube ($3^3 = 3 × 3 × 3$) and represents the atomic number of Cobalt."
    },
    28: {
      trick: "Think of it as doubling the Table of 14! E.g. 28 × 5 = 140.",
      pattern: "The units digits repeat in the sequence: 8, 6, 4, 2, 0.",
      fact: "28 is a Perfect Number, meaning the sum of its proper divisors ($1 + 2 + 4 + 7 + 14$) equals exactly 28!"
    },
    29: {
      trick: "Multiply by 30 and subtract the multiplier! E.g. 29 × 6 = (30 × 6) - 6 = 180 - 6 = 174.",
      pattern: "The tens digits increase by 3 each step, while the units digits decrease by 1.",
      fact: "29 is a prime number and the number of days in February during a leap year."
    },
    30: {
      trick: "Multiply by 3 and append a zero! E.g. 30 × 7: 7 × 3 = 21 ➔ 210.",
      pattern: "The units digit is always 0, and the digits follow the Table of 3.",
      fact: "30 is a pronic number ($5 × 6$) and is the sum of the squares of the first four integers ($1^2 + 2^2 + 3^2 + 4^2$)."
    }
  };

  return facts[num] || {
    trick: `Multiply by 10 and add ${num - 10} times the number!`,
    pattern: "Cycles through prime-based sequences.",
    fact: `${num} is an interesting mathematical value.`
  };
};

export function PracticePage() {
  const [topics, setTopics] = useState<PracticeTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<string, { selected: string; isCorrect: boolean }>>({});
  const [recitationCounts, setRecitationCounts] = useState<Record<number, number>>({});

  // Multiplication Master Custom State
  const [activeTab, setActiveTab] = useState<PracticeTab>("tables");
  const [selectedNumber, setSelectedNumber] = useState<number>(12);
  const [hoveredMultiplier, setHoveredMultiplier] = useState<number>(5);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Quick Quiz State
  const [quizMode, setQuizMode] = useState<boolean>(false);
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    text: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [quizAttempts, setQuizAttempts] = useState<Record<number, { selected: string; isCorrect: boolean }>>({});
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(5);
  const quizTimerRef = useRef<any>(null);

  // Speech Recitation State
  const [recitationMode, setRecitationMode] = useState<boolean>(false);
  const [recitationActive, setRecitationActive] = useState<boolean>(false);
  const [reciteIndex, setReciteIndex] = useState<number>(1);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [reciteError, setReciteError] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [completedReciteRows, setCompletedReciteRows] = useState<Record<number, boolean>>({});
  const [recitationCompleted, setRecitationCompleted] = useState<boolean>(false);
  const [typeMode, setTypeMode] = useState<boolean>(false);
  const [typedAnswer, setTypedAnswer] = useState<string>("");
  const [typeTimerMs, setTypeTimerMs] = useState<number>(0);
  const [completedTypeTimeMs, setCompletedTypeTimeMs] = useState<number | null>(null);
  const [typeTimerActive, setTypeTimerActive] = useState<boolean>(false);
  const typeStartTimeRef = useRef<number | null>(null);

  // New Cloud ASR (NVIDIA Parakeet) and Session states
  const isSpeechSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const [speechEngine, setSpeechEngine] = useState<"browser" | "nvidia">(isSpeechSupported ? "browser" : "nvidia");
  const speechEngineRef = useRef(speechEngine);
  useEffect(() => {
    speechEngineRef.current = speechEngine;
  }, [speechEngine]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Ref tracking to enable continuous auto-restarts during pauses
  const recitationActiveRef = useRef(recitationActive);
  useEffect(() => {
    recitationActiveRef.current = recitationActive;
  }, [recitationActive]);

  // Audio recording high-quality visualizer context & canvas references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Ref tracking to avoid stale closures in speech recognition events
  const reciteIndexRef = useRef(reciteIndex);
  useEffect(() => {
    reciteIndexRef.current = reciteIndex;
  }, [reciteIndex]);

  // Ref tracking to clean the speech history and avoid stale matching on older rows
  const lastMatchTranscriptLengthRef = useRef(0);

  const loadTopics = async () => {
    try {
      const res = await client.api.questions.$get();
      if (!res.ok) return;
      const data = await res.json();
      const nextTopics = Array.isArray(data?.topics) ? data.topics : [];
      setTopics(nextTopics);
      if (nextTopics.length > 0) {
        setExpandedTopic(nextTopics[0].id);
      }

      // Restore user attempts from DB
      if (Array.isArray(data?.attempts)) {
        const attemptsMap: Record<string, { selected: string; isCorrect: boolean }> = {};
        data.attempts.forEach((att: any) => {
          attemptsMap[att.questionId] = {
            selected: att.answer,
            isCorrect: att.isCorrect
          };
        });
        setAttempts(attemptsMap);
      }

      // Restore user table recitation counts
      if (Array.isArray(data?.recitations)) {
        const countsMap: Record<number, number> = {};
        data.recitations.forEach((r: any) => {
          countsMap[r.tableNumber] = r.count;
        });
        setRecitationCounts(countsMap);
      }
    } catch (error) {
      console.error("Failed to load practice topics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  // Dynamic running timer for Keyboard Speedrun Mode (100ms updates)
  useEffect(() => {
    let interval: any = null;
    if (typeMode && !recitationCompleted && typeTimerActive) {
      const startTime = typeStartTimeRef.current || Date.now();
      interval = setInterval(() => {
        setTypeTimerMs(Date.now() - startTime);
      }, 100);
    } else {
      if (!typeTimerActive) {
        setTypeTimerMs(0);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [typeMode, recitationCompleted, typeTimerActive]);

  // Quick 5-second countdown timer effect per quiz question
  useEffect(() => {
    if (!quizMode || currentQuizIndex >= 12 || quizAttempts[currentQuizIndex]) {
      if (quizTimerRef.current) {
        clearInterval(quizTimerRef.current);
        quizTimerRef.current = null;
      }
      return;
    }

    setQuizTimeLeft(5);

    quizTimerRef.current = setInterval(() => {
      setQuizTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(quizTimerRef.current);
          quizTimerRef.current = null;
          
          playErrorSound();
          setQuizAttempts(prevAttempts => ({
            ...prevAttempts,
            [currentQuizIndex]: { selected: "Time's Up!", isCorrect: false }
          }));

          // Automatically advance to the next question/results after 2.5 seconds
          setTimeout(() => {
            setCurrentQuizIndex((prevIndex) => {
              if (prevIndex < 11) {
                return prevIndex + 1;
              } else {
                return 12; // Go to results summary screen
              }
            });
          }, 2500);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (quizTimerRef.current) {
        clearInterval(quizTimerRef.current);
        quizTimerRef.current = null;
      }
    };
  }, [quizMode, currentQuizIndex, quizAttempts]);

  // High-quality voice recording waveform visualizer connected to the physical mic source
  useEffect(() => {
    if (!recitationActive) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn("Failed to stop media recorder:", e);
        }
        mediaRecorderRef.current = null;
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      analyserRef.current = null;
      return;
    }

    const startVisualizer = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        // If we are in NVIDIA Parakeet mode, start a MediaRecorder on this stream!
        if (speechEngineRef.current === "nvidia") {
          const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
          const chunks: Blob[] = [];
          
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          
          recorder.onstop = async () => {
            const audioBlob = new Blob(chunks, { type: "audio/webm" });
            await handleNvidiaTranscription(audioBlob);
          };
          
          recorder.start();
          mediaRecorderRef.current = recorder;
          console.log("🎙️ NVIDIA MediaRecorder started!");
        }

        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let phase = 0;

        const draw = () => {
          const canvas = canvasRef.current;
          if (!canvas) {
            animationFrameIdRef.current = requestAnimationFrame(draw);
            return;
          }

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          const width = canvas.clientWidth;
          const height = canvas.clientHeight;
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
          }

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const averageVolume = sum / bufferLength;
          const normalizedAmp = Math.min(averageVolume / 45, 3.5); // scale height nicely

          ctx.clearRect(0, 0, width, height);
          ctx.lineWidth = 1.8;
          ctx.lineCap = "round";

          const colors = [
            "rgba(239, 68, 68, 0.75)",  // Glowing Red wave
            "rgba(249, 115, 22, 0.45)",  // Neon Orange wave
            "rgba(168, 85, 247, 0.25)"   // Translucent Purple background wave
          ];

          phase += 0.08;

          for (let w = 0; w < 3; w++) {
            ctx.beginPath();
            ctx.strokeStyle = colors[w];

            const currentPhase = phase + w * (Math.PI / 4);
            const frequencyScale = 0.015 + w * 0.005;
            const waveHeightScale = (w === 0 ? 1 : w === 1 ? 0.6 : 0.3) * (height / 3.5);

            for (let x = 0; x < width; x++) {
              const centerTaper = Math.sin((x / width) * Math.PI); // Fades waves gracefully to edges
              const y = 
                height / 2 + 
                Math.sin(x * frequencyScale + currentPhase) * 
                waveHeightScale * 
                normalizedAmp * 
                centerTaper;

              if (x === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            ctx.stroke();
          }

          animationFrameIdRef.current = requestAnimationFrame(draw);
        };

        draw();
      } catch (err) {
        console.warn("Audio Visualizer initiation warning:", err);
      }
    };

    startVisualizer();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn("Failed to stop media recorder in cleanup:", e);
        }
        mediaRecorderRef.current = null;
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, [recitationActive, speechEngine]);

  // Audio Context Synthesizer for high-fidelity interactive dings & buzzes
  const playSuccessSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Happy high-pitched double chime
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.error(e);
    }
  };

  const playErrorSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Soft low warning buzz
      osc.frequency.setValueAtTime(220.00, ctx.currentTime); // A3
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(175.00, ctx.currentTime + 0.08); // Lower pitch
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error(e);
    }
  };

  // Web Speech API Voice Recitation controller
  const startRecitation = () => {
    if (speechEngine === "nvidia") {
      if (recitationActive) {
        setRecitationActive(false);
      } else {
        setRecitationActive(true);
        setReciteError(null);
        setLiveTranscript("NVIDIA Parakeet listening... Speak now, then click Stop!");
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recitationActive) {
      recitationActiveRef.current = false;
      setRecitationActive(false);
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setRecitationActive(true);
      setReciteError(null);
      setLiveTranscript("System listening... Recite the active row!");
    };

    recognition.onresult = (event: any) => {
      // If we already completed this row, ignore any final stray events during restart
      const currentMultiplier = reciteIndexRef.current;
      if (completedReciteRows[currentMultiplier]) return;

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const rawText = (finalTranscript || interimTranscript).toLowerCase().trim();
      // Pre-merge colon formatted times (e.g. "1:30" -> "130", "1:08" -> "108")
      const activeText = rawText.replace(/(\d+):(\d+)/g, "$1$2").replace(/,/g, "");
      
      if (activeText) {
        setLiveTranscript(activeText);
      }

      const N = getPracticeRowNumber(activeTab, selectedNumber, currentMultiplier - 1);
      const targetProduct = getPracticeResult(activeTab, selectedNumber, currentMultiplier - 1);

      // Clean punctuation for robust matching
      const cleanedText = activeText
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()']/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const words = cleanedText.split(/\s+/);

      // Match exact digits in the tokenized words list to avoid matching 2 inside 12
      const isDigitMatched = words.includes(String(targetProduct));

      // Normalize transcript and expected values for robust phonetics and spellings (e.g. "108")
      const normalizedTranscript = normalizeSpokenText(cleanedText);
      const expectedWords = numberToWords(targetProduct);
      const normalizedExpected = normalizeSpokenText(expectedWords);

      // Support hyphenated spelling forms
      const expectedWordsHyphen = expectedWords.replace(/\s+/g, "-");
      const normalizedExpectedHyphen = normalizeSpokenText(expectedWordsHyphen);

      const isWordMatched = 
        normalizedTranscript.includes(normalizedExpected) || 
        normalizedTranscript.includes(normalizedExpectedHyphen);

      // Support chanting structures
      if (isDigitMatched || isWordMatched) {
        // Success!
        playSuccessSound();
        setCompletedReciteRows(prev => ({ ...prev, [currentMultiplier]: true }));
        setReciteError(null);
        setLiveTranscript(`Correct! Said: ${targetProduct}`);
        
        // Stop the current recognition session to completely reset the cumulative transcript.
        recognition.stop();

        const maxRows = getPracticeMaxRows(activeTab);
        if (currentMultiplier < maxRows) {
          setReciteIndex(currentMultiplier + 1);
        } else {
          setReciteIndex(maxRows + 1);
          setLiveTranscript("👑 Incredible! You recited the entire section correctly! 🏆");
          setRecitationCompleted(true); // Launch the success/celebration card overlay!
          recitationActiveRef.current = false;
          setRecitationActive(false);

          // Automatically record correct attempt in DB to master the table!
          const officialQ = getOfficialQuestion(selectedNumber);
          handleAttempt(officialQ.id, officialQ.correctAnswer, officialQ.correctAnswer);

          // Automatically record recitation completion and save count persistence!
          handleRecitationComplete(getRecitationKey(activeTab, selectedNumber));
        }
      } else {
        // If they finished a full speech block and did not match
        if (finalTranscript && finalTranscript.trim().length > 0) {
          playErrorSound();
          
          if (activeTab === "squares") {
            setReciteError(`Try again! Say: "${N} squared is ?" or "${N} times ${N} is ?"`);
          } else if (activeTab === "cubes") {
            setReciteError(`Try again! Say: "${N} cubed is ?" or "${N} times ${N} times ${N} is ?"`);
          } else {
            const multiplierWord = currentMultiplier === 1 ? "ones" : currentMultiplier === 2 ? "twos" : currentMultiplier === 3 ? "threes" : numberToWords(currentMultiplier) + "s";
            setReciteError(`Try again! Say: "${selectedNumber} × ${currentMultiplier} = ?" (or chant: "${selectedNumber} ${multiplierWord} are ?")`);
          }
          setLiveTranscript(`Heard: "${finalTranscript.trim()}"`);
        }
      }
    };

    recognition.onerror = (e: any) => {
      console.warn("Speech recognition warning/error:", e.error);
      
      // Handle transient errors gracefully
      if (e.error === "no-speech" || e.error === "aborted") {
        return; // Silent ignore, keep listening
      }
      
      if (e.error === "not-allowed" || e.error === "permission-blocked") {
        setReciteError("Microphone permission denied. Please enable mic access in your browser settings.");
        recitationActiveRef.current = false;
        setRecitationActive(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if user paused and continuous session timed out
      if (recitationActiveRef.current) {
        try {
          recognition.start();
        } catch (err) {
          console.warn("Speech recognition auto-restart failed, retrying...", err);
          setTimeout(() => {
            if (recitationActiveRef.current) {
              try {
                recognition.start();
              } catch (e) {
                setRecitationActive(false);
              }
            }
          }, 1000);
        }
      } else {
        setRecitationActive(false);
      }
    };

    recognition.start();
    setRecognitionInstance(recognition);
  };

  const handleNvidiaTranscription = async (blob: Blob) => {
    const currentMultiplier = reciteIndexRef.current;
    if (completedReciteRows[currentMultiplier]) return;

    try {
      const formData = new FormData();
      formData.append("file", blob, "recitation.webm");

      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/speech/transcribe", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("NVIDIA Cloud ASR service error.");
      }

      const data = await res.json();
      const transcribedText = (data.text || "").toLowerCase().trim();
      
      if (!transcribedText) {
        setReciteError("NVIDIA Parakeet didn't hear any words. Please speak closer to the mic.");
        setLiveTranscript("Heard: [Silence]");
        playErrorSound();
        return;
      }

      // Pre-merge colon times
      const activeText = transcribedText.replace(/(\d+):(\d+)/g, "$1$2").replace(/,/g, "");
      setLiveTranscript(activeText);

      const N = getPracticeRowNumber(activeTab, selectedNumber, currentMultiplier - 1);
      const targetProduct = getPracticeResult(activeTab, selectedNumber, currentMultiplier - 1);
      const cleanedText = activeText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()']/g, " ").replace(/\s+/g, " ").trim();
      const words = cleanedText.split(/\s+/);
      const isDigitMatched = words.includes(String(targetProduct));

      const normalizedTranscript = normalizeSpokenText(cleanedText);
      const expectedWords = numberToWords(targetProduct);
      const normalizedExpected = normalizeSpokenText(expectedWords);
      const expectedWordsHyphen = expectedWords.replace(/\s+/g, "-");
      const normalizedExpectedHyphen = normalizeSpokenText(expectedWordsHyphen);

      const isWordMatched = 
        normalizedTranscript.includes(normalizedExpected) || 
        normalizedTranscript.includes(normalizedExpectedHyphen);

      if (isDigitMatched || isWordMatched) {
        // Success!
        playSuccessSound();
        setCompletedReciteRows(prev => ({ ...prev, [currentMultiplier]: true }));
        setReciteError(null);
        setLiveTranscript(`Correct! Said: ${targetProduct} ("${transcribedText}")`);

        const maxRows = getPracticeMaxRows(activeTab);
        if (currentMultiplier < maxRows) {
          setReciteIndex(currentMultiplier + 1);
        } else {
          setReciteIndex(maxRows + 1);
          setLiveTranscript("👑 Incredible! You recited the entire section correctly! 🏆");
          setRecitationCompleted(true);
          
          const officialQ = getOfficialQuestion(selectedNumber);
          handleAttempt(officialQ.id, officialQ.correctAnswer, officialQ.correctAnswer);
          handleRecitationComplete(getRecitationKey(activeTab, selectedNumber));
        }
      } else {
        playErrorSound();
        if (activeTab === "squares") {
          setReciteError(`Try again! Say: "${N} squared is ?" or "${N} times ${N} is ?"`);
        } else if (activeTab === "cubes") {
          setReciteError(`Try again! Say: "${N} cubed is ?" or "${N} times ${N} times ${N} is ?"`);
        } else {
          const multiplierWord = currentMultiplier === 1 ? "ones" : currentMultiplier === 2 ? "twos" : currentMultiplier === 3 ? "threes" : numberToWords(currentMultiplier) + "s";
          setReciteError(`Try again! Say: "${selectedNumber} × ${currentMultiplier} = ?" (or chant: "${selectedNumber} ${multiplierWord} are ?")`);
        }
        setLiveTranscript(`Heard: "${transcribedText}"`);
      }
    } catch (err) {
      console.error(err);
      setReciteError("NVIDIA Cloud ASR service connection failed. Please retry.");
    }
  };

  const toggleRecitationMode = () => {
    if (recitationMode) {
      recitationActiveRef.current = false;
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setRecitationMode(false);
      setRecitationActive(false);
      setRecitationCompleted(false); // Reset completion!
    } else {
      // Exit keyboard type mode if active
      if (typeMode) {
        setTypeMode(false);
        setTypedAnswer("");
      }
      // Mute text dictation if running
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      setRecitationMode(true);
      setReciteIndex(1);
      setCompletedReciteRows({});
      setLiveTranscript("");
      setReciteError(null);
      setRecitationCompleted(false); // Reset completion!
      lastMatchTranscriptLengthRef.current = 0; // Reset matching transcript length offset!
    }
  };

  const toggleTypeMode = () => {
    if (typeMode) {
      setTypeMode(false);
      setTypedAnswer("");
      setRecitationCompleted(false);
      setReciteError(null);
      setCompletedTypeTimeMs(null);
      setTypeTimerActive(false);
      typeStartTimeRef.current = null;
    } else {
      // Exit voice recitation mode if active
      if (recitationMode) {
        recitationActiveRef.current = false;
        if (recognitionInstance) {
          recognitionInstance.stop();
        }
        setRecitationMode(false);
        setRecitationActive(false);
      }
      // Mute speaker if speaking
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      setTypeMode(true);
      setReciteIndex(1);
      setCompletedReciteRows({});
      setTypedAnswer("");
      setReciteError(null);
      setRecitationCompleted(false);
      setCompletedTypeTimeMs(null);
      setTypeTimerActive(false);
      typeStartTimeRef.current = null;
    }
  };

  const handleCorrectType = (mult: number) => {
    playSuccessSound();
    setCompletedReciteRows(prev => ({ ...prev, [mult]: true }));
    setTypedAnswer("");
    setReciteError(null);
    
    const maxRows = getPracticeMaxRows(activeTab);
    if (mult < maxRows) {
      setReciteIndex(mult + 1);
    } else {
      setRecitationCompleted(true);
      const endTime = Date.now();
      const startTime = typeStartTimeRef.current || endTime;
      setCompletedTypeTimeMs(endTime - startTime);
      handleRecitationComplete(getRecitationKey(activeTab, selectedNumber));
    }
  };

  // Clean up all speech synthesis & speech recognition triggers
  useEffect(() => {
    recitationActiveRef.current = false;
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setRecitationMode(false);
    setRecitationActive(false);
    setTypeMode(false);
    setTypedAnswer("");
    setReciteIndex(1);
    setCompletedReciteRows({});
    setLiveTranscript("");
    setReciteError(null);
    setRecitationCompleted(false); // Reset completion!
  }, [selectedNumber, activeTab]);

  const handleAttempt = async (questionId: string, answer: string, correctAnswer: string) => {
    if (attempts[questionId]) return; // Already attempted

    const normalizedAnswer = String(answer).toLowerCase().trim().replace(/,/g, "");
    const normalizedCorrect = String(correctAnswer).toLowerCase().trim().replace(/,/g, "");
    const isCorrect = normalizedAnswer === normalizedCorrect;

    setAttempts((prev) => ({
      ...prev,
      [questionId]: { selected: answer, isCorrect }
    }));

    try {
      await client.api.questions.attempt.$post({
        json: {
          questionId,
          answer,
          isCorrect
        }
      });
    } catch (error) {
      console.error("Failed to record attempt:", error);
    }
  };

  const handleRecitationComplete = async (tableNum: number) => {
    // Optimistic local state update
    const currentCount = recitationCounts[tableNum] || 0;
    const newCount = currentCount + 1;

    setRecitationCounts((prev) => ({
      ...prev,
      [tableNum]: newCount
    }));

    try {
      await client.api.recitations.complete.$post({
        json: {
          tableNumber: tableNum
        }
      });
    } catch (error) {
      console.error("Failed to record recitation count in DB:", error);
    }
  };

  // Text-To-Speech (TTS) dictation handler
  const speakTable = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Mute recitation mode if active
    if (recitationActive && recognitionInstance) {
      recognitionInstance.stop();
    }

    window.speechSynthesis.cancel();
    
    const maxRows = getPracticeMaxRows(activeTab);
    const sentences = Array.from({ length: maxRows }, (_, i) => {
      const value = getPracticeRowNumber(activeTab, selectedNumber, i);
      const result = getPracticeResult(activeTab, selectedNumber, i);

      if (activeTab === "squares") {
        return `${value} squared is ${result}`;
      }

      if (activeTab === "cubes") {
        return `${value} cubed is ${result}`;
      }

      const idx = i + 1;
      return `${selectedNumber} times ${idx} is ${result}`;
    }).join(". ");

    const utterance = new SpeechSynthesisUtterance(sentences);
    utterance.rate = 0.95; // Clear reading speed
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Construct official question deterministically
  const getOfficialQuestion = (num: number) => {
    if (activeTab === "squares") {
      const correctAnswer = num * num;
      const optSet = new Set<number>();
      optSet.add(correctAnswer);
      optSet.add((num + 1) * (num + 1));
      optSet.add(num > 1 ? (num - 1) * (num - 1) : (num + 2) * (num + 2));
      optSet.add(correctAnswer + (num > 5 ? 10 : 5));
      optSet.add(correctAnswer - (num > 5 ? 10 : 5) > 0 ? correctAnswer - (num > 5 ? 10 : 5) : correctAnswer + 20);

      const sortedOptions = Array.from(optSet)
        .sort((a, b) => a - b)
        .slice(0, 4)
        .map(val => String(val));

      while (sortedOptions.length < 4) {
        const lastVal = Number(sortedOptions[sortedOptions.length - 1] || correctAnswer);
        sortedOptions.push(String(lastVal + num));
      }

      if (!sortedOptions.includes(String(correctAnswer))) {
        sortedOptions[0] = String(correctAnswer);
        sortedOptions.sort((a, b) => Number(a) - Number(b));
      }

      return {
        id: `square-q-${num}`,
        text: `What is the correct value of the square of ${num} (${num}²)?`,
        options: sortedOptions,
        correctAnswer: String(correctAnswer),
        explanation: `We know that ${num}² = ${num} × ${num} = ${correctAnswer}. ` +
          `A quick way to remember this is: ` + getSquareFacts(num).trick,
      };
    }

    if (activeTab === "cubes") {
      const correctAnswer = num * num * num;
      const optSet = new Set<number>();
      optSet.add(correctAnswer);
      optSet.add((num + 1) ** 3);
      optSet.add(num > 1 ? (num - 1) ** 3 : (num + 2) ** 3);
      optSet.add(correctAnswer + Math.max(10, num * 2));
      optSet.add(Math.max(1, correctAnswer - Math.max(10, num * 2)));

      const sortedOptions = Array.from(optSet)
        .sort((a, b) => a - b)
        .slice(0, 4)
        .map(val => String(val));

      while (sortedOptions.length < 4) {
        const lastVal = Number(sortedOptions[sortedOptions.length - 1] || correctAnswer);
        sortedOptions.push(String(lastVal + num));
      }

      if (!sortedOptions.includes(String(correctAnswer))) {
        sortedOptions[0] = String(correctAnswer);
        sortedOptions.sort((a, b) => Number(a) - Number(b));
      }

      return {
        id: `cube-q-${num}`,
        text: `What is the correct value of the cube of ${num} (${num}^3)?`,
        options: sortedOptions,
        correctAnswer: String(correctAnswer),
        explanation: `We know that ${num}^3 = ${num} x ${num} x ${num} = ${correctAnswer}. A quick way to remember this is: ${getCubeFacts(num).trick}`,
      };
    }

    const M = ((num * 7 + 3) % 10) + 3;
    const correctAnswer = num * M;

    // Distractor set
    const optSet = new Set<number>();
    optSet.add(correctAnswer);
    const d1 = M < 12 ? (M + 1) * num : (M - 1) * num;
    optSet.add(d1);
    const d2 = M > 4 ? (M - 2) * num : (M + 2) * num;
    optSet.add(d2);
    const offset = num > 5 ? 10 : 5;
    const d3 = correctAnswer + offset;
    const d4 = correctAnswer - offset > 0 ? correctAnswer - offset : correctAnswer + offset * 2;
    optSet.add(d3);
    optSet.add(d4);

    const sortedOptions = Array.from(optSet)
      .sort((a, b) => a - b)
      .slice(0, 4)
      .map(val => String(val));

    while (sortedOptions.length < 4) {
      const lastVal = Number(sortedOptions[sortedOptions.length - 1] || correctAnswer);
      sortedOptions.push(String(lastVal + num));
    }

    if (!sortedOptions.includes(String(correctAnswer))) {
      sortedOptions[0] = String(correctAnswer);
      sortedOptions.sort((a, b) => Number(a) - Number(b));
    }

    return {
      id: `mult-q-${num}`,
      text: `What is the correct result of: ${num} × ${M}?`,
      options: sortedOptions,
      correctAnswer: String(correctAnswer),
      explanation: `We know that ${num} × ${M} = ${correctAnswer}. An easy way to calculate this mentally is to break it down: ` +
        (num > 10 
          ? `(10 + ${num - 10}) × ${M} = (${10 * M} + ${(num - 10) * M}) = ${correctAnswer}.` 
          : `add ${num} to itself ${M} times.`),
    };
  };

  // Local 12-question mini quiz generation
  const startQuickQuiz = (num: number) => {
    const selectedVals: number[] = [];
    while (selectedVals.length < 12) {
      const r = activeTab === "squares"
        ? Math.floor(Math.random() * 50) + 1
        : activeTab === "cubes"
          ? Math.floor(Math.random() * 30) + 1
          : Math.floor(Math.random() * 12) + 1; // random multipliers between 1 and 12 for tables
      if (!selectedVals.includes(r)) {
        selectedVals.push(r);
      }
    }

    const generated = selectedVals.map((M) => {
      const correct = activeTab === "squares" ? M * M : activeTab === "cubes" ? M * M * M : num * M;
      const optSet = new Set<number>();
      optSet.add(correct);
      if (activeTab === "squares") {
        optSet.add((M + 1) * (M + 1));
        optSet.add(M > 1 ? (M - 1) * (M - 1) : (M + 2) * (M + 2));
        optSet.add(correct + (M > 5 ? 10 : 5));
        optSet.add(correct - (M > 5 ? 10 : 5) > 0 ? correct - (M > 5 ? 10 : 5) : correct + 20);
      } else if (activeTab === "cubes") {
        optSet.add((M + 1) ** 3);
        optSet.add(M > 1 ? (M - 1) ** 3 : (M + 2) ** 3);
        optSet.add(correct + Math.max(10, M * 2));
        optSet.add(Math.max(1, correct - Math.max(10, M * 2)));
      } else {
        optSet.add((M + 1) * num);
        optSet.add(M > 2 ? (M - 1) * num : (M + 2) * num);
        optSet.add(correct + (num > 5 ? 10 : 5));
        optSet.add(correct - (num > 5 ? 10 : 5) > 0 ? correct - (num > 5 ? 10 : 5) : correct + 15);
      }

      const options = Array.from(optSet)
        .sort((a, b) => a - b)
        .slice(0, 4)
        .map(val => String(val));
      
      while (options.length < 4) {
        const last = Number(options[options.length - 1] || correct);
        options.push(String(last + (activeTab === "tables" ? num : M)));
      }

      if (!options.includes(String(correct))) {
        options[0] = String(correct);
        options.sort((a, b) => Number(a) - Number(b));
      }

      const questionText = activeTab === "squares"
        ? `What is the correct value of the square of ${M} (${M}²)?`
        : activeTab === "cubes"
          ? `What is the correct value of the cube of ${M} (${M}^3)?`
          : `What is the correct result of: ${num} × ${M}?`;

      const explanation = activeTab === "squares"
        ? `${M}² is ${M} × ${M} = ${correct}.`
        : activeTab === "cubes"
          ? `${M}^3 is ${M} × ${M} × ${M} = ${correct}.`
          : `${num} × ${M} equals ${correct}. You can double check by repeating addition or decomposing: ${num} × ${M} = ${correct}.`;

      return {
        text: questionText,
        options,
        correctAnswer: String(correct),
        explanation
      };
    });

    setQuizQuestions(generated);
    setCurrentQuizIndex(0);
    setQuizAttempts({});
    setQuizScore(0);
    setQuizTimeLeft(5);
    setQuizMode(true);
  };

  const handleQuickQuizAnswer = (option: string) => {
    if (quizAttempts[currentQuizIndex]) return;

    const currentQuestion = quizQuestions[currentQuizIndex];
    const isCorrect = option === currentQuestion.correctAnswer;

    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      playSuccessSound(); // Delightful correct sound feedback!
    } else {
      playErrorSound(); // Wrong answer sound feedback!
    }

    setQuizAttempts(prev => ({
      ...prev,
      [currentQuizIndex]: { selected: option, isCorrect }
    }));

    // Automatically slide to the next question/results after a short delay
    const delay = isCorrect ? 900 : 2500; // 900ms for correct, 2.5s for incorrect (to study explanation)
    setTimeout(() => {
      setCurrentQuizIndex((prevIndex) => {
        if (prevIndex < 11) {
          return prevIndex + 1;
        } else {
          return 12; // Go to results summary screen
        }
      });
    }, delay);
  };

  const officialQuestion = getOfficialQuestion(selectedNumber);
  const officialAttempt = attempts[officialQuestion.id];

  const recCount = recitationCounts[getRecitationKey(activeTab, selectedNumber)] || 0;
  const currentLevel = getMasteryLevel(recCount);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-300 font-bold animate-pulse">
        Loading practice library...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-5xl font-black tracking-tighter text-white">
            Practice <span className="text-red-500">Library.</span>
          </h2>
          <p className="max-w-2xl text-lg text-slate-300 font-medium">
            Learn and master math concepts with interactive boards, audios, visual grids, and custom quiz modules.
          </p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 backdrop-blur-xl">
          <Sparkles size={18} className="text-red-400" />
          {topics.length} topic{topics.length === 1 ? "" : "s"} & tables available
        </div>
      </div>

      {/* Modern High-Aesthetic Tab Selector */}
      <div className="flex p-1.5 bg-slate-900/60 rounded-[1.5rem] border border-white/5 w-fit gap-2 flex-wrap">
        <button
          onClick={() => {
            setActiveTab("tables");
            setSelectedNumber(12);
          }}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[1.1rem] text-sm font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === "tables"
              ? "bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xl shadow-red-950/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Grid size={16} />
          Multiplication 1-30
        </button>
        <button
          onClick={() => {
            setActiveTab("squares");
            setSelectedNumber(25); // Default popular square
          }}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[1.1rem] text-sm font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === "squares"
              ? "bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xl shadow-red-950/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Sparkles size={16} />
          Squares 1-50
        </button>
        <button
          onClick={() => {
            setActiveTab("cubes");
            setSelectedNumber(1);
          }}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[1.1rem] text-sm font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === "cubes"
              ? "bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xl shadow-red-950/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Trophy size={16} />
          Cubes 1-30
        </button>
        <button
          onClick={() => setActiveTab("modules")}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[1.1rem] text-sm font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === "modules"
              ? "bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xl shadow-red-950/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <BookOpen size={16} />
          Practice Modules
        </button>
      </div>

      {/* --- TAB 1: INTERACTIVE LEARNING BOARDS --- */}
      {(activeTab === "tables" || activeTab === "squares" || activeTab === "cubes") && (
        <div className="space-y-8 animate-in slide-in-from-bottom-3 duration-500">
          {/* Grid Selector Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-white flex items-center gap-2 font-black">
                <Sparkles size={20} className="text-red-500" />
                {activeTab === "squares"
                  ? "Select a Square Range to Master"
                  : activeTab === "cubes"
                    ? "Select a Cube Range to Master"
                    : "Select a Table to Master"}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {activeTab === "squares"
                  ? "Select any decade range card below to load its perfect squares board, start hands-free voice reciting, or trial keyboard practice trials."
                  : activeTab === "cubes"
                    ? "Select any 10-number cube range to load its cube board, start voice reciting, or practice rapid keyboard recall."
                  : "Click any number from 12 to 30 to display its multiplication formulas, listen to audio read-alouds, explore advanced study hacks, and lock in your verified dashboard mastery."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTab === "squares" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { id: 1, label: "1 - 10", start: 1, title: "Single Digits Mastery", rangeExpr: "1² to 10²" },
                    { id: 2, label: "11 - 20", start: 11, title: "Teens & Benchmarks", rangeExpr: "11² to 20²" },
                    { id: 3, label: "21 - 30", start: 21, title: "Twenties Progression", rangeExpr: "21² to 30²" },
                    { id: 4, label: "31 - 40", start: 31, title: "Thirties Core Skills", rangeExpr: "31² to 40²" },
                    { id: 5, label: "41 - 50", start: 41, title: "Forties High Stakes", rangeExpr: "41² to 50²" }
                  ].map((dec) => {
                    const isSelected = getDecadeStart(selectedNumber) === dec.start;
                    const rangeRecCount = recitationCounts[100 + dec.start] || 0;
                    const level = getMasteryLevel(rangeRecCount);
                    const isOfficialMastered = attempts[`square-q-${dec.start}`]?.isCorrect;

                    return (
                      <button
                        key={dec.id}
                        onClick={() => {
                          setSelectedNumber(dec.start); // Center on start number!
                          setQuizMode(false);
                          setRecitationMode(false);
                          setRecitationActive(false);
                          setTypeMode(false);
                          setTypedAnswer("");
                          setReciteIndex(1);
                          setCompletedReciteRows({});
                          setLiveTranscript("");
                          setReciteError(null);
                          setRecitationCompleted(false);
                          if (isSpeaking) {
                            window.speechSynthesis.cancel();
                            setIsSpeaking(false);
                          }
                        }}
                        className={`relative p-5 rounded-3xl flex flex-col justify-between text-left transition-all duration-300 border ${
                          isSelected
                            ? "bg-gradient-to-br from-red-600 to-rose-700 text-white border-red-500 shadow-xl shadow-red-600/35 scale-[1.02] -translate-y-1"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-3">
                          <span className="text-3xl font-black">{dec.label}</span>
                          {isOfficialMastered && (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider animate-pulse">
                              ✓ Mastered
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1 w-full mb-4">
                          <h4 className={`text-xs font-black uppercase tracking-wider ${isSelected ? "text-red-200" : "text-red-400"}`}>
                            {dec.title}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400">
                            Range: {dec.rangeExpr}
                          </p>
                        </div>

                        <div className="flex items-center justify-between w-full border-t border-white/10 pt-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            🔥 {rangeRecCount} Recs
                          </span>
                          {level.name !== "Initiate" && (
                            <span className="text-xs" title={`${level.name} Badge`}>
                              {level.badge} <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{level.name}</span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : activeTab === "cubes" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 1, label: "1 - 10", start: 1, title: "Foundations of Cubes", rangeExpr: "1^3 to 10^3" },
                    { id: 2, label: "11 - 20", start: 11, title: "Teen Cube Recall", rangeExpr: "11^3 to 20^3" },
                    { id: 3, label: "21 - 30", start: 21, title: "Advanced Cube Mastery", rangeExpr: "21^3 to 30^3" }
                  ].map((range) => {
                    const isSelected = getCubeRangeStart(selectedNumber) === range.start;
                    const rangeRecCount = recitationCounts[200 + range.start] || 0;
                    const level = getMasteryLevel(rangeRecCount);
                    const isOfficialMastered = attempts[`cube-q-${range.start}`]?.isCorrect;

                    return (
                      <button
                        key={range.id}
                        onClick={() => {
                          setSelectedNumber(range.start);
                          setQuizMode(false);
                          setRecitationMode(false);
                          setRecitationActive(false);
                          setTypeMode(false);
                          setTypedAnswer("");
                          setReciteIndex(1);
                          setCompletedReciteRows({});
                          setLiveTranscript("");
                          setReciteError(null);
                          setRecitationCompleted(false);
                          if (isSpeaking) {
                            window.speechSynthesis.cancel();
                            setIsSpeaking(false);
                          }
                        }}
                        className={`relative p-5 rounded-3xl flex flex-col justify-between text-left transition-all duration-300 border ${
                          isSelected
                            ? "bg-gradient-to-br from-red-600 to-rose-700 text-white border-red-500 shadow-xl shadow-red-600/35 scale-[1.02] -translate-y-1"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-3">
                          <span className="text-3xl font-black">{range.label}</span>
                          {isOfficialMastered && (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider animate-pulse">
                              ✓ Mastered
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 w-full mb-4">
                          <h4 className={`text-xs font-black uppercase tracking-wider ${isSelected ? "text-red-200" : "text-red-400"}`}>
                            {range.title}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400">
                            Range: {range.rangeExpr}
                          </p>
                        </div>

                        <div className="flex items-center justify-between w-full border-t border-white/10 pt-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            🔥 {rangeRecCount} Recs
                          </span>
                          {level.name !== "Initiate" && (
                            <span className="text-xs" title={`${level.name} Badge`}>
                              {level.badge} <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{level.name}</span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-3">
                  {Array.from({ length: 19 }, (_, i) => {
                    const num = i + 12;
                    const isSelected = selectedNumber === num;
                    const isOfficialMastered = attempts[`mult-q-${num}`]?.isCorrect;
                    const recCount = recitationCounts[num] || 0;
                    const level = getMasteryLevel(recCount);

                    return (
                      <button
                        key={num}
                        onClick={() => {
                          setSelectedNumber(num);
                          setQuizMode(false);
                          setRecitationMode(false);
                          setRecitationActive(false);
                          setTypeMode(false);
                          setTypedAnswer("");
                          setReciteIndex(1);
                          setCompletedReciteRows({});
                          setLiveTranscript("");
                          setReciteError(null);
                          setRecitationCompleted(false);
                          if (isSpeaking) {
                            window.speechSynthesis.cancel();
                            setIsSpeaking(false);
                          }
                        }}
                        className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center font-black transition-all duration-300 border ${
                          isSelected
                            ? "bg-gradient-to-br from-red-600 to-rose-700 text-white border-red-500 shadow-lg shadow-red-600/30 scale-105"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:scale-105"
                        }`}
                      >
                        <span className="text-2xl">{num}</span>
                        {isOfficialMastered && (
                          <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-slate-950" title="Table Mastered" />
                        )}
                        {level.name !== "Initiate" && (
                          <span className="absolute top-1 left-1.5 text-xs select-none" title={`${level.name} Medal (${recCount} recitations)`}>
                            {level.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive Workspace Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* LEFT COLUMN: The Study Board */}
            <Card className="overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-white/5 pb-6 flex flex-col gap-5">
                  {/* Title and Badges Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3.5 flex-wrap">
                      <CardTitle className="text-4xl text-white font-black leading-none">
                        {activeTab === "squares" ? (
                          <>
                            Squares <span className="text-red-500">{getDecadeStart(selectedNumber)}–{getDecadeStart(selectedNumber) + 9}</span>
                          </>
                        ) : activeTab === "cubes" ? (
                          <>
                            Cubes <span className="text-red-500">{getCubeRangeStart(selectedNumber)}–{getCubeRangeStart(selectedNumber) + 9}</span>
                          </>
                        ) : (
                          <>
                            Table of <span className="text-red-500">{selectedNumber}</span>
                          </>
                        )}
                      </CardTitle>
                      {currentLevel.name && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-md ${currentLevel.color} ${currentLevel.glow}`} title={`${recCount} Recitations`}>
                          <span>{currentLevel.badge}</span>
                          <span>{currentLevel.name}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10 bg-white/5 text-slate-300 shadow-md">
                        🔥 {recCount} {recCount === 1 ? "Recitation" : "Recitations"}
                      </span>
                      {typeMode && !recitationCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-500/20 bg-blue-500/10 text-blue-400 shadow-md animate-pulse">
                          <span>⏱️ Speedrun:</span>
                          <span className="text-white font-mono">{(typeTimerMs / 1000).toFixed(1)}s</span>
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-slate-400 text-sm font-semibold leading-relaxed">
                      {recitationCompleted 
                        ? "🎉 Mastery achievement unlocked!" 
                        : recitationMode 
                          ? "Voice Recitation: Speak the equations clearly in sequence." 
                          : typeMode
                            ? "Keyboard Practice: Type the correct product for each equation."
                            : "Explore formulas, listen to audio read-alouds, or choose a practice mode below."
                      }
                    </CardDescription>
                  </div>

                  {/* Segmented Mode Selector Panel Bar */}
                  {!recitationCompleted && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/80 p-2 rounded-2xl border border-white/5 shadow-xl">
                      {/* Study Mode Toggle */}
                      <button
                        onClick={() => {
                          if (recitationMode) toggleRecitationMode();
                          if (typeMode) toggleTypeMode();
                        }}
                        className={`h-12 rounded-xl flex items-center justify-center gap-2 border-none transition-all duration-300 font-black text-xs uppercase tracking-widest ${
                          !recitationMode && !typeMode
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/20 scale-[1.01]"
                            : "bg-transparent hover:bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <BookOpen size={16} />
                        Study Board
                      </button>

                      {/* Voice Recite Mode Toggle */}
                      <button
                        onClick={toggleRecitationMode}
                        className={`h-12 rounded-xl flex items-center justify-center gap-2 border-none transition-all duration-300 font-black text-xs uppercase tracking-widest ${
                          recitationMode
                            ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20 scale-[1.01]"
                            : "bg-transparent hover:bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Mic size={16} className={recitationActive ? "animate-pulse text-red-200" : ""} />
                        Voice Recite
                      </button>

                      {/* Keyboard Type Mode Toggle */}
                      <button
                        onClick={toggleTypeMode}
                        className={`h-12 rounded-xl flex items-center justify-center gap-2 border-none transition-all duration-300 font-black text-xs uppercase tracking-widest ${
                          typeMode
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.01]"
                            : "bg-transparent hover:bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Keyboard size={16} />
                        Type Practice
                      </button>
                    </div>
                  )}

                  {/* Study Mode: Audio Speaker Bar inside the study board */}
                  {!recitationCompleted && !recitationMode && !typeMode && (
                    <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/5 p-4 rounded-xl animate-in slide-in-from-top-2 duration-300 shadow-md">
                      <span className="text-xs font-semibold text-slate-300">
                        {activeTab === "squares"
                          ? `Want to listen to the squares of ${getDecadeStart(selectedNumber)} to ${getDecadeStart(selectedNumber) + 9} read aloud?`
                          : activeTab === "cubes"
                            ? `Want to listen to the cubes of ${getCubeRangeStart(selectedNumber)} to ${getCubeRangeStart(selectedNumber) + 9} read aloud?`
                            : `Want to listen to the table of ${selectedNumber} read aloud?`
                        }
                      </span>
                      <Button
                        onClick={speakTable}
                        className={`h-10 px-5 rounded-xl flex items-center gap-2 border-none transition-all duration-300 shrink-0 whitespace-nowrap shadow-md ${
                          isSpeaking 
                            ? "bg-emerald-500 text-white animate-pulse" 
                            : "bg-white/10 hover:bg-white/20 text-white"
                        }`}
                      >
                        {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        <span className="font-black text-xs uppercase tracking-wider">{isSpeaking ? "Mute" : "Listen Aloud"}</span>
                      </Button>
                    </div>
                  )}
                </CardHeader>

                {/* Recitation Speech HUD Dashboard */}
                {recitationMode && !recitationCompleted && (
                  <div className="p-4 border-b border-white/5 bg-slate-950/60 flex flex-col gap-3">
                    {!isSpeechSupported ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold text-center">
                        ⚠️ Voice Recitation requires a browser with Web Speech API support (Google Chrome or MS Edge recommended).
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <Button
                            onClick={startRecitation}
                            className={`h-10 px-5 rounded-xl border-none font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${
                              recitationActive 
                                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                                : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-950/30"
                            }`}
                          >
                            <Mic size={14} />
                            {recitationActive ? "Stop Listening" : "Tap & Start Reciting"}
                          </Button>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${recitationActive ? "bg-red-500 animate-ping" : "bg-slate-600"}`} />
                            {recitationActive ? "Microphone active" : "Microphone off"}
                          </div>
                        </div>

                        {/* High-quality live Web Audio waveform visualizer */}
                        {recitationActive && (
                          <div className="h-10 w-full bg-slate-950/50 rounded-xl overflow-hidden border border-white/5 relative flex items-center justify-center animate-in slide-in-from-top-1 duration-200">
                            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-slate-950/20 pointer-events-none" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Voice Transcriber Hearing</div>
                          <p className={`text-xs font-semibold italic p-3 bg-slate-950/40 rounded-xl border border-white/5 ${
                            recitationActive ? "text-slate-300" : "text-slate-500"
                          }`}>
                            {liveTranscript || (
                              activeTab === "squares"
                                ? `Chant: "${getDecadeStart(selectedNumber) + (reciteIndex - 1)} squared is ${(getDecadeStart(selectedNumber) + (reciteIndex - 1)) * (getDecadeStart(selectedNumber) + (reciteIndex - 1))}"`
                                : activeTab === "cubes"
                                  ? `Chant: "${getCubeRangeStart(selectedNumber) + (reciteIndex - 1)} cubed is ${(getCubeRangeStart(selectedNumber) + (reciteIndex - 1)) * (getCubeRangeStart(selectedNumber) + (reciteIndex - 1)) * (getCubeRangeStart(selectedNumber) + (reciteIndex - 1))}"`
                                  : `Chant: "${selectedNumber} ${reciteIndex === 1 ? "ones" : reciteIndex === 2 ? "twos" : reciteIndex === 3 ? "threes" : numberToWords(reciteIndex) + "s"} are ${selectedNumber * reciteIndex}"`
                            )}
                          </p>
                        </div>

                        {reciteError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold animate-in shake duration-300">
                            ⚠️ {reciteError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {recitationCompleted ? (
                  <CardContent className="pt-8 pb-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
                    
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-white leading-none">
                        {recCount === 10 || recCount === 100 || recCount === 1000 || recCount === 10000 ? (
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 animate-pulse">
                            🎉 {currentLevel.name} Medal Unlocked!
                          </span>
                        ) : (
                          activeTab === "squares"
                            ? `Squares Range ${getDecadeStart(selectedNumber)}–${getDecadeStart(selectedNumber) + 9} ${typeMode ? "Completed!" : "Recited!"}`
                            : activeTab === "cubes"
                              ? `Cubes Range ${getCubeRangeStart(selectedNumber)}–${getCubeRangeStart(selectedNumber) + 9} ${typeMode ? "Completed!" : "Recited!"}`
                              : `Table of ${selectedNumber} ${typeMode ? "Completed!" : "Recited!"}`
                        )}
                      </h3>
                      <p className="text-slate-400 text-sm font-semibold max-w-sm mx-auto leading-relaxed">
                        {recCount === 10 && `Outstanding achievement! You've successfully completed this section 10 times and unlocked the Commoner Medal! 🏅`}
                        {recCount === 100 && `Incredible consistency! You've successfully completed this section 100 times and achieved the Elder Medal! 🛡️`}
                        {recCount === 1000 && `Monumental mastery! You've successfully completed this section 1,000 times to achieve the Conqueror Medal! 👑`}
                        {recCount === 10000 && `Cosmic transcension! You've completed this section 10,000 times to achieve the ultimate Transcender Medal! 🌌`}
                        {![10, 100, 1000, 10000].includes(recCount) && (
                          typeMode 
                            ? `Outstanding work! You successfully solved all equations correctly on your keyboard. Your typing speed is remarkable!` 
                            : `Outstanding work! You successfully recited all equations in this range correctly from memory. Your recall is extremely sharp!`
                        )}
                      </p>
                    </div>

                    {/* Speedrun Star Medals Reward Panel */}
                    {typeMode && completedTypeTimeMs !== null && (
                      <div className="max-w-md mx-auto w-full p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-purple-500/20 flex flex-col items-center justify-center space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Keyboard Speed Medal</span>
                        <div className="flex gap-2">
                          {Array.from({ length: 3 }).map((_, i) => {
                            const earnedStars = getTypeStars(completedTypeTimeMs, activeTab !== "tables");
                            const isEarned = i < earnedStars;
                            return (
                              <Star
                                key={i}
                                size={32}
                                className={`transition-all duration-500 ${
                                  isEarned
                                    ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] scale-110 animate-pulse"
                                    : "text-slate-700 fill-slate-800 scale-90"
                                }`}
                              />
                            );
                          })}
                        </div>
                        <div className="text-center space-y-1">
                          <span className="text-2xl font-black text-white font-mono">{(completedTypeTimeMs / 1000).toFixed(1)}s</span>
                          <span className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                            {getTypeStars(completedTypeTimeMs, activeTab !== "tables") === 3
                              ? "⚡ Lightning Fast! (3 Stars)"
                              : getTypeStars(completedTypeTimeMs, activeTab !== "tables") === 2
                              ? "🚀 Excellent Pace! (2 Stars)"
                              : "👍 Good job! Keep practicing to get 3 stars!"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Mastery Level Progress Bar */}
                    {(() => {
                      const nextLevel = getNextLevelInfo(recCount);
                      return (
                        <div className="max-w-md mx-auto w-full px-4 space-y-2 text-left bg-slate-950/40 p-4 rounded-2xl border border-white/5 shadow-inner">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Level: <span className="text-white font-bold">{currentLevel.badge} {currentLevel.name}</span></span>
                            <span>Next: <span className="text-red-400 font-bold">{nextLevel.nextName}</span></span>
                          </div>
                          
                          <div className="relative w-full h-3.5 bg-slate-950/60 rounded-full border border-white/5 overflow-hidden p-0.5 mt-1.5">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.5)] transition-all duration-1000 ease-out"
                              style={{ width: `${nextLevel.progressPercent}%` }}
                            />
                            {/* Shimmer overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none" />
                          </div>
                          
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                            <span>{recCount} Recitations</span>
                            <span>{nextLevel.remaining > 0 ? `${nextLevel.remaining} more to level up` : "Maximum Rank Achieved! 🏆"}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-md mx-auto w-full px-4">
                      <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Recite Accuracy</span>
                        <span className="text-2xl font-black text-emerald-400">100% Correct</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1">
                          {typeMode 
                            ? `${getPracticeMaxRows(activeTab)} / ${getPracticeMaxRows(activeTab)} Typed Correctly` 
                            : `${getPracticeMaxRows(activeTab)} / ${getPracticeMaxRows(activeTab)} Spoken Correctly`
                          }
                        </span>
                      </div>
                      
                      <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Mastery Badge</span>
                        <span className="text-2xl font-black text-amber-400 flex items-center gap-1.5">
                          <span>{currentLevel.badge}</span>
                          <span>{currentLevel.name}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1">{recCount} Recitations</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto w-full px-4 justify-center items-center">
                      <Button
                        onClick={() => {
                          setRecitationCompleted(false);
                          setReciteIndex(1);
                          setCompletedReciteRows({});
                          setLiveTranscript("");
                          setTypedAnswer("");
                          setReciteError(null);
                          if (typeMode) {
                            // Retry Type Mode
                            setCompletedReciteRows({});
                            setCompletedTypeTimeMs(null);
                            setTypeTimerActive(false);
                            typeStartTimeRef.current = null;
                          } else {
                            // Retry Voice Mode
                            toggleRecitationMode(); // Force-exit and restart
                            toggleRecitationMode();
                          }
                        }}
                        className="w-full sm:flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 rounded-xl font-black flex items-center justify-center gap-2 border-none transition-all shadow-md hover:scale-[1.02] active:scale-95 whitespace-nowrap px-6 uppercase tracking-wider text-xs"
                      >
                        <RefreshCw size={14} className="animate-spin duration-1000" />
                        {typeMode ? "Practice Again" : "Recite Again"}
                      </Button>
                      <Button
                        onClick={() => {
                          setRecitationCompleted(false);
                          setRecitationMode(false);
                          setTypeMode(false);
                        }}
                        className="w-full sm:flex-1 h-12 bg-white/5 hover:bg-white/10 text-white hover:text-red-400 rounded-xl font-black flex items-center justify-center gap-2 border border-white/10 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap px-6 uppercase tracking-wider text-xs"
                      >
                        <LogOut size={14} />
                        Exit
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="py-4 space-y-2.5">
                    {typeMode && reciteError && (
                      <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold animate-in shake duration-300 flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{reciteError}</span>
                      </div>
                    )}
                    {(() => {
                      const maxRows = getPracticeMaxRows(activeTab);

                      return Array.from({ length: maxRows }, (_, i) => {
                        const mult = i + 1;
                        const N = getPracticeRowNumber(activeTab, selectedNumber, i);
                        const result = getPracticeResult(activeTab, selectedNumber, i);
                        const isHovered = hoveredMultiplier === mult;

                        // Type mode row layout logic
                        if (typeMode) {
                          const isCompleted = completedReciteRows[mult] || mult < reciteIndex;
                          const isActive = mult === reciteIndex;

                          let rowStyle = "opacity-30 border border-transparent pointer-events-none";
                          let badge = null;

                          if (isCompleted) {
                            rowStyle = "bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 opacity-70";
                            badge = <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />;
                          } else if (isActive) {
                            rowStyle = "bg-blue-500/10 border-2 border-blue-500/40 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.02] translate-x-1 pointer-events-auto animate-pulse";
                            badge = <Keyboard size={18} className="text-blue-400 shrink-0" />;
                          }

                          return (
                            <div
                              key={mult}
                              className={`flex items-center justify-between py-3.5 px-6 rounded-2xl transition-all duration-300 ${rowStyle}`}
                            >
                              <div className="flex items-center gap-5 text-xl font-bold">
                                <span className="w-12 text-center text-slate-400 text-base font-black">
                                  {activeTab === "tables" ? `x ${mult}` : `#${N}`}
                                </span>
                                <span className={`text-2xl ${isActive ? "text-white font-black" : "text-slate-300 font-bold"}`}>
                                  {activeTab === "squares" ? `${N}   ×   ${N}` : activeTab === "cubes" ? `${N}   ×   ${N}   ×   ${N}` : `${selectedNumber}   ×   ${mult}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-3xl font-black">
                                {isCompleted ? (
                                  <span>=   {result}</span>
                                ) : isActive ? (
                                  <div className="flex items-center gap-3">
                                    <span>=</span>
                                    <input
                                      type="text"
                                      pattern="[0-9]*"
                                      inputMode="numeric"
                                      autoFocus
                                      value={typedAnswer}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val && !typeTimerActive) {
                                          typeStartTimeRef.current = Date.now();
                                          setTypeTimerActive(true);
                                        }
                                        setTypedAnswer(val);
                                        // Real-time auto-advance check
                                        if (parseInt(val.trim(), 10) === result) {
                                          handleCorrectType(mult);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          const val = parseInt(typedAnswer.trim(), 10);
                                          if (val === result) {
                                            handleCorrectType(mult);
                                          } else {
                                            playErrorSound();
                                            setReciteError(
                                              activeTab === "squares"
                                                ? `Incorrect! ${N}² is ${result}. Keep trying!`
                                                : activeTab === "cubes"
                                                  ? `Incorrect! ${N}^3 is ${result}. Keep trying!`
                                                  : `Incorrect! ${selectedNumber} × ${mult} is ${result}. Keep trying!`
                                            );
                                          }
                                        }
                                      }}
                                      className="w-24 h-11 px-3 rounded-xl border-2 border-blue-500/50 bg-slate-950 text-white font-black text-center text-lg focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700 shadow-inner"
                                      placeholder="?"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-slate-600">=   ?</span>
                                )}
                                {badge}
                              </div>
                            </div>
                          );
                        }

                        // Recitation mode row layout logic
                        if (recitationMode) {
                          const isCompleted = completedReciteRows[mult] || mult < reciteIndex;
                          const isActive = mult === reciteIndex;

                          let rowStyle = "opacity-30 border border-transparent pointer-events-none";
                          let badge = null;

                          if (isCompleted) {
                            rowStyle = "bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 opacity-70";
                            badge = <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />;
                          } else if (isActive) {
                            rowStyle = "bg-orange-500/10 border-2 border-orange-500/40 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.15)] scale-[1.02] translate-x-1 pointer-events-auto animate-pulse";
                            badge = <Mic size={18} className="text-orange-500 shrink-0" />;
                          }

                          return (
                            <div
                              key={mult}
                              className={`flex items-center justify-between py-3.5 px-6 rounded-2xl transition-all duration-300 ${rowStyle}`}
                            >
                              <div className="flex items-center gap-5 text-xl font-bold">
                                <span className="w-12 text-center text-slate-400 text-base font-black">
                                  {activeTab === "tables" ? `x ${mult}` : `#${N}`}
                                </span>
                                <span className={`text-2xl ${isActive ? "text-white font-black" : "text-slate-300 font-bold"}`}>
                                  {activeTab === "squares" ? `${N}   ×   ${N}` : activeTab === "cubes" ? `${N}   ×   ${N}   ×   ${N}` : `${selectedNumber}   ×   ${mult}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-3xl font-black">
                                {isCompleted ? (
                                  <span>=   {result}</span>
                                ) : isActive ? (
                                  <span className="text-orange-400 animate-pulse font-black">=   ?</span>
                                ) : (
                                  <span className="text-slate-600">=   ?</span>
                                )}
                                {badge}
                              </div>
                            </div>
                          );
                        }

                        // Standard hover row layout logic
                        return (
                          <div
                            key={mult}
                            onMouseEnter={() => setHoveredMultiplier(mult)}
                            className={`flex items-center justify-between py-3 px-6 rounded-2xl transition-all duration-200 cursor-pointer ${
                              isHovered 
                                ? "bg-red-500/10 border border-red-500/20 translate-x-1.5 shadow-md scale-[1.005]" 
                                : "border border-transparent hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-5 text-xl font-bold text-slate-300">
                              <span className="w-12 text-center text-slate-400 text-base font-black">
                                {activeTab === "tables" ? `x ${mult}` : `#${N}`}
                              </span>
                              <span className="text-2xl font-black text-white">
                                {activeTab === "squares" ? `${N}   ×   ${N}` : activeTab === "cubes" ? `${N}   ×   ${N}   ×   ${N}` : `${selectedNumber}   ×   ${mult}`}
                              </span>
                            </div>
                            <div className="text-3xl font-black text-white">
                              =   <span className={isHovered ? "text-red-500" : ""}>{result}</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </CardContent>
                )}
              </div>

              {/* Quick statistics bottom banner */}
              <div className="bg-white/5 border-t border-white/5 px-6 py-4 flex items-center justify-between text-sm text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-slate-500">
                  {recitationMode 
                    ? "Progress: Reciting" 
                    : typeMode 
                      ? "Progress: Typing" 
                      : `Formulas: ${activeTab === "squares" ? `${getDecadeStart(selectedNumber)} to ${getDecadeStart(selectedNumber) + 9}` : activeTab === "cubes" ? `${getCubeRangeStart(selectedNumber)} to ${getCubeRangeStart(selectedNumber) + 9}` : "1 to 20"}`}
                </span>
                <span className="font-black text-white">
                  {recitationMode || typeMode
                    ? `Completed: ${reciteIndex - 1} / ${getPracticeMaxRows(activeTab)}`
                    : activeTab === "squares"
                      ? `Max: ${getDecadeStart(selectedNumber) + 9}² = ${(getDecadeStart(selectedNumber) + 9) * (getDecadeStart(selectedNumber) + 9)}`
                      : activeTab === "cubes"
                        ? `Max: ${getCubeRangeStart(selectedNumber) + 9}^3 = ${(getCubeRangeStart(selectedNumber) + 9) * (getCubeRangeStart(selectedNumber) + 9) * (getCubeRangeStart(selectedNumber) + 9)}`
                        : `Max: ${selectedNumber} × 20 = ${selectedNumber * 20}`
                  }
                </span>
              </div>
            </Card>

            {/* RIGHT COLUMN: Secrets, Hacks & Quizzes */}
            <div className="space-y-8 flex flex-col justify-start">
              {/* Dynamic Dot Visual Representation Card */}
              <Card>
                <CardHeader className="pb-3 border-b border-white/5">
                  <CardTitle className="text-xl text-white font-black flex items-center gap-2">
                    <Grid size={18} className="text-red-400" />
                    {activeTab === "squares" ? "Perfect Square Secrets & Study Hacks" : activeTab === "cubes" ? "Cube Secrets & Study Hacks" : "Table Secrets & Study Hacks"}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {activeTab === "squares" 
                      ? `Advanced mathematical properties, memory helpers, and fast-calculation tricks for square of ${selectedNumber}.`
                      : activeTab === "cubes"
                        ? `Advanced mathematical properties, memory helpers, and fast-calculation tricks for cube of ${selectedNumber}.`
                        : `Advanced mathematical properties, memory helpers, and fast-calculation tricks for the Table of ${selectedNumber}.`
                    }
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-6">
                  {(() => {
                    const facts = activeTab === "squares" ? getSquareFacts(selectedNumber) : activeTab === "cubes" ? getCubeFacts(selectedNumber) : getTableFacts(selectedNumber);
                    return (
                      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-400">
                        {/* Speed Hack Block */}
                        <div className="p-4 bg-amber-950/60 border border-amber-800/40 rounded-2xl flex items-start gap-3.5 shadow-md hover:scale-[1.01] transition-transform">
                          <span className="text-2xl bg-amber-500/20 border border-amber-500/30 p-2.5 rounded-xl select-none" title="Speed Trick">⚡</span>
                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider">Mental Speed Hack</h5>
                            <p className="text-sm font-semibold text-slate-200 leading-relaxed">{facts.trick}</p>
                          </div>
                        </div>

                        {/* Pattern Alert Block */}
                        <div className="p-4 bg-blue-950/60 border border-blue-800/40 rounded-2xl flex items-start gap-3.5 shadow-md hover:scale-[1.01] transition-transform">
                          <span className="text-2xl bg-blue-500/20 border border-blue-500/30 p-2.5 rounded-xl select-none" title="Pattern Alert">🔢</span>
                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-blue-400 uppercase tracking-wider">Digit Pattern Alert</h5>
                            <p className="text-sm font-semibold text-slate-200 leading-relaxed">{facts.pattern}</p>
                          </div>
                        </div>

                        {/* Math Fact Block */}
                        <div className="p-4 bg-indigo-950/60 border border-indigo-800/40 rounded-2xl flex items-start gap-3.5 shadow-md hover:scale-[1.01] transition-transform">
                          <span className="text-2xl bg-indigo-500/20 border border-indigo-500/30 p-2.5 rounded-xl select-none" title="Fun Fact">💡</span>
                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Fun Math Fact</h5>
                            <p className="text-sm font-semibold text-slate-200 leading-relaxed">{facts.fact}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Local Fun Quizzes & Official Mastery Challenge Switcher */}
              {!quizMode ? (
                <div className="space-y-6">
                  {/* Official DB Mastery Challenge Card */}
                  <Card className="relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-red-600/10 text-red-400 border border-red-500/20 px-3 py-1 text-xs font-black uppercase tracking-widest">
                          Mastery Quest
                        </span>
                        {officialAttempt?.isCorrect && (
                          <span className="rounded-full bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                            Verified ✓
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-2xl text-white font-black mt-2">
                        {activeTab === "squares" 
                          ? `Unlock Squares of ${getDecadeStart(selectedNumber)}–${getDecadeStart(selectedNumber) + 9} Mastery`
                          : activeTab === "cubes"
                            ? `Unlock Cubes of ${getCubeRangeStart(selectedNumber)}–${getCubeRangeStart(selectedNumber) + 9} Mastery`
                            : `Unlock Table of ${selectedNumber} Mastery`
                        }
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        {activeTab === "squares"
                          ? "Attempt the verified perfect square challenge question. Correct solutions sync instantly with your Streak and overall Mastery Score!"
                          : activeTab === "cubes"
                            ? "Attempt the verified cube challenge question. Correct solutions sync instantly with your Streak and overall Mastery Score!"
                            : "Attempt the verified DB challenge question. Correct solutions sync instantly with your Streak and overall Mastery Score!"
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-5 space-y-4">
                        <p className="text-lg font-bold text-white leading-relaxed">
                          {officialQuestion.text}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {officialQuestion.options.map((option) => {
                            const isSelected = officialAttempt?.selected === option;
                            const isCorrect = option === officialQuestion.correctAnswer;
                            let borderColor = "border-white/10";
                            let bgColor = "bg-white/5";
                            let textColor = "text-slate-200";

                            if (officialAttempt) {
                              if (isCorrect) {
                                borderColor = "border-emerald-500/50";
                                bgColor = "bg-emerald-500/10";
                                textColor = "text-emerald-400";
                              } else if (isSelected) {
                                borderColor = "border-red-500/50";
                                bgColor = "bg-red-500/10";
                                textColor = "text-red-400";
                              }
                            }

                            return (
                              <button
                                key={option}
                                disabled={!!officialAttempt}
                                onClick={() => handleAttempt(officialQuestion.id, option, officialQuestion.correctAnswer)}
                                className={`text-left rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${borderColor} ${bgColor} ${textColor} ${!officialAttempt ? "hover:border-red-500/50 hover:bg-white/10" : "cursor-default"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{option}</span>
                                  {officialAttempt && isCorrect && <CheckCircle2 size={16} />}
                                  {officialAttempt && isSelected && !isCorrect && <XCircle size={16} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {officialAttempt && (
                          <div className="animate-in slide-in-from-top-2 duration-500 pt-2 border-t border-white/5">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Explanation</h5>
                            <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                              {officialQuestion.explanation}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Launch local 12-question speed quiz */}
                      <Button
                        onClick={() => startQuickQuiz(selectedNumber)}
                        className="w-full h-14 bg-white text-slate-950 hover:bg-red-500 hover:text-white rounded-2xl flex items-center justify-center gap-2 border-none font-black shadow-lg shadow-white/5 text-base transition-all"
                      >
                        <Play size={18} />
                        {activeTab === "squares" ? "Launch 12-Question Squares Quiz" : activeTab === "cubes" ? "Launch 12-Question Cubes Quiz" : "Launch 12-Question Table Quiz"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* Dynamic Interactive Mini Quiz Module */
                <Card className="animate-in zoom-in-95 duration-300">
                  <CardHeader className="pb-3 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <Button 
                        onClick={() => setQuizMode(false)}
                        className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border-none flex items-center gap-1.5 text-xs font-bold"
                      >
                        <ArrowLeft size={14} />
                        Exit Quiz
                      </Button>
                      <div className="flex items-center gap-3">
                        {/* Pulsing speed timer */}
                        {!quizAttempts[currentQuizIndex] && currentQuizIndex < 12 && (
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider animate-pulse ${
                            quizTimeLeft <= 2
                              ? "bg-red-500/10 border-red-500/30 text-red-400"
                              : "bg-orange-500/10 border-orange-500/30 text-orange-400"
                          }`}>
                            <span className="relative flex h-1.5 w-1.5">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${quizTimeLeft <= 2 ? "bg-red-500" : "bg-orange-500"}`}></span>
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${quizTimeLeft <= 2 ? "bg-red-500" : "bg-orange-500"}`}></span>
                            </span>
                            Timer: {quizTimeLeft}s
                          </div>
                        )}
                        <span className="text-xs font-black text-red-400 uppercase tracking-widest">
                          Q{currentQuizIndex + 1} of 12
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {currentQuizIndex < 12 ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <p className="text-2xl font-black text-white leading-relaxed">
                            {quizQuestions[currentQuizIndex]?.text}
                          </p>
                          <p className="text-slate-400 text-xs font-medium">
                            {activeTab === "squares"
                              ? "Test your quick square recall speed."
                              : activeTab === "cubes"
                                ? "Test your quick cube recall speed."
                                : `Test your quick math speed for table ${selectedNumber}.`}
                          </p>
                        </div>

                        {quizAttempts[currentQuizIndex]?.selected === "Time's Up!" && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold animate-in shake duration-300">
                            ⏰ Time's up! You missed this question.
                          </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                          {quizQuestions[currentQuizIndex]?.options.map((option) => {
                            const attempt = quizAttempts[currentQuizIndex];
                            const isSelected = attempt?.selected === option;
                            const isCorrect = option === quizQuestions[currentQuizIndex].correctAnswer;
                            
                            let borderColor = "border-white/10";
                            let bgColor = "bg-white/5";
                            let textColor = "text-slate-200";

                            if (attempt) {
                              if (isCorrect) {
                                borderColor = "border-emerald-500/50";
                                bgColor = "bg-emerald-500/10";
                                textColor = "text-emerald-400";
                              } else if (isSelected) {
                                borderColor = "border-red-500/50";
                                bgColor = "bg-red-500/10";
                                textColor = "text-red-400";
                              }
                            }

                            return (
                              <button
                                key={option}
                                disabled={!!attempt}
                                onClick={() => handleQuickQuizAnswer(option)}
                                className={`text-left rounded-xl border px-4 py-3.5 text-sm font-bold transition-all ${borderColor} ${bgColor} ${textColor} ${!attempt ? "hover:border-red-500/50 hover:bg-white/10" : "cursor-default"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{option}</span>
                                  {attempt && isCorrect && <CheckCircle2 size={16} />}
                                  {attempt && isSelected && !isCorrect && <XCircle size={16} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {quizAttempts[currentQuizIndex] && (
                          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                              <h5 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Explanation</h5>
                              <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                                {quizQuestions[currentQuizIndex].explanation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Quiz complete summary */
                      <div className="text-center py-6 space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-3xl font-black text-white">Quiz Completed!</h3>
                          <p className="text-slate-400 text-sm font-semibold max-w-sm mx-auto">
                            {quizScore === 12 
                              ? "Flawless score! You've mastered these formulas!" 
                              : quizScore >= 8 
                              ? "Excellent job! Keep practicing to get a perfect score." 
                              : "Practice makes perfect. Review the tables and try again!"}
                          </p>
                        </div>
                        <div className="inline-block px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Your Score</span>
                          <span className="text-4xl font-black text-white">{quizScore} / 12</span>
                        </div>
                        <div className="flex gap-4">
                          <Button
                            onClick={() => startQuickQuiz(selectedNumber)}
                            className="flex-1 h-12 bg-white text-slate-900 hover:bg-red-500 hover:text-white rounded-xl font-bold flex items-center justify-center gap-2 border-none"
                          >
                            <RefreshCw size={16} />
                            Retry Quiz
                          </Button>
                          <Button
                            onClick={() => setQuizMode(false)}
                            className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold flex items-center justify-center gap-2 border-none"
                          >
                            Close Results
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: DYNAMIC PRACTICE TOPICS & BANKS --- */}
      {activeTab === "modules" && (
        <div className="space-y-5 animate-in slide-in-from-bottom-3 duration-500">
          {topics.length === 0 ? (
            <Card className="border-white/10">
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/10 text-red-400">
                  <BookOpen size={28} />
                </div>
                <p className="text-2xl font-black text-white">No practice topics yet</p>
                <p className="mt-2 text-slate-300 font-medium">
                  Add custom modules in admin and they will appear here automatically.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              {topics.map((topic, index) => {
                const isExpanded = expandedTopic === topic.id;

                return (
                  <Card key={topic.id} className="overflow-hidden border-white/10">
                    <button
                      onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                      className="w-full text-left animate-none"
                    >
                      <CardHeader className="border-b border-white/5 pb-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/10 text-red-400 border border-red-500/20">
                              <span className="text-lg font-black">{index + 1}</span>
                            </div>
                            <div className="space-y-1">
                              <CardTitle className="text-3xl text-white">{topic.topic}</CardTitle>
                              <CardDescription className="text-slate-300 font-medium">
                                {topic.totalQuestions} question{topic.totalQuestions === 1 ? "" : "s"} in this bank
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 self-start md:self-auto">
                            <div className="rounded-full bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-300 border border-white/10">
                              Updated {new Date(topic.latestCreatedAt).toLocaleDateString()}
                            </div>
                            <div className={`rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                              <ChevronDown size={18} />
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </button>

                    {isExpanded && (
                      <CardContent className="space-y-4 pt-6">
                        {topic.content && (
                          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/5 text-slate-300 italic font-medium">
                            {topic.content}
                          </div>
                        )}
                        {topic.questions.map((question, questionIndex) => {
                          const attempt = attempts[question.id];
                          return (
                            <div key={question.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 space-y-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                                      Q{questionIndex + 1}
                                    </span>
                                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-300 border border-white/10">
                                      {question.type}
                                    </span>
                                  </div>
                                  <p className="text-lg font-bold text-white leading-relaxed">{question.text}</p>
                                </div>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                {question.options.length > 0 ? (
                                  question.options.map((option) => {
                                    const isSelected = attempt?.selected === option;
                                    const isCorrect = option === question.correctAnswer;
                                    let borderColor = "border-white/10";
                                    let bgColor = "bg-white/5";
                                    let textColor = "text-slate-200";

                                    if (attempt) {
                                      if (isCorrect) {
                                        borderColor = "border-emerald-500/50";
                                        bgColor = "bg-emerald-500/10";
                                        textColor = "text-emerald-400";
                                      } else if (isSelected) {
                                        borderColor = "border-red-500/50";
                                        bgColor = "bg-red-500/10";
                                        textColor = "text-red-400";
                                      }
                                    }

                                    return (
                                      <button
                                        key={option}
                                        disabled={!!attempt}
                                        onClick={() => handleAttempt(question.id, option, question.correctAnswer)}
                                        className={`text-left rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${borderColor} ${bgColor} ${textColor} ${!attempt ? "hover:border-red-500/50 hover:bg-white/10" : "cursor-default"}`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>{option}</span>
                                          {attempt && isCorrect && <CheckCircle2 size={16} />}
                                          {attempt && isSelected && !isCorrect && <XCircle size={16} />}
                                        </div>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="col-span-2 space-y-3">
                                    {!attempt ? (
                                      <div className="flex gap-2">
                                        <Input 
                                          id={`ans-${question.id}`}
                                          placeholder="Type your answer..."
                                          className="flex-1"
                                        />
                                        <Button 
                                          onClick={() => {
                                            const val = (document.getElementById(`ans-${question.id}`) as HTMLInputElement)?.value;
                                            if (val) handleAttempt(question.id, val, question.correctAnswer);
                                          }}
                                        >
                                          Submit
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className={`p-4 rounded-xl border ${attempt.isCorrect ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
                                        <p className="font-bold">Your Answer: {attempt.selected}</p>
                                        <p className="text-sm mt-1">Correct Answer: {question.correctAnswer}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {attempt && (
                                <div className="animate-in slide-in-from-top-2 duration-500">
                                  <div className="h-px bg-white/10 my-4" />
                                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <h5 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Explanation</h5>
                                    <p className="text-sm font-medium text-slate-300 leading-relaxed">
                                      {question.explanation || "No explanation provided."}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
