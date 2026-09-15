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

  // Forms POST to Formspree (see the form's action attribute). The form's
  // own action/method work with JS disabled too; this just upgrades it to
  // an inline, no-reload result instead of a redirect.
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) {
        return; // let the browser show native validation messages
      }
      e.preventDefault();

      if (status) {
        status.textContent = "Sending…";
        status.className = "form-status is-loading";
      }
      if (submitBtn) submitBtn.disabled = true;

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (payload) {
              return { ok: res.ok, payload: payload };
            });
        })
        .catch(function () {
          return { ok: false, payload: null };
        })
        .then(function (result) {
          if (submitBtn) submitBtn.disabled = false;
          if (!status) return;
          if (result.ok) {
            status.textContent = form.dataset.success || "Thanks — we've received your message. We aim to respond within one working day.";
            status.className = "form-status is-success";
            form.reset();
          } else {
            var message = null;
            if (result.payload && Array.isArray(result.payload.errors) && result.payload.errors.length) {
              message = result.payload.errors.map(function (e) { return e.message; }).join(" ");
            } else if (result.payload && result.payload.error) {
              message = result.payload.error;
            }
            status.textContent = message || "Something went wrong. Please email tim@fluentai.uk directly.";
            status.className = "form-status is-error";
          }
        });
    });
  });
})();
