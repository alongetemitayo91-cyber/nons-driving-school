import "./style.css";

// MOBILE NAVIGATION
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("active");

  menuToggle.textContent = navLinks.classList.contains("active") ? "✕" : "☰";
});

// CLOSE MENU AFTER CLICKING A LINK
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
    menuToggle.textContent = "☰";
  });
});

// AUTOMATIC FOOTER YEAR
document.getElementById("year").textContent = new Date().getFullYear();

// BOOKING FORM
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
