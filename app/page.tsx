import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { isAuthenticated } = await auth();

  if (isAuthenticated) {
    redirect(process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? "/editor");
  } else {
    redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in");
  }
}