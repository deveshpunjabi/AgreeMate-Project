'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, Shield, Clock, Send, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'Support',
    message: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const subjectParam = params.get('subject');
      if (subjectParam) {
        setFormData((prev) => {
          if (!prev.subject) {
            return { ...prev, subject: subjectParam };
          }
          return prev;
        });
      }
    }
  }, []);

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email is invalid';
    }
    if (!formData.subject.trim()) tempErrors.subject = 'Subject is required';
    if (!formData.message.trim()) {
      tempErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      tempErrors.message = 'Message must be at least 10 characters';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    setIsSuccess(true);

    // Trigger premium confetti explosion
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#0068a3', '#0ea5e9', '#38bdf8', '#0284c7'],
    });
  };

  return (
    <section className="relative bg-gradient-to-b from-[#0ea5e9]/5 via-transparent to-transparent py-12 md:py-20 animate-[fadeInUp_0.8s_ease-out]">
      <div className="container max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <div className="badge-premium mb-4 inline-block bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm rounded-full px-4 py-1 font-display font-normal text-[#003a5e] tracking-tight">Contact us</div>
          <h1 className="font-display font-normal text-[#003a5e] tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-6">
            We're here to help you <br />
            keep lending <span className="text-[#0ea5e9] italic font-serif">clear.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed font-body text-[#1e2c3a]/80">
            Have a question about SHA-256 evidence keys, digital locks, or security? 
            Reach out to us and we'll get back to you within 24 hours.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] items-start">
          {/* Contact Information Side */}
          <div className="flex flex-col gap-6">
            <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl rounded-[24px] p-8 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/90">
              <h3 className="font-display font-normal tracking-tight text-xl text-[#003a5e] mb-6">Reach out directly</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] transition-transform duration-500 group-hover:scale-110">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#1e2c3a]/60 mb-1">General Support</h4>
                    <a href="mailto:support@agreemate.com" className="text-sm font-medium text-[#003a5e] hover:text-[#0ea5e9] transition-colors">
                      support@agreemate.com
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] transition-transform duration-500 group-hover:scale-110">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#1e2c3a]/60 mb-1">Security & Abuse</h4>
                    <a href="mailto:security@agreemate.com" className="text-sm font-medium text-[#003a5e] hover:text-[#0ea5e9] transition-colors">
                      security@agreemate.com
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] transition-transform duration-500 group-hover:scale-110">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#1e2c3a]/60 mb-1">Partnerships & Media</h4>
                    <a href="mailto:partners@agreemate.com" className="text-sm font-medium text-[#003a5e] hover:text-[#0ea5e9] transition-colors">
                      partners@agreemate.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl rounded-[24px] p-8 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/90 flex gap-4 group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] transition-transform duration-500 group-hover:scale-110">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#003a5e] mb-1">Operating Hours</h4>
                <p className="text-xs font-body text-[#1e2c3a]/80 leading-relaxed">
                  Our core support hours are Monday through Friday, 9:00 AM to 6:00 PM IST. 
                  Critical security reports are monitored 24/7.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form Side */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl rounded-[28px] p-8 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-[#0ea5e9]/5 pointer-events-none" />
            <div className="relative z-10">
            {isSuccess ? (
              <div className="py-12 text-center flex flex-col items-center animate-[fadeInUp_0.5s_ease-out]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] mb-6">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-2xl text-[#003a5e] font-display font-normal tracking-tight mb-3">Message Sent Successfully!</h3>
                <p className="max-w-md text-sm font-body text-[#1e2c3a]/80 mb-8 leading-relaxed">
                  Thank you for reaching out, {formData.name}. We have received your inquiry regarding "{formData.subject}" and our team will get back to you shortly.
                </p>
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({ name: '', email: '', subject: '', category: 'Support', message: '' });
                  }}
                  className="bg-transparent border border-[#0ea5e9]/30 text-[#0ea5e9] hover:bg-[#0ea5e9]/5 px-6 py-2.5 rounded-full text-xs font-bold transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1e2c3a]/60 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full bg-white/50 border border-white/80 focus:border-[#0ea5e9]/50 focus:ring-2 focus:ring-[#0ea5e9]/20 rounded-xl py-3 px-4 text-sm text-[#003a5e] placeholder:text-[#1e2c3a]/40 transition-all outline-none"
                    />
                    {errors.name && <span className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1e2c3a]/60 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      className="w-full bg-white/50 border border-white/80 focus:border-[#0ea5e9]/50 focus:ring-2 focus:ring-[#0ea5e9]/20 rounded-xl py-3 px-4 text-sm text-[#003a5e] placeholder:text-[#1e2c3a]/40 transition-all outline-none"
                    />
                    {errors.email && <span className="text-[10px] text-red-500 font-bold mt-1">{errors.email}</span>}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-[1.5fr_1fr]">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1e2c3a]/60 uppercase tracking-wider">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      className="w-full bg-white/50 border border-white/80 focus:border-[#0ea5e9]/50 focus:ring-2 focus:ring-[#0ea5e9]/20 rounded-xl py-3 px-4 text-sm text-[#003a5e] placeholder:text-[#1e2c3a]/40 transition-all outline-none"
                    />
                    {errors.subject && <span className="text-[10px] text-red-500 font-bold mt-1">{errors.subject}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1e2c3a]/60 uppercase tracking-wider">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-white/50 border border-white/80 focus:border-[#0ea5e9]/50 focus:ring-2 focus:ring-[#0ea5e9]/20 rounded-xl py-3 px-4 text-sm text-[#003a5e] transition-all outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%23003a5e%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
                    >
                      <option value="Support">Product Support</option>
                      <option value="Security">Security Issue</option>
                      <option value="Billing">Billing / Account</option>
                      <option value="Partnerships">Partnership Query</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1e2c3a]/60 uppercase tracking-wider">Your Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe your query in detail..."
                    className="w-full bg-white/50 border border-white/80 focus:border-[#0ea5e9]/50 focus:ring-2 focus:ring-[#0ea5e9]/20 rounded-xl py-3 px-4 text-sm text-[#003a5e] placeholder:text-[#1e2c3a]/40 transition-all outline-none resize-none"
                  />
                  {errors.message && <span className="text-[10px] text-red-500 font-bold mt-1">{errors.message}</span>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0ea5e9] text-white py-3.5 px-6 rounded-full font-body font-medium text-sm shadow-md hover:bg-[#0284c7] hover:shadow-lg w-full flex items-center justify-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Sending message...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                    </>
                  )}
                </button>
              </form>
            )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
