import LoginRegister from "@/components/auth/login-register";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Akun Baru | Finspire",
  description: "Buat akun rahasia pseudonim Finspire.",
};

export default function RegisterPage() {
  return <LoginRegister defaultTab="register" />;
}
