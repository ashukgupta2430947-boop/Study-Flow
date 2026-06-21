import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updatePassword,
  signOut,
  deleteUser,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Clock, 
  BarChart3,
  User,
  LogOut,
  Map,
  ClipboardList,
  Moon,
  Sun,
  ArrowRight,
  Mail,
  Lock,
  Sparkles,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  Code,
  Zap,
  MessageSquare,
  Heart,
  Camera,
  Save,
  Edit,
  Settings,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  UserPlus,
  Send,
  Bell,
  Layout,
  BrainCircuit,
  ShieldCheck,
  MousePointer2,
  Smartphone,
  Target,
  TrendingUp,
  Timer,
  RefreshCw,
  Brain,
  GraduationCap,
  Award,
  LayoutGrid,
  CalendarDays,
  Phone,
  Video,
  Smile,
  Mic,
  Square,
  PhoneOff,
  MicOff,
  VideoOff,
  Play,
  Pause
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { io } from 'socket.io-client';

// --- Backend Integration (Replaces Firebase) ---
let app;
let auth;
let db;
let firebaseAvailable = false;

// 💡 ADD YOUR FIREBASE CONFIG HERE TO ENABLE REAL GOOGLE LOGIN
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseAvailable = true;
    console.log("✅ Firebase Initialized Successfully");
  }
} catch (error) {
  console.error("❌ Firebase Initialization Error:", error);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'syllabus-tracker-001';
const API_URL = "https://study-flow-1-1ojj.onrender.com";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initialising Database...');
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, subjects, roadmap
  const [isNavigating, setIsNavigating] = useState(false);
  const [isAiMarking, setIsAiMarking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quiz State
  const [quizState, setQuizState] = useState({
    active: false,
    subject: null,
    questions: [],
    currentIndex: 0,
    score: 0,
    showResult: false,
    selectedAnswer: null,
    isCorrect: null
  });
  const [showGoogleSimulation, setShowGoogleSimulation] = useState(false);
  
  // Simulated Google Accounts (based on user request)
  const simulatedAccounts = [
    { name: 'Ashuk Gupta', email: 'ashukgupta2430947@gmail.com', avatar: 'A' },
    { name: 'Ashuk Gupta', email: 'ashukgupta99@gmail.com', avatar: 'A' }
  ];
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  
  // Schedule State
  const [scheduleState, setScheduleState] = useState({
    subjectId: '',
    freeTime: 4, // default 4 hours
    generated: null,
    isGenerating: false
  });
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callStatus, setCallStatus] = useState(null); // 'calling' | 'incoming' | 'active' | null
  const [callType, setCallType] = useState(null); // 'voice' | 'video'
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0); // seconds
  const [incomingCall, setIncomingCall] = useState(null); // { fromUserId, fromName, callType, offer }
  const [callPeer, setCallPeer] = useState(null); // the other user's id during active call

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callTimerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  
  const [todos, setTodos] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed
  
  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  
  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark'; // Default to light if nothing saved
    }
    return false;
  });
  
  // Form States
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ 
    name: '', 
    topics: '', 
    durationWeeks: 4,
    color: '#3b82f6',
    examDate: ''
  });

  // Auth Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authError, setAuthError] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState('idle');
  const [rememberMe, setRememberMe] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Landing Page State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [contactStatus, setContactStatus] = useState('idle');
  const [pageView, setPageView] = useState('landing'); // 'landing' or 'auth'

  // Social/Messaging State
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null); // For edit/delete dropdown
  const [editingMessage, setEditingMessage] = useState(null); // { id, content }

  // Profile State
  const [userBio, setUserBio] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({ displayName: '', username: '', photoURL: '', bio: '' });

  // Settings State
  const [settingsMsg, setSettingsMsg] = useState({ type: '', text: '' });
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [showSettingsConfirmPassword, setShowSettingsConfirmPassword] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [activeNote, setActiveNote] = useState(null); // { subjectId, topicId, topicName, notes }

  // Focus Mode / Pomodoro State
  const [timerMode, setTimerMode] = useState('study'); // 'study' or 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      const newMode = timerMode === 'study' ? 'break' : 'study';
      setTimerMode(newMode);
      setTimeLeft(newMode === 'study' ? 25 * 60 : 5 * 60);
      showToast(timerMode === 'study' ? "Time for a break!" : "Back to work!");
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, timerMode]);

  const toggleTimer = () => setTimerActive(!timerActive);
  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(timerMode === 'study' ? 25 * 60 : 5 * 60);
  };

  // Password Strength Calculation
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (!authPassword) return 0;
    if (authPassword.length >= 6) score++;
    if (authPassword.length >= 10) score++;
    if (/[A-Z]/.test(authPassword)) score++;
    if (/[0-9]/.test(authPassword)) score++;
    if (/[^A-Za-z0-9]/.test(authPassword)) score++;
    return score;
  }, [authPassword]);

  // unreadCount memo
  const unreadCount = useMemo(() => {
    if (!notifications || !Array.isArray(notifications)) return 0;
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Toast Helper
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Authentication Initialization
  useEffect(() => {
    if (!firebaseAvailable) {
      const storedUser = localStorage.getItem('demo_user') || sessionStorage.getItem('demo_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
        // Removed automatic signInAnonymously to allow Landing Page to show
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Heartbeat to keep status active
  useEffect(() => {
    if (!user || !user.uid) return;
    
    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_URL}/api/users/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid })
        });
      } catch (err) {
        console.error("Heartbeat failed", err);
      }
    };

    sendHeartbeat(); // Initial
    const interval = setInterval(sendHeartbeat, 60000); // Every minute
    return () => clearInterval(interval);
  }, [user]);

  // Socket.io + WebRTC Signaling Setup
  useEffect(() => {
    if (!user || !user.uid) return;
    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => { socket.emit('register', user.uid); });
    socket.on('incoming-call', (data) => {
      setIncomingCall(data); setCallStatus('incoming'); setCallType(data.callType);
    });
    socket.on('call-accepted', async ({ answer }) => {
      const pc = peerConnectionRef.current;
      if (pc) { await pc.setRemoteDescription(new RTCSessionDescription(answer)); setCallStatus('active'); startCallTimer(); }
    });
    socket.on('call-rejected', ({ reason }) => { showToast(reason || 'Call declined', 'error'); cleanupCall(); });
    socket.on('ice-candidate', async ({ candidate }) => {
      const pc = peerConnectionRef.current;
      if (pc && candidate) { try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e) {} }
    });
    socket.on('call-ended', () => { showToast('Call ended', 'info'); cleanupCall(); });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user]);

  // Fetch data on login
  useEffect(() => {
    if (user) {
      if (!firebaseAvailable) {
        // Fetch from backend
        fetch(`${API_URL}/api/subjects?userId=${user.uid}`)
          .then(res => res.json())
          .then(data => setSubjects(data));
        
        fetchTodos();
      }
    }
  }, [user]);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // 2. Real-time Data Sync
  useEffect(() => {
    if (!user) return;

    if (!firebaseAvailable) {
      // Connect to MongoDB Backend
      fetch(`${API_URL}/api/subjects?userId=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const sanitizedData = data.map(s => ({
              ...s,
              topics: Array.isArray(s.topics) ? s.topics : [],
              durationWeeks: s.durationWeeks || 4
            }));
            setSubjects(sanitizedData);
          }
        })
        .catch(err => {
          console.error("Failed to fetch subjects from backend:", err);
          // Fallback to empty if server is down
          setSubjects([]);
        });
      return;
    }

    const subjectsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'subjects');
    const unsubscribe = onSnapshot(subjectsRef, (snapshot) => {
      const subjectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubjects(subjectsData);
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Social & Messaging Functions
  const fetchFriends = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/friends?userId=${user.uid}`);
      const data = await res.json();
      setFriends(data.friends || []);
      setFriendRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim() || !user) return;
    setIsSearchingUsers(true);
    try {
      const res = await fetch(`${API_URL}/api/users/search?q=${query}&currentUserId=${user.uid}`);
      const data = await res.json();
      setUserSearchResults(data);
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const sendFriendRequest = async (toId) => {
    try {
      await fetch(`${API_URL}/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: user.uid, toId })
      });
      // Update UI or show success message
    } catch (err) {
      console.error("Error sending request:", err);
    }
  };

  const acceptFriendRequest = async (requesterId) => {
    try {
      await fetch(`${API_URL}/api/friends/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, requesterId })
      });
      fetchFriends();
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const fetchMessages = async (friendId) => {
    if (!user || !friendId) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/${friendId}?currentUserId=${user.uid}`);
      const data = await res.json();
      setChatMessages(data.messages || []);
      setFriendIsTyping(data.isTyping || false);
      
      // Auto-read messages from friend when in chat
      if (data.messages && data.messages.length > 0) {
        const unreadFromFriend = data.messages.filter(m => m.senderId === friendId && !m.isRead);
        if (unreadFromFriend.length > 0) {
           fetch(`${API_URL}/api/messages/read-all`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ currentUserId: user.uid, friendId })
           }).then(() => fetchNotifications()); // Refresh notifications immediately
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const updateTypingStatus = async (toId) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/api/users/status/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, toId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditMessage = async (id, content) => {
    try {
      const res = await fetch(`${API_URL}/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        setEditingMessage(null);
        fetchMessages(selectedFriend._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActiveMessageId(null);
        fetchMessages(selectedFriend._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReactToMessage = async (id, emoji) => {
    try {
      const res = await fetch(`${API_URL}/api/messages/${id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, emoji })
      });
      if (res.ok) fetchMessages(selectedFriend._id);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredChatMessages = useMemo(() => {
    if (!chatSearchQuery.trim()) return chatMessages;
    return chatMessages.filter(m => 
      m.content.toLowerCase().includes(chatSearchQuery.toLowerCase())
    );
  }, [chatMessages, chatSearchQuery]);

  const sendMessage = async (contentOverride = null) => {
    const msgContent = contentOverride || newMessage;
    if (!msgContent.trim() || !selectedFriend || !user) return;
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.uid,
          receiverId: selectedFriend._id,
          content: msgContent
        })
      });
      if (res.ok) {
        if (!contentOverride) setNewMessage('');
        setIsTyping(false);
        fetchMessages(selectedFriend._id);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Typing status side effect
  useEffect(() => {
    if (newMessage.length > 0 && selectedFriend) {
      if (!isTyping) {
        setIsTyping(true);
        updateTypingStatus(selectedFriend._id);
      }
    } else if (newMessage.length === 0 && isTyping) {
      setIsTyping(false);
    }
  }, [newMessage, selectedFriend]);

  // Sync Friends and Initial Social Data
  useEffect(() => {
    let interval;
    if (user && activeTab === 'messages') {
      fetchFriends();
      interval = setInterval(fetchFriends, 10000); // Update online status every 10s
    }
    return () => clearInterval(interval);
  }, [user, activeTab]);

  // Poll for messages when a friend is selected
  useEffect(() => {
    let interval;
    if (selectedFriend && activeTab === 'messages') {
      fetchMessages(selectedFriend._id);
      interval = setInterval(() => fetchMessages(selectedFriend._id), 3000);
    }
    return () => clearInterval(interval);
  }, [selectedFriend, activeTab]);

  // 3. Fetch User Profile (Bio)
  useEffect(() => {
    if (!user) return;
    
    if (!firebaseAvailable) {
      const storedProfile = localStorage.getItem(`profile_${user.uid}`);
      if (storedProfile) {
        setUserBio(JSON.parse(storedProfile).bio || '');
      } else {
        setUserBio('');
      }
    } else {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
      const unsubscribe = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserBio(docSnap.data().bio || '');
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user || !user.uid) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications?userId=${user.uid}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      
      // Check for new notifications to show toast
      if (notifications.length > 0 && data.length > notifications.length) {
        const newOnes = data.filter(n => !notifications.find(old => old._id === n._id) && !n.isRead);
        if (newOnes.length > 0 && newOnes[0].type !== 'system') {
          // Only show if it's very recent (last 30 seconds) to avoid old popups
          const createdAt = new Date(newOnes[0].createdAt);
          const thirtySecondsAgo = new Date(Date.now() - 30000);
          if (createdAt > thirtySecondsAgo) {
            showToast(newOnes[0].content, newOnes[0].type === 'message' ? 'success' : 'info');
          }
        }
      }
      
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Notification Polling
  useEffect(() => {
    if (!user || !user.uid) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [user]);

  const markNotificationRead = async (id) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Logic: Handle Login/Register
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (isRegistering && !termsAccepted) {
      setAuthError('You must accept the Terms of Service.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (isRegistering && authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    try {
      setLoadingText(isRegistering ? 'Creating your account...' : 'Authenticating...');
      setLoading(true);
      await new Promise(r => setTimeout(r, 1200));

      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const body = isRegistering 
        ? { name: authName, username: authUsername, email: authEmail, password: authPassword, bio: '' }
        : { email: authEmail, password: authPassword };
        
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      setUser(data);
      setLoading(false); // Explicitly clear loader on login
      if (rememberMe) {
        localStorage.setItem('demo_user', JSON.stringify(data));
      } else {
        sessionStorage.setItem('demo_user', JSON.stringify(data));
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setAuthError(err.message);
      setLoading(false);
    }
  };

  // Logic: Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!authEmail) {
      setAuthError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setResetStatus('sending');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    try {
      // Call Backend API to send email
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, otp })
      });

      if (response.ok) {
        setResetStatus('otp-sent');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send email via server');
      }
    } catch (err) {
      console.error("OTP Send Error:", err);
      // Fallback: If backend fails, show alert with OTP so you can still login
      alert(`[ERROR] ${err.message}\n\n(Dev Mode) Your OTP is: ${otp}`);
      setResetStatus('otp-sent');
    }
  };

  const handleOtpLogin = (e) => {
    e.preventDefault();
    if (enteredOtp === generatedOtp) {
      const mockUser = {
        uid: 'otp-user-' + Date.now(),
        displayName: authEmail.split('@')[0],
        email: authEmail,
        isAnonymous: false,
        emailVerified: true
      };
      
      setUser(mockUser);
      if (!firebaseAvailable) {
        localStorage.setItem('demo_user', JSON.stringify(mockUser));
      }
      
      setPageView('landing');
      setIsResettingPassword(false);
      setResetStatus('idle');
      setEnteredOtp('');
    } else {
      setAuthError('Invalid OTP. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    if (!firebaseAvailable) {
      setShowGoogleSimulation(true);
      return;
    }

    setLoadingText('Connecting to Google...');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      
      const response = await fetch(`${API_URL}/api/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: result.user.email, 
          name: result.user.displayName, 
          photoURL: result.user.photoURL 
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } else {
        setAuthError(data.message);
      }
      setLoading(false);
    } catch (err) {
      console.error("Google Auth Error:", err);
      setAuthError(err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
  };

  const handleSimulatedGoogleLogin = async (account) => {
    setShowGoogleSimulation(false);
    setLoadingText(`Signing in as ${account.name}...`);
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: account.email, 
          name: account.name, 
          photoURL: `https://ui-avatars.com/api/?name=${account.name}&background=random` 
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } else {
        setAuthError(data.message || 'Login failed');
      }
    } catch (err) {
      setAuthError('Connection failed');
    }
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setLoadingText('Preparing Guest Session...');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    if (!firebaseAvailable) {
      const mockUser = {
        uid: 'guest-' + Date.now(),
        displayName: 'Guest',
        isAnonymous: true
      };
      setUser(mockUser);
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      setLoading(false);
      return;
    }
    try {
      await signInAnonymously(auth);
      setLoading(false);
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoadingText('Logging out securely...');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    if (firebaseAvailable) {
      await signOut(auth);
    } else {
      localStorage.removeItem('demo_user');
      sessionStorage.removeItem('demo_user');
      setUser(null);
    }
    setSubjects([]); 
    setActiveTab('overview');
    
    // Smooth transition back to landing
    setTimeout(() => {
      setLoading(false);
    }, 400);
  };

  // Logic: Add Subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!user || !newSubject.name || !newSubject.topics) return;

    // Split topics by newline or comma
    const topicList = newSubject.topics
      .split(/[\n,]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => ({ name: t, completed: false, id: crypto.randomUUID() }));

    const subjectData = {
      name: newSubject.name,
      durationWeeks: parseInt(newSubject.durationWeeks),
      topics: topicList,
      color: newSubject.color,
      examDate: newSubject.examDate,
      createdAt: Date.now(),
      userId: user.uid // Link subject to user
    };

    if (!firebaseAvailable) {
      try {
        const res = await fetch(`${API_URL}/api/subjects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subjectData)
        });
        if (res.ok) {
          const savedSubject = await res.json();
          setSubjects([savedSubject, ...subjects]);
          setNewSubject({ name: '', topics: '', durationWeeks: 4, color: '#3b82f6', examDate: '' });
          setShowAddSubject(false);
          setActiveTab('roadmap');
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert(`Server Error: ${errorData.message || "Failed to save subject"}`);
        }
      } catch (err) {
        console.error("Backend save error:", err);
        alert("Connection Error: Backend is not running.\n\nPlease open a new terminal, go to 'backend' folder, and run 'node index.js'");
      }
      return;
    }

    try {
      const docRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'subjects'));
      await setDoc(docRef, subjectData);
      setNewSubject({ name: '', topics: '', durationWeeks: 4, color: '#3b82f6', examDate: '' });
      setShowAddSubject(false);
      setActiveTab('roadmap');
    } catch (err) {
      console.error("Error adding subject:", err);
    }
  };

  // Logic: Toggle Topic Status
  const toggleTopic = async (subjectId, topicId) => {
    const subject = subjects.find(s => (s._id || s.id) === subjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => 
      t.id === topicId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t
    );

    if (!firebaseAvailable) {
      try {
        const res = await fetch(`${API_URL}/api/subjects/${subjectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topics: updatedTopics })
        });
        if (!res.ok) throw new Error("Failed to update");
        setSubjects(subjects.map(s => s.id === subjectId ? { ...s, topics: updatedTopics } : s));
      } catch (err) { 
        console.error(err);
        alert("Failed to update topic. Is backend running?");
      }
      return;
    }

    try {
      const subjectRef = doc(db, 'artifacts', appId, 'users', user.uid, 'subjects', subjectId);
      await updateDoc(subjectRef, { topics: updatedTopics });
    } catch (err) {
      console.error("Error updating topic:", err);
    }
  };

  // Logic: Delete Subject
  const deleteSubject = async (id) => {
    if (!firebaseAvailable) {
      try {
        const res = await fetch(`${API_URL}/api/subjects/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete");
        setSubjects(subjects.filter(s => s.id !== id));
      } catch (err) { 
        console.error(err);
        alert("Failed to delete subject. Is backend running?");
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'subjects', id));
    } catch (err) {
      console.error("Error deleting subject:", err);
    }
  };

  // Logic: Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSettingsMsg({ type: '', text: '' });

    if (passwords.new !== passwords.confirm) {
      setSettingsMsg({ type: 'error', text: "Passwords don't match" });
      return;
    }
    if (passwords.new.length < 6) {
      setSettingsMsg({ type: 'error', text: "Password must be at least 6 characters" });
      return;
    }

    setSettingsMsg({ type: 'loading', text: 'Updating password...' });
    
    if (!user) {
      setSettingsMsg({ type: 'error', text: 'User session not found. Please login again.' });
      return;
    }

    if (!firebaseAvailable) {
      try {
        const url = `${API_URL}/api/users/${user.uid}/password`;
        console.log(`[AUTH] Calling password update: ${url}`);
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: passwords.new })
        });
        
        const data = await res.json();
        if (res.ok) {
           setSettingsMsg({ type: 'success', text: 'Password updated successfully' });
           setPasswords({ new: '', confirm: '' });
        } else {
           setSettingsMsg({ type: 'error', text: data.message || 'Failed to update password' });
        }
      } catch (err) {
        console.error("Password Update Fetch Error:", err);
        setSettingsMsg({ type: 'error', text: `Connection error: ${err.message}` });
      }
      return;
    }

    try {
      await updatePassword(user, passwords.new);
      setSettingsMsg({ type: 'success', text: 'Password updated successfully' });
      setPasswords({ new: '', confirm: '' });
    } catch (err) {
      setSettingsMsg({ type: 'error', text: err.message.replace('Firebase: ', '') });
    }
  };

  // Logic: Delete Account
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

    if (!firebaseAvailable) {
      localStorage.removeItem('demo_user');
      localStorage.removeItem(`subjects_${user.uid}`);
      localStorage.removeItem(`profile_${user.uid}`);
      setUser(null);
      return;
    }

    try {
      await deleteUser(user);
    } catch (err) {
      console.error("Delete Account Error:", err);
      setSettingsMsg({ type: 'error', text: err.code === 'auth/requires-recent-login' ? 'Please log out and log in again to delete your account.' : err.message });
    }
  };

  // Logic: Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (user.isAnonymous || (user.uid && user.uid.startsWith('guest-'))) {
      alert("Profile editing is disabled for guest accounts. Please login to save your profile permanently.");
      setIsEditingProfile(false);
      return;
    }

    try {
      const userId = user._id || user.uid;
      const res = await fetch(`${API_URL}/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          displayName: tempProfile.displayName,
          username: tempProfile.username,
          photoURL: tempProfile.photoURL,
          coverURL: tempProfile.coverURL,
          bio: tempProfile.bio
        })
      });
      
      if (!res.ok) {
        let errMessage = 'Profile update failed';
        try {
          const errorData = await res.json();
          errMessage = errorData.message || errMessage;
        } catch(e) {
          errMessage = `Server Error: ${res.statusText} (${res.status})`;
        }
        throw new Error(errMessage);
      }
      
      const updatedUser = await res.json();
      updatedUser.photoURL = tempProfile.photoURL; 
      setUser(updatedUser);
      localStorage.setItem('demo_user', JSON.stringify(updatedUser)); 
      setUserBio(updatedUser.bio || '');
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Profile update error:", err);
      alert(err.message);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile(prev => ({ ...prev, photoURL: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile(prev => ({ ...prev, coverURL: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- TODO Logic ---
  const fetchTodos = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/todos?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (err) {
      console.error("Fetch todos error:", err);
    }
  };

  const handleAddTodo = async (task) => {
    if (!user || !task.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, task, completed: false })
      });
      if (res.ok) {
        const newTodo = await res.json();
        setTodos([newTodo, ...todos]);
      }
    } catch (err) {
      console.error("Add todo error:", err);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const res = await fetch(`${API_URL}/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      if (res.ok) {
        setTodos(todos.map(t => t._id === id ? { ...t, completed: !completed } : t));
      }
    } catch (err) {
      console.error("Toggle todo error:", err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/todos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTodos(todos.filter(t => t._id !== id));
      }
    } catch (err) {
      console.error("Delete todo error:", err);
    }
  };

  // --- Topic Notes Logic ---
  const updateTopicNote = async (subjectId, topicId, notes) => {
    const subject = subjects.find(s => s._id === subjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => 
      t.id === topicId ? { ...t, notes } : t
    );

    try {
      const res = await fetch(`${API_URL}/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: updatedTopics })
      });
      if (res.ok) {
        setSubjects(subjects.map(s => s._id === subjectId ? { ...s, topics: updatedTopics } : s));
        showToast("Note saved!");
      }
    } catch (err) {
      console.error("Update note error:", err);
    }
  };

  // Calculations
  const stats = useMemo(() => {
    const totalTopics = subjects.reduce((acc, s) => acc + s.topics.length, 0);
    const completedTopics = subjects.reduce((acc, s) => acc + s.topics.filter(t => t.completed).length, 0);
    const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    return { totalTopics, completedTopics, progress };
  }, [subjects]);

  // Chart Data
  const chartData = useMemo(() => {
    return subjects.map(s => {
      const completed = s.topics.filter(t => t.completed).length;
      const total = s.topics.length;
      return {
        name: s.name,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        color: s.color
      };
    });
  }, [subjects]);

  // AI Recommendation Insights
  const aiInsights = useMemo(() => {
    if (subjects.length === 0) return null;
    
    let nextTopic = null;
    let nextTopicSubject = null;
    let weakSubject = null;
    
    const sortedSubjects = [...subjects].sort((a, b) => {
      if (a.examDate && b.examDate) return new Date(a.examDate) - new Date(b.examDate);
      if (a.examDate) return -1;
      if (b.examDate) return 1;
      const aComp = a.topics.length ? a.topics.filter(t=>t.completed).length / a.topics.length : 0;
      const bComp = b.topics.length ? b.topics.filter(t=>t.completed).length / b.topics.length : 0;
      return aComp - bComp;
    });

    for (const s of sortedSubjects) {
      const incomplete = s.topics.find(t => !t.completed);
      if (incomplete) {
        nextTopic = incomplete;
        nextTopicSubject = s;
        break;
      }
    }

    const activeSubjects = subjects.filter(s => s.topics.some(t => t.completed) && s.topics.some(t => !t.completed));
    if (activeSubjects.length > 0) {
      weakSubject = activeSubjects.reduce((weakest, current) => {
        const cComp = current.topics.filter(t=>t.completed).length / current.topics.length;
        const wComp = weakest.topics.filter(t=>t.completed).length / weakest.topics.length;
        return cComp < wComp ? current : weakest;
      }, activeSubjects[0]);
    }

    return {
      next: nextTopic ? { topic: nextTopic, subject: nextTopicSubject } : null,
      weak: weakSubject
    };
  }, [subjects]);

  // Velocity Progress Prediction
  const progressPrediction = useMemo(() => {
    let totalCompleted = 0;
    let totalRemaining = 0;
    let earliestDate = new Date();
    let hasCompleted = false;

    subjects.forEach(s => {
      if (s.createdAt && new Date(s.createdAt) < earliestDate) {
        earliestDate = new Date(s.createdAt);
      }
      s.topics.forEach(t => {
        if (t.completed) {
          totalCompleted++;
          hasCompleted = true;
          if (t.completedAt && new Date(t.completedAt) < earliestDate) {
            earliestDate = new Date(t.completedAt);
          }
        } else {
          totalRemaining++;
        }
      });
    });

    if (!hasCompleted || totalRemaining === 0) return null;

    const daysStudying = Math.max(1, (Date.now() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
    const velocity = totalCompleted / daysStudying; 
    if (velocity < 0.1) return null;

    const daysRemaining = Math.max(1, Math.ceil(totalRemaining / velocity));
    return { velocity: velocity.toFixed(1), daysRemaining };
  }, [subjects]);

  // Filtered Subjects based on search and status
  const filteredSubjects = useMemo(() => {
    let result = subjects;
    
    // Status Filter
    if (filterStatus === 'pending') {
      result = subjects.filter(s => s.topics.some(t => !t.completed));
    } else if (filterStatus === 'completed') {
      result = subjects.filter(s => s.topics.every(t => t.completed) && s.topics.length > 0);
    }

    if (!searchQuery.trim()) return result;
    const query = searchQuery.toLowerCase();
    return result.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.topics.some(t => t.name.toLowerCase().includes(query))
    );
  }, [subjects, searchQuery, filterStatus]);

  // Filtered Chart Data
  const filteredChartData = useMemo(() => {
    return (filteredSubjects || []).map(s => {
      const topics = s.topics || [];
      const completed = topics.filter(t => t.completed).length;
      const total = topics.length;
      return {
        name: s.name,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        color: s.color
      };
    });
  }, [filteredSubjects]);

  // Filtered Roadmap
  const filteredRoadmap = useMemo(() => {
    return (filteredSubjects || []).map(subject => {
      const topics = subject.topics || [];
      const weeks = subject.durationWeeks || 1;
      const topicsPerWeek = Math.ceil(topics.length / weeks);
      const schedule = [];
      for (let i = 0; i < weeks; i++) {
        schedule.push({
          week: i + 1,
          topics: topics.slice(i * topicsPerWeek, (i + 1) * topicsPerWeek)
        });
      }
      return { ...subject, schedule };
    });
  }, [filteredSubjects]);

  // Roadmap Generator Logic
  const roadmap = useMemo(() => {
    return subjects.map(subject => {
      const weeks = subject.durationWeeks;
      const topicsPerWeek = Math.ceil(subject.topics.length / weeks);
      const schedule = [];

      for (let i = 0; i < weeks; i++) {
        schedule.push({
          week: i + 1,
          topics: subject.topics.slice(i * topicsPerWeek, (i + 1) * topicsPerWeek)
        });
      }

      return { ...subject, schedule };
    });
  }, [subjects]);

  // Landing Page Helpers
  const scrollToSection = (id) => {
    if (pageView !== 'landing') setPageView('landing');
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab || isNavigating) return;
    setIsNavigating(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsNavigating(false);
    }, 300);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    setContactStatus('sending');
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContactStatus('success');
        e.target.reset(); // clear the form
      } else {
        setContactStatus('error');
        console.error('Failed to submit contact:', data.message);
      }
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setContactStatus('error');
    } finally {
      setTimeout(() => setContactStatus('idle'), 3000);
    }
  };

  const getDaysRemaining = (date) => {
    if (!date) return null;
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          sendMessage(`AUDIO_DATA:${base64Audio}`);
        };
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      showToast("Recording...", "info");
    } catch (err) {
      console.error("Mic access denied", err);
      showToast("Microphone access denied", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      showToast("Voice Note Sent!", "success");
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const createPeerConnection = (remoteUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          toUserId: remoteUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteAudioStream] = event.streams;
      setRemoteStream(remoteAudioStream);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteAudioStream;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanupCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanupCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus(null);
    setCallType(null);
    setCallPeer(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsSpeakerOff(false);
    setCallDuration(0);
  };

  const handleInitiateCall = async (type) => {
    if (!selectedFriend || !socketRef.current) return;
    const constraints = type === 'video'
      ? { video: true, audio: true }
      : { audio: true };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setCallType(type);
      setCallStatus('calling');
      setCallPeer(selectedFriend._id || selectedFriend.uid);

      const pc = createPeerConnection(selectedFriend._id || selectedFriend.uid);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit('call-user', {
        toUserId: selectedFriend._id || selectedFriend.uid,
        fromUserId: user.uid,
        fromName: user.displayName || user.name,
        callType: type,
        offer
      });

      showToast(`Calling ${selectedFriend.name}...`, 'info');
    } catch (err) {
      console.error('Call initiation failed:', err);
      showToast(err.message.includes('Permission') ? 'Microphone/Camera access denied' : 'Failed to start call', 'error');
      cleanupCall();
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall || !socketRef.current) return;
    const { fromUserId, callType: inType, offer } = incomingCall;
    const constraints = inType === 'video' ? { video: true, audio: true } : { audio: true };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setCallStatus('active');
      setCallPeer(fromUserId);

      const pc = createPeerConnection(fromUserId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit('call-accepted', { toUserId: fromUserId, answer });
      startCallTimer();
      setIncomingCall(null);
    } catch (err) {
      console.error('Accept call failed:', err);
      showToast('Failed to accept call', 'error');
      handleRejectCall();
    }
  };

  const handleRejectCall = () => {
    if (incomingCall && socketRef.current) {
      socketRef.current.emit('call-rejected', {
        toUserId: incomingCall.fromUserId,
        reason: 'Call declined'
      });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (callPeer && socketRef.current) {
      socketRef.current.emit('end-call', { toUserId: callPeer });
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerOff(prev => !prev);
    }
  };

  const formatCallDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatLastActive = (lastActiveDate) => {
    if (!lastActiveDate) return "Offline";
    const now = new Date();
    const then = new Date(lastActiveDate);
    const diff = Math.floor((now - then) / 1000); // seconds
    
    if (diff < 120) return "Active Now"; // 2 minutes window
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Quiz Interaction Logic
  const startQuiz = async (subject) => {
    setIsQuizLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subjectId: subject._id || subject.id,
          subjectName: subject.name,
          topics: subject.topics
        })
      });
      
      const questions = await response.json();
      
      if (!response.ok) throw new Error(questions.message);

      setQuizState({
        active: true,
        subject: subject,
        questions: questions,
        currentIndex: 0,
        score: 0,
        showResult: false,
        selectedAnswer: null,
        isCorrect: null
      });
    } catch (err) {
      console.error("Quiz Error:", err);
      showToast("Failed to generate AI quiz. Please try again.", "error");
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleAnswer = (index) => {
    if (quizState.selectedAnswer !== null) return;
    
    const isCorrect = index === quizState.questions[quizState.currentIndex].correct;
    setQuizState(prev => ({
      ...prev,
      selectedAnswer: index,
      isCorrect: isCorrect,
      score: isCorrect ? prev.score + 1 : prev.score
    }));
  };

  const nextQuestion = () => {
    if (quizState.currentIndex + 1 < quizState.questions.length) {
      setQuizState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        selectedAnswer: null,
        isCorrect: null
      }));
    } else {
      setQuizState(prev => ({ ...prev, showResult: true }));
    }
  };

  const generateAutoSchedule = () => {
    const subject = subjects.find(s => s._id === scheduleState.subjectId || s.id === scheduleState.subjectId);
    if (!subject || !subject.examDate) {
      showToast("Please select a subject with a valid exam date.", "error");
      return;
    }

    setScheduleState(prev => ({ ...prev, isGenerating: true }));

    setTimeout(() => {
      const daysLeft = getDaysRemaining(subject.examDate);
      if (daysLeft <= 0) {
        showToast("Exam date must be in the future!", "error");
        setScheduleState(prev => ({ ...prev, isGenerating: false }));
        return;
      }

      const pendingTopics = subject.topics.filter(t => !t.completed);
      const topicsPerDay = Math.ceil(pendingTopics.length / daysLeft);
      
      const newSchedule = [];
      let topicIndex = 0;

      for (let i = 0; i < daysLeft; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const dayTopics = pendingTopics.slice(topicIndex, topicIndex + topicsPerDay);
        topicIndex += topicsPerDay;

        if (dayTopics.length > 0) {
          newSchedule.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            topics: dayTopics,
            hours: scheduleState.freeTime
          });
        }
      }

      setScheduleState(prev => ({ 
        ...prev, 
        generated: newSchedule, 
        isGenerating: false 
      }));
      showToast("Timetable generated successfully!", "success");
    }, 1500);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-white dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-300 overflow-hidden relative font-sans`}>
        {/* Background mesh for premium feel */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] animate-mesh"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-mesh" style={{ animationDelay: '-5s' }}></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shadow-2xl shadow-blue-500/30 animate-pulse-glow mb-8 animate-rotate-in bg-white p-2">
            <img src="/favicon.png" alt="StudyFlow Logo" className="w-full h-full object-contain" />
          </div>
          
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2 animate-fade-in-up">
            Study<span className="text-blue-600">Flow</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mb-12 animate-fade-in-up stagger-1">
            Innovate Your Learning
          </p>

          <div className="w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative animate-fade-in-up stagger-2">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 animate-loading-bar rounded-full"></div>
          </div>
          
          <div className="mt-8 flex items-center gap-2 animate-fade-in-up stagger-3 text-slate-400 dark:text-slate-600">
            <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{loadingText}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- LANDING PAGE VIEW ---
  if (!user) {
    // --- AUTHENTICATION PAGE VIEW ---
    if (pageView === 'auth') {
      return (
        <>
        <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300`}>
          {/* Background Elements */}
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[100px] animate-mesh"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px] animate-mesh" style={{ animationDelay: '-5s' }}></div>

          <button 
            onClick={() => setPageView('landing')}
            className="absolute top-6 right-6 z-20 p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {/* Auth Form Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 w-full max-w-md z-10 relative group animate-in fade-in zoom-in-95">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative">
              {isResettingPassword ? (
                <div className="animate-in fade-in zoom-in-95">
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Reset Password
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                      Enter your email to receive a reset link.
                    </p>
                  </div>

                  {resetStatus === 'success' ? (
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                        <Mail size={32} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Check your mail</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          We have sent a password reset link to <span className="font-bold text-slate-900 dark:text-white">{authEmail}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => { setIsResettingPassword(false); setResetStatus('idle'); }}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-xl hover:opacity-90 transition-all"
                      >
                        Back to Login
                      </button>
                    </div>
                  ) : (
                    resetStatus === 'otp-sent' ? (
                      <form onSubmit={handleOtpLogin} className="space-y-4">
                        <div className="relative group/input">
                          <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={20} />
                          <input 
                            type="text" 
                            placeholder="Enter 6-digit OTP"
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white tracking-widest text-center font-mono text-lg"
                            value={enteredOtp}
                            onChange={(e) => setEnteredOtp(e.target.value)}
                            maxLength={6}
                            required
                          />
                        </div>
                        {authError && (
                          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium text-center animate-pulse">
                            {authError}
                          </div>
                        )}
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]">
                          Verify & Login
                        </button>
                      </form>
                    ) : (
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div className="relative group/input">
                        <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={20} />
                        <input 
                          type="email" 
                          placeholder="Email Address"
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          required
                        />
                      </div>

                      {authError && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium text-center animate-pulse">
                          {authError}
                        </div>
                      )}

                      <button 
                        type="submit"
                        disabled={resetStatus === 'sending'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {resetStatus === 'sending' ? 'Sending...' : 'Get OTP'}
                      </button>

                      <button 
                        type="button"
                        onClick={() => setIsResettingPassword(false)}
                        className="w-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm py-2 transition-colors"
                      >
                        Back to Login
                      </button>
                    </form>
                    )
                  )}
                </div>
              ) : (
              <>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isRegistering ? 'Create an Account' : 'Welcome Back'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  {isRegistering ? 'Start your journey today.' : 'Enter your details to access your dashboard.'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {isRegistering && (
                  <>
                    <div className="relative group/input">
                      <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={20} />
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative group/input">
                      <span className="absolute left-4 top-3.5 text-slate-400 group-focus-within/input:text-blue-500 font-bold">@</span>
                      <input 
                        type="text" 
                        placeholder="username"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="relative group/input">
                  <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={20} />
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="relative group/input">
                  <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {isRegistering && authPassword && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div 
                          key={level}
                          className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                            level <= passwordStrength 
                              ? (passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500') 
                              : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-right text-slate-500 dark:text-slate-400 font-medium">
                      {['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength]}
                    </p>
                  </div>
                )}

                {isRegistering && (
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={20} />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                )}

                {isRegistering && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="terms"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                      I agree to the <a href="#" className="text-blue-600 hover:underline" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                    </label>
                  </div>
                )}

                {!isRegistering && (
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => setIsResettingPassword(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {authError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium text-center animate-pulse">
                    {authError}
                  </div>
                )}

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  {isRegistering ? 'Sign Up' : 'Sign In'}
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Or continue with</span>
                </div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>

              <div className="mt-6 flex items-center justify-between text-sm">
                <button onClick={() => setIsRegistering(!isRegistering)} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                  {isRegistering ? 'Already have an account?' : 'Need an account?'}
                </button>
                <button onClick={handleGuestLogin} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  Guest Access
                </button>
              </div>
              </>
              )}
            </div>
          </div>
        </div>

        {/* Google Account Chooser Simulation Modal */}
        {showGoogleSimulation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-[400px] bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="p-8 pb-4 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
                <h3 className="text-2xl font-normal text-white mb-2">Choose an account</h3>
                <p className="text-sm text-gray-400">to continue to <span className="text-blue-400 font-medium">StudyFlow</span></p>
              </div>

              {/* Account List */}
              <div className="mt-4">
                {simulatedAccounts.map((acc, i) => (
                  <button
                    key={i}
                    onClick={() => handleSimulatedGoogleLogin(acc)}
                    className="w-full flex items-center gap-4 px-8 py-4 hover:bg-white/[0.05] transition-colors border-t border-[#333] text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium shrink-0 group-hover:bg-gray-500 transition-colors">
                      {acc.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">{acc.name}</p>
                      <p className="text-xs text-gray-400 truncate">{acc.email}</p>
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => {
                    const email = prompt("Enter another Gmail address:");
                    if (email) handleSimulatedGoogleLogin({ name: email.split('@')[0], email });
                  }}
                  className="w-full flex items-center gap-4 px-8 py-4 hover:bg-white/[0.05] transition-colors border-t border-[#333] text-left group"
                >
                  <div className="w-10 h-10 rounded-full border border-[#444] flex items-center justify-center text-gray-400 shrink-0 group-hover:bg-white/[0.05]">
                    <User size={20} />
                  </div>
                  <p className="text-sm font-medium text-white">Use another account</p>
                </button>
              </div>

              {/* Footer */}
              <div className="p-8 py-6 flex justify-end">
                <button 
                  onClick={() => setShowGoogleSimulation(false)}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        </>
      );
    }

    // --- LANDING PAGE VIEW (default) ---
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-mesh-gradient text-slate-900 dark:text-slate-50 font-sans selection:bg-blue-500/30 transition-colors duration-300 relative overflow-x-hidden`}>
        {/* Background Mesh */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] animate-mesh"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] animate-mesh" style={{ animationDelay: '-9s' }}></div>
        </div>

        <div className="relative z-10">
          {/* Navigation */}
          <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/20 dark:border-slate-800/50 transition-all duration-500">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              <div 
                className="flex items-center gap-3 font-black text-2xl tracking-tighter cursor-pointer group" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20 bg-white p-1.5 transition-transform group-hover:scale-110 group-hover:rotate-3">
                  <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">StudyFlow</span>
              </div>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</button>
                <button onClick={() => scrollToSection('about')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</button>
                <button onClick={() => scrollToSection('contact')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</button>
              </div>

              <div className="hidden md:flex items-center gap-4">
                <button 
                  onClick={() => setDarkMode(!darkMode)} 
                  className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  aria-label="Toggle Dark Mode"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button 
                  onClick={() => setPageView('auth')}
                  className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Login
                </button>
              </div>

              {/* Mobile Menu Toggle */}
              <div className="md:hidden flex items-center gap-4">
                 <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500">
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-900 dark:text-white">
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>

            {/* Mobile Nav */}
            {isMobileMenuOpen && (
              <div className="md:hidden glass-panel border-t border-white/20 dark:border-slate-800/50 p-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
                <button onClick={() => scrollToSection('features')} className="text-left py-2 font-medium text-slate-600 dark:text-slate-300">Features</button>
                <button onClick={() => scrollToSection('about')} className="text-left py-2 font-medium text-slate-600 dark:text-slate-300">About</button>
                <button onClick={() => scrollToSection('contact')} className="text-left py-2 font-medium text-slate-600 dark:text-slate-300">Contact</button>
                <button onClick={() => { setIsMobileMenuOpen(false); setPageView('auth'); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-2 shadow-lg shadow-blue-500/30">Login / Sign Up</button>
              </div>
            )}
          </nav>

          {/* Hero Section */}
          <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
              {/* Left Content */}
              <div className="space-y-10 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold animate-gentle-bounce">
                  <Sparkles size={16} />
                  <span>Next-Gen Syllabus Tracking</span>
                </div>
                
                <div className="space-y-6">
                  <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.95] text-slate-900 dark:text-white">
                    Master Your <br />
                    <span className="text-glow">Learning Flow.</span>
                  </h1>
                  <p className="text-xl text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
                    The ultimate roadmap for students. Track your syllabus, manage topics, 
                    and crush your exams with our premium AI-powered dashboard.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-4">
                  <button 
                    onClick={() => setPageView('auth')}
                    className="btn-gradient px-10 py-5 rounded-2xl text-white font-bold text-xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 group"
                  >
                    Start Tracking Free
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                  </button>
                  
                  <div className="flex items-center gap-4 px-2">
                    <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 overflow-hidden shadow-sm">
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Joined by 2,000+ students</p>
                      <div className="flex gap-0.5 text-yellow-400">
                        {[1,2,3,4,5].map(i => <Sparkles key={i} size={12} className="fill-current" />)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Content - Interactive Preview */}
              <div className="relative hidden lg:block animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="relative z-10 glass-card p-4 rounded-[3rem] border-white/40 dark:border-slate-700/50 shadow-2xl transform hover:rotate-1 transition-transform duration-700">
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] overflow-hidden aspect-square flex flex-col">
                    <div className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center px-8 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="p-8 flex-1 space-y-6">
                      <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      <div className="grid grid-cols-2 gap-6">
                        <div className="h-32 bg-blue-500/20 rounded-2xl animate-pulse" />
                        <div className="h-32 bg-purple-500/20 rounded-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                      </div>
                      <div className="space-y-3">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-12 bg-white/50 dark:bg-slate-800/30 rounded-xl flex items-center px-4 gap-4">
                            <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600" />
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Badges */}
                <div className="absolute -top-6 -right-10 glass-card p-5 rounded-2xl shadow-xl animate-gentle-bounce z-20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-500">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Progress</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">85% Done</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-10 -left-10 glass-card p-6 rounded-2xl shadow-xl animate-gentle-bounce z-20" style={{ animationDelay: '-1.5s' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                      <Zap size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Exam Today</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">Physics 101</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Features Section */}
          <section id="features" className="py-40 relative">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-24 space-y-4">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white">Everything you need to <span className="text-blue-600">Excel</span></h2>
                <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Powerful tools designed specifically for modern students who want to optimize their study time.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Layout,
                    color: "text-blue-500",
                    title: "Smart Dashboard",
                    desc: "Visualize your entire syllabus in one place with intuitive progress tracking and analytics."
                  },
                  {
                    icon: BrainCircuit,
                    color: "text-purple-500",
                    title: "AI Analysis",
                    desc: "Get insights into your study patterns and topic difficulty levels automatically with our smart engine."
                  },
                  {
                    icon: Clock,
                    color: "text-cyan-500",
                    title: "Exam Countdown",
                    desc: "Stay ahead of deadlines with real-time exam tracking and urgency indicators on every subject."
                  },
                  {
                    icon: ShieldCheck,
                    color: "text-green-500",
                    title: "Secure Data",
                    desc: "Your data is always safe with our robust encryption and OTP-based secure verification."
                  },
                  {
                    icon: MousePointer2,
                    color: "text-orange-500",
                    title: "One-Click Updates",
                    desc: "Track topic completion with a single click. Minimal friction for maximum focus on studying."
                  },
                  {
                    icon: Smartphone,
                    color: "text-pink-500",
                    title: "Fully Responsive",
                    desc: "Access your roadmap anywhere, anytime. Perfect for tablets, desktops, and wide monitors."
                  }
                ].map((feat, i) => (
                  <div key={i} className="glass-card p-10 rounded-[2.5rem] space-y-6 group">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800/50 shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6">
                      <feat.icon className={feat.color} size={32} />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{feat.title}</h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="py-40 relative">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative glass-card p-10 rounded-[3rem] border-white/40 dark:border-slate-700/50 shadow-2xl">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                      <Code size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-slate-900 dark:text-white">Community Built</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Open Source Spirit</p>
                    </div>
                  </div>
                  <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed italic">
                    "I built StudyFlow because I struggled to keep track of my self-taught curriculum. Spreadsheets were too manual, and generic tools lacked the academic focus."
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">Ashuk Gupta</p>
                        <p className="text-xs text-slate-500 font-bold">Creator & Lead Architect</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-16 sm:pl-0">
                      <a 
                        href="https://github.com/ashukgupta2430947-boop" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all shadow-sm hover:scale-105"
                        title="GitHub Profile"
                      >
                        <Github size={18} />
                      </a>
                      <a 
                        href="https://www.linkedin.com/in/ashuk-gupta-1404bb324" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all shadow-sm hover:scale-105"
                        title="LinkedIn Profile"
                      >
                        <Linkedin size={18} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8 order-1 lg:order-2">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-tight">Crafted for the <br /><span className="text-glow">Elite Learner.</span></h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  StudyFlow is more than just a to-do list. It's a comprehensive syllabus management system designed for the modern learner. Whether you're mastering AI, Web Dev, or Medicine, structure is your competitive advantage.
                </p>
                <div className="space-y-4">
                  {[
                    "Completely free for the student community",
                    "Privacy-first architecture (No tracking)",
                    "Modern Glassmorphic Dark UI included"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 text-lg font-bold text-slate-700 dark:text-slate-200">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                        <CheckCircle2 size={16} />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-40 relative">
            <div className="max-w-3xl mx-auto px-6 text-center space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white">Get in <span className="text-blue-600">Touch.</span></h2>
                <p className="text-xl text-slate-600 dark:text-slate-300">Have questions or feedback? I'd love to hear from you.</p>
              </div>

              <div className="glass-card p-10 rounded-[3rem] border-white/40 dark:border-slate-700/50 shadow-2xl text-left">
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-1">Name</label>
                      <input 
                        type="text" 
                        name="name"
                        required
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        placeholder="Your Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-1">Email</label>
                      <input 
                        type="email" 
                        name="email"
                        required
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-1">Message</label>
                    <textarea 
                      required
                      name="message"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white h-32 resize-none"
                      placeholder="What's on your mind?"
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    disabled={contactStatus === 'sending'}
                    className={`w-full py-5 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 group ${
                      contactStatus === 'sending' 
                        ? 'bg-blue-500/80 cursor-not-allowed' 
                        : contactStatus === 'success' 
                        ? 'bg-green-600 shadow-green-500/30 animate-pulse' 
                        : contactStatus === 'error'
                        ? 'bg-red-600 shadow-red-500/30'
                        : 'bg-blue-600 shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5'
                    }`}
                  >
                    {contactStatus === 'sending' ? (
                      <>
                        <span>Sending Message...</span>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </>
                    ) : contactStatus === 'success' ? (
                      <>
                        <span>Message Sent Successfully!</span>
                        <CheckCircle2 size={20} className="text-white" />
                      </>
                    ) : contactStatus === 'error' ? (
                      <>
                        <span>Failed to Send. Try Again!</span>
                        <AlertTriangle size={20} className="text-white" />
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 font-bold text-xl text-slate-900 dark:text-white">
                <img src="/favicon.png" alt="StudyFlow" className="w-8 h-8 object-contain rounded-lg" />
                <span>StudyFlow</span>
              </div>
              
              <div className="flex items-center gap-6 text-slate-500 dark:text-slate-400">
                <a href="https://github.com/ashukgupta2430947-boop" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors"><Github size={20} /></a>
                <a href="mailto:ashukgupta2430947@gmail.com" className="hover:text-red-500 transition-colors" title="Email Ashuk"><Mail size={20} /></a>
                <a href="https://www.linkedin.com/in/ashuk-gupta-1404bb324" target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 transition-colors"><Linkedin size={20} /></a>
              </div>

              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                Made with <Heart size={14} className="text-red-500 fill-red-500" /> by Ashuk
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // --- MAIN APP VIEW ---
  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300`}>
      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-64 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border-r border-slate-200/50 dark:border-slate-800/50 z-50 transition-colors duration-300 shadow-2xl flex flex-col">
        <div className="p-8 shrink-0">
          <h1 className="text-2xl font-black flex items-center gap-3 text-blue-600 drop-shadow-md">
            <img src="/favicon.png" alt="StudyFlow Logo" className="w-10 h-10 object-contain rounded-xl" />
            StudyFlow
          </h1>
          <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.3em] font-bold">Syllabus Tracker</p>
        </div>

        <div className="flex flex-col px-6 pb-6 gap-3 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <NavItem 
            active={activeTab === 'overview'} 
            onClick={() => handleTabChange('overview')} 
            icon={<BarChart3 size={20} />} 
            label="Overview" 
          />
          <NavItem 
            active={activeTab === 'subjects'} 
            onClick={() => handleTabChange('subjects')} 
            icon={<ClipboardList size={20} />} 
            label="Subjects" 
          />
          <NavItem 
            active={activeTab === 'roadmap'} 
            onClick={() => handleTabChange('roadmap')} 
            icon={<Map size={20} />} 
            label="Roadmap" 
          />
          <NavItem 
            active={activeTab === 'quiz'} 
            onClick={() => handleTabChange('quiz')} 
            icon={<Brain size={20} />} 
            label="Quiz" 
          />
          <NavItem 
            active={activeTab === 'schedule'} 
            onClick={() => handleTabChange('schedule')} 
            icon={<LayoutGrid size={20} />} 
            label="Schedule" 
          />
          <NavItem 
            active={activeTab === 'tasks'} 
            onClick={() => handleTabChange('tasks')} 
            icon={<CheckCircle2 size={20} />} 
            label="Tasks" 
          />
          <NavItem 
            active={activeTab === 'focus'} 
            onClick={() => handleTabChange('focus')} 
            icon={<Timer size={20} />} 
            label="Focus" 
          />
          <NavItem 
            active={activeTab === 'messages'} 
            onClick={() => handleTabChange('messages')}  
            icon={<MessageSquare size={20} />} 
            label="Messages" 
          />
          <NavItem 
            active={activeTab === 'profile'} 
            onClick={() => handleTabChange('profile')} 
            icon={<User size={20} />} 
            label="Profile" 
          />
          <NavItem 
            active={activeTab === 'settings'} 
            onClick={() => handleTabChange('settings')} 
            icon={<Settings size={20} />} 
            label="Settings" 
          />
          
          <NavItem 
            active={activeTab === 'activity'} 
            onClick={() => { handleTabChange('activity'); markAllNotificationsRead(); }} 
            icon={
              <div className="relative">
                <Bell size={20} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg ring-2 ring-white dark:ring-slate-900">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </div>
            } 
            label="Activity" 
          />
        </div>

        <div className="px-8 pb-6 shrink-0 pt-4 mt-auto">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-4 p-4 mb-4 rounded-2xl text-slate-500 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/80 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="text-sm font-bold tracking-wide">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="flex items-center justify-between p-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl transition-all shadow-md">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/40">
                <User size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate max-w-[100px] text-slate-800 dark:text-slate-100">{user?.displayName || (user?.isAnonymous ? 'Guest' : 'Student')}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">ID: {user?.uid.slice(0, 4)}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="ml-64 p-12 min-h-screen relative">
        <header className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-4xl font-black capitalize text-slate-900 dark:text-white tracking-tight">{activeTab}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Track your learning journey systematically.</p>
            </div>
            {['overview', 'subjects', 'roadmap'].includes(activeTab) && (
              <button 
                onClick={() => setShowAddSubject(true)}
                className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:-translate-y-1 hover:shadow-blue-600/40"
              >
                <Plus size={20} />
                <span>Add Subject</span>
              </button>
            )}
          </div>
          {/* Search Bar */}
          {['overview', 'subjects', 'roadmap'].includes(activeTab) && (
          <div className="relative group/search max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-500 transition-colors duration-200" size={20} />
            <input
              id="search-bar"
              type="text"
              placeholder="Search subjects or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-14 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-lg hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
          )}
          
          {['overview', 'subjects', 'roadmap'].includes(activeTab) && (
          <div className="flex gap-3 mt-6 pl-1">
            {['all', 'pending', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 ${
                  filterStatus === status 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 -translate-y-0.5' 
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          )}
          {searchQuery && ['overview', 'subjects', 'roadmap'].includes(activeTab) && (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4 ml-2">
              Found <span className="font-bold text-blue-600 dark:text-blue-400">{filteredSubjects.length}</span> subject{filteredSubjects.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </header>

        {/* Dynamic Views */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-8">
            <StatsCard 
              label="Overall Progress" 
              value={`${stats.progress}%`} 
              subtext={`${stats.completedTopics}/${stats.totalTopics} topics completed`}
              color="blue"
            />
            <StatsCard 
              label="Active Subjects" 
              value={subjects.length} 
              subtext="Keep going!"
              color="indigo"
            />
            {aiInsights?.next && (
              <div className="col-span-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-3xl shadow-xl flex items-center justify-between card-hover animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <Sparkles className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight">AI Recommended: What to study next</h3>
                    <p className="text-blue-100 font-medium text-sm mt-0.5">Focus on "<span className="font-bold text-white">{aiInsights.next.topic.name}</span>" in {aiInsights.next.subject.name}</p>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    setIsAiMarking(true);
                    await new Promise(r => setTimeout(r, 800));
                    toggleTopic(aiInsights.next.subject._id || aiInsights.next.subject.id, aiInsights.next.topic.id);
                    setIsAiMarking(false);
                  }} 
                  className={`px-4 py-2 rounded-xl font-bold transition shadow-lg shrink-0 flex items-center justify-center gap-2 min-w-[100px] ${
                    isAiMarking ? 'bg-green-100 text-green-600 scale-95' : 'bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 active:scale-95'
                  }`}
                  disabled={isAiMarking}
                >
                  {isAiMarking ? (
                    <span className="flex items-center gap-2 animate-tick">
                      <CheckCircle2 size={18} />
                      Done!
                    </span>
                  ) : (
                    "Mark Done"
                  )}
                </button>
              </div>
            )}

            {progressPrediction && (
              <div className="col-span-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-l-4 border-l-green-500 p-8 rounded-3xl shadow-lg flex flex-row items-center gap-6 card-hover animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1">
                <div className="flex items-center gap-4 flex-1">
                  <TrendingUp size={28} className="text-green-500 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Smart Prediction</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">At your current speed of <span className="font-bold text-slate-700 dark:text-slate-200">{progressPrediction.velocity} topics/day</span>, you'll complete the syllabus in <span className="font-bold text-green-600">{progressPrediction.daysRemaining} days</span>.</p>
                  </div>
                </div>
                {aiInsights?.weak && (
                  <div className="w-auto flex-1 bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-inner">
                    <Target size={20} className="text-red-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Needs Attention</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Your weakest subject is <span className="font-bold text-red-500">{aiInsights.weak.name}</span></p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Progress Chart */}
            <div className="col-span-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 transition-colors">
              <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                <BarChart3 size={18} className="text-blue-500" />
                Analytics
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}%`} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        color: darkMode ? '#f8fafc' : '#0f172a'
                      }}
                    />
                    <Bar dataKey="progress" radius={[4, 4, 0, 0]} barSize={40}>
                      {filteredChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 transition-colors">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                <Calendar size={18} className="text-blue-500" />
                Upcoming Deadlines
              </h3>
              <div className="grid grid-cols-3 gap-6">
                {subjects.filter(s => s.examDate).length === 0 ? (
                  <p className="col-span-full text-slate-400 dark:text-slate-500 text-center py-4 text-sm italic">No exam dates set yet.</p>
                ) : (
                  subjects
                    .filter(s => s.examDate)
                    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
                    .map(s => {
                      const days = getDaysRemaining(s.examDate);
                      return (
                        <div key={s._id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{s.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{new Date(s.examDate).toLocaleDateString()}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-black ${days <= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
                            {days <= 0 ? 'Today' : `${days}d`}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="col-span-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 transition-colors">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                <Clock size={18} className="text-blue-500" />
                Recent Progress
              </h3>
              <div className="space-y-4">
                {filteredSubjects.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500 text-center py-8">{searchQuery ? 'No matching subjects found.' : 'No subjects added yet. Start by adding one!'}</p>
                ) : (
                  filteredSubjects.slice(0, 5).map(s => {
                    const progress = s.topics.length > 0 ? (s.topics.filter(t => t.completed).length / s.topics.length) * 100 : 0;
                    return (
                      <div key={s._id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-900 dark:text-slate-200">{s.name}</span>
                          <span className="text-slate-500 dark:text-slate-400">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-500" 
                            style={{ width: `${progress}%`, backgroundColor: s.color }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="grid grid-cols-2 gap-8">
            {filteredSubjects.length === 0 && (
              <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <BookOpen className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">{searchQuery ? 'No matching subjects found' : 'Your shelf is empty'}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{searchQuery ? `No subjects or topics match "${searchQuery}".` : 'Add subjects to begin generating your study roadmap.'}</p>
                {!searchQuery && (
                  <button 
                    onClick={() => setShowAddSubject(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                  >
                    Get Started
                  </button>
                )}
              </div>
            )}
            {filteredSubjects.map(subject => (
              <SubjectCard 
                key={subject._id || subject.id} 
                subject={subject} 
                onToggle={toggleTopic}
                onDelete={deleteSubject}
                onNoteEdit={(sid, tid, tname, tnotes) => setActiveNote({ subjectId: sid, topicId: tid, topicName: tname, notes: tnotes })}
                getDaysRemaining={getDaysRemaining}
              />
            ))}
          </div>
        )}        {activeTab === 'roadmap' && (
          <div className="space-y-8">
            {filteredRoadmap.length === 0 ? (
              <div className="text-center py-20">
                <Map size={60} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">{searchQuery ? `No roadmaps match "${searchQuery}".` : 'Add subjects and topics to generate a weekly roadmap.'}</p>
              </div>
            ) : (
              filteredRoadmap.map(subject => (
                <div key={subject.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-8 rounded-full" style={{ backgroundColor: subject.color }}></div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{subject.name} Roadmap</h3>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase">
                      {subject.durationWeeks} Weeks Plan
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-6">
                    {subject.schedule.map(week => (
                      <div key={week.week} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Week {week.week}</span>
                        </div>
                        <ul className="space-y-2">
                          {week.topics.map(topic => (
                            <li key={topic.id} className="text-xs flex items-start gap-2 text-slate-600 dark:text-slate-300">
                              {topic.completed ? (
                                <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 mt-0.5" />
                              )}
                              <span className={topic.completed ? 'line-through text-slate-400 dark:text-slate-600' : ''}>
                                {topic.name}
                              </span>
                            </li>
                          ))}
                          {week.topics.length === 0 && <li className="text-slate-400 dark:text-slate-500 italic text-xs">Rest / Buffer</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <Clock className="text-blue-600" />
                Daily Planner
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">What are we focusing on today?</p>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.target.elements.todoTask;
                  handleAddTodo(input.value);
                  input.value = '';
                }} 
                className="flex gap-2 mb-8"
              >
                <input 
                  name="todoTask"
                  required
                  placeholder="Add a new task..."
                  className="flex-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button type="submit" className="bg-blue-600 text-white px-6 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">
                  Add
                </button>
              </form>

              <div className="space-y-3">
                {todos.length === 0 ? (
                  <div className="py-12 text-center">
                    <Sparkles className="mx-auto text-slate-200 dark:text-slate-700 mb-2" size={32} />
                    <p className="text-slate-400 dark:text-slate-500 italic text-sm">Clear your mind and your list.</p>
                  </div>
                ) : (
                  todos.map(todo => (
                    <div key={todo._id} className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100/50 dark:border-slate-700/50 group transition-all hover:border-blue-200 dark:hover:border-blue-800">
                      <button 
                        onClick={() => toggleTodo(todo._id, todo.completed)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          todo.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-500'
                        }`}
                      >
                        {todo.completed && <CheckCircle2 size={16} />}
                      </button>
                      <span className={`flex-1 text-sm font-medium ${todo.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200'}`}>
                        {todo.task}
                      </span>
                      <button 
                        onClick={() => deleteTodo(todo._id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {isQuizLoading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-3xl min-h-[500px] animate-in fade-in duration-300">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/50 animate-pulse">
                    <Brain size={48} className="animate-spin-slow" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                    <Sparkles size={16} />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">AI Generating Quiz...</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Analyzing your topics to create unique challenges.</p>
              </div>
            )}
            {!quizState.active ? (
              <div className="space-y-8">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-6 shadow-xl shadow-blue-500/10">
                    <Brain size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Active Learning Quiz</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Select a subject to test your knowledge and prepare better.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {subjects.length === 0 ? (
                    <div className="col-span-2 py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                      <GraduationCap className="mx-auto text-slate-200 mb-4" size={48} />
                      <p className="text-slate-400 italic">Add some subjects first to start a quiz!</p>
                    </div>
                  ) : (
                    subjects.map(s => (
                      <button 
                        key={s._id}
                        onClick={() => startQuiz(s)}
                        className="group relative p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-left transition-all hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shadow-lg" style={{ backgroundColor: s.color }}>
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{s.name}</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{s.topics.length} Topics</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                          <span>Start Preparation Quiz</span>
                          <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : quizState.showResult ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-orange-500/30 animate-bounce">
                  <Award size={48} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Quiz Complete!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-12">Great effort on <span className="text-blue-600 font-bold">{quizState.subject.name}</span></p>
                
                <div className="grid grid-cols-2 gap-8 max-w-md mx-auto mb-12">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Your Score</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{quizState.score}/{quizState.questions.length}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Accuracy</p>
                    <p className="text-3xl font-black text-blue-600">{Math.round((quizState.score / quizState.questions.length) * 100)}%</p>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => startQuiz(quizState.subject)}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-xl shadow-blue-500/20"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => setQuizState({ ...quizState, active: false })}
                    className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Back to Selection
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setQuizState({ ...quizState, active: false })}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowRight className="transform rotate-180" size={18} />
                    <span className="font-bold text-sm">Exit Quiz</span>
                  </button>
                  <div className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full text-xs font-black">
                    Question {quizState.currentIndex + 1}/{quizState.questions.length}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 min-h-[400px] flex flex-col">
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-10">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-500" 
                      style={{ width: `${((quizState.currentIndex + 1) / quizState.questions.length) * 100}%` }}
                    />
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-10 leading-tight">
                    {quizState.questions[quizState.currentIndex].question}
                  </h3>

                  <div className="grid grid-cols-1 gap-4 flex-1">
                    {quizState.questions[quizState.currentIndex].options.map((option, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                          quizState.selectedAnswer === idx
                            ? (quizState.isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20')
                            : quizState.selectedAnswer !== null && idx === quizState.questions[quizState.currentIndex].correct
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                                : 'border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-800/30'
                        }`}
                        disabled={quizState.selectedAnswer !== null}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            quizState.selectedAnswer === idx ? 'bg-white shadow-sm' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-200">{option}</span>
                        </div>
                        {quizState.selectedAnswer === idx && (
                          quizState.isCorrect ? <CheckCircle2 className="text-green-500" /> : <X className="text-red-500" />
                        )}
                        {quizState.selectedAnswer !== null && idx === quizState.questions[quizState.currentIndex].correct && quizState.selectedAnswer !== idx && (
                          <CheckCircle2 className="text-green-500 opacity-50" />
                        )}
                      </button>
                    ))}
                  </div>

                  {quizState.selectedAnswer !== null && (
                    <button 
                      onClick={nextQuestion}
                      className="mt-10 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all animate-in fade-in slide-in-from-bottom-2"
                    >
                      {quizState.currentIndex + 1 === quizState.questions.length ? 'See Results' : 'Next Question'}
                      <ArrowRight size={20} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg">
                  <CalendarDays size={30} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Auto Schedule Generator</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Let AI craft your perfect daily study plan.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Subject</label>
                  <select 
                    value={scheduleState.subjectId}
                    onChange={(e) => setScheduleState(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm transition-all"
                  >
                    <option value="">Choose a subject...</option>
                    {subjects.map(s => (
                      <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Daily Free Time (Hours)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="24"
                    value={scheduleState.freeTime}
                    onChange={(e) => setScheduleState(prev => ({ ...prev, freeTime: e.target.value }))}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                  />
                </div>
                <button 
                  onClick={generateAutoSchedule}
                  disabled={scheduleState.isGenerating}
                  className="bg-indigo-600 text-white p-3.5 rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {scheduleState.isGenerating ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap size={20} className="fill-white" />
                      Build Timetable
                    </>
                  )}
                </button>
              </div>
            </div>

            {scheduleState.generated && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
                {scheduleState.generated.map((day, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 group hover:border-indigo-500/50 transition-all card-hover">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">Day {idx + 1}</p>
                        <h4 className="font-bold text-slate-900 dark:text-white">{day.date}</h4>
                      </div>
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                        <Clock size={18} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Focus ({day.hours} hrs)</p>
                      {day.topics.map(topic => (
                        <div key={topic.id} className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100/50 dark:border-slate-700/50">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{topic.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'focus' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white dark:bg-slate-900 p-12 flex flex-col items-center justify-center rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
              
              <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-12">
                <button 
                  onClick={() => { setTimerMode('study'); setTimeLeft(25*60); setTimerActive(false); }}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${timerMode === 'study' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Study Session
                </button>
                <button 
                  onClick={() => { setTimerMode('break'); setTimeLeft(5*60); setTimerActive(false); }}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${timerMode === 'break' ? 'bg-green-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Short Break
                </button>
              </div>

              <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-12">
                <svg className="w-full h-full transform -rotate-90 absolute">
                  <circle cx="50%" cy="50%" r="48%" stroke="currentColor" strokeWidth="4%" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                  <circle 
                    cx="50%" cy="50%" r="48%" 
                    stroke="currentColor" 
                    strokeWidth="4%" 
                    fill="transparent" 
                    strokeDasharray="301.59" 
                    strokeDashoffset={301.59 - (301.59 * (timeLeft / (timerMode === 'study' ? 25*60 : 5*60)))} 
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ${timerMode === 'study' ? 'text-blue-500' : 'text-green-500'}`}
                    style={{ r: "calc(50% - 10px)", strokeDasharray: "calc(2 * 3.14159 * (50% - 10px))", strokeDashoffset: `calc(2 * 3.14159 * (50% - 10px) * (1 - ${timeLeft / (timerMode === 'study' ? 25*60 : 5*60)}))`}}
                  />
                </svg>
                <div className="z-10 flex flex-col items-center">
                  <span className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                    {timerMode === 'study' ? 'Focus Time' : 'Relax'}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={toggleTimer}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95 ${timerActive ? 'bg-orange-500 shadow-orange-500/30' : 'bg-blue-600 shadow-blue-500/30'}`}
                >
                  {timerActive ? <span className="w-5 h-5 bg-white rounded-sm"></span> : <span className="ml-1 w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent"></span>}
                </button>
                <button 
                  onClick={resetTimer}
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-transform hover:scale-110 active:scale-95"
                >
                  <RefreshCw size={24} />
                </button>
              </div>

            </div>
          </div>
        )}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-12 gap-8 h-[calc(100vh-14rem)] min-h-[700px] animate-in fade-in slide-in-from-bottom-4">
            {/* Friends & Search Sidebar */}
            <div className="col-span-4 flex flex-col gap-6 overflow-hidden">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex flex-col h-full overflow-hidden">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by name or @username..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => searchUsers(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                  {/* Search Results */}
                  {userSearchResults.length > 0 && (
                    <div className="space-y-2">
                       <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Search Results</h4>
                       {userSearchResults.map(u => (
                         <div key={u._id} className="flex items-center justify-between p-2 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
                           <div className="flex items-center gap-3 overflow-hidden">
                             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold shrink-0">{u.name.charAt(0)}</div>
                             <div className="flex flex-col min-w-0">
                               <span className="text-sm font-bold truncate leading-tight">{u.name}</span>
                               <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium truncate">@{u.username || 'no_handle'}</span>
                             </div>
                           </div>
                           <button onClick={() => sendFriendRequest(u._id)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"><UserPlus size={16} /></button>
                         </div>
                       ))}
                    </div>
                  )}

                  {/* Friend Requests */}
                  {friendRequests.length > 0 && (
                    <div className="space-y-2">
                       <h4 className="text-[10px] font-bold uppercase text-amber-500 tracking-widest px-1">Friend Requests ({friendRequests.length})</h4>
                       {friendRequests.map(u => (
                         <div key={u._id} className="flex items-center justify-between p-2 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10">
                           <div className="flex items-center gap-2 overflow-hidden">
                             <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs shrink-0">{u.name.charAt(0)}</div>
                             <span className="text-sm font-medium truncate">{u.name}</span>
                           </div>
                           <div className="flex gap-1">
                             <button onClick={() => acceptFriendRequest(u._id)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition"><CheckCircle2 size={16} /></button>
                           </div>
                         </div>
                       ))}
                    </div>
                  )}

                  {/* Friends List */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">My Friends</h4>
                    {friends.length === 0 ? (
                      <div className="text-center py-10">
                        <User size={32} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400">Search for users above to make new friends!</p>
                      </div>
                    ) : (
                      friends.map(f => (
                        <div 
                          key={f._id} 
                          onClick={() => setSelectedFriend(f)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedFriend?._id === f._id ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                              {f.photoURL ? <img src={f.photoURL} alt="" className="w-full h-full object-cover" /> : f.name.charAt(0)}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 rounded-full ${formatLastActive(f.lastActive) === 'Active Now' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-400'}`}></div>
                            
                            {/* Unread Message Notification Badge with Count */}
                            {notifications.filter(n => n.fromId === f._id && !n.isRead).length > 0 && (
                              <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-green-500 text-white text-[9px] font-black rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-bounce shadow-lg shadow-green-500/40 z-10">
                                {notifications.filter(n => n.fromId === f._id && !n.isRead).length}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm truncate ${notifications.some(n => n.fromId === f._id && !n.isRead) ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                              {f.name}
                            </h4>
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold truncate">@{f.username || 'no_handle'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="col-span-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden relative">
              {selectedFriend ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {selectedFriend.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{selectedFriend.name}</h4>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">@{selectedFriend.username || 'no_handle'}</span>
                        </div>
                        <span className={`text-[10px] font-bold ${formatLastActive(selectedFriend.lastActive) === 'Active Now' ? 'text-green-500' : 'text-slate-400'}`}>
                          {formatLastActive(selectedFriend.lastActive)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleInitiateCall('voice')}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                      >
                        <Phone size={20} />
                      </button>
                      <button 
                        onClick={() => handleInitiateCall('video')}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                      >
                        <Video size={20} />
                      </button>
                      <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800 mx-1"></div>
                      <div className="relative group">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${chatSearchQuery ? 'text-blue-500' : 'text-slate-400'}`} size={14} />
                        <input 
                          type="text" 
                          placeholder="Search chat..." 
                          value={chatSearchQuery}
                          onChange={(e) => setChatSearchQuery(e.target.value)}
                          className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-none w-32 md:w-48 transition-all"
                        />
                        {chatSearchQuery && (
                          <button onClick={() => setChatSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages History */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
                    {filteredChatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                        <MessageSquare size={48} className="mb-2 opacity-50" />
                        <p className="text-sm">{chatSearchQuery ? 'No messages matching your search' : 'Say hello to start the conversation!'}</p>
                      </div>
                    ) : (
                      filteredChatMessages.map((msg, i) => (
                        <div key={msg._id || i} className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'} group/msg`}>
                          <div className={`relative max-w-[75%] p-3.5 rounded-2xl text-sm transition-all ${
                            msg.senderId === user.uid 
                              ? 'bg-blue-600 text-white rounded-br-none shadow-md' 
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700'
                          }`}>
                            {editingMessage?.id === msg._id ? (
                              <div className="flex flex-col gap-2 min-w-[200px]">
                                <textarea 
                                  autoFocus
                                  className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white p-2 rounded-lg text-sm border-none focus:ring-1 focus:ring-blue-400 outline-none"
                                  value={editingMessage.content}
                                  onChange={(e) => setEditingMessage({...editingMessage, content: e.target.value})}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditMessage(msg._id, editingMessage.content); }
                                    if (e.key === 'Escape') setEditingMessage(null);
                                  }}
                                />
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => setEditingMessage(null)} className="text-[10px] uppercase font-bold opacity-70">Cancel</button>
                                  <button onClick={() => handleEditMessage(msg._id, editingMessage.content)} className="text-[10px] uppercase font-black">Save</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                                                 {msg.content.startsWith('AUDIO_DATA:') ? (
                                   <div className="flex flex-col gap-2 min-w-[230px]">
                                     <div className="flex items-center gap-3 bg-white/10 dark:bg-slate-900/40 p-2 rounded-xl border border-white/10">
                                       <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                                         <Mic size={14} className="text-white" />
                                       </div>
                                       <audio 
                                         controls 
                                         className="h-8 max-w-[150px] filter brightness-110"
                                         src={msg.content.replace('AUDIO_DATA:', '')}
                                       />
                                     </div>
                                   </div>
                                 ) : (
                                   <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                 )}

                                
                                {/* Reactions Display */}
                                {msg.reactions && msg.reactions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {msg.reactions.reduce((acc, r) => {
                                      const existing = acc.find(x => x.emoji === r.emoji);
                                      if (existing) existing.count++;
                                      else acc.push({ emoji: r.emoji, count: 1 });
                                      return acc;
                                    }, []).map(r => (
                                      <button 
                                        key={r.emoji} 
                                        onClick={() => handleReactToMessage(msg._id, r.emoji)}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100/10 dark:bg-white/10 rounded-full text-[10px] font-bold border border-white/20"
                                      >
                                        {r.emoji} {r.count}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Message Actions Trigger (Hover) */}
                            {!editingMessage && (
                              <div className={`absolute top-0 ${msg.senderId === user.uid ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden`}>
                                {['❤️', '👍', '🔥', '👏'].map(emoji => (
                                  <button key={emoji} onClick={() => handleReactToMessage(msg._id, emoji)} className="hover:scale-125 transition-transform p-1">{emoji}</button>
                                ))}
                                <div className="w-[1px] h-3 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                {msg.senderId === user.uid && (
                                  <>
                                    <button onClick={() => { setEditingMessage({ id: msg._id, content: msg.content }); setActiveMessageId(null); }} className="p-1 hover:text-blue-500 transition-colors"><Edit size={12} /></button>
                                    <button onClick={() => handleDeleteMessage(msg._id)} className="p-1 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className={`flex items-center gap-2 mt-1 px-1 text-[10px] opacity-60 font-medium ${msg.senderId === user.uid ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.isEdited && <span>• Edited</span>}
                            {msg.senderId === user.uid && (
                              <div className="flex items-center">
                                {msg.isRead ? (
                                  <div className="flex -space-x-1">
                                    <CheckCircle2 size={10} className="text-blue-400" />
                                    <CheckCircle2 size={10} className="text-blue-400" />
                                  </div>
                                ) : (
                                  <CheckCircle2 size={10} />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md relative">
                    {friendIsTyping && (
                      <div className="absolute -top-8 left-6 animate-pulse flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{selectedFriend.name.split(' ')[0]} is typing...</span>
                      </div>
                    )}
                    
                    {showEmojiMenu && (
                      <div className="absolute bottom-full left-4 mb-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
                        {['❤️', '👍', '🔥', '👏', '😂', '😮', '😢', '🙏', '💯', '✨'].map(emoji => (
                          <button 
                            key={emoji} 
                            onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojiMenu(false); }}
                            className="text-xl hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    <form 
                      onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                      className="relative flex items-center gap-2"
                    >
                      <button 
                        type="button"
                        onClick={() => setShowEmojiMenu(!showEmojiMenu)}
                        className={`p-2 transition-colors ${showEmojiMenu ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <Smile size={22} />
                      </button>
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={isRecording ? "Recording voice..." : "Type a message..."}
                          className={`w-full pl-4 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${isRecording ? 'animate-pulse ring-2 ring-red-500/50 placeholder:text-red-500' : ''}`}
                          disabled={isRecording}
                        />
                        {isRecording && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                          </div>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={toggleRecording}
                        className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                        {isRecording ? <Square size={18} /> : <Mic size={22} />}
                      </button>
                      <button 
                        type="submit"
                        disabled={!newMessage.trim() || isRecording}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
                      >
                        <Send size={20} />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">My Conversations</h3>
                  <p className="max-w-xs mx-auto text-sm">Select a friend from the left sidebar to start chatting or find new friends to build your study group.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'activity' && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Recent Activity</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Stay updated with your study group and messages.</p>
                </div>
                <button 
                  onClick={markAllNotificationsRead}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Mark all as read
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <Bell size={40} className="text-slate-300" />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">No activity yet</p>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">When you get messages, friend requests, or call alerts, they'll show up here.</p>
                  </div>
                ) : (
                  notifications.slice().reverse().map(n => (
                    <div 
                      key={n._id} 
                      className={`flex items-start gap-4 p-5 rounded-2xl transition-all border ${n.isRead ? 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 opacity-60' : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 shadow-sm'}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                        n.type === 'message' ? 'bg-green-100 text-green-600' : 
                        n.type === 'friend_request' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {n.type === 'message' ? <MessageSquare size={20} /> : n.type === 'friend_request' ? <UserPlus size={20} /> : <Bell size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            n.type === 'message' ? 'bg-green-100 text-green-600' : 
                            n.type === 'friend_request' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {n.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">{n.content}</p>
                        
                        {n.type === 'message' && (
                          <button 
                            onClick={() => {
                              const friend = friends.find(f => f._id === n.fromId);
                              if (friend) {
                                setSelectedFriend(friend);
                                handleTabChange('messages');
                              }
                            }}
                            className="text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            Open Chat <ChevronRight size={14} />
                          </button>
                        )}
                        
                        {n.type === 'friend_request' && !n.isRead && (
                          <div className="flex gap-2">
                             <button onClick={() => acceptFriendRequest(n.fromId)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold">Accept</button>
                             <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-bold">Decline</button>
                          </div>
                        )}
                      </div>
                      {!n.isRead && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 mt-2 animate-pulse"></div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              {/* Cover Image */}
              <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
                {(isEditingProfile ? tempProfile.coverURL : user.coverURL) && (
                  <img src={isEditingProfile ? tempProfile.coverURL : user.coverURL} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {!isEditingProfile ? (
                  <button 
                    onClick={() => {
                      setTempProfile({ 
                        displayName: user.displayName || '', 
                        username: user.username || '',
                        photoURL: user.photoURL || '', 
                        coverURL: user.coverURL || '',
                        bio: userBio 
                      });
                      setIsEditingProfile(true);
                    }}
                    className="absolute top-6 right-6 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-white/30 transition flex items-center gap-2 z-10"
                  >
                    <Edit size={16} /> Edit Profile
                  </button>
                ) : (
                  <label className="absolute top-6 right-6 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold cursor-pointer hover:bg-black/60 transition flex items-center gap-2 z-10">
                    <Camera size={14} /> Change Cover
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                  </label>
                )}
              </div>

              <div className="px-8 pb-8">
                <div className="relative -mt-16 mb-6 flex justify-between items-end">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-lg">
                      {(isEditingProfile ? tempProfile.photoURL : user.photoURL) ? (
                        <img src={isEditingProfile ? tempProfile.photoURL : user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <User size={48} />
                        </div>
                      )}
                    </div>
                    {isEditingProfile && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-transform hover:scale-110">
                        <Camera size={18} />
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      </label>
                    )}
                  </div>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Display Name</label>
                        <input 
                          type="text" 
                          value={tempProfile.displayName}
                          onChange={(e) => setTempProfile({...tempProfile, displayName: e.target.value})}
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Username (@)</label>
                        <input 
                          type="text" 
                          value={tempProfile.username}
                          onChange={(e) => setTempProfile({...tempProfile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                          placeholder="unique_handle"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                      <textarea 
                        rows="4"
                        value={tempProfile.bio}
                        onChange={(e) => setTempProfile({...tempProfile, bio: e.target.value})}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setIsEditingProfile(false)}
                        className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/30"
                      >
                        <Save size={18} /> Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{user.displayName || 'Student'}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-blue-600 dark:text-blue-400 font-bold text-sm">@{user.username || 'username_not_set'}</p>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2">About Me</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {userBio || "No bio added yet. Click 'Edit Profile' to introduce yourself!"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.totalTopics}</div>
                        <div className="text-xs font-bold text-blue-600/60 dark:text-blue-400/60 uppercase">Total Topics</div>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 text-center">
                        <div className="text-2xl font-black text-green-600 dark:text-green-400">{stats.completedTopics}</div>
                        <div className="text-xs font-bold text-green-600/60 dark:text-green-400/60 uppercase">Completed</div>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 text-center">
                        <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{subjects.length}</div>
                        <div className="text-xs font-bold text-purple-600/60 dark:text-purple-400/60 uppercase">Subjects</div>
                      </div>
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 text-center">
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.progress}%</div>
                        <div className="text-xs font-bold text-amber-600/60 dark:text-amber-400/60 uppercase">Progress</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Account Settings</h2>
              <p className="text-slate-500 dark:text-slate-400">Manage your security and preferences.</p>
            </div>
            
            {/* Change Password */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Lock size={20} className="text-blue-500" />
                Change Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                  <div className="relative">
                    <input 
                      type={showSettingsPassword ? "text" : "password"}
                      required
                      className="w-full p-3 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showSettingsPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showSettingsConfirmPassword ? "text" : "password"}
                      required
                      className="w-full p-3 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSettingsConfirmPassword(!showSettingsConfirmPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showSettingsConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {settingsMsg.text && (
                  <div className={`p-3 rounded-lg text-sm font-medium text-center ${settingsMsg.type === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                    {settingsMsg.text}
                  </div>
                )}

                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
                  Update Password
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-3xl border border-red-100 dark:border-red-900/20">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle size={20} />
                Danger Zone
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                Once you delete your account, there is no going back. All your subjects, topics, and progress will be permanently removed.
              </p>
              <button onClick={handleDeleteAccount} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-500/30">
                Delete Account
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Note Modal */}
      {activeNote && (
        <NoteModal 
          isOpen={!!activeNote} 
          onClose={() => setActiveNote(null)} 
          topicName={activeNote.topicName}
          note={activeNote.notes}
          onSave={(notes) => updateTopicNote(activeNote.subjectId, activeNote.topicId, notes)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[100] animate-in slide-in-from-right-10 fade-in duration-500`}>
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
            toast.type === 'success' ? 'bg-green-500/90 border-green-400/50 text-white' : 
            toast.type === 'error' ? 'bg-red-500/90 border-red-400/50 text-white' : 
            'bg-blue-600/90 border-blue-500/50 text-white'
          }`}>
            <div className="bg-white/20 p-2 rounded-full">
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : 
               toast.type === 'error' ? <AlertTriangle size={18} /> : <Bell size={18} />}
            </div>
            <p className="font-bold text-sm tracking-tight">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-2 hover:scale-110 transition-transform">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add Subject */}
      {showAddSubject && (
        <div className="modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="modal-content bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/30 dark:border-slate-700/50">
            <div className="p-6 border-b border-slate-100/80 dark:border-slate-800/80 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={20} className="text-blue-500" />
                Configure New Subject
              </h3>
              <button onClick={() => setShowAddSubject(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubject} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subject Name</label>
                <input 
                  autoFocus
                  required
                  placeholder="e.g. Machine Learning"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all duration-300"
                  value={newSubject.name}
                  onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Duration (Weeks)</label>
                  <input 
                    type="number"
                    min="1"
                    max="52"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all duration-300"
                    value={newSubject.durationWeeks}
                    onChange={e => setNewSubject({...newSubject, durationWeeks: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Theme Color</label>
                  <input 
                    type="color"
                    className="w-full h-[50px] p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-300"
                    value={newSubject.color}
                    onChange={e => setNewSubject({...newSubject, color: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Syllabus Topics (One per line)</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Introduction&#10;Neural Networks&#10;Backpropagation&#10;..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-900 dark:text-white transition-all duration-300"
                  value={newSubject.topics}
                  onChange={e => setNewSubject({...newSubject, topics: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Exam Date (Optional)</label>
                <input 
                  type="date"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all duration-300"
                  value={newSubject.examDate}
                  onChange={e => setNewSubject({...newSubject, examDate: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-gradient flex-1 px-4 py-3 rounded-xl text-white font-semibold"
                >
                  Create Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Remote audio element (hidden) */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      {/* Incoming Call Banner */}
      {callStatus === 'incoming' && incomingCall && (
        <IncomingCallBanner
          call={incomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Active / Outgoing Call Modal */}
      {(callStatus === 'calling' || callStatus === 'active') && (
        <CallModal
          status={callStatus}
          type={callType}
          friend={selectedFriend}
          onEnd={endCall}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isSpeakerOff={isSpeakerOff}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
          callDuration={callDuration}
          formatCallDuration={formatCallDuration}
        />
      )}
    </div>
  );
};

// --- Sub-components ---

// Incoming call banner
const IncomingCallBanner = ({ call, onAccept, onReject }) => (
  <div className="fixed top-0 left-0 right-0 z-[300] flex justify-center p-4 animate-in slide-in-from-top duration-300">
    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4 max-w-sm w-full">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 animate-pulse">
        {call.fromName?.charAt(0) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate">{call.fromName}</p>
        <p className="text-sm text-blue-400 flex items-center gap-1">
          {call.callType === 'video' ? <Video size={14}/> : <Phone size={14}/>}
          Incoming {call.callType === 'video' ? 'Video' : 'Voice'} Call
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onReject}
          className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
        >
          <PhoneOff size={20} className="text-white"/>
        </button>
        <button
          onClick={onAccept}
          className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-all shadow-lg animate-bounce"
        >
          <Phone size={20} className="text-white fill-white"/>
        </button>
      </div>
    </div>
  </div>
);

const CallModal = ({ status, type, friend, onEnd, localStream, remoteStream, isMuted, isSpeakerOff, onToggleMute, onToggleSpeaker, callDuration, formatCallDuration }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const isCalling = status === 'calling';
  const isActive = status === 'active';

  return (
    <div className="fixed inset-0 z-[200] flex flex-col text-white overflow-hidden" style={{background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'}}>
      {/* Animated background rings */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5 animate-ping" style={{animationDuration:'3s'}}/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5 animate-ping" style={{animationDuration:'2s'}}/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-blue-500/20 animate-ping" style={{animationDuration:'1.5s'}}/>
      </div>

      {/* Video call - remote stream fills background */}
      {type === 'video' && remoteStream && (
        <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full items-center justify-between p-8 backdrop-blur-sm bg-black/30">
        {/* Top bar */}
        <div className="w-full flex justify-between items-center">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">StudyFlow Call</div>
          {isActive && (
            <div className="flex items-center gap-2 bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
              {formatCallDuration(callDuration)}
            </div>
          )}
          {isCalling && (
            <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>
              Calling...
            </div>
          )}
          <div className="text-xs text-white/30">🔒 E2E Encrypted</div>
        </div>

        {/* Center - Avatar & Name */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div
              className="w-36 h-36 rounded-full overflow-hidden flex items-center justify-center text-5xl font-black shadow-2xl ring-4 ring-white/10"
              style={{background: 'linear-gradient(135deg, #3b82f6, #6366f1)'}}
            >
              {friend?.photoURL
                ? <img src={friend.photoURL} alt="" className="w-full h-full object-cover"/>
                : (friend?.name?.charAt(0) || '?')
              }
            </div>
            {/* Audio activity indicator */}
            {isActive && !isMuted && (
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-lg">
                <Mic size={16} className="text-white"/>
              </div>
            )}
            {isActive && isMuted && (
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-lg">
                <MicOff size={16} className="text-white"/>
              </div>
            )}
          </div>

          <div className="text-center">
            <h2 className="text-4xl font-black tracking-tight mb-1">{friend?.name || 'Unknown'}</h2>
            <p className="text-base text-white/60 font-medium">
              {isCalling
                ? `Calling via ${type === 'video' ? 'video' : 'voice'}...`
                : isActive
                ? type === 'video' ? '📹 Video Connected' : '🎙️ Voice Connected'
                : ''}
            </p>
          </div>

          {/* Waveform animation when active */}
          {isActive && (
            <div className="flex items-end gap-1 h-8">
              {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.4].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-blue-400 rounded-full"
                  style={{
                    height: `${h * 32}px`,
                    animation: `pulse ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 80}ms`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6 mb-6">
          {/* Feature buttons row */}
          <div className="flex items-center gap-6">
            {/* Mute */}
            <button
              onClick={onToggleMute}
              className={`flex flex-col items-center gap-2 group`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl border ${
                isMuted
                  ? 'bg-red-500/30 border-red-500/50 text-red-400'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}>
                {isMuted ? <MicOff size={24}/> : <Mic size={24}/>}
              </div>
              <span className="text-xs text-white/60 font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* Speaker */}
            <button
              onClick={onToggleSpeaker}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl border ${
                isSpeakerOff
                  ? 'bg-orange-500/30 border-orange-500/50 text-orange-400'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}>
                {isSpeakerOff
                  ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                }
              </div>
              <span className="text-xs text-white/60 font-medium">{isSpeakerOff ? 'Speaker On' : 'Speaker'}</span>
            </button>

            {/* Video toggle for video calls */}
            {type === 'video' && (
              <button className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all shadow-xl">
                  <Video size={24}/>
                </div>
                <span className="text-xs text-white/60 font-medium">Camera</span>
              </button>
            )}
          </div>

          {/* End call button */}
          <button
            onClick={onEnd}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 active:scale-90 transition-all shadow-[0_0_50px_rgba(239,68,68,0.5)] hover:shadow-[0_0_70px_rgba(239,68,68,0.8)] hover:scale-105"
          >
            <PhoneOff size={32} className="fill-white text-white"/>
          </button>
          <span className="text-xs text-white/50 font-medium">End Call</span>
        </div>
      </div>

      {/* Local video preview (video call only) */}
      {type === 'video' && localStream && (
        <div className="absolute top-20 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-30">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]"/>
          <div className="absolute bottom-1 left-0 right-0 text-center text-xs text-white/70 font-medium">You</div>
        </div>
      )}
    </div>
  );
};

const NoteModal = ({ isOpen, onClose, note, onSave, topicName }) => {
  const [tempNote, setTempNote] = useState(note || '');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit size={18} className="text-blue-500" />
            Notes: {topicName}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5">
          <textarea 
            autoFocus
            className="w-full h-40 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-700 dark:text-slate-200 text-sm"
            placeholder="Write your notes here..."
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
          />
        </div>
        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
          <button onClick={() => { onSave(tempNote); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">Save Note</button>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'nav-active' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 hover:translate-x-1'
    }`}
  >
    <span className={`transition-transform duration-300 ${active ? '' : 'group-hover:scale-110'}`}>{icon}</span>
    <span className="font-semibold text-sm md:block hidden">{label}</span>
  </button>
);

const StatsCard = ({ label, value, subtext, color }) => {
  return (
    <div className={`stat-card-${color} p-6 rounded-2xl flex flex-col justify-between h-36 card-hover animate-fade-in-up ${color === 'blue' ? 'stagger-1' : 'stagger-2'}`}>
      <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.15em]">{label}</p>
      <div>
        <h3 className="text-4xl font-black text-slate-900 dark:text-white animate-count">{value}</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>
      </div>
    </div>
  );
};

const SubjectCard = ({ subject, onToggle, onDelete, onNoteEdit, getDaysRemaining }) => {
  const [expanded, setExpanded] = useState(false);
  const topics = subject.topics || [];
  const completedCount = topics.filter(t => t.completed).length;
  const progress = topics.length > 0 ? (completedCount / topics.length) * 100 : 0;
  
  const daysLeft = getDaysRemaining(subject.examDate);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden card-hover">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform duration-300 hover:scale-110 hover:rotate-3"
            style={{ backgroundColor: subject.color, boxShadow: `0 8px 20px ${subject.color}40` }}
          >
            {subject.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate text-slate-900 dark:text-white">{subject.name}</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1"><Clock size={12} /> {subject.durationWeeks} Weeks</span>
              <span className="flex items-center gap-1"><BookOpen size={12} /> {subject.topics.length} Topics</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{Math.round(progress)}% Done</span>
              {daysLeft !== null && (
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-tighter ${daysLeft <= 3 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-orange-100 text-orange-600'}`}>
                  {daysLeft <= 0 ? 'Exam Today!' : `${daysLeft} Days to Exam`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => onDelete(subject.id)}
            className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
          >
            <Trash2 size={18} />
          </button>
          <button 
            onClick={() => setExpanded(!expanded)}
            className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${expanded ? 'rotate-90' : ''}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-700 rounded-full progress-glow animate-progress relative"
            style={{ width: `${progress}%`, backgroundColor: subject.color }}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 bg-gradient-to-b from-slate-50/80 to-white/50 dark:from-slate-800/50 dark:to-slate-900/50 animate-fade-in-up">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-3 tracking-[0.2em]">Syllabus Breakdown</h4>
          <div className="space-y-2">
            {subject.topics.map((topic, idx) => (
              <div 
                key={topic.id}
                onClick={() => onToggle(subject.id, topic.id)}
                className="topic-item flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 group"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                {topic.completed ? (
                  <CheckCircle2 size={20} className="text-green-500 shrink-0 checkbox-done" />
                ) : (
                  <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 group-hover:border-blue-400 group-hover:scale-110 shrink-0 transition-all duration-200" />
                )}
                <span className={`text-sm font-medium transition-all duration-300 flex-1 ${topic.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200'}`}>
                  {topic.name}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onNoteEdit(subject._id || subject.id, topic.id, topic.name, topic.notes); }}
                  className={`p-2 rounded-lg transition-all duration-200 ${topic.notes ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;