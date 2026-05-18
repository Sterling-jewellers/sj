import { Router, Request, Response } from 'express';
import NewsletterSubscriber from '../models/NewsletterSubscriber.model';
import { sendNewsletterWelcome } from '../services/email.service';

const router = Router();

/* POST /api/newsletter/subscribe */
router.post('/subscribe', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: 'A valid email address is required.' });
    return;
  }

  try {
    const existing = await NewsletterSubscriber.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
      // Already subscribed — return 200 gracefully
      res.status(200).json({ message: 'You are already subscribed!', alreadySubscribed: true });
      return;
    }

    await NewsletterSubscriber.create({ email: email.toLowerCase().trim() });

    // Send welcome email (fire-and-forget — don't block the response)
    sendNewsletterWelcome(email).catch((err: Error) =>
      console.error('[newsletter] welcome email failed:', err.message),
    );

    res.status(201).json({ message: 'Subscribed successfully! Welcome to the Sterling family.' });
  } catch (err) {
    console.error('[newsletter] subscribe error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

export default router;
