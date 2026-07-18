import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import { GasStation, QueueToken, SMSAlert, VehicleType, TokenStatus, StationStatus, UserRole } from "./src/types.js";

// Robust process-wide crash prevention
process.on("uncaughtException", (err) => {
  console.error("CRITICAL UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("CRITICAL UNHANDLED REJECTION:", reason);
});

// Server User representation with hashed passwords
interface ServerUser {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  stationId?: string;
  displayName: string;
}

// Global hashing helper (SHA-256 with salt-free layout or dynamic salting)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// In-Memory Users database
// Crucial: No two workers or stations share the same passwords!
let users: ServerUser[] = [
  {
    id: "u-admin",
    username: "admin",
    passwordHash: hashPassword("AdminHawassa2026!"),
    role: "SuperAdmin",
    displayName: "Global Admin (ሀዋሳ ማዕከል)"
  },
  {
    id: "u-manager-central",
    username: "manager_central",
    passwordHash: hashPassword("CentralMadiya2026!"),
    role: "StationManager",
    stationId: "station-1",
    displayName: "Manager (በንዚል መዲያ)"
  },
  {
    id: "u-attendant-central",
    username: "attendant_central",
    passwordHash: hashPassword("CentralAttendant2026!"),
    role: "StationAttendant",
    stationId: "station-1",
    displayName: "አልማዝ አበበ (Benzil Attendant 1)"
  },
  {
    id: "u-attendant-central-2",
    username: "attendant_central_2",
    passwordHash: hashPassword("CentralAttendant2_2026!"),
    role: "StationAttendant",
    stationId: "station-1",
    displayName: "ዮናስ ታሪኩ (Benzil Attendant 2)"
  },
  {
    id: "u-manager-millennium",
    username: "manager_millennium",
    passwordHash: hashPassword("NocMillennium2026!"),
    role: "StationManager",
    stationId: "station-2",
    displayName: "Manager (ኖክ ማደያ)"
  },
  {
    id: "u-attendant-millennium",
    username: "attendant_millennium",
    passwordHash: hashPassword("NocAttendant2026!"),
    role: "StationAttendant",
    stationId: "station-2",
    displayName: "ኪያ በቀለ (NOC Attendant 1)"
  },
  {
    id: "u-manager-piazza",
    username: "manager_piazza",
    passwordHash: hashPassword("TotalPiazza2026!"),
    role: "StationManager",
    stationId: "station-3",
    displayName: "Manager (ቶታል ማደያ)"
  },
  {
    id: "u-attendant-piazza",
    username: "attendant_piazza",
    passwordHash: hashPassword("TotalAttendant2026!"),
    role: "StationAttendant",
    stationId: "station-3",
    displayName: "ዳዊት ወንድሙ (Total Attendant 1)"
  },
  {
    id: "u-manager-tabor",
    username: "manager_tabor",
    passwordHash: hashPassword("TaborYetebaberut2026!"),
    role: "StationManager",
    stationId: "station-5",
    displayName: "Manager (የተባበሩት ማደያ)"
  },
  {
    id: "u-attendant-tabor",
    username: "attendant_tabor",
    passwordHash: hashPassword("TaborAttendant2026!"),
    role: "StationAttendant",
    stationId: "station-5",
    displayName: "ሄለን ካሳሁን (Yetebaberut Attendant 1)"
  }
];

// Initial Launch Setup (Default Password):
// Each station is initialized with a standard, secure default password during database seeding
let stationPasswords: Record<string, string> = {
  "station-1": hashPassword("HawassaStation2026!"),
  "station-2": hashPassword("HawassaStation2026!"),
  "station-3": hashPassword("HawassaStation2026!"),
  "station-4": hashPassword("HawassaStation2026!"),
  "station-5": hashPassword("HawassaStation2026!"),
};

// In-Memory active attendant sessions (Key: token, Value: station user state)
let activeSessions: Record<string, { stationId: string; expiresAt: number }> = {};

// Helper to authenticate station worker requests
const authenticateWorker = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "ያልተፈቀደ መዳረሻ! እባክዎ አስቀድመው ይግቡ። (Unauthorized! Please log in first.)" });
  }

  const token = authHeader.split(" ")[1];
  const session = activeSessions[token];

  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: "የእርስዎ ክፍለ-ጊዜ አልፏል! እባክዎ እንደገና ይግቡ። (Session expired! Please log in again.)" });
  }

  const station = stations.find(s => s.id === session.stationId);
  if (!station) {
    return res.status(401).json({ error: "ማደያው አልተገኘም! (Station not found!)" });
  }

  req.user = {
    id: station.id,
    stationId: station.id,
    role: "StationManager",
    displayName: station.nameAm
  };
  next();
};

const app = express();
const PORT = 3000;

app.use(express.json());


// In-Memory Database State
let stations: GasStation[] = [
  {
    id: "station-1",
    nameAm: "በንዚል መዲያ (ሀዋሳ ማዕከል)",
    nameEn: "Benzil Madiya (Hawassa Central)",
    locationAm: "ፒያሳ አካባቢ፣ ከራስ ሆቴል ፊት ለፊት",
    locationEn: "Piazza area, opposite Ras Hotel",
    status: "busy",
    currentNumber: 12,
    lastNumber: 18,
    totalWaiting: 6,
    updatedAt: new Date().toISOString(),
    currentAllowedVehicle: "all"
  },
  {
    id: "station-2",
    nameAm: "ኖክ ማደያ (ሚሊኒየም)",
    nameEn: "NOC Station (Millennium)",
    locationAm: "ሚሊኒየም ሰፈር፣ ከባህር ዳርቻው መንገድ አጠገብ",
    locationEn: "Millennium neighborhood, near the lakeshore road",
    status: "fast",
    currentNumber: 5,
    lastNumber: 7,
    totalWaiting: 2,
    updatedAt: new Date().toISOString(),
    currentAllowedVehicle: "bajaj"
  },
  {
    id: "station-3",
    nameAm: "ቶታል ማደያ (ፒያሳ)",
    nameEn: "TotalEnergies (Piazza)",
    locationAm: "ፒያሳ መዞሪያ፣ ከዋናው ፖስታ ቤት አጠገብ",
    locationEn: "Piazza roundabout, next to Main Post Office",
    status: "packed",
    currentNumber: 45,
    lastNumber: 51,
    totalWaiting: 6,
    updatedAt: new Date().toISOString(),
    currentAllowedVehicle: "motorbike"
  },
  {
    id: "station-4",
    nameAm: "ኦላ ማደያ (ሞቢል)",
    nameEn: "Ola Energy (Mobil)",
    locationAm: "ሞቢል ሰፈር፣ ወደ አላሙዲ አዳራሽ መሄጃ",
    locationEn: "Mobil area, on the way to Al-Amoudi Hall",
    status: "out_of_fuel",
    currentNumber: 0,
    lastNumber: 0,
    totalWaiting: 0,
    updatedAt: new Date().toISOString(),
    currentAllowedVehicle: "all"
  },
  {
    id: "station-5",
    nameAm: "የተባበሩት ማደያ (ታቦር)",
    nameEn: "Yetebaberut (Tabor)",
    locationAm: "ታቦር ክፍለ ከተማ፣ ከቀበሌ 05 ፖሊስ ጣቢያ አጠገብ",
    locationEn: "Tabor Sub-city, near Kebele 05 Police Station",
    status: "fast",
    currentNumber: 22,
    lastNumber: 25,
    totalWaiting: 3,
    updatedAt: new Date().toISOString(),
    currentAllowedVehicle: "all"
  }
];

let tokens: QueueToken[] = [
  // Station 1 Seeding (Current serving: 12, Last: 18, Total waiting: 6)
  {
    id: "t-1-12",
    stationId: "station-1",
    tokenNumber: 12,
    plateNumber: "ኮድ 3 - AA 45124",
    vehicleType: "car",
    phoneNumber: "0912345678",
    status: "serving",
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    servingAt: new Date(Date.now() - 2 * 60000).toISOString(),
    estimatedTime: 0
  },
  {
    id: "t-1-13",
    stationId: "station-1",
    tokenNumber: 13,
    plateNumber: "ኮድ 1 - HW 02451",
    vehicleType: "bajaj",
    phoneNumber: "0911223344",
    status: "waiting",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    estimatedTime: 2
  },
  {
    id: "t-1-14",
    stationId: "station-1",
    tokenNumber: 14,
    plateNumber: "ኮድ 3 - HW 12543",
    vehicleType: "minibus",
    phoneNumber: "0922334455",
    status: "waiting",
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    estimatedTime: 4
  },
  {
    id: "t-1-15",
    stationId: "station-1",
    tokenNumber: 15,
    plateNumber: "ኮድ 1 - HW 08922",
    vehicleType: "bajaj",
    phoneNumber: "0933445566",
    status: "waiting",
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    estimatedTime: 9
  },
  {
    id: "t-1-16",
    stationId: "station-1",
    tokenNumber: 16,
    plateNumber: "ኮድ 3 - AA 77123",
    vehicleType: "car",
    phoneNumber: "0944556677",
    status: "waiting",
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    estimatedTime: 11
  },
  {
    id: "t-1-17",
    stationId: "station-1",
    tokenNumber: 17,
    plateNumber: "ኮድ 1 - HW 01124",
    vehicleType: "bajaj",
    phoneNumber: "0955667788",
    status: "waiting",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    estimatedTime: 15
  },
  {
    id: "t-1-18",
    stationId: "station-1",
    tokenNumber: 18,
    plateNumber: "ኮድ 4 - ET 99245",
    vehicleType: "truck",
    phoneNumber: "0966778899",
    status: "waiting",
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    estimatedTime: 17
  },

  // Station 2 Seeding (Current: 5, Last: 7, Total waiting: 2)
  {
    id: "t-2-5",
    stationId: "station-2",
    tokenNumber: 5,
    plateNumber: "ኮድ 1 - HW 03322",
    vehicleType: "bajaj",
    phoneNumber: "0977889900",
    status: "serving",
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    servingAt: new Date(Date.now() - 1 * 60000).toISOString(),
    estimatedTime: 0
  },
  {
    id: "t-2-6",
    stationId: "station-2",
    tokenNumber: 6,
    plateNumber: "ኮድ 3 - AA 55212",
    vehicleType: "car",
    phoneNumber: "0988990011",
    status: "waiting",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    estimatedTime: 4
  },
  {
    id: "t-2-7",
    stationId: "station-2",
    tokenNumber: 7,
    plateNumber: "ኮድ 1 - HW 05678",
    vehicleType: "bajaj",
    phoneNumber: "0999001122",
    status: "waiting",
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
    estimatedTime: 8
  },

  // Station 3 Seeding (Current: 45, Last: 51, Total waiting: 6)
  {
    id: "t-3-45",
    stationId: "station-3",
    tokenNumber: 45,
    plateNumber: "ኮድ 3 - AA 88722",
    vehicleType: "car",
    phoneNumber: "0900112233",
    status: "serving",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    servingAt: new Date(Date.now() - 3 * 60000).toISOString(),
    estimatedTime: 0
  },
  {
    id: "t-3-46",
    stationId: "station-3",
    tokenNumber: 46,
    plateNumber: "ኮድ 1 - HW 12121",
    vehicleType: "bajaj",
    phoneNumber: "0912121212",
    status: "waiting",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    estimatedTime: 2
  },
  {
    id: "t-3-47",
    stationId: "station-3",
    tokenNumber: 47,
    plateNumber: "ኮድ 3 - HW 72611",
    vehicleType: "minibus",
    phoneNumber: "0923232323",
    status: "waiting",
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    estimatedTime: 4
  },
  {
    id: "t-3-48",
    stationId: "station-3",
    tokenNumber: 48,
    plateNumber: "ኮድ 3 - AA 00293",
    vehicleType: "car",
    phoneNumber: "0934343434",
    status: "waiting",
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    estimatedTime: 9
  },
  {
    id: "t-3-49",
    stationId: "station-3",
    tokenNumber: 49,
    plateNumber: "ኮድ 1 - HW 99911",
    vehicleType: "bajaj",
    phoneNumber: "0945454545",
    status: "waiting",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    estimatedTime: 13
  },
  {
    id: "t-3-50",
    stationId: "station-3",
    tokenNumber: 50,
    plateNumber: "ኮድ 3 - AA 11223",
    vehicleType: "car",
    phoneNumber: "0956565656",
    status: "waiting",
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    estimatedTime: 15
  },
  {
    id: "t-3-51",
    stationId: "station-3",
    tokenNumber: 51,
    plateNumber: "ኮድ 1 - HW 78901",
    vehicleType: "bajaj",
    phoneNumber: "0967676767",
    status: "waiting",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    estimatedTime: 19
  },

  // Station 5 Seeding (Current: 22, Last: 25, Total waiting: 3)
  {
    id: "t-5-22",
    stationId: "station-5",
    tokenNumber: 22,
    plateNumber: "ኮድ 3 - HW 00912",
    vehicleType: "minibus",
    phoneNumber: "0978787878",
    status: "serving",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    servingAt: new Date(Date.now() - 2 * 60000).toISOString(),
    estimatedTime: 0
  },
  {
    id: "t-5-23",
    stationId: "station-5",
    tokenNumber: 23,
    plateNumber: "ኮድ 1 - HW 02441",
    vehicleType: "bajaj",
    phoneNumber: "0989898989",
    status: "waiting",
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    estimatedTime: 2
  },
  {
    id: "t-5-24",
    stationId: "station-5",
    tokenNumber: 24,
    plateNumber: "ኮድ 3 - AA 99182",
    vehicleType: "car",
    phoneNumber: "0990909090",
    status: "waiting",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    estimatedTime: 4
  },
  {
    id: "t-5-25",
    stationId: "station-5",
    tokenNumber: 25,
    plateNumber: "ኮድ 1 - HW 05511",
    vehicleType: "bajaj",
    phoneNumber: "0901010101",
    status: "waiting",
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    estimatedTime: 8
  }
];

let smsLogs: SMSAlert[] = [
  {
    id: "sms-init-1",
    phoneNumber: "0911223344",
    message: "[SIMULATED SMS - በንዚል መዲያ] ውድ አሽከርካሪ፣ የሰሌዳ ቁጥር ኮድ 1 - HW 02451 ለበንዚል መዲያ (ሀዋሳ ማዕከል) ማደያ ተራ ቁጥር 13 በስኬት ተይዞልዎታል። የቀረው ጊዜ ግምት፡ 2 ደቂቃ።",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    tokenNumber: 13,
    plateNumber: "ኮድ 1 - HW 02451"
  },
  {
    id: "sms-init-2",
    phoneNumber: "0911223344",
    message: "[SIMULATED SMS - በንዚል መዲያ] ተራዎ ሊደርስ 5 መኪና ብቻ ቀርቷል! እባክዎ በአስቸኳይ ወደ በንዚል መዲያ (ሀዋሳ ማዕከል) ማደያ ይምጡ።",
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    tokenNumber: 13,
    plateNumber: "ኮድ 1 - HW 02451"
  }
];

// Server-Sent Events (SSE) Client Connections
let clients: { id: string; res: any }[] = [];

// Broadcast system events
function broadcastEvent(type: string, data: any) {
  const payload = JSON.stringify({ type, data });
  const activeClients: typeof clients = [];

  clients.forEach((client) => {
    try {
      if (client.res && !client.res.destroyed && !client.res.writableEnded) {
        client.res.write(`data: ${payload}\n\n`);
        activeClients.push(client);
      }
    } catch (err) {
      console.error(`Error broadcasting to client ${client.id}:`, err);
    }
  });

  clients = activeClients;
}

// Service duration weights by vehicle type (in minutes)
const SERVICE_TIMES: Record<VehicleType, number> = {
  bajaj: 2,
  motorbike: 2,
  car: 4,
  minibus: 5,
  truck: 8,
};

// Calculate ETA for all waiting tokens of a station
function recalculateETAs(stationId: string) {
  const stationTokens = tokens.filter(
    (t) => t.stationId === stationId && (t.status === "waiting" || t.status === "serving")
  );
  
  // Sort by token number
  stationTokens.sort((a, b) => a.tokenNumber - b.tokenNumber);
  
  let currentETAAccumulator = 3; // base minutes for current serving vehicle
  
  stationTokens.forEach((token) => {
    if (token.status === "serving") {
      token.estimatedTime = 2; // serving vehicle is almost done
    } else {
      token.estimatedTime = currentETAAccumulator;
      currentETAAccumulator += SERVICE_TIMES[token.vehicleType];
    }
  });
}

// Run initial ETA calculation and security token assignment for private communications
tokens.forEach((t) => {
  if (!t.securityToken) {
    t.securityToken = `drv-${t.id}-${crypto.randomBytes(4).toString("hex")}`;
  }
});
stations.forEach((s) => recalculateETAs(s.id));

// REST APIs
// --- AUTHENTICATION & SECURITY ENDPOINTS ---

// Simplified Login via Gas Station Dropdown and Password
app.post("/api/auth/login", (req, res) => {
  const { stationId, password } = req.body;
  if (!stationId || !password) {
    return res.status(400).json({ error: "እባክዎ ማደያ እና የይለፍ ቃል ያስገቡ! (Gas station selection and password are required.)" });
  }

  const station = stations.find((s) => s.id === stationId);
  if (!station) {
    return res.status(404).json({ error: "እባክዎ ትክክለኛ ማደያ ይምረጡ! (Selected station not found.)" });
  }

  const expectedHash = stationPasswords[stationId] || hashPassword("HawassaStation2026!");
  const hashedInput = hashPassword(password);
  
  if (expectedHash !== hashedInput) {
    return res.status(401).json({ error: "የተሳሳተ የይለፍ ቃል! (Incorrect password. Try default 'HawassaStation2026!')" });
  }

  // Create active session
  const sessionToken = "session-" + crypto.randomBytes(16).toString("hex");
  activeSessions[sessionToken] = {
    stationId: station.id,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000 // 12 hours
  };

  const safeUser = {
    id: station.id,
    username: station.id,
    role: "StationManager" as UserRole,
    stationId: station.id,
    displayName: station.nameAm
  };

  res.json({ user: safeUser, token: sessionToken });
});

// Check Current Session Status
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No active session." });
  }

  const token = authHeader.split(" ")[1];
  const session = activeSessions[token];

  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: "Session expired." });
  }

  const station = stations.find((s) => s.id === session.stationId);
  if (!station) {
    return res.status(401).json({ error: "Gas station associated with session not found." });
  }

  const safeUser = {
    id: station.id,
    username: station.id,
    role: "StationManager" as UserRole,
    stationId: station.id,
    displayName: station.nameAm
  };
  res.json(safeUser);
});

// Secure Password Change Flow with 3-Step Validation (የይለፍ ቃል መቀየሪያ)
app.post("/api/auth/change-password", authenticateWorker, (req: any, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const user = req.user; // Contains user.stationId

  const currentHash = stationPasswords[user.stationId] || hashPassword("HawassaStation2026!");
  const hashedCurrent = hashPassword(currentPassword);
  if (currentHash !== hashedCurrent) {
    return res.status(400).json({ 
      error: "የድሮው የይለፍ ቃል የተሳሳተ ነው! (The old password entered is incorrect.)" 
    });
  }

  // Enforce strength: Must be at least 8 characters
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ 
      error: "አዲሱ የይለፍ ቃል ቢያንስ 8 ፊደላት/ቁጥሮች መሆን አለበት! (New password must be at least 8 characters long.)" 
    });
  }

  // Enforce pattern: At least 1 letter and 1 number
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (!hasLetter || !hasNumber) {
    return res.status(400).json({ 
      error: "የይለፍ ቃሉ ቢያንስ አንድ ፊደል እና አንድ ቁጥር መያዝ አለበት! (Password must contain at least one letter and one number.)" 
    });
  }

  const proposedNewHash = hashPassword(newPassword);
  
  // Security rule: passwords cannot be identical across stations to prevent multi-station bypasses
  const isPasswordShared = Object.entries(stationPasswords).some(
    ([sId, hash]) => sId !== user.stationId && hash === proposedNewHash
  );
  if (isPasswordShared) {
    return res.status(400).json({ 
      error: "ይህ የይለፍ ቃል በሌላ ማደያ ጥቅም ላይ ውሏል! እባክዎ ልዩ የይለፍ ቃል ያስገቡ። (Password already in use by another station. Password reuse is strictly forbidden.)" 
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ 
      error: "አዲሱ የይለፍ ቃል ከማረጋገጫው ጋር አይዛመድም! (The new password and confirmation do not match.)" 
    });
  }

  // Update password in-memory database
  stationPasswords[user.stationId] = proposedNewHash;
  console.log(`Password updated successfully for station ${user.stationId} (${user.displayName})`);

  res.json({ 
    success: true, 
    message: "የይለፍ ቃልዎ በስኬት ተቀይሯል! (Your password has been changed successfully!)" 
  });
});

// Update gas station current allowed vehicle type parameter (Station-controlled service days)
app.post("/api/stations/allowed-vehicle", authenticateWorker, (req: any, res) => {
  const { stationId, allowedVehicle } = req.body;
  
  const station = stations.find((s) => s.id === stationId);
  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }

  // Ensure the logged in worker is associated with this station
  if (req.user.stationId !== stationId) {
    return res.status(403).json({ error: "ያልተፈቀደ እርምጃ! ይህንን ማደያ ማስተዳደር አይችሉም። (Unauthorized action! You cannot manage this station.)" });
  }

  const allowedTypes = ['bajaj', 'motorbike', 'car', 'minibus', 'truck', 'all'];
  if (!allowedTypes.includes(allowedVehicle)) {
    return res.status(400).json({ error: "የተሳሳተ የተሽከርካሪ አይነት! (Invalid vehicle type.)" });
  }

  station.currentAllowedVehicle = allowedVehicle;
  station.updatedAt = new Date().toISOString();

  // Broadcast state change
  broadcastEvent("stations", stations);

  res.json(station);
});

// Private isolated driver queue tracking & alerts API
app.get("/api/tokens/private", (req, res) => {
  let securityToken = req.query.securityToken as string;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    securityToken = authHeader.split(" ")[1];
  }

  if (!securityToken) {
    return res.status(400).json({ error: "የይለፍ ቃል ወይም የደህንነት ምልክት አልተገኘም! (Missing security token.)" });
  }

  const token = tokens.find((t) => t.securityToken === securityToken);
  if (!token) {
    return res.status(404).json({ error: "የሰልፍ መለያው አልተገኘም ወይም የደህንነት ቶከኑ የተሳሳተ ነው! (Queue token not found or security token is invalid.)" });
  }

  const station = stations.find((s) => s.id === token.stationId)!;

  // Strict targeted data isolation: filter SMS alerts specifically for this vehicle's phone or plate
  const privateSms = smsLogs.filter(
    (s) => s.plateNumber === token.plateNumber || s.phoneNumber === token.phoneNumber
  );

  res.json({
    token,
    station,
    smsLogs: privateSms.slice().reverse().slice(0, 15) // latest 15 targeted sms only
  });
});

app.get("/api/stations", (req, res) => {
  res.json(stations);
});

app.get("/api/sms-logs", (req, res) => {
  res.json(smsLogs.slice().reverse().slice(0, 50)); // Return latest 50 SMS logs
});

app.get("/api/tokens", (req, res) => {
  res.json(tokens);
});

// SSE Event Stream Endpoint
app.get("/api/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const clientId = Date.now().toString();
  clients.push({ id: clientId, res });

  // Keep-alive ping
  const intervalId = setInterval(() => {
    try {
      if (!res.destroyed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
      } else {
        clearInterval(intervalId);
      }
    } catch (err) {
      console.error(`Error sending keep-alive ping to client ${clientId}:`, err);
      clearInterval(intervalId);
    }
  }, 30000);

  req.on("close", () => {
    clients = clients.filter((c) => c.id !== clientId);
    clearInterval(intervalId);
  });
});

// Book virtual queue token
app.post("/api/tokens/book", (req, res) => {
  const { stationId, plateNumber, vehicleType, phoneNumber } = req.body;

  if (!stationId || !plateNumber || !vehicleType || !phoneNumber) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const station = stations.find((s) => s.id === stationId);
  if (!station) {
    return res.status(404).json({ error: "Gas station not found" });
  }

  // Dynamic Station-Controlled Service Day validation
  if (station.currentAllowedVehicle && station.currentAllowedVehicle !== "all" && vehicleType !== station.currentAllowedVehicle) {
    const vehicleNamesAm: Record<string, string> = {
      bajaj: "ባጃጅ",
      motorbike: "ሞተርሳይክል",
      car: "የቤት መኪና",
      minibus: "ሚኒባስ",
      truck: "ጭነት መኪና",
      all: "ሁሉም"
    };

    const vehicleNamesEn: Record<string, string> = {
      bajaj: "Bajaj",
      motorbike: "Motorbike",
      car: "Private Car",
      minibus: "Minibus",
      truck: "Truck",
      all: "All Vehicles"
    };

    const allowedAm = vehicleNamesAm[station.currentAllowedVehicle] || station.currentAllowedVehicle;
    const allowedEn = vehicleNamesEn[station.currentAllowedVehicle] || station.currentAllowedVehicle;
    const requestedAm = vehicleNamesAm[vehicleType] || vehicleType;
    const requestedEn = vehicleNamesEn[vehicleType] || vehicleType;

    return res.status(400).json({
      error: `ይህ ማደያ ዛሬ ለ${allowedAm} ብቻ ነው የሚሰራው! የእርስዎ ተሽከርካሪ (${requestedAm}) በዚህ ሰዓት መመዝገብ አይችልም። (Today, this station is serving ${allowedEn} only! Your vehicle type (${requestedEn}) is currently restricted.)`
    });
  }

  if (station.status === "out_of_fuel") {
    return res.status(400).json({ error: "Station is out of fuel" });
  }

  // Prevent plate number cheating (check if this plate already has an active token at this station)
  const activeDuplicate = tokens.find(
    (t) => t.stationId === stationId && t.plateNumber.trim().toUpperCase() === plateNumber.trim().toUpperCase() && (t.status === "waiting" || t.status === "serving")
  );

  if (activeDuplicate) {
    return res.status(400).json({ 
      error: "ይህ የሰሌዳ ቁጥር አስቀድሞ በዚህ ማደያ ሰልፍ ላይ ተመዝግቧል! (This plate number already has an active token here.)" 
    });
  }

  // Generate new token number
  const nextTokenNumber = station.lastNumber + 1;
  station.lastNumber = nextTokenNumber;
  station.totalWaiting += 1;
  station.updatedAt = new Date().toISOString();

  const securityToken = "drv-" + crypto.randomBytes(12).toString("hex");

  // Create new Token
  const newToken: QueueToken = {
    id: `t-${stationId}-${nextTokenNumber}`,
    stationId,
    tokenNumber: nextTokenNumber,
    plateNumber: plateNumber.trim().toUpperCase(),
    vehicleType,
    phoneNumber,
    status: "waiting",
    createdAt: new Date().toISOString(),
    estimatedTime: 0,
    securityToken
  };

  tokens.push(newToken);
  recalculateETAs(stationId);

  // Find the created token's ETA
  const updatedToken = tokens.find((t) => t.id === newToken.id)!;

  // Create simulated welcome SMS
  const smsMessage = `[SIMULATED SMS - ${station.nameEn}] Dear Driver, Plate ${updatedToken.plateNumber} successfully booked Token #${updatedToken.tokenNumber} at ${station.nameEn}. Estimated wait: ${updatedToken.estimatedTime} min.`;
  const sms: SMSAlert = {
    id: `sms-${Date.now()}`,
    phoneNumber,
    message: smsMessage,
    timestamp: new Date().toISOString(),
    tokenNumber: updatedToken.tokenNumber,
    plateNumber: updatedToken.plateNumber,
  };
  smsLogs.push(sms);

  // Broadcast state changes
  broadcastEvent("stations", stations);
  broadcastEvent("tokens", tokens);
  broadcastEvent("sms", sms);

  res.status(201).json({ token: updatedToken, sms });
});

// Cancel a token
app.post("/api/tokens/cancel", (req, res) => {
  const { tokenId } = req.body;
  const tokenIndex = tokens.findIndex((t) => t.id === tokenId);

  if (tokenIndex === -1) {
    return res.status(404).json({ error: "Token not found" });
  }

  const token = tokens[tokenIndex];
  const station = stations.find((s) => s.id === token.stationId)!;

  const wasWaitingOrServing = token.status === "waiting" || token.status === "serving";

  token.status = "canceled";
  token.completedAt = new Date().toISOString();

  if (wasWaitingOrServing) {
    station.totalWaiting = Math.max(0, station.totalWaiting - 1);
    station.updatedAt = new Date().toISOString();
  }

  recalculateETAs(token.stationId);

  // Simulated SMS for cancellation
  const smsMessage = `[SIMULATED SMS - ${station.nameEn}] Token #${token.tokenNumber} has been canceled.`;
  const sms: SMSAlert = {
    id: `sms-${Date.now()}`,
    phoneNumber: token.phoneNumber,
    message: smsMessage,
    timestamp: new Date().toISOString(),
    tokenNumber: token.tokenNumber,
    plateNumber: token.plateNumber,
  };
  smsLogs.push(sms);

  broadcastEvent("stations", stations);
  broadcastEvent("tokens", tokens);
  broadcastEvent("sms", sms);

  res.json({ token, sms });
});

// Advance queue (Next vehicle) - Called by Station Attendant
app.post("/api/stations/next", authenticateWorker, (req: any, res) => {
  const { stationId } = req.body;

  // Ensure the logged in worker is associated with this station
  if (req.user.stationId !== stationId) {
    return res.status(403).json({ error: "ያልተፈቀደ እርምጃ! ይህንን ማደያ ማስተዳደር አይችሉም። (Unauthorized action! You cannot manage this station.)" });
  }

  const station = stations.find((s) => s.id === stationId);

  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }

  // 1. Move current serving vehicle (if any) to completed
  const currentServing = tokens.find((t) => t.stationId === stationId && t.status === "serving");
  if (currentServing) {
    currentServing.status = "completed";
    currentServing.completedAt = new Date().toISOString();
    
    // Add completion SMS
    const completionSms: SMSAlert = {
      id: `sms-comp-${Date.now()}`,
      phoneNumber: currentServing.phoneNumber,
      message: `[SIMULATED SMS - ${station.nameEn}] Token #${currentServing.tokenNumber} completed. Thank you for using Hawassa Fuel Queue!`,
      timestamp: new Date().toISOString(),
      tokenNumber: currentServing.tokenNumber,
      plateNumber: currentServing.plateNumber,
    };
    smsLogs.push(completionSms);
    broadcastEvent("sms", completionSms);
  }

  // 2. Find next waiting vehicle
  const waitingTokens = tokens
    .filter((t) => t.stationId === stationId && t.status === "waiting")
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  let nextServingToken: QueueToken | null = null;

  if (waitingTokens.length > 0) {
    nextServingToken = waitingTokens[0];
    nextServingToken.status = "serving";
    nextServingToken.servingAt = new Date().toISOString();
    station.currentNumber = nextServingToken.tokenNumber;
    station.totalWaiting = Math.max(0, station.totalWaiting - 1);
  } else {
    // No more waiting vehicles
    station.currentNumber = 0;
    station.totalWaiting = 0;
  }

  station.updatedAt = new Date().toISOString();
  recalculateETAs(stationId);

  // 3. Trigger simulated SMS warnings for the 5th driver in line (or closer)
  // Let's check remaining waiting drivers in queue
  const remainingWaiting = tokens
    .filter((t) => t.stationId === stationId && t.status === "waiting")
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  // If there are waiting drivers, the 4th index (which is 5th in queue, since 1st is index 0)
  // should get a "You are 5th in line" SMS!
  // Wait, let's also alert anyone who is closer if they haven't been alerted yet!
  // To keep it simple, we check if the driver at index 4 (5th in line) exists, and send them an SMS.
  if (remainingWaiting.length >= 5) {
    const fifthDriver = remainingWaiting[4]; // 5th in line (index 4)
    const alertSms: SMSAlert = {
      id: `sms-alert-${Date.now()}`,
      phoneNumber: fifthDriver.phoneNumber,
      message: `[SIMULATED SMS - ${station.nameEn}] ተራዎ ሊደርስ 5 መኪና ብቻ ቀርቷል! እባክዎ በአስቸኳይ ወደ ${station.nameAm} ማደያ ይምጡ።`,
      timestamp: new Date().toISOString(),
      tokenNumber: fifthDriver.tokenNumber,
      plateNumber: fifthDriver.plateNumber,
    };
    smsLogs.push(alertSms);
    broadcastEvent("sms", alertSms);
  }
  
  // Also send an alert if a driver is now 3rd in line or 1st in line to be helpful
  if (remainingWaiting.length > 0) {
    const nextUp = remainingWaiting[0];
    const alertSms: SMSAlert = {
      id: `sms-alert-next-${Date.now()}`,
      phoneNumber: nextUp.phoneNumber,
      message: `[SIMULATED SMS - ${station.nameEn}] ተራዎ ደርሷል! ቀጣዩ እርስዎ ነዎት፤ እባክዎ በአስቸኳይ ወደ መጋቢው መስመር ይግቡ።`,
      timestamp: new Date().toISOString(),
      tokenNumber: nextUp.tokenNumber,
      plateNumber: nextUp.plateNumber,
    };
    smsLogs.push(alertSms);
    broadcastEvent("sms", alertSms);
  }

  broadcastEvent("stations", stations);
  broadcastEvent("tokens", tokens);

  res.json({ station, nextToken: nextServingToken });
});

// Update station fuel or queue status
app.post("/api/stations/status", authenticateWorker, (req: any, res) => {
  const { stationId, status } = req.body;

  // Ensure the logged in worker is associated with this station
  if (req.user.stationId !== stationId) {
    return res.status(403).json({ error: "ያልተፈቀደ እርምጃ! ይህንን ማደያ ማስተዳደር አይችሉም። (Unauthorized action! You cannot manage this station.)" });
  }

  const station = stations.find((s) => s.id === stationId);

  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }

  if (status) {
    station.status = status as StationStatus;
    
    // If out of fuel, cancel all waiting tokens automatically to free drivers
    if (status === "out_of_fuel") {
      tokens.forEach((t) => {
        if (t.stationId === stationId && (t.status === "waiting" || t.status === "serving")) {
          t.status = "canceled";
          t.completedAt = new Date().toISOString();
          
          const cancelSms: SMSAlert = {
            id: `sms-out-${Date.now()}-${t.id}`,
            phoneNumber: t.phoneNumber,
            message: `[SIMULATED SMS - ${station.nameEn}] ማደያው ላይ ነዳጅ በማለቁ ምክንያት ተራዎ ተሰርዟል። ስለተፈጠረው ችግር ይቅርታ እንጠይቃለን።`,
            timestamp: new Date().toISOString(),
            tokenNumber: t.tokenNumber,
            plateNumber: t.plateNumber,
          };
          smsLogs.push(cancelSms);
          broadcastEvent("sms", cancelSms);
        }
      });
      station.totalWaiting = 0;
      station.currentNumber = 0;
    }
    
    station.updatedAt = new Date().toISOString();
    recalculateETAs(stationId);
  }

  broadcastEvent("stations", stations);
  broadcastEvent("tokens", tokens);

  res.json(station);
});

// Setup Vite Dev Middleware / Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
