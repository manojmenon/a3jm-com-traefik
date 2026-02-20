(function () {
  // Toggle sidebar on mobile
  const sidebar = document.getElementById("main-sidebar");
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const sidebarToggle = document.getElementById("sidebar-toggle");

  if (mobileToggle) {
    mobileToggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.remove("open");
    });
  }

  // Close sidebar when clicking outside on mobile or when clicking a link
  document.addEventListener("click", function (e) {
    if (window.innerWidth <= 768 && sidebar.classList.contains("open")) {
      // Close if clicking outside sidebar or on a sidebar link
      if (!sidebar.contains(e.target) || e.target.classList.contains("sidebar-nav-item")) {
        sidebar.classList.remove("open");
      }
    }
  });

  // Update user links in sidebar based on auth status
  const userLinksContainer = document.getElementById("sidebar-user-links");
  if (userLinksContainer) {
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          let html = '<div class="sidebar-divider">My Account</div>';
          if (data.user.role === "admin") {
            html += '<a href="/admin/dashboard" class="sidebar-nav-item">Admin Panel</a>';
          } else {
            html += '<a href="/student" class="sidebar-nav-item">My Area</a>';
          }
          html += '<a href="/" class="sidebar-nav-item btn-logout-sidebar">Logout</a>';
          userLinksContainer.innerHTML = html;

          // Add logout handler
          const logoutBtn = userLinksContainer.querySelector(".btn-logout-sidebar");
          if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
              e.preventDefault();
              fetch("/api/logout", { method: "POST", credentials: "same-origin" }).then(() => {
                window.location.reload();
              });
            });
          }
        } else {
          userLinksContainer.innerHTML =
            '<div class="sidebar-divider">Account</div>' +
            '<a href="/login" class="sidebar-nav-item">Login</a>' +
            '<a href="/register" class="sidebar-nav-item">Register</a>';
        }
      })
      .catch(() => {
        userLinksContainer.innerHTML =
          '<div class="sidebar-divider">Account</div>' +
          '<a href="/login" class="sidebar-nav-item">Login</a>' +
          '<a href="/register" class="sidebar-nav-item">Register</a>';
      });
  }
})();
