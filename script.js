let currentUser = "";

// LOGIN
function login() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();

  if (u === "admin" && p === "admin") {
    currentUser = "admin";
    document.getElementById("login-page").classList.add("hidden");
    document.getElementById("admin-panel").classList.remove("hidden");
    loadUserList();
  } else {
    firebase.database().ref("users/" + u).once("value").then(snapshot => {
      if (snapshot.exists() && snapshot.val() === p) {
        currentUser = u;
        document.getElementById("login-page").classList.add("hidden");
        document.getElementById("user-panel").classList.remove("hidden");
      } else {
        alert("Invalid credentials");
      }
    });
  }
}

// LOGOUT
function logout() {
  currentUser = "";
  document.getElementById("user-panel").classList.add("hidden");
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("login-page").classList.remove("hidden");
}

// ADD USER
function addUser() {
  const user = document.getElementById("newUsername").value.trim();
  const pass = document.getElementById("newPassword").value.trim();
  if (!user || !pass) return alert("Enter username and password");

  firebase.database().ref("users/" + user).once("value").then(snapshot => {
    if (snapshot.exists()) {
      alert("User already exists");
    } else {
      firebase.database().ref("users/" + user).set(pass);
      alert("User added");
      loadUserList();
    }
  });
}

// LOAD USER LIST
function loadUserList() {
  const select = document.getElementById("userSelect");
  select.innerHTML = "";
  firebase.database().ref("users").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const opt = document.createElement("option");
      opt.value = child.key;
      opt.textContent = child.key;
      select.appendChild(opt);
    });
  });
}

// MARK ATTENDANCE
function markAttendance() {
  const today = new Date().toISOString().split("T")[0];
  firebase.database().ref(`reports/${currentUser}/${today}/present`).set(true);
  alert("Marked Present");
}

// SUBMIT REPORT
function submitReport() {
  const total = +document.getElementById("totalCalls").value;
  const connected = +document.getElementById("connectedCalls").value;
  const confirmed = +document.getElementById("confirmedCalls").value;
  const today = new Date().toISOString().split("T")[0];

  firebase.database().ref(`reports/${currentUser}/${today}`).once("value").then(snapshot => {
    if (snapshot.val()?.submitted) {
      alert("Report already submitted.");
      return;
    }
    firebase.database().ref(`reports/${currentUser}/${today}`).set({
      present: true,
      total,
      connected,
      confirmed,
      submitted: true
    });
    alert("Report Submitted");
  });
}

// VIEW REPORT (ADMIN)
function viewReport() {
  const user = document.getElementById("userSelect").value;
  const date = document.getElementById("reportDate").value;
  firebase.database().ref(`reports/${user}/${date}`).once("value").then(snapshot => {
    const data = snapshot.val();
    const table = document.getElementById("reportTable");
    if (!data) return table.innerHTML = "<tr><td>No data</td></tr>";
    table.innerHTML = `<tr><th>Date</th><th>Present</th><th>Total</th><th>Connected</th><th>Confirmed</th></tr>
      <tr><td>${date}</td><td>${data.present ? "Yes" : "No"}</td><td>${data.total}</td><td>${data.connected}</td><td>${data.confirmed}</td></tr>`;
  });
}

// VIEW MONTHLY REPORT (ADMIN)
function viewMonthlyReport() {
  const user = document.getElementById("userSelect").value;
  const table = document.getElementById("reportTable");
  table.innerHTML = `<tr><th>Date</th><th>Present</th><th>Total</th><th>Connected</th><th>Confirmed</th></tr>`;
  firebase.database().ref(`reports/${user}`).once("value").then(snapshot => {
    snapshot.forEach(child => {
      const date = child.key;
      const r = child.val();
      table.innerHTML += `<tr><td>${date}</td><td>${r.present ? "Yes" : "No"}</td><td>${r.total || 0}</td><td>${r.connected || 0}</td><td>${r.confirmed || 0}</td></tr>`;
    });
  });
}

// USER DAILY VIEW
function viewUserDaily() {
  const today = new Date().toISOString().split("T")[0];
  const table = document.getElementById("userReportTable");
  firebase.database().ref(`reports/${currentUser}/${today}`).once("value").then(snapshot => {
    const data = snapshot.val();
    if (!data) return table.innerHTML = "<tr><td>No data</td></tr>";
    table.innerHTML = `<tr><th>Date</th><th>Present</th><th>Total</th><th>Connected</th><th>Confirmed</th></tr>
      <tr><td>${today}</td><td>${data.present ? "Yes" : "No"}</td><td>${data.total}</td><td>${data.connected}</td><td>${data.confirmed}</td></tr>`;
  });
}

// USER MONTHLY VIEW
function viewUserMonthly() {
  const table = document.getElementById("userReportTable");
  table.innerHTML = `<tr><th>Date</th><th>Present</th><th>Total</th><th>Connected</th><th>Confirmed</th></tr>`;
  firebase.database().ref(`reports/${currentUser}`).once("value").then(snapshot => {
    snapshot.forEach(child => {
      const date = child.key;
      const r = child.val();
      table.innerHTML += `<tr><td>${date}</td><td>${r.present ? "Yes" : "No"}</td><td>${r.total || 0}</td><td>${r.connected || 0}</td><td>${r.confirmed || 0}</td></tr>`;
    });
  });
}

// EXPORT CSV
function exportCSV() {
  const user = document.getElementById("userSelect").value;
  firebase.database().ref(`reports/${user}`).once("value").then(snapshot => {
    let csv = "Date,Present,Total Calls,Connected Calls,Confirmed Calls\n";
    snapshot.forEach(child => {
      const date = child.key;
      const r = child.val();
      csv += `${date},${r.present ? "Yes" : "No"},${r.total || 0},${r.connected || 0},${r.confirmed || 0}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = user + "_report.csv";
    link.click();
  });
}
