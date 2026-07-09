"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "@/app/(auth)/actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialState: AuthState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <Card className="p-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" required placeholder="Alex Coach" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
        </div>
        {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
        <Button type="submit" disabled={pending} className="mt-1 w-full justify-center">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-[13px] text-text-2">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent-strong hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
