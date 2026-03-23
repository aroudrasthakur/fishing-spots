import type { Metadata } from "next";
import { SignInView } from "@/components/auth/SignInView";

export const metadata: Metadata = {
  title: "Sign in — ReelMap US",
  description: "Sign in to add U.S. fishing spots and catch photos on the map.",
};

export default function SignInPage() {
  return <SignInView />;
}
