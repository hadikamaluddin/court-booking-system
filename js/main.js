const STORAGE_KEYS = {
  users: "cbs_users",
  courtTypes: "cbs_court_types",
  courts: "cbs_courts",
  bookings: "cbs_bookings",
  currentUser: "cbs_current_user"
};

const PRICE_PER_HOUR = 10;

const mockCourtTypes = [
  { courtTypeId: "CT001", typeName: "Badminton" },
  { courtTypeId: "CT002", typeName: "Futsal" },
  { courtTypeId: "CT003", typeName: "Tennis" },
  { courtTypeId: "CT004", typeName: "Netball" },
  { courtTypeId: "CT005", typeName: "Basketball" },
  { courtTypeId: "CT006", typeName: "Volleyball" },
  { courtTypeId: "CT007", typeName: "Squash" },
  { courtTypeId: "CT008", typeName: "Sepak Takraw" },
  { courtTypeId: "CT009", typeName: "Table Tennis" },
  { courtTypeId: "CT010", typeName: "Handball" }
];

const mockCourts = [
  { courtId: "C001", courtName: "Badminton Court A", courtTypeId: "CT001", location: "Sports Complex Hall 1", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "C002", courtName: "Badminton Court B", courtTypeId: "CT001", location: "Sports Complex Hall 1", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "C003", courtName: "Futsal Court A", courtTypeId: "CT002", location: "Outdoor Court Zone", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "C004", courtName: "Futsal Court B", courtTypeId: "CT002", location: "Outdoor Court Zone", courtStatus: "Unavailable", pricePerHour: 10 },
  { courtId: "C005", courtName: "Tennis Court A", courtTypeId: "CT003", location: "Tennis Area", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "C006", courtName: "Tennis Court B", courtTypeId: "CT003", location: "Tennis Area", courtStatus: "Unavailable", pricePerHour: 10 },
  { courtId: "C007", courtName: "Netball Court A", courtTypeId: "CT004", location: "Multipurpose Court", courtStatus: "Available", pricePerHour: 10 },
  { courtId: "C008", courtName: "Netball Court B", courtTypeId: "CT004", location: "Multipurpose Court", courtStatus: "Available", pricePerHour: 10 }
];

const mockUsers = [
  { userId: "U001", fullName: "Sample Student", email: "student@iium.edu.my", phoneNo: "0123456789", password: "student123" }
];

const mockBookings = [
  {
    bookingId: "B001",
    userId: "U001",
    courtId: "C001",
    bookingDate: "2026-06-10",
    startTime: "09:00",
    endTime: "10:00",
    duration: 1,
    amount: 10,
    paymentStatus: "Unpaid",
    bookingStatus: "Pending"
  },
  {
    bookingId: "B002",
    userId: "U001",
    courtId: "C003",
    bookingDate: "2026-06-12",
    startTime: "17:00",
    endTime: "19:00",
    duration: 2,
    amount: 20,
    paymentStatus: "Paid",
    bookingStatus: "Confirmed"
  }
];

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
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify({ userId: "U001", role: "student" }));
  }
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || '{"userId":"U001","role":"student"}');
}

function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

function getCourtTypeName(typeId) {
  const type = getData(STORAGE_KEYS.courtTypes).find((item) => item.courtTypeId === typeId);
  return type ? type.typeName : "Unknown";
}

function getCourtName(courtId) {
  const court = getData(STORAGE_KEYS.courts).find((item) => item.courtId === courtId);
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

function initHomePage() {
  const target = document.getElementById("homeCourtTypes");
  if (!target) return;
  target.innerHTML = getData(STORAGE_KEYS.courtTypes).map((type) => {
    const count = getData(STORAGE_KEYS.courts).filter((court) => court.courtTypeId === type.courtTypeId).length;
    const label = count ? `${count} court${count > 1 ? "s" : ""} listed` : "No court yet";
    return `<a class="type-chip" href="courts.html?type=${type.courtTypeId}">${type.typeName}<span>${label}</span></a>`;
  }).join("");
}

function initLoginPage() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const loginId = document.getElementById("loginId").value.trim();
    const password = document.getElementById("loginPassword").value;
    const isAdmin = document.getElementById("adminLogin").checked;

    if (isAdmin) {
      if (password === "admin123") {
        setCurrentUser({ userId: "ADMIN", role: "admin" });
        showMessage("loginMessage", "Admin login successful. Redirecting to dashboard...");
        setTimeout(() => window.location.href = "admin-dashboard.html", 700);
      } else {
        showMessage("loginMessage", "Admin password is incorrect.", "error");
      }
      return;
    }

    const user = getData(STORAGE_KEYS.users).find((item) => {
      return (item.userId.toLowerCase() === loginId.toLowerCase() || item.email.toLowerCase() === loginId.toLowerCase()) && item.password === password;
    });

    if (!user) {
      showMessage("loginMessage", "Student ID/email or password is incorrect.", "error");
      return;
    }

    setCurrentUser({ userId: user.userId, role: "student" });
    showMessage("loginMessage", `Welcome back, ${user.fullName}.`);
    setTimeout(() => window.location.href = "courts.html", 700);
  });
}

function initRegisterPage() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const users = getData(STORAGE_KEYS.users);
    const email = document.getElementById("email").value.trim();
    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      showMessage("registerMessage", "This email is already registered.", "error");
      return;
    }

    const newUser = {
      userId: nextId("U", users, "userId"),
      fullName: document.getElementById("fullName").value.trim(),
      email,
      phoneNo: document.getElementById("phoneNo").value.trim(),
      password: document.getElementById("password").value
    };

    users.push(newUser);
    saveData(STORAGE_KEYS.users, users);
    setCurrentUser({ userId: newUser.userId, role: "student" });
    form.reset();
    showMessage("registerMessage", `Registration saved. Your student ID is ${newUser.userId}.`);
  });
}

function initCourtsPage() {
  const filters = document.getElementById("courtTypeFilters");
  const cards = document.getElementById("courtCards");
  if (!filters || !cards) return;

  const courtTypes = getData(STORAGE_KEYS.courtTypes);
  const urlType = new URLSearchParams(window.location.search).get("type");
  let selectedType = urlType || "CT001";

  function renderFilters() {
    filters.innerHTML = courtTypes.map((type) => {
      return `<button type="button" class="${type.courtTypeId === selectedType ? "active" : ""}" data-type="${type.courtTypeId}">${type.typeName}</button>`;
    }).join("");
  }

  function renderCourts() {
    const courts = getData(STORAGE_KEYS.courts).filter((court) => court.courtTypeId === selectedType);
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
            <span>Type: ${getCourtTypeName(court.courtTypeId)}</span>
            <span>Location: ${court.location}</span>
            <span>Price: RM${court.pricePerHour} per hour</span>
          </div>
          <a class="btn ${disabled ? "btn-secondary" : "btn-primary"}" href="${disabled ? "#" : `booking.html?courtId=${court.courtId}`}" aria-disabled="${disabled}">${disabled ? "Not Available" : "Book Court"}</a>
        </article>
      `;
    }).join("");
  }

  filters.addEventListener("click", (event) => {
    if (!event.target.matches("button")) return;
    selectedType = event.target.dataset.type;
    renderFilters();
    renderCourts();
  });

  renderFilters();
  renderCourts();
}

function initBookingPage() {
  const form = document.getElementById("bookingForm");
  const courtSelect = document.getElementById("courtSelect");
  const duration = document.getElementById("duration");
  const totalPrice = document.getElementById("totalPrice");
  if (!form || !courtSelect || !duration || !totalPrice) return;

  const currentUser = getCurrentUser();
  document.getElementById("bookingUserLabel").textContent = currentUser.userId;
  const availableCourts = getData(STORAGE_KEYS.courts).filter((court) => court.courtStatus === "Available");
  const selectedCourtId = new URLSearchParams(window.location.search).get("courtId");

  courtSelect.innerHTML = `<option value="">Choose court</option>` + availableCourts.map((court) => {
    return `<option value="${court.courtId}">${court.courtName} - ${getCourtTypeName(court.courtTypeId)}</option>`;
  }).join("");
  if (selectedCourtId) courtSelect.value = selectedCourtId;

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("bookingDate").setAttribute("min", today);

  function updatePrice() {
    totalPrice.textContent = `RM${Number(duration.value) * PRICE_PER_HOUR}`;
  }

  duration.addEventListener("change", updatePrice);
  updatePrice();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const bookings = getData(STORAGE_KEYS.bookings);
    const newBooking = {
      bookingId: nextId("B", bookings, "bookingId"),
      userId: currentUser.userId || "U001",
      courtId: courtSelect.value,
      bookingDate: document.getElementById("bookingDate").value,
      startTime: document.getElementById("startTime").value,
      endTime: addHours(document.getElementById("startTime").value, duration.value),
      duration: Number(duration.value),
      amount: Number(duration.value) * PRICE_PER_HOUR,
      paymentStatus: "Unpaid",
      bookingStatus: "Pending"
    };

    const duplicate = bookings.some((booking) => {
      return booking.courtId === newBooking.courtId &&
        booking.bookingDate === newBooking.bookingDate &&
        booking.startTime === newBooking.startTime &&
        booking.bookingStatus !== "Cancelled";
    });

    if (duplicate) {
      showMessage("bookingMessage", "This court is already booked for that date and start time.", "error");
      return;
    }

    bookings.push(newBooking);
    saveData(STORAGE_KEYS.bookings, bookings);
    form.reset();
    updatePrice();
    showMessage("bookingMessage", `Booking submitted successfully. Your booking ID is ${newBooking.bookingId}.`);
  });
}

function initMyBookingsPage() {
  const table = document.getElementById("myBookingsTable");
  if (!table) return;
  const message = document.getElementById("noBookingsMessage");
  const currentUser = getCurrentUser();

  function render() {
    const bookings = getData(STORAGE_KEYS.bookings).filter((booking) => booking.userId === currentUser.userId);
    message.classList.toggle("hidden", bookings.length > 0);
    table.innerHTML = bookings.map((booking) => {
      const canCancel = booking.bookingStatus !== "Cancelled";
      return `
        <tr>
          <td>${booking.bookingId}</td>
          <td>${getCourtName(booking.courtId)}</td>
          <td>${booking.bookingDate}</td>
          <td>${booking.startTime} - ${booking.endTime}</td>
          <td>${booking.duration} hour${booking.duration > 1 ? "s" : ""}</td>
          <td>RM${booking.amount}</td>
          <td>${badge(booking.paymentStatus)}</td>
          <td>${badge(booking.bookingStatus)}</td>
          <td><button class="btn btn-danger btn-small" data-cancel="${booking.bookingId}" ${canCancel ? "" : "disabled"}>Cancel</button></td>
        </tr>
      `;
    }).join("");
  }

  table.addEventListener("click", (event) => {
    const bookingId = event.target.dataset.cancel;
    if (!bookingId) return;
    if (!confirm(`Cancel booking ${bookingId}?`)) return;
    const bookings = getData(STORAGE_KEYS.bookings).map((booking) => {
      if (booking.bookingId === bookingId) return { ...booking, bookingStatus: "Cancelled" };
      return booking;
    });
    saveData(STORAGE_KEYS.bookings, bookings);
    showMessage("myBookingsMessage", `Booking ${bookingId} has been cancelled.`);
    render();
  });

  render();
}

function initAdminDashboardPage() {
  const summary = document.getElementById("adminSummary");
  const recentTable = document.getElementById("recentBookingsTable");
  if (!summary || !recentTable) return;

  const courts = getData(STORAGE_KEYS.courts);
  const bookings = getData(STORAGE_KEYS.bookings);
  const cards = [
    { label: "Total Courts", value: courts.length },
    { label: "Total Bookings", value: bookings.length },
    { label: "Pending Payments", value: bookings.filter((booking) => booking.paymentStatus === "Unpaid").length },
    { label: "Cancelled Bookings", value: bookings.filter((booking) => booking.bookingStatus === "Cancelled").length }
  ];

  summary.innerHTML = cards.map((card) => `<div class="summary-card"><span>${card.label}</span><strong>${card.value}</strong></div>`).join("");

  recentTable.innerHTML = bookings.slice().reverse().slice(0, 5).map((booking) => `
    <tr>
      <td>${booking.bookingId}</td>
      <td>${getUserName(booking.userId)}</td>
      <td>${getCourtName(booking.courtId)}</td>
      <td>${booking.bookingDate}</td>
      <td>${badge(booking.bookingStatus)}</td>
      <td>${badge(booking.paymentStatus)}</td>
    </tr>
  `).join("");
}

function initManageCourtsPage() {
  const form = document.getElementById("courtForm");
  const table = document.getElementById("manageCourtsTable");
  const typeSelect = document.getElementById("courtTypeId");
  if (!form || !table || !typeSelect) return;

  typeSelect.innerHTML = getData(STORAGE_KEYS.courtTypes).map((type) => {
    return `<option value="${type.courtTypeId}">${type.typeName}</option>`;
  }).join("");

  function resetForm() {
    form.reset();
    document.getElementById("courtId").value = "";
    document.getElementById("pricePerHour").value = PRICE_PER_HOUR;
    document.getElementById("courtFormTitle").textContent = "Add Court";
  }

  function render() {
    table.innerHTML = getData(STORAGE_KEYS.courts).map((court) => `
      <tr>
        <td>${court.courtId}</td>
        <td>${court.courtName}</td>
        <td>${getCourtTypeName(court.courtTypeId)}</td>
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
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const courts = getData(STORAGE_KEYS.courts);
    const existingId = document.getElementById("courtId").value;
    const courtData = {
      courtId: existingId || nextId("C", courts, "courtId"),
      courtName: document.getElementById("courtName").value.trim(),
      courtTypeId: document.getElementById("courtTypeId").value,
      location: document.getElementById("courtLocation").value.trim(),
      courtStatus: document.getElementById("courtStatus").value,
      pricePerHour: Number(document.getElementById("pricePerHour").value)
    };

    const updatedCourts = existingId
      ? courts.map((court) => court.courtId === existingId ? courtData : court)
      : [...courts, courtData];

    saveData(STORAGE_KEYS.courts, updatedCourts);
    showMessage("courtMessage", existingId ? "Court updated successfully." : "Court added successfully.");
    resetForm();
    render();
  });

  table.addEventListener("click", (event) => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;
    const courts = getData(STORAGE_KEYS.courts);

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
      saveData(STORAGE_KEYS.courts, courts.filter((court) => court.courtId !== deleteId));
      showMessage("courtMessage", `Court ${deleteId} has been deleted.`);
      render();
    }
  });

  document.getElementById("resetCourtForm").addEventListener("click", resetForm);
  resetForm();
  render();
}

function initManageBookingsPage() {
  const table = document.getElementById("manageBookingsTable");
  if (!table) return;

  function render() {
    table.innerHTML = getData(STORAGE_KEYS.bookings).map((booking) => `
      <tr>
        <td>${booking.bookingId}</td>
        <td>${getUserName(booking.userId)}</td>
        <td>${getCourtName(booking.courtId)}</td>
        <td>${booking.bookingDate}</td>
        <td>${booking.startTime} - ${booking.endTime}</td>
        <td>RM${booking.amount}</td>
        <td>
          <select data-booking-status="${booking.bookingId}">
            <option value="Pending" ${booking.bookingStatus === "Pending" ? "selected" : ""}>Pending</option>
            <option value="Confirmed" ${booking.bookingStatus === "Confirmed" ? "selected" : ""}>Confirmed</option>
            <option value="Cancelled" ${booking.bookingStatus === "Cancelled" ? "selected" : ""}>Cancelled</option>
          </select>
        </td>
        <td>
          <select data-payment-status="${booking.bookingId}">
            <option value="Unpaid" ${booking.paymentStatus === "Unpaid" ? "selected" : ""}>Unpaid</option>
            <option value="Paid" ${booking.paymentStatus === "Paid" ? "selected" : ""}>Paid</option>
          </select>
        </td>
      </tr>
    `).join("");
  }

  table.addEventListener("change", (event) => {
    const bookingStatusId = event.target.dataset.bookingStatus;
    const paymentStatusId = event.target.dataset.paymentStatus;
    const bookings = getData(STORAGE_KEYS.bookings).map((booking) => {
      if (booking.bookingId === bookingStatusId) return { ...booking, bookingStatus: event.target.value };
      if (booking.bookingId === paymentStatusId) return { ...booking, paymentStatus: event.target.value };
      return booking;
    });
    saveData(STORAGE_KEYS.bookings, bookings);
    showMessage("manageBookingsMessage", "Booking record updated successfully.");
    render();
  });

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  seedData();
  setupNavigation();
  const page = document.body.dataset.page;
  if (page === "home") initHomePage();
  if (page === "login") initLoginPage();
  if (page === "register") initRegisterPage();
  if (page === "courts") initCourtsPage();
  if (page === "booking") initBookingPage();
  if (page === "my-bookings") initMyBookingsPage();
  if (page === "admin-dashboard") initAdminDashboardPage();
  if (page === "manage-courts") initManageCourtsPage();
  if (page === "manage-bookings") initManageBookingsPage();
});
