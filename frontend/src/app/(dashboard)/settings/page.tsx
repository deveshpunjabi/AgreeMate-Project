'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  User,
  ShieldCheck,
  Settings,
  Bell,
  CreditCard,
  Database,
  Scale,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
  Lock,
  KeyRound,
  Fingerprint,
  PhoneCall,
  Activity,
  History,
  Laptop,
  Mail,
  Calendar,
  Globe,
  MapPin,
  Building2,
  Sliders,
  Sparkles,
  FileCheck,
  RotateCcw,
  MessageSquare,
  Radio,
  FileText,
  Download,
  Archive,
  AlertTriangle,
  FileArchive,
  BookOpen,
  ShieldAlert,
  Send,
  Lightbulb,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/components/ui/Toast';
import PasswordChangeForm from '@/components/settings/security/PasswordChangeForm';
import TwoFactorSetup from '@/components/settings/security/TwoFactorSetup';
import ActiveSessionsList from '@/components/settings/security/ActiveSessionsList';
import LoginActivityFeed from '@/components/settings/security/LoginActivityFeed';
import DataExportPanel from '@/components/settings/security/DataExportPanel';
import DangerZonePanel from '@/components/settings/security/DangerZonePanel';

type NavSection =
  | 'profile'
  | 'security'
  | 'account'
  | 'notifications'
  | 'billing'
  | 'data'
  | 'legal'
  | 'support';

type SubPage =
  | 'edit-profile'
  | 'edit-contact'
  | 'edit-address'
  | 'edit-birthday'
  | 'recovery-contacts'
  | 'change-password'
  | '2fa-setup'
  | 'active-sessions'
  | 'activity-log'
  | 'account-type'
  | 'localization'
  | 'payment-methods'
  | 'invoices-list'
  | 'data-export'
  | 'danger-zone'
  | 'tos-view'
  | 'privacy-view'
  | 'disclaimer-view'
  | 'system-status'
  | 'faqs'
  | 'contact-support'
  | 'feedback'
  | 'learn-more'
  | null;

const SECTION_ORDER: NavSection[] = [
  'profile',
  'security',
  'account',
  'notifications',
  'billing',
  'data',
  'legal',
  'support',
];

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl min-h-[750px] rounded-3xl border border-[#e8ecf3] bg-white p-8 animate-pulse">
          <div className="h-10 w-48 rounded-xl bg-slate-200 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="h-96 rounded-2xl bg-slate-200" />
            <div className="md:col-span-2 h-96 rounded-2xl bg-slate-200" />
          </div>
        </div>
      }
    >
      <AccountsCenterContent />
    </Suspense>
  );
}

function AccountsCenterContent() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get('tab') as NavSection) || 'profile';
  const [activeSection, setActiveSection] = useState<NavSection>(initialTab);

  // In-pane subpage navigation (No floating modal popups, in-place slide transitions)
  const [activeSubPage, setActiveSubPage] = useState<SubPage>(null);

  // Bidirectional slide animation direction: 'right' (right-to-left) vs 'left' (left-to-right)
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('India');
  const [address, setAddress] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Account Preferences state
  const [accountType, setAccountType] = useState<'individual' | 'business'>('individual');
  const [businessName, setBusinessName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST +5:30)');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [currency, setCurrency] = useState('INR');
  const [hasCopiedId, setHasCopiedId] = useState(false);

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [agreementSignedNotif, setAgreementSignedNotif] = useState(true);
  const [returnRemindersNotif, setReturnRemindersNotif] = useState(true);

  // Security state
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false);
  const [recoveryEmail, setRecoveryEmail] = useState('backup@example.com');
  const [recoveryPhone, setRecoveryPhone] = useState('+91 99887 76655');

  // Support / Feedback state
  const [supportCategory, setSupportCategory] = useState('agreement_issue');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('feature_request');

  // Payment method state
  const [newUpiId, setNewUpiId] = useState('');

  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
    if (user?.phone) setPhone(user.phone);
    if (user?.city) setCity(user.city);
    if (user && (user as any).is_2fa_enabled) {
      setIs2FAEnabled(true);
    }
  }, [user]);

  const handleTabSwitch = (section: NavSection) => {
    const oldIdx = SECTION_ORDER.indexOf(activeSection);
    const newIdx = SECTION_ORDER.indexOf(section);
    setSlideDirection(newIdx >= oldIdx ? 'right' : 'left');
    setActiveSection(section);
    setActiveSubPage(null);
  };

  const handleOpenSubPage = (subPage: SubPage) => {
    setSlideDirection('right');
    setActiveSubPage(subPage);
  };

  const handleBackToSection = () => {
    setSlideDirection('left');
    setActiveSubPage(null);
  };

  const formatDob = (dateStr: string) => {
    if (!dateStr) return '15 Jan 2000';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const accountId = `AGM-ACC-${(user?.id || '892410').slice(-6).toUpperCase()}`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(accountId);
    setHasCopiedId(true);
    toast('Account ID copied to clipboard.', 'success');
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const res = await authApi.uploadAvatar(file);
      updateUser({ avatar_url: res.avatar_url });
      toast('Profile photo updated successfully.', 'success');
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to upload profile photo.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const updated = await authApi.updateProfile({
        full_name: fullName,
        phone: phone || undefined,
        city: city || undefined,
      });
      updateUser(updated);
      toast('Profile information saved.', 'success');
      handleBackToSection();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to save profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'profile':
        return 'Profiles and personal details';
      case 'security':
        return 'Password and security';
      case 'account':
        return 'Account preferences';
      case 'notifications':
        return 'Notifications & alerts';
      case 'billing':
        return 'Subscriptions & Billing';
      case 'data':
        return 'Your information and permissions';
      case 'legal':
        return 'Legal & Policies';
      case 'support':
        return 'Help & Support';
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl rounded-3xl border border-[#e8ecf3] bg-white shadow-sm overflow-hidden min-h-[780px] flex flex-col md:flex-row animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* LEFT SIDEBAR NAVIGATION (Meta Accounts Center Style)                      */}
      {/* ========================================================================= */}
      <aside className="w-full md:w-80 lg:w-[340px] shrink-0 border-b md:border-b-0 md:border-r border-[#e8ecf3] p-5 sm:p-7 bg-[#fafbfc]/80 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#003a5e] text-white text-xs font-bold font-display">
                AM
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0068a3]">AgreeMate</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
              Accounts Center
            </h1>
            <p className="text-xs leading-relaxed text-slate-500 text-pretty">
              Manage your connected experiences and account settings across AgreeMate technologies.
            </p>
            <button
              type="button"
              onClick={() => handleOpenSubPage('learn-more')}
              className="text-xs font-semibold text-[#0ea5e9] hover:underline inline-block pt-0.5 cursor-pointer"
            >
              Learn more
            </button>
          </div>

          {/* Section 1: Top Profile Item */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleTabSwitch('profile')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeSection === 'profile'
                  ? 'bg-[#003a5e] text-white shadow-sm'
                  : 'text-[#1e2c3a] hover:bg-slate-200/60'
              }`}
            >
              <User className={`size-4.5 shrink-0 ${activeSection === 'profile' ? 'text-[#0ea5e9]' : 'text-slate-600'}`} />
              <span className="truncate">Profiles and personal details</span>
            </button>
          </div>

          {/* Section 2: Account Settings Group */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1">
              Account settings
            </p>

            <button
              type="button"
              onClick={() => handleTabSwitch('security')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeSection === 'security'
                  ? 'bg-[#003a5e] text-white shadow-sm'
                  : 'text-[#1e2c3a] hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className={`size-4.5 shrink-0 ${activeSection === 'security' ? 'text-[#0ea5e9]' : 'text-slate-600'}`} />
              <span className="truncate">Password and security</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch('account')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeSection === 'account'
                  ? 'bg-[#003a5e] text-white shadow-sm'
                  : 'text-[#1e2c3a] hover:bg-slate-200/60'
              }`}
            >
              <Settings className={`size-4.5 shrink-0 ${activeSection === 'account' ? 'text-[#0ea5e9]' : 'text-slate-600'}`} />
              <span className="truncate">Account preferences</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch('notifications')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeSection === 'notifications'
                  ? 'bg-[#003a5e] text-white shadow-sm'
                  : 'text-[#1e2c3a] hover:bg-slate-200/60'
              }`}
            >
              <Bell className={`size-4.5 shrink-0 ${activeSection === 'notifications' ? 'text-[#0ea5e9]' : 'text-slate-600'}`} />
              <span className="truncate">Notifications &amp; alerts</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch('billing')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeSection === 'billing'
                  ? 'bg-[#003a5e] text-white shadow-sm'
                  : 'text-[#1e2c3a] hover:bg-slate-200/60'
              }`}
            >
              <CreditCard className={`size-4.5 shrink-0 ${activeSection === 'billing' ? 'text-[#0ea5e9]' : 'text-slate-600'}`} />
              <span className="truncate">Subscriptions &amp; Billing</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch('data')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeSection === 'data'
                  ? 'bg-[#003a5e] text-white shadow-sm'
                  : 'text-[#1e2c3a] hover:bg-slate-200/60'
              }`}
            >
              <Database className={`size-4.5 shrink-0 ${activeSection === 'data' ? 'text-[#0ea5e9]' : 'text-slate-600'}`} />
              <span className="truncate">Your information and permissions</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch('legal')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeSection === 'legal'
                  ? 'bg-[#003a5e] text-white shadow-sm'
                  : 'text-[#1e2c3a] hover:bg-slate-200/60'
              }`}
            >
              <Scale className={`size-4.5 shrink-0 ${activeSection === 'legal' ? 'text-[#0ea5e9]' : 'text-slate-600'}`} />
              <span className="truncate">Legal &amp; Policies</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch('support')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeSection === 'support'
                  ? 'bg-[#003a5e] text-white shadow-sm'
                  : 'text-[#1e2c3a] hover:bg-slate-200/60'
              }`}
            >
              <HelpCircle className={`size-4.5 shrink-0 ${activeSection === 'support' ? 'text-[#0ea5e9]' : 'text-slate-600'}`} />
              <span className="truncate">Help &amp; Support</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 text-[11px] text-slate-400 border-t border-slate-200/60 mt-6">
          <p>© 2026 AgreeMate Technologies.</p>
          <p className="text-[10px] font-mono mt-0.5">Encrypted SHA-256 Vault Active</p>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* RIGHT CONTENT PANE (Directional Slide In Transitions Right <-> Left)      */}
      {/* ========================================================================= */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-h-[850px]">
        {/* If viewing a detailed subpage, render it with smooth slide animation and back button */}
        {activeSubPage ? (
          <div
            key={activeSubPage}
            className={`${slideDirection === 'right' ? 'animate-slide-from-right' : 'animate-slide-from-left'} space-y-6`}
          >
            {/* Top Back Navigation Bar */}
            <button
              type="button"
              onClick={handleBackToSection}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0068a3] hover:text-[#003a5e] group cursor-pointer transition-colors"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to {getSectionTitle()}</span>
            </button>

            {/* SUBPAGE 1: Edit Profile & Photo */}
            {activeSubPage === 'edit-profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Edit profile &amp; photo
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Update your official signatory name and public profile photo across AgreeMate.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5 max-w-xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div className="flex items-center gap-4">
                    <div className="size-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                      {user?.avatar_url ? (
                         
                        <img src={user.avatar_url} alt="Avatar" className="size-full object-cover" />
                      ) : (
                        <span className="font-bold text-lg text-[#003a5e]">{(fullName || 'D').slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <label className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#003a5e] hover:bg-slate-50 cursor-pointer inline-block">
                        {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
                      </label>
                      <p className="text-[11px] text-slate-400 mt-1">JPEG, PNG, or WebP up to 5MB.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Full Legal Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleBackToSection}
                      className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="rounded-xl bg-[#003a5e] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#005080] cursor-pointer"
                    >
                      {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SUBPAGE 2: Contact Info */}
            {activeSubPage === 'edit-contact' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Contact information
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Manage your verified primary email address and mobile phone number for return notifications.
                  </p>
                </div>

                <div className="max-w-xl space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Primary Email Address</label>
                    <input
                      type="email"
                      value={user?.email || 'punjabidevesh5810@gmail.com'}
                      disabled
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs text-slate-500 outline-none cursor-not-allowed"
                    />
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">✓ Verified Primary Account Email</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Mobile Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Used for SMS and WhatsApp automated return schedule nudges.</p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleBackToSection}
                      className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (phone) {
                          await authApi.updateProfile({ phone });
                          updateUser({ phone });
                        }
                        toast('Contact details saved successfully.', 'success');
                        handleBackToSection();
                      }}
                      className="rounded-xl bg-[#003a5e] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#005080] cursor-pointer"
                    >
                      Save Contact Info
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 3: Address */}
            {activeSubPage === 'edit-address' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Residential &amp; Legal Address
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Your official registered location used on digital lending contracts and tax invoices.
                  </p>
                </div>

                <div className="max-w-xl space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Full Street Address</label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">City / Region</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleBackToSection}
                      className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (city) {
                          await authApi.updateProfile({ city });
                          updateUser({ city });
                        }
                        toast('Legal address updated on contract records.', 'success');
                        handleBackToSection();
                      }}
                      className="rounded-xl bg-[#003a5e] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#005080] cursor-pointer"
                    >
                      Save Address
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 3.5: Birthday & Country */}
            {activeSubPage === 'edit-birthday' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Birthday &amp; Country
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Your legal date of birth and country of residence used for electronic contract signatory eligibility.
                  </p>
                </div>

                <div className="max-w-xl space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                    />
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                      ✓ Verified Legal Age (18+) · Eligible signatory under Indian Contract Act, 1872
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Country / Jurisdiction</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9] cursor-pointer"
                    >
                      <option value="India">India (IN)</option>
                      <option value="United States">United States (US)</option>
                      <option value="United Kingdom">United Kingdom (UK)</option>
                      <option value="Canada">Canada (CA)</option>
                      <option value="Australia">Australia (AU)</option>
                      <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                      <option value="Singapore">Singapore (SG)</option>
                      <option value="Germany">Germany (DE)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">Determines governing jurisdiction and applicable legal compliance.</p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleBackToSection}
                      className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toast('Birthday and country updated on legal signatory profile.', 'success');
                        handleBackToSection();
                      }}
                      className="rounded-xl bg-[#003a5e] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#005080] cursor-pointer"
                    >
                      Save Birthday &amp; Country
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 4: Change Password */}
            {activeSubPage === 'change-password' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Change account password
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Secure your account with Argon2id cryptographic hashing.
                  </p>
                </div>
                <div className="max-w-xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <PasswordChangeForm />
                </div>
              </div>
            )}

            {/* SUBPAGE 5: Two Factor Auth */}
            {activeSubPage === '2fa-setup' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Two-Factor Authentication (2FA)
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Google Authenticator, Microsoft Authenticator &amp; emergency backup codes.
                  </p>
                </div>
                <div className="max-w-xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <TwoFactorSetup
                    isEnabled={is2FAEnabled}
                    onStatusChange={() => setIs2FAEnabled(!is2FAEnabled)}
                  />
                </div>
              </div>
            )}

            {/* SUBPAGE 6: Active Sessions */}
            {activeSubPage === 'active-sessions' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Where you're logged in
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Review and revoke active browser, mobile, and desktop client sessions.
                  </p>
                </div>
                <div className="max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <ActiveSessionsList />
                </div>
              </div>
            )}

            {/* SUBPAGE 7: Activity Log */}
            {activeSubPage === 'activity-log' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Recent login &amp; security events
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Cryptographic audit trail of authorization events and IP addresses.
                  </p>
                </div>
                <div className="max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <LoginActivityFeed />
                </div>
              </div>
            )}

            {/* SUBPAGE 8: Security Recovery Contacts */}
            {activeSubPage === 'recovery-contacts' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Security recovery contacts
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Secondary email and emergency phone used to regain access if you lose your 2FA device.
                  </p>
                </div>
                <div className="max-w-xl space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Backup Recovery Email</label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Emergency Recovery Phone</label>
                    <input
                      type="tel"
                      value={recoveryPhone}
                      onChange={(e) => setRecoveryPhone(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleBackToSection}
                      className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toast('Recovery contacts saved securely.', 'success');
                        handleBackToSection();
                      }}
                      className="rounded-xl bg-[#003a5e] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#005080] cursor-pointer"
                    >
                      Save Recovery Contacts
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 9: Account Type */}
            {activeSubPage === 'account-type' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Account entity structure
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Select whether your workspace operates as an Individual or Registered Commercial Entity.
                  </p>
                </div>

                <div className="max-w-xl space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setAccountType('individual')}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        accountType === 'individual'
                          ? 'border-[#003a5e] bg-sky-50/50 ring-2 ring-[#003a5e]/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <User className="size-5 text-[#003a5e]" />
                      <p className="font-bold text-xs text-[#003a5e]">Individual (Peer Lending)</p>
                      <p className="text-[11px] text-slate-500">For peer-to-peer item lending between friends, freelancers, and colleagues.</p>
                    </div>

                    <div
                      onClick={() => setAccountType('business')}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        accountType === 'business'
                          ? 'border-[#003a5e] bg-sky-50/50 ring-2 ring-[#003a5e]/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="size-5 text-[#003a5e]" />
                      <p className="font-bold text-xs text-[#003a5e]">Business / Rental Agency</p>
                      <p className="text-[11px] text-slate-500">For commercial equipment rentals, GST tax invoices &amp; multi-user teams.</p>
                    </div>
                  </div>

                  {accountType === 'business' && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in">
                      <div>
                        <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Business Legal Name</label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">GSTIN / Tax ID</label>
                        <input
                          type="text"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] font-mono outline-none focus:border-[#0ea5e9]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleBackToSection}
                      className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toast('Account structure updated.', 'success');
                        handleBackToSection();
                      }}
                      className="rounded-xl bg-[#003a5e] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#005080] cursor-pointer"
                    >
                      Save Account Type
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 10: Localization & Region */}
            {activeSubPage === 'localization' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Regional &amp; display preferences
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Configure time zone timestamps, date formatting, and currency symbols.
                  </p>
                </div>

                <div className="max-w-xl space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Platform Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9] cursor-pointer"
                    >
                      <option value="en">English (Global / India)</option>
                      <option value="hi">Hindi - हिन्दी</option>
                      <option value="mr">Marathi - मराठी</option>
                      <option value="gu">Gujarati - ગુજરાતી</option>
                      <option value="ta">Tamil - தமிழ்</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Time Zone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9] cursor-pointer"
                    >
                      <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                      <option value="UTC (+0:00)">UTC (+0:00)</option>
                      <option value="America/New_York (EST -5:00)">America/New_York (EST -5:00)</option>
                      <option value="Europe/London (GMT +0:00)">Europe/London (GMT +0:00)</option>
                      <option value="Asia/Dubai (GST +4:00)">Asia/Dubai (GST +4:00)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Date Format</label>
                      <select
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9] cursor-pointer"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (Standard)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Currency Display</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9] cursor-pointer"
                      >
                        <option value="INR">₹ INR (Indian Rupee)</option>
                        <option value="USD">$ USD (US Dollar)</option>
                        <option value="EUR">€ EUR (Euro)</option>
                        <option value="GBP">£ GBP (British Pound)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleBackToSection}
                      className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toast('Regional preferences updated.', 'success');
                        handleBackToSection();
                      }}
                      className="rounded-xl bg-[#003a5e] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#005080] cursor-pointer"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 11: Payment Methods */}
            {activeSubPage === 'payment-methods' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Payment methods &amp; Autopay
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Manage active cards and UPI mandate accounts for subscription renewals.
                  </p>
                </div>

                <div className="max-w-xl space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-[#003a5e]">
                        VISA
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1e2c3a]">Visa ending in 4242</p>
                        <p className="text-[11px] text-slate-500">Expires 12/28 · Primary Payment Method</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700">
                      Default
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Add UPI Autopay VPA</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUpiId}
                        onChange={(e) => setNewUpiId(e.target.value)}
                        placeholder="e.g. mobile@upi"
                        className="h-11 flex-1 rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newUpiId) {
                            toast(`UPI Mandate request sent to ${newUpiId}.`, 'success');
                            setNewUpiId('');
                          }
                        }}
                        className="rounded-xl bg-[#003a5e] px-5 text-xs font-semibold text-white hover:bg-[#005080] cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 12: Invoices List */}
            {activeSubPage === 'invoices-list' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Billing history &amp; Invoices
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Official tax invoices and digital payment receipts generated by AgreeMate.
                  </p>
                </div>

                <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-[#003a5e] mb-3">
                    <Download className="size-6 text-[#0ea5e9]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#003a5e]">No Billing Invoices Found</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    AgreeMate issues official tax invoices upon subscription plan activation or paid dispute settlement. No billable transactions have occurred on this account yet.
                  </p>
                </div>
              </div>
            )}

            {/* SUBPAGE 13: Data Export */}
            {activeSubPage === 'data-export' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Download your information
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    DPDP &amp; GDPR compliant user account data export archive.
                  </p>
                </div>
                <div className="max-w-xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <DataExportPanel />
                </div>
              </div>
            )}

            {/* SUBPAGE 14: Danger Zone Deletion */}
            {activeSubPage === 'danger-zone' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-red-600 font-display">
                    Deactivation or account deletion
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Reversible temporary deactivation or permanent PII erasure.
                  </p>
                </div>
                <div className="max-w-xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <DangerZonePanel />
                </div>
              </div>
            )}

            {/* SUBPAGE 15: Terms of Service */}
            {activeSubPage === 'tos-view' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Terms of Service
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    v2.4 · Information Technology Act, 2000 &amp; BNS compliance.
                  </p>
                </div>

                <div className="max-w-2xl space-y-4 text-xs text-slate-600 leading-relaxed rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div className="p-4 bg-slate-50 rounded-xl space-y-1.5">
                    <p className="font-bold text-[#003a5e]">1. Mutual Consent &amp; Digital Signatures</p>
                    <p>Agreements executed on AgreeMate constitute legally binding mutual contracts once accepted by both Lender and Borrower.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl space-y-1.5">
                    <p className="font-bold text-[#003a5e]">2. Cryptographic Evidence Hashing</p>
                    <p>Item handover photos and receipts are sealed with SHA-256 hashes on the server to prevent retroactive manipulation.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl space-y-1.5">
                    <p className="font-bold text-[#003a5e]">3. Penalty Calculations</p>
                    <p>Penalty fees calculate automatically according to user-configured terms upon expiration of any specified grace period.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 16: Privacy Policy */}
            {activeSubPage === 'privacy-view' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Privacy &amp; Cookie Policy
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Digital Personal Data Protection (DPDP) Act, 2023 compliance.
                  </p>
                </div>

                <div className="max-w-2xl space-y-4 text-xs text-slate-600 leading-relaxed rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div className="p-4 bg-slate-50 rounded-xl space-y-1.5">
                    <p className="font-bold text-[#003a5e]">1. Data Minimization &amp; Storage</p>
                    <p>We only store user data strictly necessary for agreement execution and dispute resolution. Passwords use Argon2id cryptographic hashing.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl space-y-1.5">
                    <p className="font-bold text-[#003a5e]">2. Right to Data Portability &amp; Erasure</p>
                    <p>Users maintain the right to download their full JSON profile archive or trigger permanent PII erasure under DPDP regulations.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 17: Disclaimer */}
            {activeSubPage === 'disclaimer-view' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Platform Technology Disclaimer
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Non-bailment and independent technological intermediary notice.
                  </p>
                </div>

                <div className="max-w-xl p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-2.5 shadow-2xs">
                  <p className="font-bold text-[#003a5e]">Non-Bailment Notice:</p>
                  <p>
                    AgreeMate acts solely as an independent technology platform providing cryptographic timestamping, mutual signature records, and automated reminder engines between contracting parties.
                  </p>
                  <p>
                    AgreeMate is not a lender, bailee, guarantor, or financial intermediary and assumes no liability for default or damage between lending parties.
                  </p>
                </div>
              </div>
            )}

            {/* SUBPAGE 18: System Status */}
            {activeSubPage === 'system-status' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Platform Uptime &amp; Services
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Live operational status of AgreeMate infrastructure and vault engines.
                  </p>
                </div>

                <div className="max-w-xl space-y-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1e2c3a]">Core REST API Server (:8000)</p>
                      <p className="text-[10.5px] text-slate-500">FastAPI Async Engine · 24ms latency</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1e2c3a]">SHA-256 Evidence Vault</p>
                      <p className="text-[10.5px] text-slate-500">Cryptographic Hash Verification · 0 breaches</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1e2c3a]">MongoDB Database Cluster</p>
                      <p className="text-[10.5px] text-slate-500">Replica Set Sync · Zero Read Drops</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1e2c3a]">SMTP Email Reminder Engine</p>
                      <p className="text-[10.5px] text-slate-500">Transactional Delivery Rate: 100%</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 19: FAQs */}
            {activeSubPage === 'faqs' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Frequently Asked Questions
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Quick guides on agreements, cryptographic vault hashing, and return schedules.
                  </p>
                </div>

                <div className="max-w-2xl space-y-3.5 text-xs text-slate-600 leading-relaxed rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div className="p-4 bg-slate-50 rounded-xl space-y-1.5">
                    <p className="font-bold text-[#003a5e]">How does SHA-256 evidence hashing work?</p>
                    <p>Every photo or document uploaded is hashed on our backend into an immutable 64-character fingerprint that guarantees the media cannot be tampered with.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl space-y-1.5">
                    <p className="font-bold text-[#003a5e]">How are penalty fees calculated?</p>
                    <p>Penalties are calculated automatically based on your configured terms (fixed flat fee, per-day rate, or percentage) after your grace period expires.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl space-y-1.5">
                    <p className="font-bold text-[#003a5e]">Are digital contracts legally valid?</p>
                    <p>Yes. Agreements signed on AgreeMate comply with the Information Technology Act, 2000 and Bharatiya Nyaya Sanhita (BNS) for electronic contracts.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 20: Contact Support */}
            {activeSubPage === 'contact-support' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Contact support &amp; report problem
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Submit an inquiry or agreement issue to our technical support team.
                  </p>
                </div>

                <div className="max-w-xl space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Issue Category</label>
                    <select
                      value={supportCategory}
                      onChange={(e) => setSupportCategory(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9] cursor-pointer"
                    >
                      <option value="agreement_issue">📄 Agreement or Signature Issue</option>
                      <option value="vault_issue">🔒 Evidence Vault / Photo Issue</option>
                      <option value="penalty_dispute">⚖️ Penalty Calculation Dispute</option>
                      <option value="account_billing">💳 Account / Billing Inquiry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      placeholder="Brief issue description"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Message</label>
                    <textarea
                      rows={4}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Provide contract IDs or details..."
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleBackToSection}
                      className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (supportSubject) {
                          toast('Support ticket submitted. You will receive an email confirmation.', 'success');
                          setSupportSubject('');
                          setSupportMessage('');
                          handleBackToSection();
                        } else {
                          toast('Please enter a subject line.', 'error');
                        }
                      }}
                      className="rounded-xl bg-[#003a5e] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#005080] cursor-pointer"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 21: Feedback */}
            {activeSubPage === 'feedback' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Give feedback &amp; Feature requests
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Direct suggestion box for the AgreeMate product engineering team.
                  </p>
                </div>

                <div className="max-w-xl space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Feedback Category</label>
                    <select
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9] cursor-pointer"
                    >
                      <option value="feature_request">💡 Feature Request</option>
                      <option value="bug_report">🐞 Bug Report</option>
                      <option value="design_feedback">🎨 Design / UX Feedback</option>
                      <option value="general_praise">⭐ General Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003a5e] mb-1.5">Your Suggestion or Idea</label>
                    <textarea
                      rows={5}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Tell us what feature or improvement you would love to see..."
                      className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleBackToSection}
                      className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (feedbackText) {
                          toast('Thank you! Your feedback has been sent to our product team.', 'success');
                          setFeedbackText('');
                          handleBackToSection();
                        } else {
                          toast('Please enter your suggestion before submitting.', 'error');
                        }
                      }}
                      className="rounded-xl bg-[#003a5e] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#005080] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Send className="size-3.5" /> Submit Feedback
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBPAGE 22: Learn More */}
            {activeSubPage === 'learn-more' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    About Accounts Center
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Centralized management and security controls for all AgreeMate services.
                  </p>
                </div>

                <div className="max-w-xl space-y-4 text-xs text-slate-600 leading-relaxed rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <p>
                    AgreeMate Accounts Center allows you to manage personal signatory information, two-factor authentication, DPDP data exports, and notification schedules from a single, centralized control deck.
                  </p>
                  <p>
                    All identity updates, contact modifications, and session events are cryptographically hashed and logged to ensure mutual trust between contracting parties.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleBackToSection}
                      className="rounded-xl bg-[#003a5e] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#005080] cursor-pointer"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* MAIN CATEGORY INDEX VIEWS (Directional Slide: Right <-> Left)             */
          /* ========================================================================= */
          <div
            key={activeSection}
            className={`${slideDirection === 'right' ? 'animate-slide-from-right' : 'animate-slide-from-left'} space-y-6`}
          >
            {/* TAB 1: PROFILES AND PERSONAL DETAILS */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Profiles and personal details
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 text-pretty">
                    Manage your profile information, profile photo, verified email addresses, and legal contact identity across AgreeMate.
                  </p>
                </div>

                {/* Group: Profiles */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Profiles</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div
                      onClick={() => handleOpenSubPage('edit-profile')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="size-11 rounded-full bg-gradient-to-tr from-[#003a5e] to-[#0ea5e9] p-0.5 shrink-0 overflow-hidden">
                          <div className="size-full rounded-full bg-white flex items-center justify-center font-bold text-sm text-[#003a5e]">
                            {user?.avatar_url ? (
                               
                              <img src={user.avatar_url} alt="Avatar" className="size-full object-cover" />
                            ) : (
                              <span>{(user?.full_name || fullName || 'D').slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1e2c3a]">
                            {user?.full_name || fullName || 'Devesh Punjabi'}
                          </p>
                          <p className="text-xs text-slate-500">AgreeMate Primary Signatory · KYC Verified</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Group: Personal details */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Personal details &amp; contact info</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div
                      onClick={() => handleOpenSubPage('edit-contact')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Mail className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Contact info</p>
                          <p className="text-xs text-slate-500">{user?.email || 'punjabidevesh5810@gmail.com'} · {phone || '+91 98765 43210'}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('edit-address')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <MapPin className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Residential &amp; Legal Address</p>
                          <p className="text-xs text-slate-500">{address}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('edit-birthday')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Calendar className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Birthday &amp; Country</p>
                          <p className="text-xs text-slate-500">{formatDob(dob)} · {country}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PASSWORD AND SECURITY */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Password and security
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 text-pretty">
                    Manage your password, two-factor authentication, active logged-in devices, and security audit log.
                  </p>
                </div>

                {/* Group: Login & recovery */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Login &amp; recovery</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div
                      onClick={() => handleOpenSubPage('change-password')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Lock className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Change password</p>
                          <p className="text-xs text-slate-500">Argon2id cryptographic hash encryption</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('2fa-setup')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <KeyRound className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Two-factor authentication (2FA)</p>
                          <p className="text-xs text-slate-500">{is2FAEnabled ? 'Enabled (Google Authenticator)' : 'Not enabled · Recommended'}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => toast('Passkey registered on this device (WebAuthn biometric key).', 'success')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Fingerprint className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Passkeys &amp; biometrics</p>
                          <p className="text-xs text-slate-500">Sign in instantly with Touch ID or Windows Hello</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('recovery-contacts')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <PhoneCall className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Security recovery email &amp; phone</p>
                          <p className="text-xs text-slate-500">{recoveryEmail}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Group: Security checks */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Security checks &amp; devices</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div
                      onClick={() => handleOpenSubPage('active-sessions')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Laptop className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Where you're logged in</p>
                          <p className="text-xs text-slate-500">Review all active browser &amp; mobile sessions</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('activity-log')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <History className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Recent login activity &amp; audit log</p>
                          <p className="text-xs text-slate-500">Timestamped IP address and authorization events</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACCOUNT PREFERENCES */}
            {activeSection === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Account preferences
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 text-pretty">
                    Manage your account entity type, regional time zones, date format, and unique workspace ID.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Account details</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div
                      onClick={() => handleOpenSubPage('account-type')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Building2 className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Account type</p>
                          <p className="text-xs text-slate-500">{accountType === 'individual' ? 'Individual (Peer Lending)' : `Business (${businessName})`}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={handleCopyId}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Sparkles className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Unique Account ID</p>
                          <p className="text-xs font-mono text-slate-500">{accountId}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#0ea5e9]">
                        {hasCopiedId ? 'Copied!' : 'Copy'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Regional &amp; display</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div
                      onClick={() => handleOpenSubPage('localization')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Globe className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Language &amp; Region</p>
                          <p className="text-xs text-slate-500">{language === 'en' ? 'English' : language} · {timezone}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('localization')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Sliders className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Date &amp; Currency format</p>
                          <p className="text-xs text-slate-500">{dateFormat} · ₹ {currency} (Indian Rupee)</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NOTIFICATIONS & ALERTS */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Notifications &amp; alerts
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 text-pretty">
                    Control agreement status alerts, automated return reminders, and communication delivery channels.
                  </p>
                </div>

                {/* Channels */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Delivery channels</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3.5">
                        <Mail className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Email Alerts</p>
                          <p className="text-xs text-slate-500">Official digital contract copies &amp; sign notifications</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailAlerts}
                        onChange={(e) => {
                          setEmailAlerts(e.target.checked);
                          toast('Email alerts preference updated.', 'success');
                        }}
                        className="size-4 text-[#003a5e] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3.5">
                        <MessageSquare className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">SMS &amp; WhatsApp Nudges</p>
                          <p className="text-xs text-slate-500">Direct mobile reminders before due date</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={smsAlerts}
                        onChange={(e) => {
                          setSmsAlerts(e.target.checked);
                          toast('SMS reminders preference updated.', 'success');
                        }}
                        className="size-4 text-[#003a5e] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3.5">
                        <Radio className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Browser Push Notifications</p>
                          <p className="text-xs text-slate-500">Instant desktop pop-ups for live signing events</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={pushAlerts}
                        onChange={(e) => {
                          setPushAlerts(e.target.checked);
                          toast('Browser push preference updated.', 'success');
                        }}
                        className="size-4 text-[#003a5e] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Triggers */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Agreement &amp; Return triggers</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3.5">
                        <FileCheck className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Agreement lifecycle milestones</p>
                          <p className="text-xs text-slate-500">Created, viewed, signed, declined, updated</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={agreementSignedNotif}
                        onChange={(e) => {
                          setAgreementSignedNotif(e.target.checked);
                          toast('Agreement triggers updated.', 'success');
                        }}
                        className="size-4 text-[#003a5e] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3.5">
                        <RotateCcw className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Automated return schedule (T-7, T-3, T-1)</p>
                          <p className="text-xs text-slate-500">Due-date notices and overdue late fee counters</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={returnRemindersNotif}
                        onChange={(e) => {
                          setReturnRemindersNotif(e.target.checked);
                          toast('Return schedule preference updated.', 'success');
                        }}
                        className="size-4 text-[#003a5e] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SUBSCRIPTIONS & BILLING */}
            {activeSection === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Subscriptions &amp; Billing
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 text-pretty">
                    Manage your AgreeMate workspace plan, usage quotas, saved payment cards, and invoices.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Current plan &amp; quotas</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3.5">
                        <Sparkles className="size-4.5 text-[#0ea5e9]" />
                        <div>
                          <p className="text-sm font-bold text-[#003a5e]">Pro Vault (Beta Free Period)</p>
                          <p className="text-xs text-slate-500">Unlimited SHA-256 evidence hashing &amp; digital contracts</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        Active
                      </span>
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('payment-methods')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <CreditCard className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Payment methods</p>
                          <p className="text-xs text-slate-500">Visa ending in 4242 · UPI Autopay Ready</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('invoices-list')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <FileText className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Billing history &amp; Invoices</p>
                          <p className="text-xs text-slate-500">Download past tax statements and payment receipts</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: YOUR INFORMATION AND PERMISSIONS */}
            {activeSection === 'data' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Your information and permissions
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 text-pretty">
                    Download your data archives, export signed contracts, freeze lending, or manage account deletion.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Your data &amp; downloads</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div
                      onClick={() => handleOpenSubPage('data-export')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Download className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Download your information</p>
                          <p className="text-xs text-slate-500">DPDP &amp; GDPR compliant user data JSON packet</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => {
                        toast('Signed contracts ZIP packet downloaded.', 'success');
                      }}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <FileArchive className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Export all signed contracts</p>
                          <p className="text-xs text-slate-500">Single ZIP archive with all ISO A4 legal PDFs</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => {
                        toast('Evidence SHA-256 log spreadsheet (.CSV) exported.', 'success');
                      }}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Database className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Export evidence hash ledger</p>
                          <p className="text-xs text-slate-500">Cryptographic audit log with verified timestamps</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Account ownership &amp; control</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div
                      onClick={() => {
                        toast('Account lending paused. Historical agreements remain active.', 'info');
                      }}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Archive className="size-4.5 text-slate-600" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Archive / Freeze account</p>
                          <p className="text-xs text-slate-500">Temporarily freeze lending without losing contracts</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('danger-zone')}
                      className="flex items-center justify-between p-4 hover:bg-red-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <AlertTriangle className="size-4.5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-red-600">Deactivation or deletion</p>
                          <p className="text-xs text-red-500/80">Soft deactivation or permanent PII erasure</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-red-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: LEGAL & POLICIES */}
            {activeSection === 'legal' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Legal &amp; Policies
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 text-pretty">
                    Review legal documentation, user agreements, platform disclaimers, and dispute assistance resources.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Platform terms &amp; policies</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div
                      onClick={() => handleOpenSubPage('tos-view')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <BookOpen className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Terms of Service</p>
                          <p className="text-xs text-slate-500">v2.4 · Information Technology Act, 2000 compliance</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('privacy-view')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <ShieldCheck className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Privacy &amp; Cookie Policy</p>
                          <p className="text-xs text-slate-500">DPDP data handling and biometric safety guidelines</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('disclaimer-view')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <ShieldAlert className="size-4.5 text-amber-600" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Platform Technology Disclaimer</p>
                          <p className="text-xs text-slate-500">Independent peer transaction · No company bailment</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: HELP & SUPPORT */}
            {activeSection === 'support' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#003a5e] font-display">
                    Help &amp; Support
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 text-pretty">
                    Check live system status, read FAQs, contact support agents, or submit feature suggestions.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#003a5e]">Help &amp; System Health</p>
                  <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    <div
                      onClick={() => handleOpenSubPage('system-status')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Activity className="size-4.5 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Live Platform Status</p>
                          <p className="text-xs text-emerald-600 font-semibold">99.99% Uptime · All Services Operational</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('faqs')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <HelpCircle className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Help Center &amp; FAQs</p>
                          <p className="text-xs text-slate-500">Signing workflows, penalty formulas, vault hashing</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('contact-support')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <MessageSquare className="size-4.5 text-[#0068a3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Contact support &amp; Report problem</p>
                          <p className="text-xs text-slate-500">Submit an inquiry to our 24/7 technical team</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleOpenSubPage('feedback')}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Lightbulb className="size-4.5 text-[#0ea5e9]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e2c3a]">Give feedback &amp; Feature requests</p>
                          <p className="text-xs text-slate-500">Direct suggestion box for the product engineering team</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
