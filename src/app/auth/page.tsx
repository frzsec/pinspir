import LoginRegister from "@/components/auth/login-register";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk atau Daftar Akun | Finspire",
  description: "Masuk dengan Player Code atau buat akun rahasia pseudonim Finspire.",
};

export default function AuthPage() {
  return <LoginRegister defaultTab="login" />;
}
