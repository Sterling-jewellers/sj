'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface ContactForm { name: string; email: string; phone?: string; subject: string; message: string; }

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ContactForm>();

  const onSubmit = async (_data: ContactForm) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="bg-ivory py-16">
      <div className="page-container">
        <div className="text-center mb-14">
          <p className="section-subtitle mb-3">Get In Touch</p>
          <h1 className="section-title">Contact Us</h1>
          <div className="gold-divider mt-4" />
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Info */}
          <div className="space-y-8">
            {[
              { icon: Phone, title: 'Call Us', lines: ['0800 123 4567', 'Mon–Sat 9am–6pm'] },
              { icon: Mail, title: 'Email Us', lines: ['hello@sterlingjewellers.co.uk', 'We reply within 2 hours'] },
              { icon: MapPin, title: 'Visit Us', lines: ['48 Bond Street', 'London, W1S 1RB'] },
              { icon: Clock, title: 'Opening Hours', lines: ['Mon–Sat: 9am–6pm', 'Sunday: 11am–5pm'] },
            ].map(({ icon: Icon, title, lines }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 border border-gold-300 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-gold-500" />
                </div>
                <div>
                  <p className="font-sans font-semibold text-sm text-charcoal mb-1">{title}</p>
                  {lines.map((line, i) => <p key={i} className="text-sm font-sans text-gray-500">{line}</p>)}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white p-8">
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                <h3 className="font-serif text-2xl text-charcoal mb-2">Message Sent!</h3>
                <p className="text-sm font-sans text-gray-500">Thank you for contacting us. We'll get back to you within 2 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-sans font-medium tracking-widest uppercase text-charcoal mb-2">Full Name</label>
                    <input {...register('name', { required: 'Required' })} className="input-field" />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-sans font-medium tracking-widest uppercase text-charcoal mb-2">Email</label>
                    <input {...register('email', { required: 'Required' })} type="email" className="input-field" />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-sans font-medium tracking-widest uppercase text-charcoal mb-2">Phone <span className="text-gray-400">(optional)</span></label>
                  <input {...register('phone')} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-sans font-medium tracking-widest uppercase text-charcoal mb-2">Subject</label>
                  <select {...register('subject', { required: 'Required' })} className="input-field">
                    <option value="">Select a subject</option>
                    <option>Product Enquiry</option>
                    <option>Custom Ring / Bespoke Order</option>
                    <option>Order Status</option>
                    <option>Returns & Exchanges</option>
                    <option>Ring Sizing</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-sans font-medium tracking-widest uppercase text-charcoal mb-2">Message</label>
                  <textarea {...register('message', { required: 'Required' })} rows={5} className="input-field resize-none" />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-gold flex items-center gap-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
