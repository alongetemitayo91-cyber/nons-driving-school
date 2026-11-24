
import { supabase } from "./supabase.js";
import "./admin.css";

// ==========================================
// ELEMENTS
// ==========================================

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");

const logoutButton = document.getElementById("logoutButton");
const refreshButton = document.getElementById("refreshButton");

const reviewsList = document.getElementById("reviewsList");
const reviewCount = document.getElementById("reviewCount");
const dashboardMessage = document.getElementById("dashboardMessage");

// ==========================================
// MESSAGES
// ==========================================

function showLoginMessage(message, isError = true) {
  loginMessage.textContent = message;
  loginMessage.style.color = isError ? "#dc2626" : "#15803d";
}

function showDashboardMessage(message, isError = false) {
  dashboardMessage.textContent = message;
  dashboardMessage.style.color = isError ? "#dc2626" : "#15803d";
}

// ==========================================
// CHECK ADMIN PERMISSIONS
// ==========================================

async function checkAdmin(user) {
  const { data, error } = await supabase
    .from("review_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Admin permission check failed:", error.message);
    throw new Error("Could not verify administrator permissions.");
  }

  return Boolean(data);
}

// ==========================================
// SHOW DASHBOARD
// ==========================================

async function openDashboard(user) {
  try {
    const isAdmin = await checkAdmin(user);

    if (!isAdmin) {
      await supabase.auth.signOut();
      loginSection.hidden = false;
      dashboardSection.hidden = true;

      showLoginMessage(
        "You do not have permission to access this dashboard."
      );

      return;
    }

    loginSection.hidden = true;
    dashboardSection.hidden = false;

    adminEmail.value = "";
    adminPassword.value = "";

    await loadAllReviews();
  } catch (error) {
    console.error(error);

    await supabase.auth.signOut();

    loginSection.hidden = false;
    dashboardSection.hidden = true;

    showLoginMessage(error.message);
  }
}

// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = adminEmail.value.trim();
  const password = adminPassword.value;

  if (!email || !password) {
    showLoginMessage("Please enter your email and password.");
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";

  showLoginMessage("");

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await openDashboard(data.user);
  } catch (error) {
    console.error("Login failed:", error.message);

    showLoginMessage(
      "Login failed. Please check your email and password."
    );
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
  }
});

// ==========================================
// LOAD ALL CUSTOMER REVIEWS
// ==========================================

async function loadAllReviews() {
  reviewsList.innerHTML = `
    <div class="empty-state">Loading customer reviews...</div>
  `;

  reviewCount.textContent = "...";

  refreshButton.disabled = true;
  showDashboardMessage("");

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, name, instructor, rating, review, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    reviewCount.textContent = data.length;

    reviewsList.innerHTML = "";

    if (data.length === 0) {
      reviewsList.innerHTML = `
        <div class="empty-state">
          No customer reviews have been submitted yet.
        </div>
      `;

      return;
    }

    data.forEach((review) => {
      const card = document.createElement("article");
      card.className = "admin-review-card";

      const top = document.createElement("div");
      top.className = "admin-review-top";

      const details = document.createElement("div");

      const name = document.createElement("h3");
      name.textContent = review.name;

      const date = document.createElement("p");
      date.className = "admin-review-date";

      date.textContent = new Date(review.created_at).toLocaleString(
        "en-GB",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      details.append(name, date);

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.textContent = "Delete Review";
      deleteButton.type = "button";

      deleteButton.addEventListener("click", () => {
        deleteReview(review.id, deleteButton);
      });

      top.append(details, deleteButton);

      const stars = document.createElement("div");
      stars.className = "admin-review-stars";
      stars.textContent =
        "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

      const reviewText = document.createElement("p");
      reviewText.className = "admin-review-text";
      reviewText.textContent = review.review;

      const instructor = document.createElement("p");
      instructor.className = "admin-review-instructor";
      instructor.textContent = `Instructor: ${review.instructor}`;

      card.append(top, stars, reviewText, instructor);

      reviewsList.appendChild(card);
    });

  } catch (error) {
    console.error("Could not load reviews:", error);

    reviewsList.innerHTML = `
      <div class="empty-state">
        Could not load reviews. Please refresh and try again.
      </div>
    `;

    showDashboardMessage(error.message, true);

  } finally {
    refreshButton.disabled = false;
  }
}

// ==========================================
// DELETE A CUSTOMER REVIEW
// ==========================================

async function deleteReview(reviewId, button) {
  const confirmed = window.confirm(
    "Are you sure you want to permanently delete this review? This action cannot be undone."
  );

  if (!confirmed) return;

  button.disabled = true;
  button.textContent = "Deleting...";

  showDashboardMessage("");

  try {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) throw error;

    showDashboardMessage("Review deleted successfully.");

    await loadAllReviews();

  } catch (error) {
    console.error("Review deletion failed:", error);

    button.disabled = false;
    button.textContent = "Delete Review";

    showDashboardMessage(
      "Could not delete this review. Please try again.",
      true
    );
  }
}

// ==========================================
// REFRESH REVIEWS
// ==========================================

refreshButton.addEventListener("click", async () => {
  await loadAllReviews();
});

// ==========================================
// LOG OUT
// ==========================================

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "Logging out...";

  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    dashboardSection.hidden = true;
    loginSection.hidden = false;

    loginForm.reset();
    showLoginMessage("You have been logged out successfully.", false);

  } catch (error) {
    console.error("Logout failed:", error);

    showDashboardMessage("Could not log out. Please try again.", true);

  } finally {
    logoutButton.disabled = false;
    logoutButton.textContent = "Log Out";
  }
});

// ==========================================
// CHECK EXISTING LOGIN SESSION
// ==========================================

async function initializeDashboard() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    showLoginMessage("Could not check your login session.");
    return;
  }

  if (data.session) {
    await openDashboard(data.session.user);
  }
}

initializeDashboard();
