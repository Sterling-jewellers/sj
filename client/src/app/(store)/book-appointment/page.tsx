'use client';

import { useState } from 'react';
import { Video, MapPin, Check, Calendar, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ── Appointment types ─────────────────────────────────────────────────────────
const APPOINTMENT_TYPES = [
  {
    id: 'virtual',
    icon: Video,
    label: 'Virtual Appointment',
    desc: 'Talk face-to-face with a diamond expert from the comfort of your home via Zoom, Google Meet, or Teams.',
    badge: 'Most Popular',
  },
  {
    id: 'in-store',
    icon: MapPin,
    label: 'In-Store Visit',
    desc: 'Visit our London showroom and view our full collection in person. Private appointment — no wait times.',
    badge: 'By Appointment',
  },
];

const PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams'];
const PURPOSES  = [
  'Engagement Ring', 'Wedding Rings', 'Custom Design',
  'Diamond Investment', 'General Jewellery', 'Gift Consultation',
];
const BUDGETS   = [
  'Under £1,000', '£1,000 – £3,000', '£3,000 – £10,000',
  '£10,000 – £25,000', 'Over £25,000', 'Unsure — I need guidance',
];
const REFERRALS = [
  'Google', 'Instagram', 'Facebook', 'Friend / Family',
  'Editorial / Press', 'Returning Customer', 'Other',
];
const TIME_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

function generateDates(): { date: Date; label: string; day: string; available: boolean }[] {
  const dates = [];
  const now = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (d.getDay() === 0) continue; // closed Sundays
    dates.push({
      date:      d,
      label:     d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      day:       d.toLocaleDateString('en-GB', { weekday: 'short' }),
      available: d.getDay() !== 6 || i % 3 !== 0, // some Saturdays unavailable
    });
  }
  return dates;
}

// Deterministic slot availability — alternates based on date
function slotAvailable(date: Date, slot: string): boolean {
  const seed = date.getDate() + parseInt(slot.replace(':', ''));
  return seed % 3 !== 0;
}

export default function BookAppointmentPage() {
  const [type,       setType]       = useState<'virtual'|'in-store'|null>(null);
  const [dateList]                  = useState(generateDates);
  const [selDate,    setSelDate]    = useState<Date | null>(null);
  const [selSlot,    setSelSlot]    = useState<string | null>(null);
  const [platform,   setPlatform]   = useState('Zoom');
  const [purpose,    setPurpose]    = useState('');
  const [budget,     setBudget]     = useState('');
  const [referral,   setReferral]   = useState('');
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [notes,      setNotes]      = useState('');
  const [submitted,  setSubmitted]  = useState(false);
  const [step,       setStep]       = useState<1|2|3>(1);

  const canAdvance1 = !!type;
  const canAdvance2 = !!selDate && !!selSlot;
  const canSubmit   = firstName && lastName && email && purpose && budget;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production: POST /api/appointments with the form data
    setSubmitted(true);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ── Confirmation screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-white min-h-screen">
        {/* Header */}
        <div className="bg-charcoal text-white py-16 text-center">
          <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-gold-300 mb-3">Sterling Jewellers</p>
          <h1 className="font-serif text-4xl font-light mb-4">Appointment Confirmed</h1>
          <div className="w-12 h-px bg-gold-300 mx-auto mt-4" />
        </div>

        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={28} className="text-emerald-700" />
          </div>
          <h2 className="font-serif text-2xl font-light text-charcoal mb-3">You're booked in</h2>
          <p className="text-sm font-sans text-gray-500 mb-8">
            We've reserved your slot and will send a confirmation to <strong>{email}</strong>
          </p>

          {/* Summary card */}
          <div className="bg-gray-50 border border-gray-200 p-6 text-left space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-charcoal flex-shrink-0" />
              <div>
                <p className="text-[10px] font-sans uppercase tracking-wider text-gray-400">Date</p>
                <p className="text-sm font-sans font-medium text-charcoal">{selDate ? formatDate(selDate) : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-charcoal flex-shrink-0" />
              <div>
                <p className="text-[10px] font-sans uppercase tracking-wider text-gray-400">Time</p>
                <p className="text-sm font-sans font-medium text-charcoal">{selSlot}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {type === 'virtual' ? <Video size={16} className="text-charcoal" /> : <MapPin size={16} className="text-charcoal" />}
              <div>
                <p className="text-[10px] font-sans uppercase tracking-wider text-gray-400">Format</p>
                <p className="text-sm font-sans font-medium text-charcoal">
                  {type === 'virtual' ? `Virtual via ${platform}` : 'In-Store — 1 New Bond St, London W1S 2AF'}
                </p>
              </div>
            </div>
          </div>

          {/* What to expect */}
          <div className="border border-gray-200 p-6 text-left mb-8">
            <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-charcoal mb-4">What to expect</p>
            <ul className="space-y-2 text-sm font-sans text-gray-600">
              <li className="flex items-start gap-2"><Check size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />A personal introduction to our diamond consultant</li>
              <li className="flex items-start gap-2"><Check size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />Live viewing of certified diamond inventory</li>
              <li className="flex items-start gap-2"><Check size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />Setting and style recommendations for your budget</li>
              <li className="flex items-start gap-2"><Check size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />No pressure, no obligation</li>
            </ul>
          </div>

          {/* Add to calendar */}
          <div className="flex gap-3 justify-center flex-wrap mb-6">
            <a href="#" className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-[12px] font-sans font-medium text-charcoal hover:bg-charcoal hover:text-white transition-colors">
              <Calendar size={13} /> Google Calendar
            </a>
            <a href="#" className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-[12px] font-sans font-medium text-charcoal hover:bg-charcoal hover:text-white transition-colors">
              <Calendar size={13} /> Apple Calendar
            </a>
          </div>

          <Link href="/" className="text-[12px] font-sans text-gray-500 underline hover:text-charcoal">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero header */}
      <div className="bg-charcoal text-white py-14 text-center">
        <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-gold-300 mb-3">One-to-One Consultation</p>
        <h1 className="font-serif text-4xl font-light mb-3">Book a Private Appointment</h1>
        <p className="text-sm font-sans text-gray-300 max-w-md mx-auto leading-relaxed">
          Speak with one of our diamond experts — in-person at our London showroom or virtually from anywhere in the world.
        </p>
        <div className="w-12 h-px bg-gold-300 mx-auto mt-6" />
      </div>

      {/* Step indicator */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-2">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-sans font-bold transition-colors',
                step >= s ? 'bg-charcoal text-white' : 'bg-gray-200 text-gray-500'
              )}>
                {step > s ? <Check size={13} /> : s}
              </div>
              <span className={cn('text-[11px] font-sans hidden sm:inline',
                step === s ? 'text-charcoal font-medium' : 'text-gray-400')}>
                {s === 1 ? 'Type' : s === 2 ? 'Date & Time' : 'Your Details'}
              </span>
              {s < 3 && <div className="w-8 h-px bg-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* ── STEP 1: Appointment type ── */}
        {step === 1 && (
          <div>
            <h2 className="font-serif text-2xl font-light text-charcoal mb-2">Choose your appointment type</h2>
            <p className="text-sm font-sans text-gray-500 mb-8">Both options give you dedicated one-to-one time with a diamond expert.</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {APPOINTMENT_TYPES.map(({ id, icon: Icon, label, desc, badge }) => (
                <button
                  key={id}
                  onClick={() => setType(id as 'virtual' | 'in-store')}
                  className={cn(
                    'text-left border p-6 transition-all relative',
                    type === id ? 'border-charcoal bg-charcoal/[0.03]' : 'border-gray-200 hover:border-gray-400'
                  )}
                >
                  {badge && (
                    <span className="absolute top-3 right-3 text-[9px] font-sans font-bold tracking-wider uppercase bg-charcoal text-white px-2 py-0.5">
                      {badge}
                    </span>
                  )}
                  <div className={cn(
                    'w-12 h-12 border flex items-center justify-center mb-4',
                    type === id ? 'border-charcoal bg-charcoal text-white' : 'border-gray-300 text-charcoal'
                  )}>
                    <Icon size={20} />
                  </div>
                  <h3 className="font-serif text-lg font-light text-charcoal mb-2">{label}</h3>
                  <p className="text-[12px] font-sans text-gray-500 leading-relaxed">{desc}</p>
                  {type === id && (
                    <div className="absolute top-3 left-3 w-5 h-5 bg-charcoal rounded-full flex items-center justify-center">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Virtual platform selector */}
            {type === 'virtual' && (
              <div className="mb-8 bg-gray-50 border border-gray-200 p-5">
                <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-charcoal mb-3">Preferred Platform</p>
                <div className="flex gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => setPlatform(p)}
                      className={cn(
                        'px-4 py-2 text-[12px] font-sans border transition-colors',
                        platform === p ? 'bg-charcoal border-charcoal text-white' : 'border-gray-300 text-charcoal hover:border-charcoal'
                      )}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => canAdvance1 && setStep(2)}
              disabled={!canAdvance1}
              className="flex items-center gap-2 px-8 py-3.5 bg-charcoal text-white text-sm font-sans font-medium tracking-wider hover:bg-black transition-colors disabled:opacity-40"
            >
              Continue — Choose Date & Time <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Date & Time ── */}
        {step === 2 && (
          <div>
            <h2 className="font-serif text-2xl font-light text-charcoal mb-2">Choose a date and time</h2>
            <p className="text-sm font-sans text-gray-500 mb-6">All times are in GMT/BST. Appointments last approximately 45–60 minutes.</p>

            {/* Date grid */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-8">
              {dateList.map(({ date, label, day, available }) => {
                const isSelected = selDate?.toDateString() === date.toDateString();
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => available && setSelDate(date)}
                    disabled={!available}
                    className={cn(
                      'flex flex-col items-center py-3 px-2 border transition-all',
                      isSelected   ? 'border-charcoal bg-charcoal text-white'
                      : available  ? 'border-gray-200 hover:border-charcoal text-charcoal'
                      :              'border-gray-100 text-gray-300 cursor-not-allowed'
                    )}
                  >
                    <span className="text-[9px] font-sans uppercase tracking-wider">{day}</span>
                    <span className={cn('text-[13px] font-sans font-bold mt-1', isSelected ? 'text-white' : '')}>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Time slots */}
            {selDate && (
              <div>
                <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-charcoal mb-3">
                  Available times for {selDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-8">
                  {TIME_SLOTS.map(slot => {
                    const avail = slotAvailable(selDate, slot);
                    const isSel = selSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => avail && setSelSlot(slot)}
                        disabled={!avail}
                        className={cn(
                          'py-2.5 border text-[12px] font-sans font-medium transition-all',
                          isSel  ? 'bg-charcoal border-charcoal text-white'
                          : avail ? 'border-gray-200 hover:border-charcoal text-charcoal'
                          :         'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-1 px-5 py-3 border border-gray-300 text-sm font-sans text-gray-600 hover:border-charcoal hover:text-charcoal transition-colors">
                <ChevronLeft size={14} /> Back
              </button>
              <button onClick={() => canAdvance2 && setStep(3)}
                disabled={!canAdvance2}
                className="flex items-center gap-2 px-8 py-3 bg-charcoal text-white text-sm font-sans font-medium tracking-wider hover:bg-black transition-colors disabled:opacity-40">
                Continue — Your Details <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Your details ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h2 className="font-serif text-2xl font-light text-charcoal mb-2">Your details</h2>
            <p className="text-sm font-sans text-gray-500 mb-8">We'll use these to confirm your appointment and send a reminder.</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[11px] font-sans uppercase tracking-wider text-charcoal block mb-1.5">First Name *</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} required
                  className="w-full border border-gray-300 px-4 py-3 text-sm font-sans text-charcoal focus:outline-none focus:border-charcoal transition-colors" />
              </div>
              <div>
                <label className="text-[11px] font-sans uppercase tracking-wider text-charcoal block mb-1.5">Last Name *</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} required
                  className="w-full border border-gray-300 px-4 py-3 text-sm font-sans text-charcoal focus:outline-none focus:border-charcoal transition-colors" />
              </div>
              <div>
                <label className="text-[11px] font-sans uppercase tracking-wider text-charcoal block mb-1.5">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full border border-gray-300 px-4 py-3 text-sm font-sans text-charcoal focus:outline-none focus:border-charcoal transition-colors" />
              </div>
              <div>
                <label className="text-[11px] font-sans uppercase tracking-wider text-charcoal block mb-1.5">Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 text-sm font-sans text-charcoal focus:outline-none focus:border-charcoal transition-colors" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[11px] font-sans uppercase tracking-wider text-charcoal block mb-1.5">What are you looking for? *</label>
                <select value={purpose} onChange={e => setPurpose(e.target.value)} required
                  className="w-full border border-gray-300 px-4 py-3 text-sm font-sans text-charcoal bg-white focus:outline-none focus:border-charcoal transition-colors">
                  <option value="">Please select</option>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-sans uppercase tracking-wider text-charcoal block mb-1.5">Budget Range *</label>
                <select value={budget} onChange={e => setBudget(e.target.value)} required
                  className="w-full border border-gray-300 px-4 py-3 text-sm font-sans text-charcoal bg-white focus:outline-none focus:border-charcoal transition-colors">
                  <option value="">Please select</option>
                  {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[11px] font-sans uppercase tracking-wider text-charcoal block mb-1.5">
                Tell us more <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Any specific pieces you've seen, ring sizes, metal preferences..."
                className="w-full border border-gray-300 px-4 py-3 text-sm font-sans text-charcoal focus:outline-none focus:border-charcoal transition-colors resize-none" />
            </div>

            <div className="mb-8">
              <label className="text-[11px] font-sans uppercase tracking-wider text-charcoal block mb-1.5">
                How did you hear about us? <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <select value={referral} onChange={e => setReferral(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 text-sm font-sans text-charcoal bg-white focus:outline-none focus:border-charcoal transition-colors">
                <option value="">Please select</option>
                {REFERRALS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Summary of booking */}
            <div className="bg-gray-50 border border-gray-200 p-4 mb-8 text-sm font-sans">
              <p className="font-semibold text-charcoal mb-2 text-[11px] uppercase tracking-wider">Booking Summary</p>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <span className="text-gray-500">Type:</span>
                <span className="text-charcoal font-medium">{type === 'virtual' ? `Virtual (${platform})` : 'In-Store London'}</span>
                <span className="text-gray-500">Date:</span>
                <span className="text-charcoal font-medium">{selDate ? formatDate(selDate) : '—'}</span>
                <span className="text-gray-500">Time:</span>
                <span className="text-charcoal font-medium">{selSlot || '—'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)}
                className="flex items-center gap-1 px-5 py-3.5 border border-gray-300 text-sm font-sans text-gray-600 hover:border-charcoal hover:text-charcoal transition-colors">
                <ChevronLeft size={14} /> Back
              </button>
              <button type="submit" disabled={!canSubmit}
                className="flex items-center gap-2 px-8 py-3.5 bg-charcoal text-white text-sm font-sans font-medium tracking-wider hover:bg-black transition-colors disabled:opacity-40">
                Confirm Appointment <Check size={15} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
