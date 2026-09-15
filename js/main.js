(function () {
  "use strict";

  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.querySelectorAll(".has-dropdown > .nav-link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (window.matchMedia("(max-width: 760px)").matches) {
        e.preventDefault();
        link.parentElement.classList.toggle("is-open");
      }
    });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".has-dropdown")) {
      document.querySelectorAll(".has-dropdown.is-open").forEach(function (el) {
        el.classList.remove("is-open");
      });
    }
  });

  // Close mobile nav when a link is chosen
  document.querySelectorAll(".nav-primary a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.matchMedia("(max-width: 760px)").matches && !link.parentElement.classList.contains("has-dropdown")) {
        document.body.classList.remove("nav-open");
      }
    });
  });

  // Lightweight client-side handling for forms with no backend attached.
  // Wire data-endpoint to a real form handler (e.g. a Cloudflare Pages
  // Function or Formspree) to send submissions somewhere.
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new FormData(form);
      var subject = encodeURIComponent(form.dataset.subject || "Website enquiry");
      var lines = [];
      data.forEach(function (value, key) {
        if (value) lines.push(key + ": " + value);
      });
      var mailto = "mailto:hello@fluentai.co.uk?subject=" + subject + "&body=" + encodeURIComponent(lines.join("\n"));

      if (status) {
        status.textContent = form.dataset.success || "Thanks — your message has been prepared. We aim to respond within one working day.";
        status.className = "form-status is-success";
      }
      form.reset();
      window.location.href = mailto;
    });
  });
})();
