const MIN_SUBMIT_TIME_MS = 3000;

export function antispam(req, res, next) {
  const { website, email, phone, user_email, phone_number, _t } = req.body;

  // Check honeypot fields - bots will fill these
  if (website || email || phone || user_email || phone_number) {
    console.log("Spam detected: honeypot field filled");
    return res.status(400).json({
      success: false,
      error: "Unable to process your request.",
    });
  }

  // Check timing - bots submit too fast
  if (_t !== undefined) {
    const timeSpent = parseInt(_t, 10);
    if (isNaN(timeSpent) || timeSpent < MIN_SUBMIT_TIME_MS) {
      console.log(`Spam detected: submitted too fast (${timeSpent}ms)`);
      return res.status(400).json({
        success: false,
        error: "Please take your time to write your experience.",
      });
    }
  }

  // Clean honeypot fields from body before passing to handler
  delete req.body.website;
  delete req.body.email;
  delete req.body.phone;
  delete req.body.user_email;
  delete req.body.phone_number;
  delete req.body._t;

  next();
}

export default antispam;
