const layout = (title, body) => `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
    <h1 style="color:#10b981;font-size:22px;margin:0 0 16px">${title}</h1>
    ${body}
    <p style="color:#94a3b8;font-size:12px;margin-top:32px">GharGhar Sewa — home services in Nepal</p>
  </div>
</body>
</html>`;

const otpEmail = (code, purpose) => {
  const action =
    purpose === "password_reset" ? "reset your password" : "verify your email";
  return layout(
    "Verification code",
    `<p style="color:#475569">Use this code to ${action}:</p>
     <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a;text-align:center;margin:24px 0">${code}</p>
     <p style="color:#94a3b8;font-size:14px">Expires in 10 minutes. Do not share this code.</p>`
  );
};

const providerPendingEmail = (name) =>
  layout(
    "Application received",
    `<p>Hi <strong>${name}</strong>,</p>
     <p style="color:#475569">Thanks for registering as a service provider on GharGhar Sewa.</p>
     <p style="color:#475569">Your profile is <strong>pending admin approval</strong>. We will email you once you are verified and can receive customer bookings.</p>`
  );

const providerApprovedEmail = (name) =>
  layout(
    "You are approved",
    `<p>Hi <strong>${name}</strong>,</p>
     <p style="color:#475569">Great news — your provider account has been <strong>approved</strong>.</p>
     <p style="color:#475569">You can now appear in search results and accept bookings on GharGhar Sewa.</p>`
  );

const newBookingProviderEmail = (providerName, userName, booking, dateStr) =>
  layout(
    "New booking request",
    `<p>Hi <strong>${providerName}</strong>,</p>
     <p style="color:#475569"><strong>${userName}</strong> booked your <strong>${booking.serviceCategory}</strong> service.</p>
     <ul style="color:#475569;line-height:1.8">
       <li>When: ${dateStr}</li>
       <li>Address: ${booking.address}</li>
       <li>Amount: Rs. ${booking.totalPrice}</li>
     </ul>
     <p style="color:#475569">Log in to your provider dashboard to accept or manage this order.</p>`
  );

const newBookingUserEmail = (userName, providerName, booking, dateStr) =>
  layout(
    "Booking confirmed",
    `<p>Hi <strong>${userName}</strong>,</p>
     <p style="color:#475569">Your booking with <strong>${providerName}</strong> is confirmed.</p>
     <ul style="color:#475569;line-height:1.8">
       <li>Service: ${booking.serviceCategory}</li>
       <li>When: ${dateStr}</li>
       <li>Address: ${booking.address}</li>
       <li>Total: Rs. ${booking.totalPrice}</li>
     </ul>`
  );

const newReviewProviderEmail = (providerName, rating, comment) =>
  layout(
    "New review",
    `<p>Hi <strong>${providerName}</strong>,</p>
     <p style="color:#475569">You received a <strong>${rating} / 5</strong> star review.</p>
     <p style="color:#475569;font-style:italic">"${comment}"</p>`
  );

module.exports = {
  otpEmail,
  providerPendingEmail,
  providerApprovedEmail,
  newBookingProviderEmail,
  newBookingUserEmail,
  newReviewProviderEmail,
};
