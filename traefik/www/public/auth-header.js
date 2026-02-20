(function () {
  const el = document.getElementById("auth-links");
  if (!el) return;
  fetch("/api/me", { credentials: "same-origin" })
    .then((r) => r.json())
    .then((data) => {
      if (data.user) {
        if (data.user.role === "admin") {
          el.innerHTML = '<a href="/admin/dashboard">Admin</a> <a href="/" class="btn-logout">Logout</a>';
        } else {
          el.innerHTML = '<a href="/student">My area</a> <a href="/" class="btn-logout">Logout</a>';
        }
        const logout = el.querySelector(".btn-logout");
        if (logout) {
          logout.addEventListener("click", function (e) {
            e.preventDefault();
            fetch("/api/logout", { method: "POST", credentials: "same-origin" }).then(() => (window.location.href = "/"));
          });
        }
      } else {
        el.innerHTML = '<a href="/login">Login</a> <a href="/register">Register</a>';
      }
    })
    .catch(() => {
      el.innerHTML = '<a href="/login">Login</a> <a href="/register">Register</a>';
    });
})();
