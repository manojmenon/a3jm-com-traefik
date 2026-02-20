(function () {
  const form = document.getElementById("reg-form");
  const messageEl = document.getElementById("form-message");
  const submitBtn = document.getElementById("submit-btn");

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = "form-message " + (type === "error" ? "error" : "success");
  }

  function clearMessage() {
    messageEl.textContent = "";
    messageEl.className = "form-message";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearMessage();
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    const payload = {
      studentName: form.studentName.value,
      guardianName: form.guardianName.value,
      email: form.email.value,
      phone: form.phone.value,
      grade: form.grade.value,
      subject: form.subject.value,
      slot: form.slot.value,
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showMessage(data.message, "success");
        form.reset();
      } else {
        showMessage(data.message || "Something went wrong. Please try again.", "error");
      }
    } catch (err) {
      showMessage("Network error. Please check your connection and try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit registration";
    }
  });
})();
