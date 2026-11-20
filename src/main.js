import "./style.css";
import { supabase } from "./supabase.js";

// ==========================================
// MOBILE NAVIGATION
// ==========================================

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("active");
  menuToggle.textContent = navLinks.classList.contains("active") ? "✕" : "☰";
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
    menuToggle.textContent = "☰";
  });
});

// ==========================================
// BOOKING FORM
// ==========================================

const bookingForm = document.getElementById("bookingForm");

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const lessonType = document.getElementById("lessonType").value;
  const packageType = document.getElementById("package").value;
  const message = document.getElementById("message").value.trim();

  if (!name || !phone || !lessonType || !packageType) {
    alert("Please complete all required fields.");
    return;
  }

  const whatsappNumber = "447448132114";

  const whatsappMessage = `
Hello Non's Driving School!

I would like to make a driving lesson enquiry.

Name: ${name}
Phone: ${phone}
Lesson type: ${lessonType}
Package: ${packageType}

Additional information:
${message || "None"}

Please get back to me with more information. Thank you!
  `;

  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  window.open(whatsappURL, "_blank");
});

// ==========================================
// REVIEWS SYSTEM
// ==========================================

const reviewForm = document.getElementById("reviewForm");
const reviewsGrid = document.getElementById("reviewsGrid");
const reviewFormMessage = document.getElementById("reviewFormMessage");

const instructorSelect = document.getElementById("reviewInstructor");
const customInstructorInput = document.getElementById("customInstructor");

// ==========================================
// CUSTOM INSTRUCTOR NAME
// ==========================================

instructorSelect.addEventListener("change", () => {
  const isOther = instructorSelect.value === "Other";

  customInstructorInput.hidden = !isOther;
  customInstructorInput.required = isOther;

  if (!isOther) {
    customInstructorInput.value = "";
  }
});

// ==========================================
// LOAD ONLY THE FIVE LATEST CUSTOMER REVIEWS
// KEEP EXISTING HTML REVIEWS UNTOUCHED
// ==========================================

async function loadReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select("name, instructor, rating, review, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Could not load reviews:", error.message);
    return;
  }

  // Remove only previously loaded Supabase review cards.
  // Existing HTML reviews are not affected.
  reviewsGrid.querySelectorAll(".supabase-review").forEach((card) => {
    card.remove();
  });

  if (!data) return;

  data.forEach((review) => {
    const card = document.createElement("article");
    card.className = "review-card supabase-review";

    const stars = document.createElement("div");
    stars.className = "review-stars";
    stars.textContent =
      "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

    const reviewText = document.createElement("p");
    reviewText.textContent = `“${review.review}”`;

    const reviewerName = document.createElement("strong");
    reviewerName.textContent = review.name;

    const instructorName = document.createElement("small");
    instructorName.className = "review-instructor";
    instructorName.textContent = `Instructor: ${review.instructor}`;

    card.append(stars, reviewText, reviewerName, instructorName);

    reviewsGrid.appendChild(card);
  });
}

// ==========================================
// SUBMIT A NEW REVIEW
// ==========================================

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("reviewerName").value.trim();

  const selectedInstructor = instructorSelect.value;

  const instructor =
    selectedInstructor === "Other"
      ? customInstructorInput.value.trim()
      : selectedInstructor;

  const rating = Number(document.getElementById("reviewRating").value);

  const review = document.getElementById("reviewText").value.trim();

  const submitButton = reviewForm.querySelector('button[type="submit"]');

  if (!name || !instructor || !rating || !review) {
    reviewFormMessage.textContent = "Please complete all review fields.";
    reviewFormMessage.style.color = "#dc2626";
    return;
  }

  if (instructor.length < 2 || instructor.length > 60) {
    reviewFormMessage.textContent =
      "Instructor name must be between 2 and 60 characters.";
    reviewFormMessage.style.color = "#dc2626";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  reviewFormMessage.textContent = "";

  try {
    const { error } = await supabase.from("reviews").insert([
      {
        name,
        instructor,
        rating,
        review,
        approved: true,
      },
    ]);

    if (error) throw error;

    reviewForm.reset();

    customInstructorInput.hidden = true;
    customInstructorInput.required = false;

    reviewFormMessage.textContent =
      "Thank you! Your review has been published successfully.";

    reviewFormMessage.style.color = "#15803d";

    // Refresh the five newest customer reviews.
    // Existing HTML reviews remain untouched.
    await loadReviews();
  } catch (error) {
    console.error("Review submission failed:", error);

    reviewFormMessage.textContent =
      "Sorry, your review could not be submitted. Please try again.";

    reviewFormMessage.style.color = "#dc2626";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Review";
  }
});

// ==========================================
// LOAD CUSTOMER REVIEWS WHEN PAGE OPENS
// ==========================================

loadReviews();
