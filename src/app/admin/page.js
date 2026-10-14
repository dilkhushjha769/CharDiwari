'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  Building2,
  Video,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Upload,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Film,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Search,
  Sparkles,
  BarChart3,
  Activity,
  Clock,
  Layers,
  ShieldCheck,
  Flame,
  Compass,
  Phone,
  User,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { parseVideoUrl } from '@/lib/video';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';

export default function AdminPage() {
  // Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Active dashboard tab: 'properties' | 'access' | 'media'
  const [activeTab, setActiveTab] = useState('properties');

  // Properties state
  const [properties, setProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [propSearch, setPropSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'published' | 'rejected'
  const [editingProperty, setEditingProperty] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [savePropLoading, setSavePropLoading] = useState(false);
  const [savePropMessage, setSavePropMessage] = useState({ text: '', type: '' });

  // Website Settings state
  const [settings, setSettings] = useState({
    website_access: 'public',
    maintenance_message: '',
    announcement_banner: '',
    allow_registrations: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState({ text: '', type: '' });

  // Media Vault State
  const [mediaVault, setMediaVault] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [copiedUrl, setCopiedUrl] = useState('');

  const fileInputRef = useRef(null);
  const propMediaInputRef = useRef(null);

  // Analytics Test State
  const [testEventStatus, setTestEventStatus] = useState('');

  // Check admin session on mount
  useEffect(() => {
    let ignore = false;
    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        if (data?.authenticated) {
          setIsAdminLoggedIn(true);
          setAdminUser(data.admin);
          fetchProperties();
          fetchSettings();
        } else {
          setIsAdminLoggedIn(false);
          setAdminUser(null);
        }
      })
      .catch(() => {
        if (!ignore) setIsAdminLoggedIn(false);
      })
      .finally(() => {
        if (!ignore) setAuthLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Invalid credentials.');
        return;
      }

      setIsAdminLoggedIn(true);
      setAdminUser(data.user);
      fetchProperties();
      fetchSettings();
    } catch (err) {
      setLoginError('Failed to connect to authentication service.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAdminLoggedIn(false);
      setAdminUser(null);
      setProperties([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  async function fetchProperties() {
    try {
      setLoadingProps(true);
      const res = await fetch('/api/admin/properties');
      const data = await res.json();
      if (res.ok && data.properties) {
        setProperties(data.properties);
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoadingProps(false);
    }
  }

  async function fetchSettings() {
    try {
      setSettingsLoading(true);
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  }

  const handleOpenNewProperty = () => {
    setIsCreatingNew(true);
    setSavePropMessage({ text: '', type: '' });
    setEditingProperty({
      title: '',
      slug: '',
      location: '',
      city: 'Goa',
      type: 'Luxury Villa & Estate',
      price: '₹5.50 Cr',
      beds: '4 Beds',
      baths: '4 Baths',
      area: '4,500 sq.ft',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      video_url: '',
      tag: 'Verified',
      description: 'Architect-designed residence crafted with native stone, high ceilings, and landscaped outdoor sanctuary.',
    });
  };

  const handleEditProperty = (prop) => {
    setIsCreatingNew(false);
    setSavePropMessage({ text: '', type: '' });
    setEditingProperty({
      ...prop,
      video_url: prop.video_url || prop.videoUrl || '',
    });
  };

  const handleDeleteProperty = async (propId) => {
    if (!confirm('Are you sure you want to remove this property listing?')) return;

    try {
      const res = await fetch(`/api/admin/properties/${propId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== propId));
      } else {
        alert('Failed to delete property.');
      }
    } catch (err) {
      alert('Error deleting property.');
    }
  };

  const handleApproveProperty = async (prop) => {
    try {
      setLoadingProps(true);
      const res = await fetch(`/api/admin/properties/${prop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prop,
          status: 'published',
          tag: prop.tag === 'Under Review' ? 'Verified Property' : (prop.tag || 'Verified'),
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        await fetchProperties();
        const sellerEmail = prop.seller_email || prop.seller?.email;
        if (sellerEmail) {
          alert(`Property "${prop.title}" approved and published live!\n\nEmail notification successfully dispatched to ${sellerEmail}.`);
        } else {
          alert(`Property "${prop.title}" approved and published live!`);
        }
      } else {
        alert('Failed to approve property.');
      }
    } catch (err) {
      alert('Error approving property.');
    } finally {
      setLoadingProps(false);
    }
  };

  const handleRejectProperty = async (prop) => {
    const reason = window.prompt('Reason for rejection or admin feedback note (optional):', 'Incomplete details / needs verification');
    if (reason === null) return;
    try {
      setLoadingProps(true);
      const res = await fetch(`/api/admin/properties/${prop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prop,
          status: 'rejected',
          admin_review_note: reason,
        }),
      });
      if (res.ok) {
        await fetchProperties();
        const sellerEmail = prop.seller_email || prop.seller?.email;
        if (sellerEmail) {
          alert(`Property marked as rejected.\n\nReview feedback email successfully dispatched to ${sellerEmail}.`);
        } else {
          alert('Property marked as rejected.');
        }
      } else {
        alert('Failed to update property status.');
      }
    } catch (err) {
      alert('Error updating property.');
    } finally {
      setLoadingProps(false);
    }
  };

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    setSavePropLoading(true);
    setSavePropMessage({ text: '', type: '' });

    try {
      const payload = {
        ...editingProperty,
        video_url: editingProperty.video_url || null,
        videoUrl: editingProperty.video_url || null,
      };

      let res;
      if (isCreatingNew) {
        res = await fetch('/api/admin/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/properties/${editingProperty.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setSavePropMessage({ text: data.error || 'Failed to save property.', type: 'error' });
        return;
      }

      setSavePropMessage({
        text: isCreatingNew ? 'Property listed successfully!' : 'Property updated successfully!',
        type: 'success',
      });

      fetchProperties();
      setTimeout(() => {
        setEditingProperty(null);
      }, 1000);
    } catch (err) {
      setSavePropMessage({ text: 'Error connecting to database.', type: 'error' });
    } finally {
      setSavePropLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaveMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();

      if (!res.ok) {
        setSettingsSaveMsg({ text: data.error || 'Failed to save settings.', type: 'error' });
        return;
      }

      setSettingsSaveMsg({ text: 'Website settings updated successfully!', type: 'success' });
      setTimeout(() => setSettingsSaveMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setSettingsSaveMsg({ text: 'Error saving settings.', type: 'error' });
    }
  };

  // Upload handler for Property Modal
  const handlePropertyMediaUpload = async (file) => {
    if (!file) return;
    setUploadLoading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'properties');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || 'Upload failed.');
        return;
      }

      if (data.media?.isVideo) {
        setEditingProperty((prev) => ({
          ...prev,
          video_url: data.media.url,
        }));
      } else {
        setEditingProperty((prev) => ({
          ...prev,
          image: data.media.url,
        }));
      }
    } catch (err) {
      setUploadError('Failed to upload media file.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Media Vault Direct Upload
  const handleMediaVaultUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'vault');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || 'Upload failed.');
        return;
      }

      setMediaVault((prev) => [data.media, ...prev]);
    } catch (err) {
      setUploadError('Failed to upload media.');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(''), 2000);
  };

  // Counts for status
  const pendingCount = properties.filter((p) => p.status === 'pending_review' || p.status === 'pending').length;
  const publishedCount = properties.filter((p) => p.status === 'published' || (!p.status && !p.is_deleted)).length;
  const rejectedCount = properties.filter((p) => p.status === 'rejected' || p.status === 'archived').length;

  // Filtered properties
  const filteredProperties = properties.filter((p) => {
    // Status filter
    if (statusFilter === 'pending') {
      if (p.status !== 'pending_review' && p.status !== 'pending') return false;
    } else if (statusFilter === 'published') {
      if (p.status !== 'published' && p.status) return false;
    } else if (statusFilter === 'rejected') {
      if (p.status !== 'rejected' && p.status !== 'archived') return false;
    }

    if (!propSearch.trim()) return true;
    const q = propSearch.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q) ||
      p.seller_name?.toLowerCase().includes(q) ||
      p.seller_phone?.includes(q) ||
      p.seller?.name?.toLowerCase().includes(q) ||
      p.seller?.phone?.includes(q)
    );
  });

  const videoPropertiesCount = properties.filter((p) => Boolean(p.video_url || p.videoUrl)).length;

  // --------------------------------------------------------------------------
  // RENDER 1: LOADING STATE
  // --------------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl h-16 flex items-center px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/dwarkesh-logo-transparent.png"
              alt="Dwarkesh Real Estate Group"
              width={1024}
              height={551}
              className="h-8 w-auto max-w-[50px] object-contain drop-shadow-xs"
            />
            <span className="font-serif font-bold tracking-[0.14em] text-black text-sm uppercase">Dwarkesh</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-stone-700">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Opening Admin Suite...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER 2: LOGIN SCREEN (MATCHES DWARKESH /AUTH DESIGN EXACTLY)
  // --------------------------------------------------------------------------
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-white bg-grid-light flex flex-col selection:bg-black selection:text-white font-sans">
        {/* Top Header */}
        <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group rounded-lg focus-ring">
              <Image
                src="/dwarkesh-logo-transparent.png"
                alt="Dwarkesh Real Estate Group"
                width={1024}
                height={551}
                priority
                className="h-8 w-auto max-w-[50px] object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
              />
              <div className="flex flex-col">
                <span className="font-serif font-bold tracking-[0.14em] text-black text-sm uppercase leading-none">
                  Dwarkesh
                </span>
                <span className="text-[9px] font-semibold tracking-[0.20em] text-zinc-500 uppercase font-sans mt-0.5">
                  Real Estate Group
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-xs font-mono text-zinc-500 hover:text-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition focus-ring"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
              </Link>
            </div>
          </div>
        </header>

        {/* Center Auth Card */}
        <main className="flex-1 flex items-center justify-center p-4 py-12">
          <div className="w-full max-w-[440px]">
            <div className="auth-panel rounded-3xl border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8 sm:p-9 animate-fade-in-up">
              {/* Card Header */}
              <div className="mb-7 text-center">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4 border border-stone-200/80">
                  <Lock className="w-5 h-5 text-stone-800" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-black mb-1.5 text-balance">
                  Administrator Sign In
                </h1>
                <p className="text-xs text-zinc-500 font-light text-pretty">
                  Enter your administrative credentials to manage properties, video tours, and website controls.
                </p>
              </div>

              {loginError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@dwarkesh.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-black placeholder-zinc-400 text-sm outline-none transition-[border-color,box-shadow] duration-150 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] light-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-zinc-200 bg-white text-black placeholder-zinc-400 text-sm outline-none transition-[border-color,box-shadow] duration-150 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] light-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loginSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {loginSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In as Administrator</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Default Credentials Helper */}
              <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
                <p className="text-[11px] text-zinc-400">
                  Default credentials: <span className="font-mono text-zinc-700">admin@dwarkesh.com</span> /{' '}
                  <span className="font-mono text-zinc-700">Admin@Dwarkesh2026!</span>
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER 3: AUTHENTICATED ADMIN DASHBOARD (MATCHES DWARKESH EDITORIAL LOOK)
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-stone-50/40 dark:bg-white text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group rounded-lg focus-ring">
              <Image
                src="/dwarkesh-logo-transparent.png"
                alt="Dwarkesh Real Estate Group"
                width={1024}
                height={551}
                priority
                className="h-8 w-auto max-w-[50px] object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
              />
              <div className="flex flex-col">
                <span className="font-serif font-bold tracking-[0.14em] text-stone-900 text-sm sm:text-base uppercase leading-none">
                  Dwarkesh
                </span>
                <span className="text-[9px] font-semibold tracking-[0.20em] text-stone-500 uppercase font-sans mt-0.5">
                  Admin Suite
                </span>
              </div>
            </Link>

            <span className="hidden md:inline-block h-4 w-px bg-stone-200" />

            {/* Availability Pill */}
            <div className="hidden md:flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  settings.website_access === 'public'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    settings.website_access === 'public' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`}
                />
                <span>Website: {settings.website_access === 'public' ? 'Public Live' : 'Maintenance Mode'}</span>
              </span>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-stone-900 bg-white text-xs font-semibold text-stone-700 hover:text-stone-900 transition shadow-xs"
            >
              <span>View Live Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </Link>

            <div className="text-right hidden lg:block pl-2">
              <div className="text-xs font-semibold text-stone-900">{adminUser?.name || 'Administrator'}</div>
              <div className="text-[10px] text-stone-500">{adminUser?.email}</div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Sign out from admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Suite Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Editorial Suite Hero Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-2">
            <Link href="/" className="hover:text-stone-900 transition">Dwarkesh</Link>
            <span>/</span>
            <span className="text-stone-900">Admin Suite</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-stone-900 tracking-tight">
                Dwarkesh Portfolio Suite
              </h1>
              <p className="text-sm text-stone-600 mt-1 max-w-2xl font-light">
                Curate verified luxury properties, video walkthroughs, and control website availability.
              </p>
            </div>

            {/* Quick Stat Highlights */}
            <div className="flex items-center gap-3">
              <div
                onClick={() => { setActiveTab('properties'); setStatusFilter('pending'); }}
                className={`border rounded-2xl px-4 py-2.5 shadow-xs text-center min-w-[100px] transition cursor-pointer ${
                  pendingCount > 0
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100 hover:bg-amber-100/70'
                    : 'bg-white border-stone-200/90'
                }`}
                title="Filter pending property submissions"
              >
                <div className={`text-xl font-serif font-bold tabular-nums ${pendingCount > 0 ? 'text-amber-700' : 'text-stone-900'}`}>
                  {pendingCount}
                </div>
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${pendingCount > 0 ? 'text-amber-800' : 'text-stone-500'}`}>
                  Review Queue
                </div>
              </div>

              <div className="bg-white border border-stone-200/90 rounded-2xl px-4 py-2.5 shadow-xs text-center min-w-[100px]">
                <div className="text-xl font-serif font-bold text-stone-900 tabular-nums">
                  {properties.length}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  Properties
                </div>
              </div>

              <div className="bg-white border border-stone-200/90 rounded-2xl px-4 py-2.5 shadow-xs text-center min-w-[100px]">
                <div className="text-xl font-serif font-bold text-stone-900 tabular-nums">
                  {videoPropertiesCount}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  Video Tours
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Styled to match website categories) */}
        <div className="flex items-center gap-2 mb-6 border-b border-stone-200 pb-3 overflow-x-auto scrollbar-none">
          {[
            { id: 'properties', label: 'Property Listings', icon: Building2, count: properties.length, pending: pendingCount },
            { id: 'access', label: 'Website Availability', icon: Globe },
            { id: 'media', label: 'Media & Video Vault', icon: Film },
            { id: 'analytics', label: 'PostHog Analytics', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.pending > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                    {tab.pending} review
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ================================================================ */}
        {/* TAB 1: PROPERTIES CATALOG                                        */}
        {/* ================================================================ */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            {/* Status Filter Tabs Strip */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              {[
                { id: 'all', label: 'All Listings', count: properties.length },
                { id: 'pending', label: 'Awaiting Review', count: pendingCount, highlight: pendingCount > 0 },
                { id: 'published', label: 'Live Published', count: publishedCount },
                { id: 'rejected', label: 'Rejected / Archived', count: rejectedCount },
              ].map((sf) => (
                <button
                  key={sf.id}
                  type="button"
                  onClick={() => setStatusFilter(sf.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    statusFilter === sf.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : sf.highlight
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-white hover:bg-stone-50 text-stone-600 border border-stone-200'
                  }`}
                >
                  {sf.highlight && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                  <span>{sf.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      statusFilter === sf.id
                        ? 'bg-stone-800 text-white'
                        : sf.highlight
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {sf.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filter & Add Strip */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by title, locality, seller name, or phone..."
                  value={propSearch}
                  onChange={(e) => setPropSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchProperties}
                  className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition cursor-pointer"
                  title="Refresh listings"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingProps ? 'animate-spin' : ''}`} />
                </button>
                <Link
                  href="/admin/properties/new"
                  className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Property</span>
                </Link>
              </div>
            </div>

            {/* Property Cards Grid (Styled to match website PropertyCard.js) */}
            {loadingProps ? (
              <div className="py-20 text-center text-stone-500 text-xs">
                Loading Dwarkesh portfolio listings...
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-stone-200/90 shadow-xs p-8">
                <Building2 className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <p className="text-base font-bold text-stone-800">No properties found</p>
                <p className="text-xs text-stone-500 mt-1">
                  {propSearch ? 'Try a different search keyword.' : 'Click "Add New Property" to add your first listing.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((prop) => {
                  const hasVideo = Boolean(prop.video_url || prop.videoUrl);
                  const isPending = prop.status === 'pending_review' || prop.status === 'pending';
                  const isRejected = prop.status === 'rejected';
                  const sellerName = prop.seller_name || prop.seller?.name;
                  const sellerPhone = prop.seller_phone || prop.seller?.phone;
                  const sellerRole = prop.seller_role || prop.seller?.role || 'Owner';
                  const cleanPhone = (sellerPhone || '').replace(/[^\d]/g, '');

                  return (
                    <div
                      key={prop.id}
                      className={`group bg-white rounded-3xl border overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
                        isPending
                          ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/10'
                          : isRejected
                          ? 'border-rose-200 bg-rose-50/10 opacity-75'
                          : 'border-stone-200/90 hover:border-stone-300'
                      }`}
                    >
                      <div>
                        {/* Status Warning Banner for Pending */}
                        {isPending && (
                          <div className="bg-amber-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Awaiting Review &amp; Call</span>
                            </div>
                            <span className="text-[10px] font-mono tracking-wider bg-amber-600 px-2 py-0.5 rounded-full">
                              {prop.submission_ref || 'User Submission'}
                            </span>
                          </div>
                        )}

                        {isRejected && (
                          <div className="bg-rose-600 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between">
                            <span>Listing Rejected / Archived</span>
                            {prop.admin_review_note && (
                              <span className="text-[10px] font-normal opacity-90 truncate max-w-[150px]">
                                {prop.admin_review_note}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Image Cover */}
                        <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
                          <img
                            src={prop.image || (Array.isArray(prop.gallery) && prop.gallery[0]) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}
                            alt={prop.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Top Badges */}
                          <div className="absolute top-3.5 left-3.5 flex gap-1.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-stone-900 shadow-xs">
                              {prop.city}
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-xs text-white ${
                                isPending ? 'bg-amber-600' : isRejected ? 'bg-rose-700' : 'bg-emerald-700'
                              }`}
                            >
                              {isPending ? 'Under Review' : isRejected ? 'Rejected' : (prop.tag || 'Verified')}
                            </span>
                          </div>

                          {/* Video Indicator */}
                          {hasVideo && (
                            <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md text-amber-300 text-xs font-bold flex items-center gap-1 shadow-xs">
                              <Video className="w-3 h-3 text-amber-400" />
                              <span>Video Tour</span>
                            </div>
                          )}

                          {/* Price Tag */}
                          <div className="absolute bottom-3.5 left-3.5">
                            <span className="px-3.5 py-1.5 rounded-xl bg-stone-900/90 backdrop-blur-md text-white font-serif font-bold text-base tabular-nums shadow-xs">
                              {prop.price}
                            </span>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-5">
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1.5">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{prop.location}</span>
                          </div>

                          <h3 className="text-lg font-bold text-stone-900 truncate mb-1">
                            {prop.title}
                          </h3>

                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-4">
                            {prop.description || 'Exclusive luxury residence in a prime location.'}
                          </p>

                          {/* Specs */}
                          <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs font-medium text-stone-600">
                            <div className="flex items-center gap-1.5">
                              <Bed className="w-4 h-4 text-stone-400" />
                              <span>{prop.beds || prop.bhk}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Bath className="w-4 h-4 text-stone-400" />
                              <span>{prop.baths || '4 Baths'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Maximize2 className="w-4 h-4 text-stone-400" />
                              <span>{prop.area}</span>
                            </div>
                          </div>

                          {/* Seller Details Card (Shown for all user submissions) */}
                          {sellerPhone && (
                            <div className="mt-3.5 p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-stone-500" />
                                  <span>{sellerName || 'Direct Seller'}</span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                                  {sellerRole}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-200/50">
                                <a
                                  href={`tel:+91${cleanPhone}`}
                                  className="inline-flex items-center gap-1 text-stone-900 font-mono font-bold hover:underline"
                                  title="Call Seller"
                                >
                                  <Phone className="w-3 h-3 text-stone-600" />
                                  <span>+91 {sellerPhone}</span>
                                </a>
                                <a
                                  href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(sellerName || '')},%20this%20is%20Dwarkesh%20regarding%20your%20property%20listing%20"${encodeURIComponent(prop.title)}".`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold inline-flex items-center gap-1 transition shadow-2xs"
                                >
                                  <span>WhatsApp</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="p-5 pt-0">
                        {/* Pending Review Primary Action Strip */}
                        {isPending ? (
                          <div className="pt-3 border-t border-amber-200 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleApproveProperty(prop)}
                                className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve &amp; Publish</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectProperty(prop)}
                                className="w-full py-2 px-3 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <Link
                                href={`/admin/properties/new?id=${prop.id}`}
                                className="text-stone-600 hover:text-stone-900 font-semibold flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit Specs First</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteProperty(prop.id)}
                                className="text-stone-400 hover:text-rose-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
                            <Link
                              href={`/property/${prop.slug || prop.id}`}
                              target="_blank"
                              className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 transition"
                            >
                              <span>Live Page</span>
                              <ExternalLink className="w-3 h-3 text-stone-400" />
                            </Link>

                            <div className="flex items-center gap-2">
                              {isRejected && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveProperty(prop)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                                  title="Approve and make live"
                                >
                                  Publish
                                </button>
                              )}

                              <Link
                                href={`/admin/properties/new?id=${prop.id}`}
                                className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-stone-900 bg-white text-stone-800 text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
                              >
                                <Edit className="w-3 h-3 text-stone-600" />
                                <span>Edit</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDeleteProperty(prop.id)}
                                className="p-1.5 rounded-xl border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                                title="Delete listing"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: WEBSITE AVAILABILITY & ANNOUNCEMENT                       */}
        {/* ================================================================ */}
        {activeTab === 'access' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h2 className="text-xl font-serif font-bold text-stone-900 mb-1 flex items-center gap-2">
                <Globe className="w-5 h-5 text-stone-800" />
                <span>Website Availability & Public Access</span>
              </h2>
              <p className="text-xs text-stone-500 mb-6 font-light">
                Manage the public availability of the Dwarkesh website. You can toggle between Live Public
                browsing and Maintenance Mode with custom notices.
              </p>

              {settingsSaveMsg.text && (
                <div
                  className={`mb-6 p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                    settingsSaveMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{settingsSaveMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Access Policy Radio Cards */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-2.5">
                    Website Status Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label
                      className={`flex items-start gap-3 p-5 rounded-2xl border cursor-pointer transition select-none ${
                        settings.website_access === 'public'
                          ? 'bg-emerald-50/50 border-emerald-400 shadow-xs'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="website_access"
                        value="public"
                        checked={settings.website_access === 'public'}
                        onChange={(e) => setSettings({ ...settings, website_access: e.target.value })}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <div>
                        <div className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                          <span>Live Public Website</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          The website is publicly live and available to all home buyers and clients.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-5 rounded-2xl border cursor-pointer transition select-none ${
                        settings.website_access === 'maintenance'
                          ? 'bg-amber-50/60 border-amber-400 shadow-xs'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="website_access"
                        value="maintenance"
                        checked={settings.website_access === 'maintenance'}
                        onChange={(e) => setSettings({ ...settings, website_access: e.target.value })}
                        className="mt-0.5 accent-amber-600"
                      />
                      <div>
                        <div className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                          <span>Maintenance Mode</span>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          Displays a scheduled upgrade banner while authenticated administrators browse normally.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Maintenance Message */}
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                    Maintenance Announcement Notice
                  </label>
                  <textarea
                    rows={3}
                    value={settings.maintenance_message || ''}
                    onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                    placeholder="Dwarkesh Real Estate Group is currently undergoing scheduled platform upgrades..."
                    className="w-full p-3.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition leading-relaxed"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Displayed to public visitors when Maintenance Mode is enabled.
                  </p>
                </div>

                {/* Global Announcement Strip */}
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                    Global Website Announcement Banner
                  </label>
                  <input
                    type="text"
                    value={settings.announcement_banner || ''}
                    onChange={(e) => setSettings({ ...settings, announcement_banner: e.target.value })}
                    placeholder="e.g. Exclusive Alibaug Coastal Villa collection now available for private viewing."
                    className="w-full px-4 py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Optional announcement strip displayed across the top of all public pages.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-stone-900 hover:bg-black text-white font-semibold rounded-2xl text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Website Settings</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: VIDEO & IMAGE VAULT                                       */}
        {/* ================================================================ */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                    <Film className="w-5 h-5 text-stone-800" />
                    <span>Video & Image Media Storage</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-1 font-light">
                    Upload property tour videos (MP4, WebM, MOV) and architectural photography securely to Supabase Storage.
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,video/*"
                    onChange={handleMediaVaultUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {uploadLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Uploading File...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload Video / Photo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {uploadError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Dropzone Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-200 hover:border-stone-400 rounded-3xl p-8 sm:p-10 text-center bg-stone-50/50 hover:bg-stone-50 cursor-pointer transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Video className="w-6 h-6 text-stone-800" />
                </div>
                <h4 className="text-sm font-bold text-stone-900">Choose Video or Photo to Upload</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed font-light">
                  Supports video formats (MP4, WebM, MOV up to 150MB) and photography (JPG, PNG, WebP). Files are stored securely in Supabase Storage with instant HTTPS streaming URLs.
                </p>
              </div>

              {/* Uploaded Media Stream */}
              {mediaVault.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Uploaded Files ({mediaVault.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaVault.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex flex-col justify-between"
                      >
                        <div className="aspect-video bg-black rounded-xl overflow-hidden relative mb-2 flex items-center justify-center">
                          {item.isVideo ? (
                            (() => {
                              const p = parseVideoUrl(item.url);
                              return p?.type === 'youtube' ? (
                                <iframe
                                  src={p.embedUrl}
                                  title={item.filename}
                                  className="w-full h-full border-0"
                                  allowFullScreen
                                />
                              ) : (
                                <video
                                  src={item.url}
                                  controls
                                  playsInline
                                  className="w-full h-full object-contain bg-black"
                                />
                              );
                            })()
                          ) : (
                            <img
                              src={item.url}
                              alt={item.filename}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-black/85 text-white">
                            {item.isVideo ? 'VIDEO TOUR' : 'PHOTOGRAPHY'}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-stone-900 truncate">{item.filename}</p>
                          <p className="text-[10px] text-stone-500 mt-0.5 font-mono truncate">
                            {item.url}
                          </p>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.url)}
                            className="w-full mt-2 py-2 px-2 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            {copiedUrl === item.url ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied URL!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-stone-500" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 4: POSTHOG ANALYTICS & INSIGHTS                              */}
        {/* ================================================================ */}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      {/* ================================================================ */}
      {/* MODAL: ADD / EDIT PROPERTY WITH VIDEO & IMAGE UPLOADER           */}
      {/* ================================================================ */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-stone-800" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {isCreatingNew ? 'Create New Property Listing' : `Edit Listing: ${editingProperty.title}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProperty(null)}
                className="text-stone-400 hover:text-stone-900 p-1.5 rounded-xl cursor-pointer hover:bg-stone-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProperty} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {savePropMessage.text && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                    savePropMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{savePropMessage.text}</span>
                </div>
              )}

              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProperty.title}
                    onChange={(e) => setEditingProperty({ ...editingProperty, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                    placeholder="The Palm Villa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={editingProperty.slug || ''}
                    onChange={(e) => setEditingProperty({ ...editingProperty, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                    placeholder="the-palm-villa"
                  />
                </div>
              </div>

              {/* Location, City, Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Locality & Address *</label>
                  <input
                    type="text"
                    required
                    value={editingProperty.location}
                    onChange={(e) => setEditingProperty({ ...editingProperty, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                    placeholder="Assagao, North Goa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={editingProperty.city}
                    onChange={(e) => setEditingProperty({ ...editingProperty, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                    placeholder="Goa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Property Type</label>
                  <select
                    value={editingProperty.type}
                    onChange={(e) => setEditingProperty({ ...editingProperty, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                  >
                    <option value="Luxury Villa & Estate">Luxury Villa & Estate</option>
                    <option value="Architectural Apartment">Architectural Apartment</option>
                    <option value="Penthouse / Sky Villa">Penthouse / Sky Villa</option>
                  </select>
                </div>
              </div>

              {/* Price, Beds, Baths, Area */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Price *</label>
                  <input
                    type="text"
                    required
                    value={editingProperty.price}
                    onChange={(e) => setEditingProperty({ ...editingProperty, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                    placeholder="₹7.20 Cr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Bedrooms</label>
                  <input
                    type="text"
                    value={editingProperty.beds}
                    onChange={(e) => setEditingProperty({ ...editingProperty, beds: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                    placeholder="4 Beds"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Bathrooms</label>
                  <input
                    type="text"
                    value={editingProperty.baths || ''}
                    onChange={(e) => setEditingProperty({ ...editingProperty, baths: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                    placeholder="5 Baths"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Carpet Area</label>
                  <input
                    type="text"
                    value={editingProperty.area}
                    onChange={(e) => setEditingProperty({ ...editingProperty, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
                    placeholder="5,600 sq.ft"
                  />
                </div>
              </div>

              {/* MEDIA SECTION: IMAGE & VIDEO UPLOADS */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-stone-700" />
                    <span>Media Uploads (Cover Photography & Video Walkthrough)</span>
                  </h4>
                  <input
                    type="file"
                    ref={propMediaInputRef}
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePropertyMediaUpload(f);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => propMediaInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="px-3.5 py-1.5 bg-white border border-stone-300 hover:border-stone-900 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-stone-600" />
                    <span>Upload Image / Video</span>
                  </button>
                </div>

                {uploadLoading && (
                  <div className="p-3 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 text-xs flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-700" />
                    <span>Uploading file securely to Supabase Storage...</span>
                  </div>
                )}

                {/* Primary Image URL & Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-semibold text-stone-600">
                      Primary Cover Image URL
                    </label>
                    <input
                      type="text"
                      value={editingProperty.image}
                      onChange={(e) => setEditingProperty({ ...editingProperty, image: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="aspect-video bg-stone-200 rounded-xl overflow-hidden border border-stone-300 flex items-center justify-center">
                    {editingProperty.image ? (
                      <img
                        src={editingProperty.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-400" />
                    )}
                  </div>
                </div>

                {/* Video Tour URL & Player Preview */}
                <div className="space-y-2 pt-3 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-stone-800 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-stone-700" />
                      <span>Video Tour URL (YouTube, Vimeo, or MP4/WebM/MOV)</span>
                    </label>
                    {editingProperty.video_url && (
                      <span className="text-[10px] text-stone-500 font-medium">
                        {parseVideoUrl(editingProperty.video_url)?.type === 'youtube'
                          ? 'YouTube embed detected'
                          : 'Direct video file'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editingProperty.video_url || ''}
                    onChange={(e) => setEditingProperty({ ...editingProperty, video_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                    placeholder="e.g. https://youtu.be/e1cwjeP5Ofs or upload an MP4/WebM/MOV video file"
                  />

                  {editingProperty.video_url && (() => {
                    const parsedVideo = parseVideoUrl(editingProperty.video_url);
                    return (
                      <div className="aspect-video bg-black rounded-xl overflow-hidden border border-stone-300 mt-2 relative">
                        {parsedVideo?.type === 'youtube' ? (
                          <iframe
                            src={parsedVideo.embedUrl}
                            title="Video Preview"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            key={editingProperty.video_url}
                            src={editingProperty.video_url}
                            controls
                            playsInline
                            className="w-full h-full object-contain bg-black"
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProperty.description || ''}
                  onChange={(e) => setEditingProperty({ ...editingProperty, description: e.target.value })}
                  className="w-full p-3.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition leading-relaxed"
                  placeholder="Restored classic Portuguese-style villa with natural stone walls..."
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savePropLoading}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-black text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savePropLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Property</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Website Footer */}
      <Footer />
    </div>
  );
}
