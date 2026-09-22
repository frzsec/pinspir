"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginRegister({
  defaultTab = "login",
}: {
  defaultTab?: "login" | "register";
}) {
  const router = useRouter();

  // Modal states
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSocialNotice, setShowSocialNotice] = useState<string | null>(null);

  // Tabs inside the Player Code modal
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);

  // WhatsApp state
  const [waNumber, setWaNumber] = useState("");
  const [waName, setWaName] = useState("");
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState("");

  // Login form state
  const [loginPlayerCode, setLoginPlayerCode] = useState("");
  const [loginPassphrase, setLoginPassphrase] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regNickname, setRegNickname] = useState("");
  const [regPassphrase, setRegPassphrase] = useState("");
  const [regCohortCode, setRegCohortCode] = useState("");
  const [regError, setRegError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Registration success modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    playerCode: string;
    nickname: string;
    passphrase: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginPlayerCode.trim() || !loginPassphrase) {
      setLoginError("Player Code dan kata sandi wajib diisi.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/v1/auth/pseudonymous/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerCode: loginPlayerCode.trim().toUpperCase(),
          passphrase: loginPassphrase,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error?.message || "Player Code atau kata sandi tidak valid.");
        setIsLoggingIn(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setLoginError("Gagal terhubung ke server. Periksa koneksi Anda.");
      setIsLoggingIn(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regPassphrase || regPassphrase.length < 8) {
      setRegError("Kata sandi minimal 8 karakter.");
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch("/api/v1/auth/pseudonymous/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: regNickname.trim() || "Petualang",
          passphrase: regPassphrase,
          cohortCode: regCohortCode.trim() ? regCohortCode.trim().toUpperCase() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error?.message || data.message || "Gagal membuat akun.");
        setIsRegistering(false);
        return;
      }

      setCreatedCredentials({
        playerCode: data.user.playerCode,
        nickname: data.user.nickname,
        passphrase: regPassphrase,
      });
      setIsRegistering(false);
    } catch {
      setRegError("Terjadi kesalahan jaringan saat pendaftaran.");
      setIsRegistering(false);
    }
  };

  // Handle WhatsApp Quick Registration / Login
  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaError("");

    if (!waNumber.trim() && !waName.trim()) {
      setWaError("Silakan masukkan nama panggilan atau nomor WhatsApp.");
      return;
    }

    setWaLoading(true);
    try {
      const autoPassphrase = `foxy-${Math.floor(1000 + Math.random() * 9000)}`;
      const nickname = waName.trim() || `SobatWA-${waNumber.slice(-4) || "Foxy"}`;

      const res = await fetch("/api/v1/auth/pseudonymous/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          passphrase: autoPassphrase,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWaError(data.error?.message || "Gagal memproses pendaftaran WhatsApp.");
        setWaLoading(false);
        return;
      }

      setShowWhatsAppModal(false);
      setCreatedCredentials({
        playerCode: data.user.playerCode,
        nickname: data.user.nickname,
        passphrase: autoPassphrase,
      });
      setWaLoading(false);
    } catch {
      setWaError("Terjadi gangguan saat menghubungkan. Coba lagi.");
      setWaLoading(false);
    }
  };

  // Handle Social (Google / Apple) Quick Login
  const handleSocialClick = (provider: string) => {
    setShowSocialNotice(provider);
  };

  const handleQuickSocialLogin = async (provider: string) => {
    try {
      const autoPassphrase = `foxy-${provider.toLowerCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const nickname = `${provider}User`;

      const res = await fetch("/api/v1/auth/pseudonymous/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          passphrase: autoPassphrase,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.user?.playerCode) {
        setShowSocialNotice(null);
        setCreatedCredentials({
          playerCode: data.user.playerCode,
          nickname: data.user.nickname,
          passphrase: autoPassphrase,
        });
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Akun Finspire:\nPlayer Code: ${createdCredentials.playerCode}\nKata Sandi: ${createdCredentials.passphrase}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleFinishRegister = () => {
    router.push("/");
    router.refresh();
  };

  const generateEasyPassphrase = () => {
    const words = ["foxy", "koin", "cerdas", "hebat", "pintar", "hemat", "rajin", "emas", "bintang", "juara"];
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setRegPassphrase(`${w1}-${w2}-${num}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#EBF8EF] flex items-center justify-center overflow-x-hidden font-nunitoSans selection:bg-emerald-200">
      {/* Centered card container - widened horizontally, no overflow-hidden so shadow is not cropped */}
      <div className="relative w-full max-w-[460px] sm:max-w-[480px] min-h-[100dvh] flex flex-col justify-between bg-[#EBF8EF]">
        
        {/* Top & Hero Section */}
        <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-6 pt-10 pb-6 text-center select-none">
          {/* Mascot Illustration */}
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center mb-2">
            <Image
              src="/Gemini_generated_image_yto8snyto8snyto8removebg1.png"
              alt="Finspire Mascot Foxy"
              width={180}
              height={180}
              priority
              className="w-auto h-full object-contain pointer-events-none drop-shadow-sm mix-blend-multiply"
            />
          </div>

          {/* Title */}
          <h1 className="text-[#0D5C3A] text-3xl font-black tracking-tight mt-1">
            Finspire
          </h1>

          {/* Subtitle */}
          <p className="text-[#4E6155] text-sm sm:text-[15px] font-semibold mt-2 max-w-[290px] leading-snug">
            Siap belajar hal baru dengan cara yang seru dan pastinya menantang
          </p>
        </div>

        {/* Bottom Sheet White Card - button-like top drop shadow without background blur/cropping */}
        <div className="relative z-20 w-full bg-white rounded-t-[38px] sm:rounded-t-[44px] border-t-[3px] sm:border-t-[4px] border-slate-200/90 shadow-[0_-4px_8px_rgba(0,0,0,0.04)] px-7 sm:px-9 pt-7 pb-8 flex flex-col select-none">
          
          {/* Primary Action: Lanjut dengan WhatsApp */}
          <button
            type="button"
            onClick={() => setShowWhatsAppModal(true)}
            className="cursor-pointer group active:translate-y-[2px] active:border-b-0 transition-all w-full flex items-center justify-center gap-2.5 py-3.5 sm:py-4 px-5 rounded-[22px] bg-[#0EB378] hover:bg-[#0da46e] border-b-[4px] border-[#078C5B] shadow-sm text-[#003822] font-black text-base"
          >
            {/* Chat Bubble Icon matching reference image */}
            <svg
              className="w-5 h-5 text-[#003822] shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-5 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2zm2 4v2h12V8H6zm0 4v2h8v-2H6z" />
            </svg>
            <span className="tracking-[0.01em]">Lanjut dengan WhatsApp</span>
          </button>

          {/* Divider: ATAU */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
              ATAU
            </span>
          </div>

          {/* Terms & Privacy Disclaimer */}
          <p className="text-[11.5px] text-slate-500 font-medium text-center mb-4 leading-normal">
            Dengan melanjutkan, kamu setuju dengan{" "}
            <span className="hover:underline cursor-pointer">Ketentuan</span> &{" "}
            <span className="hover:underline cursor-pointer">Privasi</span> kami.
          </p>

          {/* Social Buttons Grid: Google & Apple */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Google Button */}
            <button
              type="button"
              onClick={() => handleSocialClick("Google")}
              className="cursor-pointer group active:translate-y-[2px] active:border-b-0 transition-all flex items-center justify-center gap-2.5 py-3 sm:py-3.5 px-3 rounded-[22px] bg-white hover:bg-slate-50 border border-slate-200 border-b-[4px] border-b-slate-300 shadow-sm text-slate-800 font-extrabold text-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* Apple Button */}
            <button
              type="button"
              onClick={() => handleSocialClick("Apple")}
              className="cursor-pointer group active:translate-y-[2px] active:border-b-0 transition-all flex items-center justify-center gap-2.5 py-3 sm:py-3.5 px-3 rounded-[22px] bg-white hover:bg-slate-50 border border-slate-200 border-b-[4px] border-b-slate-300 shadow-sm text-slate-800 font-extrabold text-sm"
            >
              <svg className="w-5 h-5 text-black shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.62-.76 1.05-1.81.93-2.87-.9.04-2 .6-2.65 1.36-.58.67-1.08 1.74-.95 2.78 1.01.08 2.05-.51 2.67-1.27z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* Subtle Option to enter via Player Code & Passphrase */}
          <div className="mt-4 pt-1 text-center">
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="text-xs font-bold text-[#0D5C3A] hover:text-[#094229] hover:underline cursor-pointer transition-colors"
            >
              Punya Player Code? Masuk dengan Akun Rahasia →
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* WHATSAPP MODAL                                                            */}
      {/* ========================================================================= */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[380px] bg-white rounded-3xl p-6 shadow-2xl flex flex-col text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[#0EB378]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-5 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2zm2 4v2h12V8H6zm0 4v2h8v-2H6z" />
                  </svg>
                </div>
                <h2 className="text-[#121E18] text-lg font-extrabold">
                  Lanjut dengan WhatsApp
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[#4E6155] text-xs font-medium mb-4 leading-relaxed">
              Mulai petualangan finansialmu secara instan bersama Foxy!
            </p>

            <form onSubmit={handleWhatsAppSubmit} className="flex flex-col gap-3">
              {waError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-2.5 rounded-xl">
                  {waError}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[#121E18] text-xs font-bold uppercase tracking-wider">
                  Nama Panggilan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Petualang Pintar"
                  value={waName}
                  onChange={(e) => setWaName(e.target.value)}
                  className="w-full bg-[#F8FAF9] border border-[#D8E6DC] focus:border-[#0EB378] focus:bg-white text-[#121E18] font-semibold px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#121E18] text-xs font-bold uppercase tracking-wider">
                  Nomor WhatsApp (Opsional)
                </label>
                <input
                  type="tel"
                  placeholder="0812xxxxxxxx"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  className="w-full bg-[#F8FAF9] border border-[#D8E6DC] focus:border-[#0EB378] focus:bg-white text-[#121E18] font-semibold px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={waLoading}
                className="cursor-pointer active:translate-y-[2px] transition-all flex py-3 px-4 justify-center items-center rounded-2xl border-b-[4px] border-[#078C5B] bg-[#0EB378] w-full text-[#003822] font-black text-sm mt-2 hover:brightness-105 disabled:opacity-60"
              >
                {waLoading ? "Menyiapkan Akun..." : "Masuk Sekarang"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SOCIAL QUICK CONFIRMATION MODAL                                           */}
      {/* ========================================================================= */}
      {showSocialNotice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <span className="text-2xl">✨</span>
            </div>
            <h2 className="text-[#121E18] text-lg font-extrabold mb-1">
              Masuk via {showSocialNotice}
            </h2>
            <p className="text-[#4E6155] text-xs font-medium mb-5 leading-relaxed">
              Kamu akan masuk menggunakan akun {showSocialNotice} secara cepat dan aman.
            </p>

            <div className="w-full flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickSocialLogin(showSocialNotice)}
                className="w-full py-3 rounded-2xl border-b-[4px] border-[#078C5B] bg-[#0EB378] text-[#003822] font-black text-sm hover:brightness-105 active:translate-y-[2px] transition-all cursor-pointer"
              >
                Lanjutkan Masuk
              </button>
              <button
                type="button"
                onClick={() => setShowSocialNotice(null)}
                className="w-full py-2.5 rounded-2xl text-slate-500 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PLAYER CODE & PASSPHRASE MODAL                                            */}
      {/* ========================================================================= */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white rounded-3xl p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[#121E18] text-lg font-extrabold">
                {activeTab === "login" ? "Masuk Player Code" : "Daftar Akun Baru"}
              </h2>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="w-full bg-[#F0F4F2] p-1 rounded-full flex items-center mb-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setLoginError("");
                }}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "login"
                    ? "bg-white text-[#00422B] shadow-xs"
                    : "text-[#5B6D62] hover:text-[#121E18]"
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setRegError("");
                }}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "register"
                    ? "bg-white text-[#00422B] shadow-xs"
                    : "text-[#5B6D62] hover:text-[#121E18]"
                }`}
              >
                Akun Baru
              </button>
            </div>

            {activeTab === "login" ? (
              /* FORM LOGIN */
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-2.5 rounded-xl">
                    {loginError}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[#121E18] text-xs font-bold uppercase tracking-wider">
                    Player Code
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: FOX-7K9A-4B2"
                    value={loginPlayerCode}
                    onChange={(e) => setLoginPlayerCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#F8FAF9] border border-[#D8E6DC] focus:border-[#0EB378] focus:bg-white text-[#121E18] font-semibold px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder:text-gray-400 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[#121E18] text-xs font-bold uppercase tracking-wider">
                    Kata Sandi (Passphrase)
                  </label>
                  <input
                    type="password"
                    placeholder="Masukkan kata sandimu"
                    value={loginPassphrase}
                    onChange={(e) => setLoginPassphrase(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-[#D8E6DC] focus:border-[#0EB378] focus:bg-white text-[#121E18] font-semibold px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder:text-gray-400 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="cursor-pointer active:translate-y-[2px] transition-all flex py-3 px-4 justify-center items-center rounded-2xl border-b-[4px] border-[#078C5B] bg-[#0EB378] w-full text-[#003822] font-black text-sm mt-2 hover:brightness-105 disabled:opacity-60"
                >
                  {isLoggingIn ? "Memeriksa Kredensial..." : "Masuk ke Petualangan"}
                </button>
              </form>
            ) : (
              /* FORM REGISTER */
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
                {regError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-2.5 rounded-xl">
                    {regError}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[#121E18] text-xs font-bold uppercase tracking-wider">
                    Nama Panggilan (Samaran)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BintangFinansial"
                    value={regNickname}
                    maxLength={30}
                    onChange={(e) => setRegNickname(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-[#D8E6DC] focus:border-[#0EB378] focus:bg-white text-[#121E18] font-semibold px-3.5 py-2 rounded-xl outline-none transition-all placeholder:text-gray-400 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[#121E18] text-xs font-bold uppercase tracking-wider">
                      Kata Sandi (Min. 8 Karakter)
                    </label>
                    <button
                      type="button"
                      onClick={generateEasyPassphrase}
                      className="text-xs text-[#0D5C3A] font-bold hover:underline cursor-pointer"
                    >
                      Acak Sandi
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Kata sandi rahasiamu"
                    value={regPassphrase}
                    onChange={(e) => setRegPassphrase(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-[#D8E6DC] focus:border-[#0EB378] focus:bg-white text-[#121E18] font-semibold px-3.5 py-2 rounded-xl outline-none transition-all placeholder:text-gray-400 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                    Kode Kelas / Cohort (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="6 digit kode guru"
                    value={regCohortCode}
                    maxLength={6}
                    onChange={(e) => setRegCohortCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#F8FAF9] border border-[#D8E6DC] focus:border-[#0EB378] focus:bg-white text-[#121E18] font-semibold px-3.5 py-2 rounded-xl outline-none transition-all placeholder:text-gray-400 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="cursor-pointer active:translate-y-[2px] transition-all flex py-3 px-4 justify-center items-center rounded-2xl border-b-[4px] border-[#078C5B] bg-[#0EB378] w-full text-[#003822] font-black text-sm mt-2 hover:brightness-105 disabled:opacity-60"
                >
                  {isRegistering ? "Membuat Akun..." : "Buat Akun Rahasia"}
                </button>
              </form>
            )}

            <div className="mt-4 text-center">
              <Link
                href="/onboarding"
                className="text-[#0D5C3A] text-xs font-bold hover:underline"
              >
                ← Kembali ke Pengenalan Foxy
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUCCESS REGISTRATION MODAL                                                */}
      {/* ========================================================================= */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[380px] bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">🎉</span>
            </div>
            <h2 className="text-[#121E18] text-xl font-extrabold">
              Akun Rahasia Terbit!
            </h2>
            <p className="text-[#3C4A42] text-xs font-medium mt-1 mb-4">
              Simpan kodemu baik-baik untuk login kembali di perangkat lain.
            </p>

            <div className="w-full bg-[#F0F4F2] border border-[#D8E6DC] rounded-2xl p-3.5 mb-4 text-left">
              <div className="text-[11px] font-bold text-[#5B6D62] uppercase tracking-wider mb-1">
                Player Code Kamu
              </div>
              <div className="text-lg font-extrabold text-[#0D5C3A] tracking-wider mb-2 select-all font-mono">
                {createdCredentials.playerCode}
              </div>
              <div className="text-[11px] font-bold text-[#5B6D62] uppercase tracking-wider mb-0.5">
                Kata Sandi
              </div>
              <div className="text-sm font-bold text-[#121E18] font-mono select-all">
                {createdCredentials.passphrase}
              </div>
            </div>

            <button
              onClick={handleCopyCredentials}
              className="w-full py-2.5 px-4 rounded-xl border border-[#0EB378] text-[#0D5C3A] font-bold text-sm mb-3 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              {isCopied ? "✓ Kredensial Tersalin!" : "Salin Kredensial"}
            </button>

            <button
              onClick={handleFinishRegister}
              className="w-full py-3.5 rounded-2xl border-b-[4px] border-[#078C5B] bg-[#0EB378] text-[#003822] font-black text-base hover:brightness-105 active:translate-y-[2px] transition-all cursor-pointer"
            >
              Mulai Petualangan!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
