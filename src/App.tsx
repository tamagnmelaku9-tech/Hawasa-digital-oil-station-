import React, { useState, useEffect } from "react";
import {
  Fuel,
  Car,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Smartphone,
  RefreshCw,
  Languages,
  UserCheck,
  Server,
  Shield,
  Database,
  LogOut,
  MapPin,
  Bell,
  ChevronRight,
  Sparkles,
  PlusCircle,
  Search,
  ArrowRight,
  Bike,
  Bus,
  Truck
} from "lucide-react";
import { GasStation, QueueToken, SMSAlert, VehicleType, StationStatus, TokenStatus } from "./types";
import { localization } from "./localization";

export default function App() {
  // Localization and views state
  const [lang, setLang] = useState<"am" | "en">("am");
  const [currentTab, setCurrentTab] = useState<"driver" | "attendant" | "architecture">("driver");

  // Core data states
  const [stations, setStations] = useState<GasStation[]>([]);
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSAlert[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Active user token state (saved in localStorage)
  const [activeToken, setActiveToken] = useState<QueueToken | null>(() => {
    const saved = localStorage.getItem("hawassa_fuel_active_token");
    return saved ? JSON.parse(saved) : null;
  });

  // Booking Form State
  const [plateCode, setPlateCode] = useState<string>("3");
  const [plateRegion, setPlateRegion] = useState<string>("HW"); // HW for Hawassa, AA for Addis Ababa, ET for Ethiopia, etc.
  const [plateDigits, setPlateDigits] = useState<string>("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("bajaj");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState<boolean>(false);

  // Attendant & Security states
  const [attendantUsername, setAttendantUsername] = useState<string>("");
  const [attendantPassword, setAttendantPassword] = useState<string>("");
  const [attendantToken, setAttendantToken] = useState<string>(() => {
    return localStorage.getItem("hawassa_fuel_attendant_token") || "";
  });
  const [attendantUser, setAttendantUser] = useState<any>(() => {
    const saved = localStorage.getItem("hawassa_fuel_attendant_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAttendantLoggedIn, setIsAttendantLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem("hawassa_fuel_attendant_token");
  });
  const [attendantStationId, setAttendantStationId] = useState<string | null>(() => {
    return localStorage.getItem("hawassa_fuel_attendant_station_id") || "station-1";
  });
  const [loginStationId, setLoginStationId] = useState<string>("station-1");
  const [attendantError, setAttendantError] = useState<string | null>(null);

  // Secure Password Change Workflow states (3-step verification)
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPasswordState, setNewPasswordState] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [isPasswordChanging, setIsPasswordChanging] = useState<boolean>(false);

  // Private isolated driver logs
  const [privateSmsLogs, setPrivateSmsLogs] = useState<SMSAlert[]>([]);
  const [privateLoading, setPrivateLoading] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Live Toast simulated phone notifications
  const [incomingSms, setIncomingSms] = useState<SMSAlert | null>(null);

  // Text resources short-hand
  const t = localization[lang];

  // Load Initial Data & SSE Stream
  useEffect(() => {
    // Initial fetch
    const fetchInitialData = async () => {
      try {
        const resStations = await fetch("/api/stations");
        const dataStations = await resStations.json();
        setStations(dataStations);
        
        // Default to first station if none selected
        if (dataStations.length > 0) {
          if (!selectedStationId) {
            setSelectedStationId(dataStations[0].id);
          }
          setLoginStationId(dataStations[0].id);
        }

        const resTokens = await fetch("/api/tokens");
        const dataTokens = await resTokens.json();
        setTokens(dataTokens);

        const resSms = await fetch("/api/sms-logs");
        const dataSms = await resSms.json();
        setSmsLogs(dataSms);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };

    fetchInitialData();

    // Server Sent Events (SSE) for real-time synchronization with automatic reconnection
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource("/api/events");

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "stations") {
            setStations(parsed.data);
          } else if (parsed.type === "tokens") {
            setTokens(parsed.data);
          } else if (parsed.type === "sms") {
            setSmsLogs((prev) => [parsed.data, ...prev]);
            
            // Trigger virtual phone push notification
            setIncomingSms(parsed.data);
            
            // Auto-hide sms toast after 7 seconds
            setTimeout(() => {
              setIncomingSms((current) => current?.id === parsed.data.id ? null : current);
            }, 7000);
          }
        } catch (e) {
          console.error("Error parsing SSE event:", e);
        }
      };

      eventSource.onerror = (err) => {
        console.warn("SSE connection closed or failed. Scheduling reconnect in 5 seconds...");
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Update localized Active Token whenever tokens array updates from SSE
  useEffect(() => {
    if (activeToken && tokens.length > 0) {
      const serverToken = tokens.find((t) => t.id === activeToken.id);
      if (serverToken) {
        if (JSON.stringify(serverToken) !== JSON.stringify(activeToken)) {
          setActiveToken(serverToken);
          localStorage.setItem("hawassa_fuel_active_token", JSON.stringify(serverToken));
        }
      }
    }
  }, [tokens, activeToken?.id]);

  // Load Attendant Profile if token exists in localStorage on startup
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("hawassa_fuel_attendant_token");
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const user = await res.json();
            setAttendantUser(user);
            setIsAttendantLoggedIn(true);
            if (user.stationId) {
              setAttendantStationId(user.stationId);
              localStorage.setItem("hawassa_fuel_attendant_station_id", user.stationId);
            }
          } else {
            // Clear invalid session
            localStorage.removeItem("hawassa_fuel_attendant_token");
            localStorage.removeItem("hawassa_fuel_attendant_user");
            setIsAttendantLoggedIn(false);
          }
        } catch (err) {
          console.error("Error loading attendant profile:", err);
        }
      }
    };
    fetchProfile();
  }, []);

  // Securely fetch private driver data (isolated query strictly matching securityToken)
  useEffect(() => {
    if (!activeToken || !activeToken.securityToken) {
      setPrivateSmsLogs([]);
      return;
    }

    const fetchPrivateData = async () => {
      setPrivateLoading(true);
      try {
        const res = await fetch(`/api/tokens/private?securityToken=${activeToken.securityToken}`);
        if (res.ok) {
          const data = await res.json();
          setPrivateSmsLogs(data.smsLogs || []);
          
          if (data.token && JSON.stringify(data.token) !== JSON.stringify(activeToken)) {
            setActiveToken(data.token);
            localStorage.setItem("hawassa_fuel_active_token", JSON.stringify(data.token));
          }
        } else if (res.status === 404) {
          setActiveToken(null);
          localStorage.removeItem("hawassa_fuel_active_token");
        }
      } catch (err) {
        console.error("Error fetching private driver queue data:", err);
      } finally {
        setPrivateLoading(false);
      }
    };

    fetchPrivateData();

    // Poll for status updates securely every 8 seconds
    const interval = setInterval(fetchPrivateData, 8000);
    return () => clearInterval(interval);
  }, [activeToken?.id, activeToken?.status, tokens]);

  // Dynamically preset/constrain selected vehicle type to match daily station allowance
  useEffect(() => {
    const currentActiveStation = stations.find((s) => s.id === selectedStationId);
    if (currentActiveStation && currentActiveStation.currentAllowedVehicle && currentActiveStation.currentAllowedVehicle !== "all") {
      setVehicleType(currentActiveStation.currentAllowedVehicle as VehicleType);
    }
  }, [selectedStationId, stations]);

  // Auto-lock Attendant Panel 2 seconds after leaving the tab or minimizing the page
  useEffect(() => {
    if (!isAttendantLoggedIn) return;

    let timeoutId: any = null;

    const lockSession = () => {
      handleAttendantLogout();
    };

    // Check if user is active on the attendant page/tab
    const isOutOfPage = currentTab !== "attendant";

    if (isOutOfPage) {
      timeoutId = setTimeout(() => {
        lockSession();
      }, 2000);
    }

    // Also handle visibility change (switching browser tabs or locking screen)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            lockSession();
          }, 2000);
        }
      } else {
        if (currentTab === "attendant" && timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentTab, isAttendantLoggedIn]);

  // Handle Booking
  const handleBookToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    // Form inputs validation
    if (!plateDigits.trim() || isNaN(Number(plateDigits))) {
      setBookingError(lang === "am" ? "እባክዎ ትክክለኛ የሰሌዳ ቁጥር ያስገቡ (ቁጥሮች ብቻ)!" : "Please enter a valid plate number (numbers only)!");
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      setBookingError(lang === "am" ? "እባክዎ ትክክለኛ ባለ 10 አሃዝ ስልክ ቁጥር ያስገቡ!" : "Please enter a valid 10-digit phone number!");
      return;
    }

    if (!selectedStationId) {
      setBookingError(t.selectStation);
      return;
    }

    setIsBookingLoading(true);
    const formattedPlate = `ኮድ ${plateCode} - ${plateRegion} ${plateDigits.trim()}`;

    try {
      const response = await fetch("/api/tokens/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: selectedStationId,
          plateNumber: formattedPlate,
          vehicleType,
          phoneNumber: phoneNumber.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to book token");
      }

      // Save to state and local storage
      setActiveToken(data.token);
      localStorage.setItem("hawassa_fuel_active_token", JSON.stringify(data.token));
      
      // Clear inputs
      setPlateDigits("");
      setPhoneNumber("");
    } catch (err: any) {
      setBookingError(err.message);
    } finally {
      setIsBookingLoading(false);
    }
  };

  // Handle Cancel Token
  const handleCancelToken = async (tokenId: string) => {
    setCancelError(null);
    try {
      const response = await fetch("/api/tokens/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId }),
      });

      if (response.ok) {
        setActiveToken(null);
        localStorage.removeItem("hawassa_fuel_active_token");
      } else {
        const data = await response.json();
        setCancelError(data.error || "Failed to cancel token");
      }
    } catch (err: any) {
      console.error(err);
      setCancelError(err.message || "Network error");
    }
  };

  // Handle Attendant Login
  const handleAttendantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttendantError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: loginStationId,
          password: attendantPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setAttendantToken(data.token);
      setAttendantUser(data.user);
      setIsAttendantLoggedIn(true);
      localStorage.setItem("hawassa_fuel_attendant_token", data.token);
      localStorage.setItem("hawassa_fuel_attendant_user", JSON.stringify(data.user));
      
      if (data.user.stationId) {
        setAttendantStationId(data.user.stationId);
        localStorage.setItem("hawassa_fuel_attendant_station_id", data.user.stationId);
      }

      // Clear inputs
      setAttendantPassword("");
    } catch (err: any) {
      setAttendantError(err.message);
    }
  };

  // Handle Attendant Logout
  const handleAttendantLogout = () => {
    setIsAttendantLoggedIn(false);
    setAttendantToken("");
    setAttendantUser(null);
    localStorage.removeItem("hawassa_fuel_attendant_token");
    localStorage.removeItem("hawassa_fuel_attendant_user");
  };

  // Handle Secure Password Change Flow with 3-Step Validation (የይለፍ ቃል መቀየሪያ)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeSuccess(null);
    setPasswordChangeError(null);

    // Frontend validation
    if (!oldPassword) {
      setPasswordChangeError(lang === "am" ? "እባክዎ የድሮውን የይለፍ ቃል ያስገቡ!" : "Please enter your old password!");
      return;
    }

    if (newPasswordState.length < 8) {
      setPasswordChangeError(lang === "am" ? "አዲሱ የይለፍ ቃል ቢያንስ 8 ፊደላት/ቁጥሮች መሆን አለበት!" : "New password must be at least 8 characters long!");
      return;
    }

    // Patterns matching
    const hasLetter = /[a-zA-Z]/.test(newPasswordState);
    const hasNumber = /[0-9]/.test(newPasswordState);
    if (!hasLetter || !hasNumber) {
      setPasswordChangeError(lang === "am" ? "የይለፍ ቃሉ ቢያንስ አንድ ፊደል እና አንድ ቁጥር መያዝ አለበት!" : "Password must contain at least one letter and one number!");
      return;
    }

    if (newPasswordState !== confirmPassword) {
      setPasswordChangeError(lang === "am" ? "አዲሱ የይለፍ ቃል ከማረጋገጫው ጋር አይዛመድም!" : "New password and confirmation do not match!");
      return;
    }

    setIsPasswordChanging(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${attendantToken}`
        },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword: newPasswordState,
          confirmPassword: confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordChangeSuccess(data.message || (lang === "am" ? "የይለፍ ቃልዎ በስኬት ተቀይሯል!" : "Password changed successfully!"));
      setOldPassword("");
      setNewPasswordState("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordChangeError(err.message);
    } finally {
      setIsPasswordChanging(false);
    }
  };

  // Handle Attendant Station Change
  const handleAttendantStationChange = (id: string) => {
    setAttendantStationId(id);
    localStorage.setItem("hawassa_fuel_attendant_station_id", id);
  };

  // Handle Attendant calling NEXT vehicle (Strict Audit Trail: Knows which attendant called which token)
  const handleNextVehicle = async (stationId: string) => {
    setAttendantError(null);
    try {
      const response = await fetch("/api/stations/next", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${attendantToken}`
        },
        body: JSON.stringify({ stationId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setAttendantError(data.error || "Failed to advance queue");
      }
    } catch (err: any) {
      console.error(err);
      setAttendantError(err.message || "Network error");
    }
  };

  // Handle Attendant changing Station Status
  const handleUpdateStationStatus = async (stationId: string, status: StationStatus) => {
    setAttendantError(null);
    try {
      const response = await fetch("/api/stations/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${attendantToken}`
        },
        body: JSON.stringify({ stationId, status }),
      });

      if (!response.ok) {
        const data = await response.json();
        setAttendantError(data.error || "Failed to update status");
      }
    } catch (err: any) {
      console.error(err);
      setAttendantError(err.message || "Network error");
    }
  };

  // Handle Attendant changing daily allowed vehicle type restriction
  const handleUpdateAllowedVehicle = async (stationId: string, allowedVehicle: string) => {
    setAttendantError(null);
    try {
      const response = await fetch("/api/stations/allowed-vehicle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${attendantToken}`
        },
        body: JSON.stringify({ stationId, allowedVehicle }),
      });

      if (!response.ok) {
        const data = await response.json();
        setAttendantError(data.error || "Failed to update allowed vehicle");
      }
    } catch (err: any) {
      console.error(err);
      setAttendantError(err.message || "Network error");
    }
  };

  // Helper: Get Badge Color for Station Status
  const getStatusBadge = (status: StationStatus) => {
    switch (status) {
      case "fast":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          text: t.fast,
          dot: "bg-emerald-400",
        };
      case "busy":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          text: t.busy,
          dot: "bg-amber-400",
        };
      case "packed":
        return {
          bg: "bg-red-500/10 border-red-500/30 text-red-400",
          text: t.packed,
          dot: "bg-red-500",
        };
      case "out_of_fuel":
        return {
          bg: "bg-slate-500/10 border-slate-500/30 text-slate-400",
          text: t.out_of_fuel,
          dot: "bg-slate-400",
        };
    }
  };

  // Helper: Get Vehicle Type Name
  const getVehicleName = (type: VehicleType) => {
    switch (type) {
      case "bajaj":
        return t.bajaj;
      case "motorbike":
        return lang === "am" ? "ሞተርሳይክል" : "Motorbike";
      case "car":
        return t.car;
      case "minibus":
        return t.minibus;
      case "truck":
        return t.truck;
    }
  };

  // Filter tokens for currently selected station (Driver View)
  const activeStation = stations.find((s) => s.id === selectedStationId);
  const selectedStationTokens = tokens.filter(
    (tk) => tk.stationId === selectedStationId && (tk.status === "waiting" || tk.status === "serving")
  );

  // Currently serving token for selected station
  const currentServingToken = selectedStationTokens.find((tk) => tk.status === "serving");

  // Count vehicles ahead of active token
  const getVehiclesAheadCount = () => {
    if (!activeToken || activeToken.status !== "waiting") return 0;
    const sameStationWaiting = tokens
      .filter((tk) => tk.stationId === activeToken.stationId && tk.status === "waiting")
      .sort((a, b) => a.tokenNumber - b.tokenNumber);
    
    const index = sameStationWaiting.findIndex((tk) => tk.id === activeToken.id);
    return index === -1 ? 0 : index;
  };

  const vehiclesAhead = getVehiclesAheadCount();

  // Check if driver has a truly active reservation (waiting or serving)
  const hasActiveReservation = !!(activeToken && (activeToken.status === "waiting" || activeToken.status === "serving"));

  // Attendant details
  const attendantStation = stations.find((s) => s.id === attendantStationId);
  const attendantStationTokens = tokens.filter((tk) => tk.stationId === attendantStationId);
  const attendantWaitingTokens = attendantStationTokens
    .filter((tk) => tk.status === "waiting")
    .sort((a, b) => a.tokenNumber - b.tokenNumber);
  const attendantActiveServing = attendantStationTokens.find((tk) => tk.status === "serving");

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-16 flex flex-col justify-between">
      {/* Top Banner Accent */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 w-full" />

      {/* Main Header Container */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* App Logo and Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5 relative overflow-hidden">
              <Fuel className="h-6 w-6 relative z-10 animate-pulse" />
              <div className="absolute inset-0 bg-emerald-500/5 blur-sm" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                {t.title}
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  Beta
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">ሀዋሳ፣ ኢትዮጵያ (Hawassa, Ethiopia)</p>
            </div>
          </div>

          {/* Controls: Language, Tabs, Roles */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* View Tab Buttons */}
            <nav className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs">
              <button
                onClick={() => setCurrentTab("driver")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  currentTab === "driver"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.driverDashboard}
              </button>
              <button
                onClick={() => setCurrentTab("attendant")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  currentTab === "attendant"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.attendantDashboard}
              </button>
              <button
                onClick={() => setCurrentTab("architecture")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  currentTab === "architecture"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.sysArchitecture}
              </button>
            </nav>

            {/* Language Selection Toggle */}
            <button
              onClick={() => setLang(lang === "am" ? "en" : "am")}
              className="px-3 py-1.5 rounded-xl border border-slate-800 text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-1.5 transition-all font-medium"
            >
              <Languages className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t.languageToggle}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Screen Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow w-full">
        
        {/* TAB 1: DRIVER DASHBOARD */}
        {currentTab === "driver" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Stations List */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  {t.stations}
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  {stations.length} {lang === "am" ? "ማደያዎች ተገኝተዋል" : "stations found"}
                </span>
              </div>

              {/* Station List Cards */}
              <div className="space-y-3">
                {stations.map((st) => {
                  const isSelected = selectedStationId === st.id;
                  const status = getStatusBadge(st.status);
                  
                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStationId(st.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${
                        isSelected
                          ? "bg-gradient-to-br from-slate-900 to-slate-800/80 border-emerald-500/40 shadow-xl shadow-emerald-500/5"
                          : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                      }`}
                    >
                      {/* Interactive focus backdrop */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                      )}

                      <div className="space-y-1 z-10">
                        <div className="font-bold font-display text-base text-slate-100 group-hover:text-white transition-colors flex items-center gap-2">
                          {lang === "am" ? st.nameAm : st.nameEn}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-500" />
                          <span className="truncate max-w-[240px] sm:max-w-xs">
                            {lang === "am" ? st.locationAm : st.locationEn}
                          </span>
                        </div>
                        
                        {/* Short queue stats summary */}
                        <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-400">
                          <div>
                            <span className="text-slate-500">{t.currentServing}:</span>{" "}
                            <span className="text-emerald-400 font-bold">
                              {st.currentNumber > 0 ? `#${st.currentNumber}` : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">{t.activeQueue}:</span>{" "}
                            <span className="text-yellow-500 font-semibold">{st.totalWaiting}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right edge: Status badge and chevron */}
                      <div className="flex flex-col items-end gap-2 shrink-0 z-10">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.text}
                        </span>
                        <ChevronRight className={`h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-transform ${
                          isSelected ? "translate-x-1 text-emerald-400" : ""
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Dynamic Form / Active Ticket Tracking */}
            <div className="lg:col-span-7">
              {activeStation ? (
                <div className="space-y-6">
                  
                  {/* Station Banner Card */}
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Fuel className="h-32 w-32 text-emerald-400" />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
                          {t.stationStatus}
                        </span>
                        <h3 className="text-xl font-bold font-display mt-0.5">
                          {lang === "am" ? activeStation.nameAm : activeStation.nameEn}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          {lang === "am" ? activeStation.locationAm : activeStation.locationEn}
                        </p>
                      </div>

                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shrink-0 ${
                        getStatusBadge(activeStation.status).bg
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${getStatusBadge(activeStation.status).dot}`} />
                        {getStatusBadge(activeStation.status).text}
                      </span>
                    </div>

                    {/* Stats bento indicators */}
                    <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-800/80 text-center relative z-10">
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                        <div className="text-xs text-slate-500">{t.currentServing}</div>
                        <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                          {activeStation.currentNumber > 0 ? `#${activeStation.currentNumber}` : "-"}
                        </div>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                        <div className="text-xs text-slate-500">{t.lastIssued}</div>
                        <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">
                          {activeStation.lastNumber > 0 ? `#${activeStation.lastNumber}` : "-"}
                        </div>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                        <div className="text-xs text-slate-500">{t.activeQueue}</div>
                        <div className="text-lg font-bold font-mono text-amber-500 mt-0.5">
                          {activeStation.totalWaiting}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Panel / Active Spot Tracking */}
                  {activeToken && activeToken.stationId === activeStation.id && (activeToken.status === "waiting" || activeToken.status === "serving") ? (
                    
                    /* ACTIVE TOKEN COMPONENT */
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-emerald-500/5">
                      
                      {/* Background circular highlights */}
                      <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-emerald-500/5 blur-xl" />
                      <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-emerald-500/5 blur-xl" />

                      <div className="text-center space-y-4 relative z-10">
                        
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t.registrationSuccess}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{t.yourToken}</p>
                          <div className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-white py-2">
                            #{activeToken.tokenNumber}
                          </div>
                        </div>

                        {/* Vehicle plate reference badge */}
                        <div className="inline-block bg-slate-900/90 border-2 border-slate-800 px-4 py-2 rounded-2xl font-mono text-base font-bold text-slate-200 shadow-md">
                          {activeToken.plateNumber}
                          <span className="mx-2 text-slate-600">|</span>
                          <span className="text-emerald-400 text-sm font-sans font-medium">{getVehicleName(activeToken.vehicleType)}</span>
                        </div>

                        {/* Queue dynamic position indicators */}
                        {activeToken.status === "serving" ? (
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 font-semibold animate-pulse mt-4 flex items-center justify-center gap-2">
                            <Fuel className="h-5 w-5" />
                            {lang === "am" ? "ተራዎ ደርሷል! እባክዎ በአካል ነዳጅ ይቀዱ።" : "It's your turn! Please pull up to the pump to fuel."}
                          </div>
                        ) : (
                          <div className="space-y-4 mt-4 pt-4 border-t border-slate-800/60">
                            
                            {/* Wait estimations */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 text-center">
                                <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                                  {t.waitEstimation}
                                </div>
                                <div className="text-xl font-bold font-mono text-slate-200 mt-1">
                                  ~{activeToken.estimatedTime} {t.minutes}
                                </div>
                              </div>

                              <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 text-center">
                                <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                                  <Car className="h-3.5 w-3.5 text-blue-400" />
                                  {t.aheadOfYou}
                                </div>
                                <div className="text-xl font-bold font-mono text-slate-200 mt-1">
                                  {vehiclesAhead}
                                </div>
                              </div>
                            </div>

                            {/* Dynamic Animated Progress Bar */}
                            <div className="space-y-1.5 text-left">
                              <div className="flex justify-between text-xs font-semibold text-slate-400 font-mono">
                                <span>{t.currentServing}: #{activeStation.currentNumber}</span>
                                <span>{lang === "am" ? "በሰልፍ ላይ" : "In queue"}</span>
                              </div>
                              <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                                  style={{ 
                                    width: `${Math.max(5, Math.min(100, (1 - (vehiclesAhead / (activeToken.tokenNumber - (activeStation.currentNumber || 1) + 1))) * 100))}%` 
                                  }}
                                />
                              </div>
                            </div>

                            {/* Warning Banner if they are close */}
                            {vehiclesAhead <= 4 && (
                              <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-2xl flex items-center gap-2 text-left justify-center animate-bounce">
                                <AlertCircle className="h-4 w-4 shrink-0 text-yellow-400" />
                                <span>{t.headToStation}</span>
                              </div>
                            )}

                          </div>
                        )}

                        {/* Action buttons with secure inline confirmation flow */}
                        <div className="pt-4 flex flex-col items-center justify-center gap-3 w-full animate-fade-in">
                          {cancelError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 justify-center w-full max-w-sm">
                              <AlertCircle className="h-4 w-4 shrink-0" />
                              <span>{cancelError}</span>
                            </div>
                          )}

                          {!showCancelConfirm ? (
                            <button
                              onClick={() => {
                                setCancelError(null);
                                setShowCancelConfirm(true);
                              }}
                              className="px-5 py-2.5 rounded-2xl border border-red-500/30 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all text-xs font-bold cursor-pointer"
                            >
                              {t.cancelToken}
                            </button>
                          ) : (
                            <div className="bg-slate-950 p-4 rounded-2xl border border-red-500/20 max-w-sm w-full space-y-3">
                              <p className="text-xs text-red-400 font-bold">
                                {lang === "am" ? "በእርግጥ ተራዎን መሰረዝ ይፈልጋሉ?" : "Are you sure you want to cancel your token?"}
                              </p>
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={async () => {
                                    await handleCancelToken(activeToken.id);
                                    setShowCancelConfirm(false);
                                  }}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                                >
                                  {lang === "am" ? "አዎ፣ ሰርዝ" : "Yes, cancel"}
                                </button>
                                <button
                                  onClick={() => setShowCancelConfirm(false)}
                                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                                >
                                  {lang === "am" ? "አይ፣ ተመለስ" : "No, cancel"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  ) : (
                    
                    /* BOOKING FORM COMPONENT */
                    <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
                      
                      <div className="flex items-center gap-2">
                        <PlusCircle className="h-5 w-5 text-emerald-400" />
                        <h4 className="text-lg font-bold font-display">{t.bookToken}</h4>
                      </div>

                      {hasActiveReservation && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>
                            {lang === "am" 
                              ? `ቀድሞ የያዙት ተራ ስላለ ሌላ መያዝ አይችሉም። እባክዎ መጀመሪያ ተራዎን ይሰርዙ ወይም ያጠናቁ።` 
                              : `You already have an active token elsewhere. Please cancel it first before booking a new one.`}
                          </span>
                        </div>
                      )}

                      <form onSubmit={handleBookToken} className="space-y-4">
                        
                        {/* Plate Code & Digits Group */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {t.plateNumber} *
                          </label>
                          <div className="grid grid-cols-12 gap-2">
                            {/* Code selection */}
                            <select
                              value={plateCode}
                              onChange={(e) => setPlateCode(e.target.value)}
                              disabled={hasActiveReservation || activeStation.status === "out_of_fuel"}
                              className="col-span-3 bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-slate-100 focus:border-emerald-500/50 outline-none font-mono text-sm"
                            >
                              <option value="1">ኮድ 1</option>
                              <option value="2">ኮድ 2</option>
                              <option value="3">ኮድ 3</option>
                              <option value="4">ኮድ 4</option>
                              <option value="5">ኮድ 5</option>
                            </select>

                            {/* Region letters selector */}
                            <select
                              value={plateRegion}
                              onChange={(e) => setPlateRegion(e.target.value)}
                              disabled={hasActiveReservation || activeStation.status === "out_of_fuel"}
                              className="col-span-3 bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-slate-100 focus:border-emerald-500/50 outline-none font-mono text-sm"
                            >
                              <option value="HW">HW (ሃዋሳ)</option>
                              <option value="AA">AA (አዲስ አበባ)</option>
                              <option value="ET">ET (ኢትዮጵያ)</option>
                              <option value="OR">OR (ኦሮሚያ)</option>
                              <option value="SP">SP (ደቡብ)</option>
                            </select>

                            {/* Numeric digits */}
                            <input
                              type="text"
                              maxLength={5}
                              pattern="[0-9]*"
                              inputMode="numeric"
                              placeholder="e.g. 12543"
                              value={plateDigits}
                              onChange={(e) => setPlateDigits(e.target.value.replace(/\D/g, ""))}
                              disabled={hasActiveReservation || activeStation.status === "out_of_fuel"}
                              className="col-span-6 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-slate-100 placeholder-slate-600 focus:border-emerald-500/50 outline-none font-mono text-base tracking-widest text-center"
                              required
                            />
                          </div>
                        </div>

                        {/* Vehicle Type selector */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                              {t.vehicleType}
                            </label>
                            {activeStation.currentAllowedVehicle && activeStation.currentAllowedVehicle !== "all" && (
                              <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md animate-pulse">
                                {lang === "am" 
                                  ? `ዛሬ የሚስተናገደው፡ ${getVehicleName(activeStation.currentAllowedVehicle as VehicleType)} ብቻ ነው` 
                                  : `Today restricted to: ${getVehicleName(activeStation.currentAllowedVehicle as VehicleType)} only`}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {(["bajaj", "motorbike", "car", "minibus", "truck"] as VehicleType[]).map((type) => {
                              const isSelected = vehicleType === type;
                              const isRestrictedByStation = activeStation.currentAllowedVehicle && activeStation.currentAllowedVehicle !== "all" && activeStation.currentAllowedVehicle !== type;
                              const isDisabled = hasActiveReservation || activeStation.status === "out_of_fuel" || isRestrictedByStation;

                              let IconComponent = Car;
                              if (type === "motorbike") IconComponent = Bike;
                              else if (type === "minibus") IconComponent = Bus;
                              else if (type === "truck") IconComponent = Truck;

                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setVehicleType(type)}
                                  disabled={isDisabled}
                                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative ${
                                    isSelected
                                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-md"
                                      : isRestrictedByStation
                                      ? "bg-red-950/10 border-red-500/10 text-slate-600 cursor-not-allowed opacity-30"
                                      : "bg-slate-950 border-slate-800 hover:bg-slate-900/50 text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  <IconComponent className={`h-4.5 w-4.5 ${isSelected ? "text-emerald-400" : isRestrictedByStation ? "text-slate-700" : "text-slate-500"}`} />
                                  <span className="text-[9px] font-bold truncate max-w-full">{getVehicleName(type)}</span>
                                  {isRestrictedByStation && (
                                    <span className="absolute top-1 right-1 text-[8px] bg-red-500/20 text-red-400 px-1 rounded border border-red-500/30 font-sans">
                                      ✕
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Phone input */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {t.phoneNumber} *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">+251</span>
                            <input
                              type="tel"
                              maxLength={10}
                              placeholder="0912345678"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                              disabled={hasActiveReservation || activeStation.status === "out_of_fuel"}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-14 pr-4 text-slate-100 placeholder-slate-600 focus:border-emerald-500/50 outline-none font-mono text-sm"
                              required
                            />
                          </div>
                        </div>

                        {/* Error log block */}
                        {bookingError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{bookingError}</span>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={hasActiveReservation || isBookingLoading || activeStation.status === "out_of_fuel"}
                          className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isBookingLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>{t.bookingInProgress}</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="h-4 w-4" />
                              <span>{t.submitBooking}</span>
                            </>
                          )}
                        </button>

                      </form>

                    </div>
                  )}

                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl text-slate-500">
                  <MapPin className="h-8 w-8 text-slate-600 mb-2 animate-bounce" />
                  <span>{t.selectStation}</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: STATION ATTENDANT DASHBOARD */}
        {currentTab === "attendant" && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* If Attendant not logged in */}
            {!isAttendantLoggedIn ? (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                
                <div className="text-center space-y-1.5">
                  <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                    <Shield className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold font-display">{t.attendantTitle}</h3>
                  <p className="text-xs text-slate-400">
                    {lang === "am" ? "የይለፍ ቃል መግቢያ ሰሌዳ (Isolated Credentials)" : "Individual Worker Secure Access"}
                  </p>
                </div>

                <form onSubmit={handleAttendantLogin} className="space-y-4">
                  
                  {/* Station Dropdown select field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {lang === "am" ? "የማደያው ስም (Station Name) *" : "Gas Station Name *"}
                    </label>
                    <select
                      value={loginStationId}
                      onChange={(e) => setLoginStationId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 focus:border-emerald-500/50 outline-none font-sans text-sm cursor-pointer"
                      required
                    >
                      {stations.map((st) => (
                        <option key={st.id} value={st.id}>
                          {lang === "am" ? st.nameAm : st.nameEn} ({lang === "am" ? "ማደያ" : "Station"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Password field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.passwordLabel} *
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={attendantPassword}
                      onChange={(e) => setAttendantPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 placeholder-slate-600 focus:border-emerald-500/50 outline-none font-mono text-sm"
                      required
                    />
                  </div>

                  {/* Error display */}
                  {attendantError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 justify-center">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{attendantError}</span>
                    </div>
                  )}

                  {/* Submit login */}
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>{t.loginBtn}</span>
                  </button>

                </form>



              </div>
            ) : (
              
              /* ATTENDANT CONTROL PANEL (LOGGED IN) */
              <div className="space-y-6">
                
                {/* Attendant header bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">
                        {lang === "am" ? "የቁጥጥር ሰሌዳ፡ " : "Attending: "}
                        <span className="text-white font-extrabold text-base">
                          {attendantStation ? (lang === "am" ? attendantStation.nameAm : attendantStation.nameEn) : ""}
                        </span>
                      </h4>
                      <p className="text-[10px] text-emerald-400 font-mono mt-0.5 uppercase tracking-wider">
                        {lang === "am" ? "የሰራተኛው አስተዳደር ክፍለ ጊዜ" : "Attendant Active Session"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Change Station selection */}
                    <select
                      value={attendantStationId || ""}
                      onChange={(e) => handleAttendantStationChange(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500/50"
                    >
                      {stations.map((st) => (
                        <option key={st.id} value={st.id}>
                          {lang === "am" ? st.nameAm : st.nameEn}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAttendantLogout}
                      className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{t.logoutBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Big-Action Buttons (Optimized for outdoor standing attendants) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left big box: CALL NEXT VEHICLE */}
                  <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between h-80 shadow-lg">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">
                        {lang === "am" ? "የሰልፍ መቆጣጠሪያ" : "Queue progression"}
                      </span>
                      <h4 className="text-base font-bold font-display mt-1">
                        {lang === "am" ? "የአሁኑ መስተናጋጅ" : "Currently Serving"}
                      </h4>
                    </div>

                    <div className="my-2 text-center">
                      {attendantActiveServing ? (
                        <div className="space-y-1 inline-block bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5">
                          <div className="text-3xl font-black font-mono tracking-tighter text-emerald-400">
                            #{attendantActiveServing.tokenNumber}
                          </div>
                          <div className="text-sm font-bold text-slate-200 font-mono tracking-wider">
                            {attendantActiveServing.plateNumber}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">
                            {getVehicleName(attendantActiveServing.vehicleType)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 py-4 text-xs font-medium">
                          {lang === "am" ? "አሁን በመስተናገድ ላይ ያለ የለም" : "No vehicle currently serving"}
                        </div>
                      )}
                    </div>

                    {/* MASSIVE NEXT VEHICLE BUTTON */}
                    <button
                      onClick={() => handleNextVehicle(attendantStationId!)}
                      disabled={attendantWaitingTokens.length === 0 && !attendantActiveServing}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer uppercase"
                    >
                      <Fuel className="h-4 w-4 stroke-[2.5]" />
                      <span>{t.nextVehicle}</span>
                      {attendantWaitingTokens.length > 0 && (
                        <span className="bg-slate-950 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
                          +{attendantWaitingTokens.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Middle box: UPDATE FUEL STATUS Toggles */}
                  <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between h-80 shadow-lg">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400">
                        {lang === "am" ? "የማደያ ሁኔታ መቆጣጠሪያ" : "Station Status Control"}
                      </span>
                      <h4 className="text-base font-bold font-display mt-1">{t.updateFuelStatus}</h4>
                    </div>

                    {/* Status selection list */}
                    <div className="space-y-1.5 my-2">
                      {([
                        { key: "fast", am: t.fast, en: "Fast Moving", color: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10", activeColor: "bg-emerald-500/20 border-emerald-500 text-emerald-300" },
                        { key: "busy", am: t.busy, en: "Busy Queue", color: "border-amber-500/30 text-amber-400 hover:bg-amber-500/10", activeColor: "bg-amber-500/20 border-amber-500 text-amber-300" },
                        { key: "packed", am: t.packed, en: "Packed Queue", color: "border-red-500/30 text-red-400 hover:bg-red-500/10", activeColor: "bg-red-500/20 border-red-500 text-red-300" },
                        { key: "out_of_fuel", am: t.out_of_fuel, en: "Out of Fuel", color: "border-slate-500/30 text-slate-400 hover:bg-slate-500/10", activeColor: "bg-slate-500/20 border-slate-500 text-slate-300" }
                      ] as const).map((opt) => {
                        const isActive = attendantStation?.status === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleUpdateStationStatus(attendantStationId!, opt.key)}
                            className={`w-full py-1.5 px-3 border rounded-xl text-left text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer ${
                              isActive ? opt.activeColor : opt.color
                            }`}
                          >
                            <span>{lang === "am" ? opt.am : opt.en}</span>
                            {isActive && <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono leading-normal">
                      {lang === "am" 
                        ? "* 'ነዳጅ የለም' መምረጥ ሰልፎችን በራስ-ሰር ይሰርዛል።" 
                        : "* Selecting 'Out of Fuel' automatically cancels waiting tokens."}
                    </div>
                  </div>

                  {/* Right box: ALLOWED VEHICLE TYPE TODAY */}
                  <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between h-80 shadow-lg">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">
                        {lang === "am" ? "የዕለት የተሽከርካሪ ቁጥጥር" : "Daily Vehicle Restriction"}
                      </span>
                      <h4 className="text-base font-bold font-display mt-1">
                        {lang === "am" ? "ዛሬ የሚስተናገድ ተሽከርካሪ" : "Allowed Vehicle Today"}
                      </h4>
                    </div>

                    {/* Vehicle selections */}
                    <div className="grid grid-cols-2 gap-1.5 my-2">
                      {([
                        { key: "all", label: lang === "am" ? "ሁሉም (All)" : "All Vehicles" },
                        { key: "bajaj", label: lang === "am" ? "ባጃጅ (Bajaj)" : "Bajaj" },
                        { key: "motorbike", label: lang === "am" ? "ሞተር (Motor)" : "Motorbike" },
                        { key: "car", label: lang === "am" ? "የቤት (Car)" : "Private Car" },
                        { key: "minibus", label: lang === "am" ? "ታክሲ (Taxi)" : "Minibus" },
                        { key: "truck", label: lang === "am" ? "ጭነት (Truck)" : "Truck" }
                      ] as const).map((opt) => {
                        const isActive = (attendantStation?.currentAllowedVehicle || "all") === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleUpdateAllowedVehicle(attendantStationId!, opt.key)}
                            className={`py-1.5 px-1.5 border rounded-xl text-center text-[10px] font-bold transition-all cursor-pointer truncate ${
                              isActive 
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm" 
                                : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 bg-slate-950/40"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono leading-normal">
                      {lang === "am" 
                        ? "* የተወሰነ አይነት መምረጥ ሌሎችን መመዝገብ ይከለክላል።" 
                        : "* Restricting a type blocks other vehicle classes."}
                    </div>
                  </div>

                </div>

                {/* Queue listings table for the current station */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
                  <h4 className="text-base font-bold font-display mb-4 flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-400" />
                    {t.allTokens} ({attendantStationTokens.filter(t => t.status === 'waiting' || t.status === 'serving').length})
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-800 font-bold text-slate-400 font-mono">
                          <th className="pb-3 text-center">{lang === "am" ? "ተራ ቁጥር" : "Token"}</th>
                          <th className="pb-3">{lang === "am" ? "የሰሌዳ ቁጥር" : "Plate"}</th>
                          <th className="pb-3">{lang === "am" ? "ተሽከርካሪ" : "Vehicle"}</th>
                          <th className="pb-3">{lang === "am" ? "ስልክ" : "Phone"}</th>
                          <th className="pb-3 text-center">{lang === "am" ? "ሁኔታ" : "Status"}</th>
                          <th className="pb-3 text-right">{lang === "am" ? "ድርጊት" : "Actions"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {attendantStationTokens
                          .filter((t) => t.status === "waiting" || t.status === "serving")
                          .sort((a, b) => a.tokenNumber - b.tokenNumber)
                          .map((tk) => {
                            const isServing = tk.status === "serving";
                            return (
                              <tr key={tk.id} className={`hover:bg-slate-950/20 transition-all ${isServing ? "bg-emerald-500/5" : ""}`}>
                                <td className="py-3 font-extrabold text-sm text-center text-slate-100">
                                  #{tk.tokenNumber}
                                </td>
                                <td className="py-3 font-sans font-bold text-slate-200">
                                  {tk.plateNumber}
                                </td>
                                <td className="py-3 font-sans text-slate-300">
                                  {getVehicleName(tk.vehicleType)}
                                </td>
                                <td className="py-3 text-slate-400 text-xs">
                                  +251 {tk.phoneNumber}
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isServing
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse"
                                      : "bg-slate-800 text-slate-400"
                                  }`}>
                                    {isServing ? t.serving : t.waiting}
                                  </span>
                                </td>
                                <td className="py-3 text-right space-x-1 font-sans">
                                  {/* Action cancel */}
                                  <button
                                    onClick={() => handleCancelToken(tk.id)}
                                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    {t.actionCancel}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        
                        {attendantStationTokens.filter(t => t.status === 'waiting' || t.status === 'serving').length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center text-slate-500 py-8 font-sans">
                              {t.noVehicles}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* SECURE PASSWORD CHANGE FORM COMPONENT (የይለፍ ቃል መቀየሪያ ቅጽ) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg max-w-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-emerald-400" />
                    <h4 className="text-base font-bold font-display text-white">
                      {lang === "am" ? "የሰራተኛው የይለፍ ቃል መቀየሪያ" : "Change Worker Password"}
                    </h4>
                  </div>
                  
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    {lang === "am" 
                      ? "የይለፍ ቃልዎን ለመቀየር ይህንን ባለ 3-ደረጃ ማረጋገጫ ቅጽ ይጠቀሙ። አዲሱ የይለፍ ቃል ቢያንስ 8 ሆሄያት ሆኖ ፊደላትንና ቁጥሮችን መያዝ አለበት።" 
                      : "Update your personal password using this secure 3-step verification workflow. New password must be at least 8 characters with letters and numbers."}
                  </p>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    
                    {/* Step A: Old Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {lang === "am" ? "ደረጃ ሀ፡ የድሮ የይለፍ ቃል *" : "Step A: Old Password *"}
                      </label>
                      <input
                        type="password"
                        placeholder={lang === "am" ? "የድሮውን ይለፍ ቃል ያስገቡ" : "Enter old password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-200 placeholder-slate-600 focus:border-emerald-500/50 outline-none font-mono text-sm"
                        required
                      />
                    </div>

                    {/* Step B: New Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {lang === "am" ? "ደረጃ ለ፡ አዲስ የይለፍ ቃል *" : "Step B: New Password *"}
                      </label>
                      <input
                        type="password"
                        placeholder={lang === "am" ? "አዲሱን ይለፍ ቃል ያስገቡ (ጠንካራ)" : "Enter strong new password"}
                        value={newPasswordState}
                        onChange={(e) => setNewPasswordState(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-200 placeholder-slate-600 focus:border-emerald-500/50 outline-none font-mono text-sm"
                        required
                      />
                    </div>

                    {/* Step C: Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {lang === "am" ? "ደረጃ ሐ፡ አዲሱን የይለፍ ቃል ያረጋግጡ *" : "Step C: Confirm New Password *"}
                      </label>
                      <input
                        type="password"
                        placeholder={lang === "am" ? "አዲሱን ይለፍ ቃል በድጋሚ ያስገቡ" : "Confirm your new password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-200 placeholder-slate-600 focus:border-emerald-500/50 outline-none font-mono text-sm"
                        required
                      />
                    </div>

                    {/* Error block */}
                    {passwordChangeError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{passwordChangeError}</span>
                      </div>
                    )}

                    {/* Success block */}
                    {passwordChangeSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{passwordChangeSuccess}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isPasswordChanging}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isPasswordChanging ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>{lang === "am" ? "በመቀየር ላይ..." : "Changing..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{lang === "am" ? "የይለፍ ቃል ቀይር" : "Update Password"}</span>
                        </>
                      )}
                    </button>

                  </form>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 3: SYSTEM ARCHITECTURE & EDGE CASES */}
        {currentTab === "architecture" && (
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Visual Architecture Title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-display tracking-tight text-white">{t.architectureTitle}</h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                {lang === "am" 
                  ? "የሀዋሳ ከተማ ዲጂታል ነዳጅ ተራ ማስተዳደሪያ የሶስትዮሽ ንብርብሮች (Client-Server-Database) የስራ ፍሰት አወቃቀር" 
                  : "Three-tier architecture designed for heavy load and cellular constraints in Hawassa, Ethiopia."}
              </p>
            </div>

            {/* Mermaid representation in custom beautiful graphical layout */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
              
              {/* Process Flow Diagram */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">
                  {lang === "am" ? "የውሂብ እና ስራ ፍሰት ንድፍ (Data Flow Diagram)" : "Data & Flow Architecture"}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  
                  {/* Step 1 */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-center relative h-full flex flex-col justify-between">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center mx-auto">1</div>
                    <div className="font-bold text-xs">{lang === "am" ? "ተራ መያዝ (Token Booking)" : "Spot Registration"}</div>
                    <p className="text-[10px] text-slate-400">
                      {lang === "am" ? "አሽከርካሪው በሞባይል ስልኩ ሰሌዳውን እና ስልኩን መዝግቦ ቶከን ይይዛል" : "Driver enters plate and phone from smartphone"}
                    </p>
                  </div>

                  <div className="hidden md:flex justify-center text-slate-700 font-bold"><ArrowRight /></div>

                  {/* Step 2 */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-center relative h-full flex flex-col justify-between">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center mx-auto">2</div>
                    <div className="font-bold text-xs">{lang === "am" ? "የሰልፍ ማስተዳደሪያ (Queue Engine)" : "Queue Processor"}</div>
                    <p className="text-[10px] text-slate-400">
                      {lang === "am" ? "በአገልጋዩ ላይ ያለው Express.js Queue State Machine ሰልፉን ያሰላል" : "Backend computes ETA and updates status blocks"}
                    </p>
                  </div>

                  <div className="hidden md:flex justify-center text-slate-700 font-bold"><ArrowRight /></div>

                  {/* Step 3 */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-center relative h-full flex flex-col justify-between">
                    <div className="h-8 w-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold flex items-center justify-center mx-auto">3</div>
                    <div className="font-bold text-xs">{lang === "am" ? "የኤስኤምኤስ ማስጠንቀቂያ (SMS Alerts)" : "SMS Broadcast"}</div>
                    <p className="text-[10px] text-slate-400">
                      {lang === "am" ? "ተራው 5ኛ ላይ ሲደርስ ለአሽከርካሪው አውቶማቲክ የኤስኤምኤስ ማሳወቂያ ይደርሳል" : "Driver gets cellular SMS text when 5th in line"}
                    </p>
                  </div>

                </div>
              </div>

              {/* Stack Architecture Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/60">
                <div className="space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    <span>{t.clientTier}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{t.clientTierDesc}</p>
                </div>

                <div className="space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <Server className="h-4 w-4 text-emerald-400" />
                    <span>{t.serverTier}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{t.serverTierDesc}</p>
                </div>

                <div className="space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <Database className="h-4 w-4 text-emerald-400" />
                    <span>{t.persistenceTier}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{t.persistenceTierDesc}</p>
                </div>
              </div>

            </div>

            {/* Edge-Case Solutions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-display flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                {t.edgeCasesTitle}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Case 1: Network drops */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                    {t.networkDrops}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t.networkDropsDesc}
                  </p>
                </div>

                {/* Case 2: Late arrivals */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-yellow-400 uppercase tracking-widest font-mono">
                    {t.lateArrivals}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t.lateArrivalsDesc}
                  </p>
                </div>

                {/* Case 3: Anti-Cheating */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-red-400 uppercase tracking-widest font-mono">
                    {t.cheatPrevention}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t.cheatPreventionDesc}
                  </p>
                </div>

              </div>
            </div>

            {/* Database schema specs visualization */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-400" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {lang === "am" ? "የዳታቤዝ አወቃቀር ሰንጠረዦች (Database Schema Models)" : "Database Schema Representation (Relational)"}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Station table Schema */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px] space-y-2.5">
                  <div className="text-emerald-400 font-bold border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>GasStation</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase">Table</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-400">
                    <li><span className="text-slate-100 font-bold">id:</span> VARCHAR(50) [PK, Unique]</li>
                    <li><span className="text-slate-100">nameAm / nameEn:</span> VARCHAR(200)</li>
                    <li><span className="text-slate-100">locationAm / locationEn:</span> VARCHAR(300)</li>
                    <li><span className="text-slate-100">status:</span> ENUM('fast', 'busy', 'packed', 'out_of_fuel')</li>
                    <li><span className="text-slate-100">currentNumber:</span> INT [Default: 0]</li>
                    <li><span className="text-slate-100">lastNumber:</span> INT [Default: 0]</li>
                    <li><span className="text-slate-100">totalWaiting:</span> INT [Default: 0]</li>
                    <li><span className="text-slate-100">updatedAt:</span> TIMESTAMP</li>
                  </ul>
                </div>

                {/* Token table Schema */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px] space-y-2.5">
                  <div className="text-emerald-400 font-bold border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>QueueToken</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase">Table</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-400">
                    <li><span className="text-slate-100 font-bold">id:</span> VARCHAR(100) [PK, Unique]</li>
                    <li><span className="text-slate-100">stationId:</span> VARCHAR(50) [FK - GasStation.id]</li>
                    <li><span className="text-slate-100 font-bold">tokenNumber:</span> INT</li>
                    <li><span className="text-slate-100 font-bold">plateNumber:</span> VARCHAR(30) [Strictly Unique per active station]</li>
                    <li><span className="text-slate-100">vehicleType:</span> ENUM('bajaj', 'car', 'minibus', 'truck')</li>
                    <li><span className="text-slate-100">phoneNumber:</span> VARCHAR(15)</li>
                    <li><span className="text-slate-100">status:</span> ENUM('waiting', 'serving', 'completed', 'canceled')</li>
                    <li><span className="text-slate-100">createdAt / completedAt:</span> TIMESTAMP</li>
                  </ul>
                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER & FLOATING SIMULATED SMS ALERTS PANEL */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-8">
          
          {/* SIMULATED SMS PANEL (Strictly isolated: A driver can ONLY see messages targeting their booked token) */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold font-display text-sm uppercase tracking-wider text-slate-300">
                  {lang === "am" ? "የተጠበቀ የማሳወቂያ መስመር (Isolated Driver Stream)" : "Isolated Driver Notifications Channel"}
                </h3>
              </div>
              
              {activeToken ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Shield className="h-3 w-3" />
                  {lang === "am" ? "የተጠበቀ መስመር (Isolated)" : "Secure Isolated Channel"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-500">
                  {lang === "am" ? "ሳይገናኝ (Inactive)" : "No Session Active"}
                </span>
              )}
            </div>

            {/* Scrollable list of recent SMS */}
            <div className="max-h-48 overflow-y-auto space-y-2.5 pr-2">
              {activeToken ? (
                <>
                  {privateLoading && privateSmsLogs.length === 0 ? (
                    <div className="text-center text-slate-500 py-6 text-xs font-mono">
                      {lang === "am" ? "የተጠበቁ መልዕክቶችን በመጫን ላይ..." : "Loading isolated private alerts..."}
                    </div>
                  ) : (
                    <>
                      {privateSmsLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl flex items-start gap-3 text-xs font-mono">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            <Bell className="h-3.5 w-3.5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-400">To: +251 {log.phoneNumber}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-300 font-sans leading-normal">
                              {log.message}
                            </p>
                          </div>
                        </div>
                      ))}

                      {privateSmsLogs.length === 0 && (
                        <div className="text-center text-slate-600 py-6 text-xs">
                          {lang === "am" ? "ለእርስዎ ስልክ ቁጥር የተላከ ማሳወቂያ እስካሁን የለም።" : "No queue alerts sent to your phone number yet."}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-500 py-8 text-xs font-sans space-y-1.5">
                  <p className="font-semibold text-slate-400">
                    {lang === "am" ? "የእርስዎን የተጠበቀ የመልዕክት ሰሌዳ ለማየት እባክዎ መጀመሪያ ተራ ያስይዙ።" : "Please book a virtual token first to establish your private notifications stream."}
                  </p>
                  <p className="text-[10px] text-slate-600 max-w-md mx-auto leading-normal">
                    {lang === "am" 
                      ? "* እያንዳንዱ አሽከርካሪ ማየት የሚችለው ለእሱ የተላከውን መልዕክት ብቻ ነው፤ የአንዱ አሽከርካሪ መረጃ በሌላው ተጠቃሚ ሊታይ አይችልም።" 
                      : "* Under Hawassa strict security mandates, drivers can never capture, intercept, or view SMS logs sent to other phone numbers."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-900/80 text-center text-xs text-slate-500">
            <div>
              &copy; 2026 {t.title}. {lang === "am" ? "የሃዋሳ ከተማ ዲጂታል ነዳጅ ተራ ማስተዳደሪያ።" : "Hawassa Digital Fuel Queue Management."}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>{lang === "am" ? "ለሃዋሳ ትራፊክ ቁጥጥር የተሰራ" : "Designed for Hawassa Traffic Control"}</span>
            </div>
          </div>

        </div>
      </footer>

      {/* FLOATING INCOMING SMS PHONE BANNER (Toast alert trigger simulation) */}
      {incomingSms && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl flex gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500" />
            
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0 flex items-center justify-center h-10 w-10">
              <Smartphone className="h-5 w-5" />
            </div>

            <div className="space-y-1 font-sans flex-grow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider font-mono">
                  {lang === "am" ? "አዲስ ኤስኤምኤስ ደርሷል" : "SIMULATED SMS RECEIVED"}
                </span>
                <button 
                  onClick={() => setIncomingSms(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs font-bold"
                >
                  &times;
                </button>
              </div>
              <p className="text-slate-200 text-xs font-medium leading-relaxed">
                {incomingSms.message}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
