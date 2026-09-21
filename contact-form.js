(() => {
  const SUPABASE_URL = "https://nwflbazvdamupdhaqbhy.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZmxiYXp2ZGFtdXBkaGFxYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjU1MTIsImV4cCI6MjA5NTMwMTUxMn0.YjsZdMlDU6Pe9K2oIpscENd6s9gccH9vfSV3hcSzYn4";

  // FormSubmit must be called from the browser on the live site (not a server).
  // Primary inbox receives the activation email the first time.
  const ALERT_INBOX = "offin.joel@gmail.com";
  const ALERT_CC = "acquisitions@jkolandinvestments.com";

  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusEl = document.getElementById("contact-form-status");
  const submitBtn = form.querySelector('[type="submit"]');

  const setStatus = (message, type) => {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
    statusEl.dataset.status = type || "";
  };

  const sendEmailAlert = async (lead) => {
    const response = await fetch(`https://formsubmit.co/ajax/${ALERT_INBOX}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: lead.full_name,
        phone: lead.phone,
        property_address: lead.property_address,
        email: lead.email || "(not provided)",
        role: lead.role,
        message: lead.message || "(none)",
        page_url: lead.page_url || "",
        _subject: `New land inquiry from ${lead.full_name}`,
        _template: "table",
        _captcha: "false",
        _cc: ALERT_CC,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === "false" || result.success === false) {
      throw new Error(result.message || `Email alert failed (${response.status})`);
    }
    return result;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("", "");

    const honeypot = form.querySelector('[name="company_website"]');
    if (honeypot && honeypot.value.trim()) {
      setStatus("Thanks — we received your details and will be in touch.", "success");
      form.reset();
      return;
    }

    const data = new FormData(form);
    const fullName = String(data.get("full_name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const propertyAddress = String(data.get("property_address") || "").trim();
    const email = String(data.get("email") || "").trim();
    const role = String(data.get("role") || "landowner").trim();
    const message = String(data.get("message") || "").trim();

    if (!fullName || !phone || !propertyAddress) {
      setStatus("Please fill in your name, phone number, and property address.", "error");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    const lead = {
      full_name: fullName,
      phone,
      property_address: propertyAddress,
      email: email || null,
      role: role === "builder_partner" ? "builder_partner" : "landowner",
      message: message || null,
      page_url: window.location.href,
      user_agent: navigator.userAgent.slice(0, 400),
    };

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/jko_contact_leads`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(lead),
      });

      if (!response.ok) {
        throw new Error(`Submit failed (${response.status})`);
      }

      try {
        await sendEmailAlert(lead);
      } catch (_emailError) {
        // Lead is saved even if the email provider needs activation.
        console.warn("Lead saved; email alert pending activation or failed.", _emailError);
      }

      form.reset();
      setStatus(
        "Thanks — we received your details and will reach you at the number you provided.",
        "success"
      );
    } catch (_error) {
      setStatus(
        "Something went wrong. Please try again in a moment, or email acquisitions@jkolandinvestments.com.",
        "error"
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Request an offer";
      }
    }
  });
})();
