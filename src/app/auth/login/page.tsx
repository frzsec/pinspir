import LoginRegister from "@/components/auth/login-register";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk Akun | Finspire",
  description: "Masuk dengan Player Code dan Passphrase Anda.",
};

export default function LoginPage() {
  return <LoginRegister defaultTab="login" />;
}
