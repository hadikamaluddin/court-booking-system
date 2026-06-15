const STORAGE_KEYS = {
  users: "cbs_users",
  courtTypes: "cbs_court_types",
  courts: "cbs_courts",
  bookings: "cbs_bookings",
  currentUser: "cbs_current_user"
};

const PRICE_PER_HOUR = 10;
const CLERK_KEY_PLACEHOLDER = "PASTE_YOUR_CLERK_PUBLISHABLE_KEY_HERE";

const mockCourtTypes = [
  { courtTypeId: "CT001", typeName: "Badminton", courtCount: 2 },
  { courtTypeId: "CT002", typeName: "Futsal", courtCount: 2 },
  { courtTypeId: "CT003", typeName: "Tennis", courtCount: 2 },
  { courtTypeId: "CT004", typeName: "Netball", courtCount: 2 },
  { courtTypeId: "CT005", typeName: "Basketball", courtCount: 0 },
  { courtTypeId: "CT006", typeName: "Volleyball", courtCount: 0 },
  { courtTypeId: "CT007", typeName: "Squash", courtCount: 0 },
  { courtTypeId: "CT008", typeName: "Sepak Takraw", courtCount: 0 },
  { courtTypeId: "CT009", typeName: "Table Tennis", courtCount: 0 },
  { courtTypeId: "CT010", typeName: "Handball", courtCount: 0 }
];

const mockCourts = [
  { courtId: "CBM001", courtName: "Badminton Court 1 Male", courtTypeId: "CT001", typeName: "Badminton", location: "Male Sports Complex", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "CBM002", courtName: "Badminton Court 2 Male", courtTypeId: "CT001", typeName: "Badminton", location: "Male Sports Complex", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "CBF001", courtName: "Badminton Court 1 Female", courtTypeId: "CT001", typeName: "Badminton", location: "Female Sports Complex", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "CBF002", courtName: "Badminton Court 2 Female", courtTypeId: "CT001", typeName: "Badminton", location: "Female Sports Complex", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "CFM001", courtName: "Futsal Court 1 Male", courtTypeId: "CT002", typeName: "Futsal", location: "Male Sports Complex", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "CFM002", courtName: "Futsal Court 2 Male", courtTypeId: "CT002", typeName: "Futsal", location: "Male Sports Complex", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "CTF001", courtName: "Tennis Court 1 Female", courtTypeId: "CT003", typeName: "Tennis", location: "Female Sports Complex", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "CTF002", courtName: "Tennis Court 2 Female", courtTypeId: "CT003", typeName: "Tennis", location: "Female Sports Complex", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "CNF001", courtName: "Netball Court 1 Female", courtTypeId: "CT004", typeName: "Netball", location: "Female Sports Complex", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "CNF002", courtName: "Netball Court 2 Female", courtTypeId: "CT004", typeName: "Netball", location: "Female Sports Complex", courtStatus: "Available", pricePerHour: 10 }
];

const mockUsers = [
  { userId: "U001", fullName: "Sample Student", email: "student@iium.edu.my", phoneNo: "0123456789", password: "student123" }
];

const mockBookings = [
  {
    bookingId: "B001",
    userId: "U001",
    fullName: "Sample Student",
    courtId: "CBM001",
    courtName: "Badminton Court 1 Male",
    bookingDate: "2026-01-05",
    startTime: "08:00",
    endTime: "10:00",
    duration: 2,
    amount: 20,
    paymentStatus: "Paid",
    bookingStatus: "Confirmed"
  }
];

let courtTypeCache = [...mockCourtTypes];
let courtCache = [...mockCourts];

function getClerkConfig() {
  return window.CLERK_CONFIG || {};
}

function getApiBaseUrl() {
  return (getClerkConfig().apiBaseUrl || "http://localhost:5000/api").replace(/\/$/, "");
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Database request failed.");
  }
  return data;
}

function getData(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function seedData() {
  if (!localStorage.getItem(STORAGE_KEYS.courtTypes)) saveData(STORAGE_KEYS.courtTypes, mockCourtTypes);
  if (!localStorage.getItem(STORAGE_KEYS.courts)) saveData(STORAGE_KEYS.courts, mockCourts);
  if (!localStorage.getItem(STORAGE_KEYS.users)) saveData(STORAGE_KEYS.users, mockUsers);
  if (!localStorage.getItem(STORAGE_KEYS.bookings)) saveData(STORAGE_KEYS.bookings, mockBookings);
  if (!localStorage.getItem(STORAGE_KEYS.currentUser)) {
    setCurrentUser({ userId: "U001", role: "student", source: "mock" });
  }
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || '{"userId":"U001","role":"student","source":"mock"}');
}

function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

function getCourtTypeName(typeId) {
  const type = courtTypeCache.find((item) => item.courtTypeId === typeId) ||
    getData(STORAGE_KEYS.courtTypes).find((item) => item.courtTypeId === typeId);
  return type ? type.typeName : "Unknown";
}

function getCourtName(courtId) {
  const court = courtCache.find((item) => item.courtId === courtId) ||
    getData(STORAGE_KEYS.courts).find((item) => item.courtId === courtId);
  return court ? court.courtName : "Deleted Court";
}

function getUserName(userId) {
  const user = getData(STORAGE_KEYS.users).find((item) => item.userId === userId);
  return user ? `${user.fullName} (${user.userId})` : userId;
}

function nextId(prefix, list, fieldName) {
  const numbers = list.map((item) => Number(String(item[fieldName]).replace(prefix, ""))).filter(Boolean);
  const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

function addHours(time, hours) {
  const [hour, minute] = time.split(":").map(Number);
  const endHour = hour + Number(hours);
  return `${String(endHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function showMessage(elementId, message, type = "success") {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}

function badge(text) {
  const className = String(text).toLowerCase();
  return `<span class="status ${className}">${text}</span>`;
}

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("navLinks");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const pageName = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.getAttribute("href") === pageName) link.classList.add("active");
  });
}

function hasClerkPublishableKey() {
  const key = getClerkConfig().publishableKey || "";
  return key && key !== CLERK_KEY_PLACEHOLDER && key.startsWith("pk_");
}

function getSafeRedirect(fallback) {
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (!redirect) return fallback;
  if (redirect.startsWith("http") || redirect.startsWith("//") || redirect.includes("\\")) return fallback;
  return redirect;
}

function decodeBase64Url(value) {
  let normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";
  return atob(normalized);
}

function getClerkFrontendApi(publishableKey) {
  const parts = publishableKey.split("_");
  const encodedFrontendApi = parts.slice(2).join("_");
  return decodeBase64Url(encodedFrontendApi).replace(/\$$/, "");
}

function loadScriptOnce(id, src, configureScript) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    if (configureScript) configureScript(script);
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error(`Could not load ${src}`)));
    document.head.appendChild(script);
  });
}

function getClerkAppearance() {
  return {
    variables: {
      colorPrimary: "#1f7a4d",
      borderRadius: "8px",
      fontFamily: "Arial, Helvetica, sans-serif"
    }
  };
}

function renderClerkSetupMessage(message) {
  const setupMessage = document.getElementById("clerkSetupMessage");
  const signInMount = document.getElementById("clerkSignIn");
  const signUpMount = document.getElementById("clerkSignUp");

  if (setupMessage) showMessage("clerkSetupMessage", message, "error");

  const fallbackHtml = `
    <div class="clerk-setup">
      <strong>Clerk is not connected yet.</strong>
      <p>Open <code>js/clerk-config.js</code> and replace the placeholder with your Clerk Publishable Key. Then enable Email address and Password in Clerk.</p>
    </div>
  `;

  if (signInMount) signInMount.innerHTML = fallbackHtml;
  if (signUpMount) signUpMount.innerHTML = fallbackHtml;
}

function getPrimaryEmail(clerkUser) {
  return clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "";
}

function getDisplayName(clerkUser) {
  const fullName = clerkUser.fullName || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");
  const email = getPrimaryEmail(clerkUser);
  return fullName || email.split("@")[0] || "Student User";
}

function syncClerkUserToLocalStorage(clerkUser) {
  if (!clerkUser) return null;

  const users = getData(STORAGE_KEYS.users);
  const email = getPrimaryEmail(clerkUser);
  const emailLower = email.toLowerCase();
  let localUser = users.find((user) => user.clerkUserId === clerkUser.id);

  if (!localUser && email) {
    localUser = users.find((user) => user.email.toLowerCase() === emailLower);
  }

  if (!localUser) {
    localUser = {
      userId: nextId("U", users, "userId"),
      clerkUserId: clerkUser.id,
      fullName: getDisplayName(clerkUser),
      email,
      phoneNo: clerkUser.primaryPhoneNumber?.phoneNumber || "0000000000",
      password: "Managed by Clerk"
    };
    users.push(localUser);
  } else {
    localUser.clerkUserId = clerkUser.id;
    localUser.fullName = getDisplayName(clerkUser);
    localUser.email = email || localUser.email;
    localUser.phoneNo = clerkUser.primaryPhoneNumber?.phoneNumber || localUser.phoneNo || "0000000000";
  }

  saveData(STORAGE_KEYS.users, users);

  const adminEmails = (getClerkConfig().adminEmails || []).map((adminEmail) => adminEmail.toLowerCase());
  const role = adminEmails.includes(emailLower) ? "admin" : "student";

  setCurrentUser({
    userId: localUser.userId,
    role,
    source: "clerk",
    clerkUserId: clerkUser.id,
    email,
    fullName: localUser.fullName,
    phoneNo: localUser.phoneNo
  });

  syncCurrentUserWithBackend();
  return localUser;
}

async function syncCurrentUserWithBackend() {
  const currentUser = getCurrentUser();
  if (currentUser.source !== "clerk" || !currentUser.email) return currentUser;

  try {
    const data = await apiRequest("/users/sync", {
      method: "POST",
      body: JSON.stringify({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phoneNo: currentUser.phoneNo || "0000000000"
      })
    });

    const syncedUser = {
      ...currentUser,
      userId: data.user.userId,
      fullName: data.user.fullName,
      email: data.user.email,
      phoneNo: data.user.phoneNo,
      source: "clerk"
    };
    setCurrentUser(syncedUser);
    return syncedUser;
  } catch (error) {
    console.warn(error);
    return currentUser;
  }
}

function clearClerkSessionIfNeeded() {
  const currentUser = getCurrentUser();
  if (currentUser.source === "clerk") {
    setCurrentUser({ userId: "U001", role: "student", source: "mock" });
  }
}

async function initClerkAuth() {
  if (!hasClerkPublishableKey()) {
    renderClerkSetupMessage("Add your Clerk Publishable Key in js/clerk-config.js before using Clerk login.");
    return null;
  }

  try {
    const config = getClerkConfig();
    const frontendApi = getClerkFrontendApi(config.publishableKey);

    await loadScriptOnce("clerk-ui-js", `https://${frontendApi}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadScriptOnce("clerk-js", `https://${frontendApi}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, (script) => {
      script.setAttribute("data-clerk-publishable-key", config.publishableKey);
    });

    await window.Clerk.load({
      appearance: getClerkAppearance(),
      ui: {
        ClerkUI: window.__internal_ClerkUICtor
      }
    });

    if (window.Clerk.user) {
      syncClerkUserToLocalStorage(window.Clerk.user);
      await syncCurrentUserWithBackend();
    } else {
      clearClerkSessionIfNeeded();
    }

    if (typeof window.Clerk.addListener === "function") {
      window.Clerk.addListener(({ user }) => {
        if (user) syncClerkUserToLocalStorage(user);
        else clearClerkSessionIfNeeded();
        updateAuthNavigation(window.Clerk);
      });
    }

    updateAuthNavigation(window.Clerk);
    return window.Clerk;
  } catch (error) {
    console.error(error);
    renderClerkSetupMessage("Clerk could not load. Check your publishable key, allowed domains, and internet connection.");
    return null;
  }
}

function updateAuthNavigation(clerk) {
  if (!clerk || !clerk.isSignedIn) return;
  const loginLink = document.querySelector('.nav-links a[href="login.html"]');
  if (!loginLink) return;

  const userButtonSlot = document.createElement("div");
  userButtonSlot.className = "nav-user-button";
  userButtonSlot.id = "navUserButton";
  loginLink.replaceWith(userButtonSlot);
  clerk.mountUserButton(userButtonSlot, {
    afterSignOutUrl: "index.html"
  });
}

function requireSignedInForPage(page, clerk) {
  const protectedPages = ["booking", "my-bookings"];
  if (!protectedPages.includes(page)) return false;
  if (!hasClerkPublishableKey()) return false;
  if (clerk && clerk.isSignedIn) return false;

  const currentPage = `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search}`;
  window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
  return true;
}

function mountClerkSignIn(clerk) {
  const signInMount = document.getElementById("clerkSignIn");
  if (!signInMount || !clerk) return;

  if (clerk.isSignedIn) {
    const currentUser = getCurrentUser();
    signInMount.innerHTML = `
      <div class="clerk-setup">
        <strong>You are signed in as ${currentUser.fullName || currentUser.email || currentUser.userId}.</strong>
        <p>You can continue to the court list or open your bookings.</p>
        <div class="button-row">
          <a href="courts.html" class="btn btn-primary">View Courts</a>
          <a href="my-bookings.html" class="btn btn-secondary">My Bookings</a>
        </div>
      </div>
    `;
    return;
  }

  const config = getClerkConfig();
  clerk.mountSignIn(signInMount, {
    appearance: getClerkAppearance(),
    routing: "hash",
    signUpUrl: config.signUpUrl || "register.html",
    fallbackRedirectUrl: getSafeRedirect(config.afterSignInUrl || "courts.html"),
    forceRedirectUrl: getSafeRedirect(config.afterSignInUrl || "courts.html")
  });
}

function mountClerkSignUp(clerk) {
  const signUpMount = document.getElementById("clerkSignUp");
  if (!signUpMount || !clerk) return;

  if (clerk.isSignedIn) {
    const currentUser = getCurrentUser();
    signUpMount.innerHTML = `
      <div class="clerk-setup">
        <strong>You are already signed in as ${currentUser.fullName || currentUser.email || currentUser.userId}.</strong>
        <p>You can continue to booking courts.</p>
        <a href="courts.html" class="btn btn-primary">View Courts</a>
      </div>
    `;
    return;
  }

  const config = getClerkConfig();
  clerk.mountSignUp(signUpMount, {
    appearance: getClerkAppearance(),
    routing: "hash",
    signInUrl: config.signInUrl || "login.html",
    fallbackRedirectUrl: config.afterSignUpUrl || "courts.html",
    forceRedirectUrl: config.afterSignUpUrl || "courts.html"
  });
}

async function loadCourtTypes() {
  try {
    const data = await apiRequest("/court-types");
    courtTypeCache = data.courtTypes;
    saveData(STORAGE_KEYS.courtTypes, data.courtTypes);
    return data.courtTypes;
  } catch (error) {
    console.warn(error);
    courtTypeCache = getData(STORAGE_KEYS.courtTypes);
    return courtTypeCache;
  }
}

async function loadCourts(options = {}) {
  const query = new URLSearchParams();
  if (options.typeId) query.set("type_id", options.typeId);
  if (options.available) query.set("available", "1");

  try {
    const data = await apiRequest(`/courts${query.toString() ? `?${query}` : ""}`);
    courtCache = data.courts;
    if (!options.typeId && !options.available) saveData(STORAGE_KEYS.courts, data.courts);
    return data.courts;
  } catch (error) {
    console.warn(error);
    const localCourts = getData(STORAGE_KEYS.courts);
    return localCourts.filter((court) => {
      if (options.typeId && court.courtTypeId !== options.typeId) return false;
      if (options.available && court.courtStatus !== "Available") return false;
      return true;
    });
  }
}

async function initHomePage() {
  const target = document.getElementById("homeCourtTypes");
  if (!target) return;
  const courtTypes = await loadCourtTypes();

  target.innerHTML = courtTypes.map((type) => {
    const count = type.courtCount ?? getData(STORAGE_KEYS.courts).filter((court) => court.courtTypeId === type.courtTypeId).length;
    const label = count ? `${count} court${count > 1 ? "s" : ""} listed` : "No court yet";
    return `<a class="type-chip" href="courts.html?type=${type.courtTypeId}">${type.typeName}<span>${label}</span></a>`;
  }).join("");
}

function initLoginPage(clerk) {
  mountClerkSignIn(clerk);

  const adminForm = document.getElementById("adminLoginForm");
  if (!adminForm) return;

  adminForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = document.getElementById("adminPassword").value;
    if (password !== "admin123") {
      showMessage("adminLoginMessage", "Admin password is incorrect.", "error");
      return;
    }

    setCurrentUser({ userId: "ADMIN", role: "admin", source: "admin-demo" });
    showMessage("adminLoginMessage", "Admin login successful. Redirecting to dashboard...");
    setTimeout(() => window.location.href = "admin-dashboard.html", 700);
  });
}

function initRegisterPage(clerk) {
  mountClerkSignUp(clerk);
}

async function initCourtsPage() {
  const filters = document.getElementById("courtTypeFilters");
  const cards = document.getElementById("courtCards");
  if (!filters || !cards) return;

  const courtTypes = await loadCourtTypes();
  const urlType = new URLSearchParams(window.location.search).get("type");
  let selectedType = urlType || (courtTypes[0] && courtTypes[0].courtTypeId) || "CT001";

  function renderFilters() {
    filters.innerHTML = courtTypes.map((type) => {
      return `<button type="button" class="${type.courtTypeId === selectedType ? "active" : ""}" data-type="${type.courtTypeId}">${type.typeName}</button>`;
    }).join("");
  }

  async function renderCourts() {
    const courts = await loadCourts({ typeId: selectedType });
    const empty = document.getElementById("noCourtsMessage");
    empty.classList.toggle("hidden", courts.length > 0);
    cards.innerHTML = courts.map((court) => {
      const disabled = court.courtStatus !== "Available";
      return `
        <article class="court-card">
          <div>
            <h2>${court.courtName}</h2>
            <span class="status ${court.courtStatus.toLowerCase()}">${court.courtStatus}</span>
          </div>
          <div class="court-meta">
            <span>Type: ${court.typeName || getCourtTypeName(court.courtTypeId)}</span>
            <span>Location: ${court.location}</span>
            <span>Price: RM${court.pricePerHour} per hour</span>
          </div>
          <a class="btn ${disabled ? "btn-secondary" : "btn-primary"}" href="${disabled ? "#" : `booking.html?courtId=${court.courtId}`}" aria-disabled="${disabled}">${disabled ? "Not Available" : "Book Court"}</a>
        </article>
      `;
    }).join("");
  }

  filters.addEventListener("click", async (event) => {
    if (!event.target.matches("button")) return;
    selectedType = event.target.dataset.type;
    renderFilters();
    await renderCourts();
  });

  renderFilters();
  await renderCourts();
}

async function initBookingPage() {
  const form = document.getElementById("bookingForm");
  const courtSelect = document.getElementById("courtSelect");
  const duration = document.getElementById("duration");
  const totalPrice = document.getElementById("totalPrice");
  if (!form || !courtSelect || !duration || !totalPrice) return;

  const currentUser = await syncCurrentUserWithBackend();
  document.getElementById("bookingUserLabel").textContent = currentUser.fullName || currentUser.email || currentUser.userId;
  const availableCourts = await loadCourts({ available: true });
  const selectedCourtId = new URLSearchParams(window.location.search).get("courtId");

  courtSelect.innerHTML = `<option value="">Choose court</option>` + availableCourts.map((court) => {
    return `<option value="${court.courtId}">${court.courtName} - ${court.typeName || getCourtTypeName(court.courtTypeId)}</option>`;
  }).join("");
  if (selectedCourtId) courtSelect.value = selectedCourtId;

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("bookingDate").setAttribute("min", today);

  function updatePrice() {
    totalPrice.textContent = `RM${Number(duration.value) * PRICE_PER_HOUR}`;
  }

  duration.addEventListener("change", updatePrice);
  updatePrice();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const syncedUser = await syncCurrentUserWithBackend();
      const data = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
          user: syncedUser,
          courtId: courtSelect.value,
          bookingDate: document.getElementById("bookingDate").value,
          startTime: document.getElementById("startTime").value,
          duration: Number(duration.value),
          paymentStatus: "Unpaid",
          paymentMethod: document.getElementById("paymentMethod").value
        })
      });

      if (data.user) setCurrentUser({ ...syncedUser, ...data.user, source: syncedUser.source || "clerk" });
      form.reset();
      updatePrice();
      showMessage("bookingMessage", `Thanks for booking with us. Your booking ID is ${data.booking.bookingId}.`);
    } catch (error) {
      showMessage("bookingMessage", error.message, "error");
    }
  });
}

async function initMyBookingsPage() {
  const table = document.getElementById("myBookingsTable");
  if (!table) return;
  const message = document.getElementById("noBookingsMessage");
  const currentUser = await syncCurrentUserWithBackend();

  async function render() {
    try {
      const data = await apiRequest(`/bookings?user_id=${encodeURIComponent(getCurrentUser().userId)}`);
      const bookings = data.bookings;
      message.classList.toggle("hidden", bookings.length > 0);
      table.innerHTML = bookings.map((booking) => {
        const isCancelled = booking.bookingStatus === "Cancelled";
        const isPaid = booking.paymentStatus === "Paid";
        const isPaymentClosed = ["Paid", "Refunded", "Cancelled"].includes(booking.paymentStatus);
        const isClosed = ["Cancelled", "Completed"].includes(booking.bookingStatus);
        const canCancel = !isClosed && !isPaymentClosed;
        const totalAmount = isCancelled || ["Cancelled", "Refunded"].includes(booking.paymentStatus) ? 0 : booking.amount;
        const actionText = isCancelled || booking.paymentStatus === "Cancelled" ? "Cancelled" : isPaid ? "Paid" : booking.paymentStatus === "Refunded" ? "Refunded" : "Cancel";
        const actionButton = isCancelled
          ? `<button class="btn btn-danger btn-small" data-delete-booking="${booking.bookingId}">Delete</button>`
          : `<button class="btn btn-danger btn-small" data-cancel="${canCancel ? booking.bookingId : ""}" ${canCancel ? "" : "disabled"}>${actionText}</button>`;

        return `
          <tr>
            <td>${booking.bookingId}</td>
            <td>${booking.courtName}</td>
            <td>${booking.bookingDate}</td>
            <td>${booking.startTime} - ${booking.endTime}</td>
            <td>${booking.duration} hour${booking.duration > 1 ? "s" : ""}</td>
            <td>RM${totalAmount}</td>
            <td>${booking.paymentMethod || "Pending"}</td>
            <td>${badge(booking.paymentStatus)}</td>
            <td>${badge(booking.bookingStatus)}</td>
            <td>${actionButton}</td>
          </tr>
        `;
      }).join("");
    } catch (error) {
      message.classList.remove("hidden");
      message.innerHTML = `<h2>Database is not connected</h2><p>${error.message}</p>`;
      table.innerHTML = "";
    }
  }

  document.querySelector(".page-heading .muted").textContent = `Showing bookings for ${currentUser.fullName || currentUser.email || currentUser.userId}.`;

  table.addEventListener("click", async (event) => {
    const cancelId = event.target.dataset.cancel;
    const deleteId = event.target.dataset.deleteBooking;
    if (!cancelId && !deleteId) return;

    try {
      if (cancelId) {
        if (!confirm(`Cancel booking ${cancelId}?`)) return;
        await apiRequest(`/bookings/${cancelId}/cancel`, { method: "PATCH" });
        showMessage("myBookingsMessage", `Booking ${cancelId} has been cancelled in Oracle.`);
      }

      if (deleteId) {
        if (!confirm(`Delete cancelled booking ${deleteId}? This will remove it from Oracle.`)) return;
        await apiRequest(`/bookings/${deleteId}`, { method: "DELETE" });
        showMessage("myBookingsMessage", `Cancelled booking ${deleteId} has been deleted from Oracle.`);
      }

      await render();
    } catch (error) {
      showMessage("myBookingsMessage", error.message, "error");
    }
  });

  await render();
}

async function initAdminDashboardPage() {
  const summary = document.getElementById("adminSummary");
  const recentTable = document.getElementById("recentBookingsTable");
  if (!summary || !recentTable) return;

  try {
    const data = await apiRequest("/admin/summary");
    const cards = [
      { label: "Total Courts", value: data.summary.totalCourts },
      { label: "Total Bookings", value: data.summary.totalBookings },
      { label: "Pending Payments", value: data.summary.pendingPayments },
      { label: "Cancelled Bookings", value: data.summary.cancelledBookings }
    ];

    summary.innerHTML = cards.map((card) => `<div class="summary-card"><span>${card.label}</span><strong>${card.value}</strong></div>`).join("");
    recentTable.innerHTML = data.recentBookings.map((booking) => `
      <tr>
        <td>${booking.bookingId}</td>
        <td>${booking.fullName} (${booking.userId})</td>
        <td>${booking.courtName}</td>
        <td>${booking.bookingDate}</td>
        <td>${badge(booking.bookingStatus)}</td>
        <td>${badge(booking.paymentStatus)}</td>
      </tr>
    `).join("");
  } catch (error) {
    summary.innerHTML = `<div class="summary-card"><span>Database Error</span><strong>!</strong><p class="muted">${error.message}</p></div>`;
    recentTable.innerHTML = "";
  }
}

async function initManageCourtsPage() {
  const form = document.getElementById("courtForm");
  const table = document.getElementById("manageCourtsTable");
  const typeSelect = document.getElementById("courtTypeId");
  if (!form || !table || !typeSelect) return;

  const courtTypes = await loadCourtTypes();
  typeSelect.innerHTML = courtTypes.map((type) => {
    return `<option value="${type.courtTypeId}">${type.typeName}</option>`;
  }).join("");

  function resetForm() {
    form.reset();
    document.getElementById("courtId").value = "";
    document.getElementById("pricePerHour").value = PRICE_PER_HOUR;
    document.getElementById("courtFormTitle").textContent = "Add Court";
  }

  async function render() {
    try {
      const courts = await loadCourts();
      table.innerHTML = courts.map((court) => `
        <tr>
          <td>${court.courtId}</td>
          <td>${court.courtName}</td>
          <td>${court.typeName || getCourtTypeName(court.courtTypeId)}</td>
          <td>${court.location}</td>
          <td>${badge(court.courtStatus)}</td>
          <td>RM${court.pricePerHour}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-secondary btn-small" data-edit="${court.courtId}">Edit</button>
              <button class="btn btn-danger btn-small" data-delete="${court.courtId}">Delete</button>
            </div>
          </td>
        </tr>
      `).join("");
    } catch (error) {
      showMessage("courtMessage", error.message, "error");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const existingId = document.getElementById("courtId").value;
    const courtData = {
      courtName: document.getElementById("courtName").value.trim(),
      courtTypeId: document.getElementById("courtTypeId").value,
      location: document.getElementById("courtLocation").value.trim(),
      courtStatus: document.getElementById("courtStatus").value,
      pricePerHour: Number(document.getElementById("pricePerHour").value)
    };

    try {
      await apiRequest(existingId ? `/courts/${existingId}` : "/courts", {
        method: existingId ? "PUT" : "POST",
        body: JSON.stringify(courtData)
      });
      showMessage("courtMessage", existingId ? "Court updated in Oracle." : "Court added to Oracle.");
      resetForm();
      await render();
    } catch (error) {
      showMessage("courtMessage", error.message, "error");
    }
  });

  table.addEventListener("click", async (event) => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;
    const courts = await loadCourts();

    if (editId) {
      const court = courts.find((item) => item.courtId === editId);
      document.getElementById("courtId").value = court.courtId;
      document.getElementById("courtName").value = court.courtName;
      document.getElementById("courtTypeId").value = court.courtTypeId;
      document.getElementById("courtLocation").value = court.location;
      document.getElementById("courtStatus").value = court.courtStatus;
      document.getElementById("pricePerHour").value = court.pricePerHour;
      document.getElementById("courtFormTitle").textContent = `Edit ${court.courtId}`;
    }

    if (deleteId) {
      if (!confirm(`Delete court ${deleteId}?`)) return;
      try {
        await apiRequest(`/courts/${deleteId}`, { method: "DELETE" });
        showMessage("courtMessage", `Court ${deleteId} has been deleted from Oracle.`);
        await render();
      } catch (error) {
        showMessage("courtMessage", error.message, "error");
      }
    }
  });

  document.getElementById("resetCourtForm").addEventListener("click", resetForm);
  resetForm();
  await render();
}

async function initManageBookingsPage() {
  const table = document.getElementById("manageBookingsTable");
  if (!table) return;

  async function render() {
    try {
      const data = await apiRequest("/bookings");
      table.innerHTML = data.bookings.map((booking) => `
        <tr>
          <td>${booking.bookingId}</td>
          <td>${booking.fullName} (${booking.userId})</td>
          <td>${booking.courtName}</td>
          <td>${booking.bookingDate}</td>
          <td>${booking.startTime} - ${booking.endTime}</td>
          <td>RM${booking.amount}</td>
          <td>
            <select data-payment-method="${booking.bookingId}">
              <option value="Cash" ${booking.paymentMethod === "Cash" ? "selected" : ""}>Cash</option>
              <option value="Online Banking" ${booking.paymentMethod === "Online Banking" ? "selected" : ""}>Online Banking</option>
              <option value="QR Pay" ${booking.paymentMethod === "QR Pay" ? "selected" : ""}>QR Pay</option>
              <option value="Pending" ${booking.paymentMethod === "Pending" ? "selected" : ""}>Pending</option>
            </select>
          </td>
          <td>
            <select data-booking-status="${booking.bookingId}">
              <option value="Pending" ${booking.bookingStatus === "Pending" ? "selected" : ""}>Pending</option>
              <option value="Confirmed" ${booking.bookingStatus === "Confirmed" ? "selected" : ""}>Confirmed</option>
              <option value="Cancelled" ${booking.bookingStatus === "Cancelled" ? "selected" : ""}>Cancelled</option>
              <option value="Completed" ${booking.bookingStatus === "Completed" ? "selected" : ""}>Completed</option>
            </select>
          </td>
          <td>
            <select data-payment-status="${booking.bookingId}">
              <option value="Unpaid" ${booking.paymentStatus === "Unpaid" ? "selected" : ""}>Unpaid</option>
              <option value="Paid" ${booking.paymentStatus === "Paid" ? "selected" : ""}>Paid</option>
              <option value="Cancelled" ${booking.paymentStatus === "Cancelled" ? "selected" : ""}>Cancelled</option>
              <option value="Refunded" ${booking.paymentStatus === "Refunded" ? "selected" : ""}>Refunded</option>
            </select>
          </td>
        </tr>
      `).join("");
    } catch (error) {
      showMessage("manageBookingsMessage", error.message, "error");
      table.innerHTML = "";
    }
  }

  table.addEventListener("change", async (event) => {
    const bookingStatusId = event.target.dataset.bookingStatus;
    const paymentStatusId = event.target.dataset.paymentStatus;
    const paymentMethodId = event.target.dataset.paymentMethod;

    try {
      if (bookingStatusId) {
        await apiRequest(`/bookings/${bookingStatusId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ bookingStatus: event.target.value })
        });
      }
      if (paymentStatusId) {
        await apiRequest(`/bookings/${paymentStatusId}/payment`, {
          method: "PATCH",
          body: JSON.stringify({ paymentStatus: event.target.value })
        });
      }
      if (paymentMethodId) {
        await apiRequest(`/bookings/${paymentMethodId}/payment`, {
          method: "PATCH",
          body: JSON.stringify({ paymentMethod: event.target.value })
        });
      }
      showMessage("manageBookingsMessage", "Oracle booking record updated successfully.");
      await render();
    } catch (error) {
      showMessage("manageBookingsMessage", error.message, "error");
    }
  });

  await render();
}

document.addEventListener("DOMContentLoaded", async () => {
  seedData();
  setupNavigation();

  const clerk = await initClerkAuth();
  const page = document.body.dataset.page;
  if (requireSignedInForPage(page, clerk)) return;

  if (page === "home") await initHomePage();
  if (page === "login") initLoginPage(clerk);
  if (page === "register") initRegisterPage(clerk);
  if (page === "courts") await initCourtsPage();
  if (page === "booking") await initBookingPage();
  if (page === "my-bookings") await initMyBookingsPage();
  if (page === "admin-dashboard") await initAdminDashboardPage();
  if (page === "manage-courts") await initManageCourtsPage();
  if (page === "manage-bookings") await initManageBookingsPage();
});
