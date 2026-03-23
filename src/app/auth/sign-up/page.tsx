import type { Metadata } from "next";
import { SignUpView } from "@/components/auth/SignUpView";

export const metadata: Metadata = {
  title: "Create account — ReelMap US",
  description: "Create a ReelMap US account to contribute fishing spots and catches.",
};

export default function SignUpPage() {
  return <SignUpView />;
}
