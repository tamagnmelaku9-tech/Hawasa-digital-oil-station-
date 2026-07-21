export const localization = {
  am: {
    title: "የሃዋሳ ነዳጅ ተራ መቆጣጠሪያ",
    subtitle: "ዲጂታል የነዳጅ ተራ መያዣ እና ማስተዳደሪያ መድረክ",
    driverDashboard: "የአሽከርካሪዎች ገፅ",
    attendantDashboard: "የማደያ ሰራተኞች ገፅ",
    sysArchitecture: "የስርዓቱ አወቃቀርና መረጃ",
    languageToggle: "English",
    
    // Station statuses
    fast: "ፈጣን ሰልፍ",
    busy: "መካከለኛ ሰልፍ",
    packed: "ረጅም ሰልፍ",
    out_of_fuel: "ነዳጅ የለም",
    
    // Stations list labels
    stations: "ማደያዎች",
    selectStation: "እባክዎ መጀመሪያ ማደያ ይምረጡ",
    stationStatus: "የማደያው ሁኔታ",
    activeQueue: "በሰልፍ ላይ ያሉ መኪኖች",
    currentServing: "አሁን በመስተናገድ ላይ ያለው",
    lastIssued: "የመጨረሻው የተሰጠ ተራ",
    bookToken: "ተራ ይያዙ (ቶከን ያውጡ)",
    
    // Vehicle types
    vehicleType: "የተሽከርካሪ ዓይነት",
    plateNumber: "የሰሌዳ ቁጥር",
    phoneNumber: "ስልክ ቁጥር (ለኤስኤምኤስ ማሳወቂያ)",
    bajaj: "ባጃጅ",
    motorbike: "ሞተርሳይክል (ሞተር)",
    car: "የግል መኪና",
    minibus: "ታክሲ (ሚኒባስ/ዳማስ/ላዳ)",
    truck: "የጭነት መኪና / አውቶቡስ",
    
    // Station controls
    allowedVehicleLabel: "ዛሬ የሚስተናገድ የተሽከርካሪ አይነት",
    allowedVehicleAll: "ሁሉም ተሽከርካሪዎች",
    allowedVehicleOnly: "ለ{vehicle} ብቻ የተገደበ",
    allowedVehicleShort: "የተፈቀደለት፡ {vehicle}",
    
    // Form buttons
    submitBooking: "ተራ ያዙ",
    bookingInProgress: "ተራ በመያዝ ላይ...",
    
    // Queue details for active token
    yourToken: "የእርስዎ ተራ ቁጥር",
    registrationSuccess: "ተራዎ በስኬት ተይዟል!",
    waitEstimation: "የመጠባበቂያ ጊዜ ግምት",
    minutes: "ደቂቃዎች",
    aheadOfYou: "ከእርስዎ በፊት ያሉ ተሽከርካሪዎች",
    headToStation: "ተራዎ ሊደርስ ስለሆነ እባክዎ ወደ ማደያው ይምጡ!",
    smsAlertSim: "የኤስኤምኤስ ማስጠንቀቂያ መድረሻ",
    cancelToken: "ተራውን ሰርዝ",
    tokenCanceled: "ተራዎ ተሰርዟል",
    doneFueling: "ነዳጅ ቀድተው ጨርሰዋል! አመሰግናለን።",
    
    // Attendant controls
    attendantTitle: "የማደያ ቁጥጥር ሰሌዳ",
    manageStation: "የሚያስተዳድሩትን ማደያ ይምረጡ",
    nextVehicle: "ቀጣይ መኪና (ይጥሩ)",
    noVehicles: "በሰልፍ ላይ የሚጠባበቅ ተሽከርካሪ የለም",
    updateFuelStatus: "የነዳጅ ሁኔታን ይቀይሩ",
    fuelAvailable: "ነዳጅ አለ",
    fuelOut: "ነዳጅ አልቋል",
    allTokens: "የተመዘገቡ ተሽከርካሪዎች ዝርዝር",
    serving: "በመስተናገድ ላይ",
    waiting: "በመጠባበቅ ላይ",
    completed: "ተጠናቋል",
    canceled: "ተሰርዟል",
    actionCall: "ጥራ",
    actionComplete: "አጠናቅ",
    actionCancel: "ሰርዝ",
    passcodeLabel: "የተጠቃሚ ስም እና የይለፍ ቃል ያስገቡ",
    passcodePlaceholder: "ለምሳሌ፡ attendant_central",
    loginBtn: "ግባ (Secure Login)",
    logoutBtn: "ውጣ (Sign Out)",
    incorrectPasscode: "የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል!",
    
    // Password Change & Security Upgrades
    usernameLabel: "የተጠቃሚ ስም (Username)",
    passwordLabel: "የይለፍ ቃል (Password)",
    oldPasswordLabel: "የድሮው የይለፍ ቃል (Old Password)",
    newPasswordLabel: "አዲሱ የይለፍ ቃል (New Password)",
    confirmPasswordLabel: "አዲሱን የይለፍ ቃል ያረጋግጡ (Confirm Password)",
    changePasswordTitle: "የይለፍ ቃል መቀየሪያ (3-Step Password Change)",
    changePasswordBtn: "የይለፍ ቃል ቀይር",
    strengthRule: "የይለፍ ቃሉ ቢያንስ 8 ፊደላት፣ ቁጥሮች እና ልዩ ምልክት መያዝ አለበት።",
    nonSharedRule: "የደህንነት ደንብ፡ የእርስዎ የይለፍ ቃል ከሌላ ሰራተኛ ጋር መደራረብ/መመሳሰል የለበትም!",
    privateAlertsTitle: "የእርስዎ የግል የሰልፍ መረጃና መልዕክቶች (Targeted Driver Isolation)",
    privateAccessOnly: "ይህ ክፍል ለእርስዎ ተሽከርካሪ ብቻ የተላኩ የግል መልዕክቶች እና የሰልፍ ሁኔታዎችን ያሳያል። ሌላ አሽከርካሪ ማየት አይችልም!",

    // SMS Notifications Simulation
    smsNotificationTitle: "የኤስኤምኤስ መልዕክቶች (በእውነተኛ ጊዜ)",
    fuelInventoryInput: "ጠቅላላ ያለ ነዳጅ (በሊትር)",
    requestedLitersInput: "የሚፈልጉት የነዳጅ መጠን (በሊትር)",
    remainingFuel: "ቀሪ የፈሳሽ ነዳጅ መጠን",
    allocatedFuel: "የተያዘ (የተሸጠ) ነዳጅ መጠን",
    fuelDepletionProgress: "የማደያው ክምችት መቶኛ",
    lowFuelWarning: "ማስጠንቀቂያ፡ የእርስዎ ተራ ከመድረሱ በፊት ነዳጅ ሊያልቅ ስለሚችል መስተናገድዎ አጠራጣሪ ነው። (WARNING: Fuel might run out before your turn!)",
    litersShort: "ሊትር",
    updateInventoryBtn: "የነዳጅ ክምችት ያዘምኑ",
    fuelInventoryStatus: "የማደያው የነዳጅ ክምችት ሁኔታ",
    noSmsSent: "እስካሁን የተላከ የኤስኤምኤስ መልዕክት የለም። ተራ ሲይዙ ወይም ተራዎ ሲቃረብ እዚህ መልዕክት ይደርስዎታል።",
    smsTemplateWelcome: "ውድ አሽከርካሪ፣ የሰሌዳ ቁጥር {plate} ለ{station} ማደያ ተራ ቁጥር {number} በስኬት ተይዞልዎታል። የቀረው ጊዜ ግምት፡ {eta} ደቂቃ።",
    smsTemplateAlert: "ተራዎ ሊደርስ {count} መኪና ብቻ ቀርቷል! እባክዎ በአስቸኳይ ወደ {station} ማደያ ይምጡ።",
    smsTemplateCompleted: "ተራ ቁጥር {number} ተጠናቋል። ስለተጠቀሙ እናመሰግናለን!",
    
    // Edge case tabs
    edgeCasesTitle: "የአሰራር ችግሮች መፍቻ መንገዶች (Edge Cases)",
    networkDrops: "የኔትወርክ መቆራረጥ",
    networkDropsDesc: "አሽከርካሪዎች በመንገድ ላይ ኔትወርክ ቢቋረጥባቸውም ያወጡት ቶከን በአገልጋይ (server) ላይ ስለሚቀመጥ አይጠፋም። አሽከርካሪው በኤስኤምኤስ ወይም ከመስመር ውጭ (offline caching) ተራውን መከታተል ይችላል።",
    lateArrivals: "ዘግይቶ መድረስ",
    lateArrivalsDesc: "ተራው ደርሶ ያላለፈበት አሽከርካሪ ከደረሰ፣ ማደያው ላይ በልዩ ሁኔታ ተራው እንዲጠበቅለት ወይም ከ 3 መኪናዎች በኋላ እንዲገባ የማደያው ሰራተኛ ቅድሚያ ሊሰጠው ይችላል። ተራው አልፎ ከ 15 ደቂቃ በላይ ከዘገየ ግን ቶከኑ ይሰረዛል።",
    cheatPrevention: "ማጭበርበርን መከላከል",
    cheatPreventionDesc: "አንድ የሰሌዳ ቁጥር በአንድ ማደያ በአንድ ጊዜ መመዝገብ የሚችለው ለአንድ ተራ ብቻ ነው። ሰራተኞች የሰሌዳ ቁጥሩን በአካል ከማሽኑ ጋር በማመሳከር ብቻ ነዳጅ እንዲቀዳ ያደርጋሉ፤ ይህም በሃሰት ተራ መያዝን ያስቀራል።",
    
    // Architecture Flow
    architectureTitle: "የስርዓቱ አወቃቀርና የውሂብ ፍሰት",
    clientTier: "የተጠቃሚ ገፅ (Client Tier)",
    clientTierDesc: "ቀላል እና ፈጣን የሆነ React + Tailwind የሞባይል ድረ-ገጽ ለሃዋሳ ባጃጅ እና ታክሲ አሽከርካሪዎች።",
    serverTier: "የአገልጋይ ንብርብር (Server Tier)",
    serverTierDesc: "Express (Node.js) የኩዊንግ ስሌትን፣ የሰዓት ግምትን እና የኤስኤምኤስ መልዕክቶችን በእውነተኛ ሰዓት (SSE - Server Sent Events) ያስተዳድራል።",
    persistenceTier: "የውሂብ ማከማቻ (Persistence Tier)",
    persistenceTierDesc: "በማህደረ ትውስታ (In-Memory Session Cache) እና የፋይል ማከማቻ ላይ የተመሰረተ አስተማማኝ የመረጃ ቋት።"
  },
  en: {
    title: "Hawassa Fuel Queue Tracker",
    subtitle: "Digital Fuel Queue Booking & Management Platform",
    driverDashboard: "Driver Dashboard",
    attendantDashboard: "Attendant Panel",
    sysArchitecture: "System Architecture",
    languageToggle: "አማርኛ",
    
    // Station statuses
    fast: "Fast Moving",
    busy: "Busy Queue",
    packed: "Packed / Long Queue",
    out_of_fuel: "Out of Fuel",
    
    // Stations list labels
    stations: "Gas Stations",
    selectStation: "Please select a gas station first",
    stationStatus: "Station Status",
    activeQueue: "Active Vehicles in Queue",
    currentServing: "Currently Serving",
    lastIssued: "Last Token Issued",
    bookToken: "Book Virtual Spot",
    
    // Vehicle types
    vehicleType: "Vehicle Type",
    plateNumber: "Plate Number",
    phoneNumber: "Phone Number (for SMS notifications)",
    bajaj: "Bajaj",
    motorbike: "Motorbike / Motor",
    car: "Private Car",
    minibus: "Minibus (Taxi/Damas/Lada)",
    truck: "Truck / Bus",
    
    // Station controls
    allowedVehicleLabel: "Allowed Vehicle Type Today",
    allowedVehicleAll: "All Vehicles Allowed",
    allowedVehicleOnly: "Serving {vehicle} Only",
    allowedVehicleShort: "Allowed: {vehicle}",
    
    // Form buttons
    submitBooking: "Get Token (Book Spot)",
    bookingInProgress: "Booking spot...",
    
    // Queue details for active token
    yourToken: "Your Token Number",
    registrationSuccess: "Your spot has been successfully booked!",
    waitEstimation: "Estimated Waiting Time",
    minutes: "minutes",
    aheadOfYou: "Vehicles ahead of you",
    headToStation: "Your turn is close! Please start driving to the station.",
    smsAlertSim: "Simulated SMS Received",
    cancelToken: "Cancel Token",
    tokenCanceled: "Your token has been canceled",
    doneFueling: "You have finished fueling. Thank you!",
    
    // Attendant controls
    attendantTitle: "Station Attendant Dashboard",
    manageStation: "Select Gas Station to Manage",
    nextVehicle: "Next Vehicle (Call)",
    noVehicles: "No vehicles waiting in the queue",
    updateFuelStatus: "Update Fuel Status",
    fuelAvailable: "Fuel Available",
    fuelOut: "No Fuel / Out of Fuel",
    allTokens: "Active Queue Registrations",
    serving: "Serving",
    waiting: "Waiting",
    completed: "Completed",
    canceled: "Canceled",
    actionCall: "Call",
    actionComplete: "Complete",
    actionCancel: "Cancel",
    passcodeLabel: "Enter Username and Password",
    passcodePlaceholder: "e.g., attendant_central",
    loginBtn: "Login (Secure)",
    logoutBtn: "Logout (Sign Out)",
    incorrectPasscode: "Incorrect username or password!",
    
    // Password Change & Security Upgrades
    usernameLabel: "Username",
    passwordLabel: "Password",
    oldPasswordLabel: "Old Password",
    newPasswordLabel: "New Password",
    confirmPasswordLabel: "Confirm Password",
    changePasswordTitle: "Change Password (3-Step Verification)",
    changePasswordBtn: "Update Password",
    strengthRule: "Password must be at least 8 characters long, contain at least one letter and one number.",
    nonSharedRule: "Security Rule: Your password must be unique and cannot be shared with any other attendant.",
    privateAlertsTitle: "Your Private Queue & Alerts (Targeted Driver Isolation)",
    privateAccessOnly: "This section displays secure alerts and notifications scoped strictly to your vehicle token. Drivers cannot intercept or view other drivers' queues.",

    // SMS Notifications Simulation
    smsNotificationTitle: "SMS Notifications Log (Real-time)",
    fuelInventoryInput: "Total Available Fuel (Liters)",
    requestedLitersInput: "Requested Fuel Amount (Liters)",
    remainingFuel: "Remaining Liquid Fuel",
    allocatedFuel: "Allocated (Reserved) Fuel",
    fuelDepletionProgress: "Fuel Depletion Level",
    lowFuelWarning: "WARNING: Fuel might run out before your turn based on demand ahead of you.",
    litersShort: "Liters",
    updateInventoryBtn: "Update Fuel Inventory",
    fuelInventoryStatus: "Station Fuel Inventory Status",
    noSmsSent: "No SMS alerts sent yet. When you book a token or your turn gets closer, simulated alerts will appear here.",
    smsTemplateWelcome: "Dear Driver, Plate {plate} successfully booked Token #{number} at {station}. Estimated wait: {eta} min.",
    smsTemplateAlert: "Only {count} vehicles left before your turn! Please drive immediately to {station} station.",
    smsTemplateCompleted: "Token #{number} completed. Thank you for using Hawassa Fuel Queue!",
    
    // Edge case tabs
    edgeCasesTitle: "Edge-Case Handling Strategies",
    networkDrops: "Network Drops on the Road",
    networkDropsDesc: "If a driver loses internet connection on the road, their token remains securely saved on the server. They will still receive SMS alerts via cellular network, or can check status offline using local cache.",
    lateArrivals: "Late Arrivals after Expiry",
    lateArrivalsDesc: "If a driver arrives after their number was called but within 15 minutes, the attendant can manually slip them back in after 3 vehicles. If they are more than 15 minutes late, the system automatically cancels the token to prevent queue stalling.",
    cheatPrevention: "Plate Cheating & Double Booking",
    cheatPreventionDesc: "A single plate number is strictly restricted to one active token at a station at any time. Attendants physically match the booked plate number with the vehicle before dispensing fuel to prevent cheating.",
    
    // Architecture Flow
    architectureTitle: "System Architecture & Data Flow",
    clientTier: "Client Tier (Frontend)",
    clientTierDesc: "Lightweight, mobile-optimized React + Tailwind interface built for Hawassa Lada/Bajaj drivers on low-bandwidth networks.",
    serverTier: "Server Tier (Backend)",
    serverTierDesc: "Express (Node.js) server running the booking logic, active queue state machine, and real-time Server-Sent Events (SSE).",
    persistenceTier: "Persistence Tier (Database)",
    persistenceTierDesc: "An in-memory storage manager representing relational-like collections of Stations and Tokens with high write performance."
  }
};
