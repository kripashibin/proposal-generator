"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn, signUp, type AuthActionState } from "./actions";

const initialState: AuthActionState = { error: null };

export function LoginForm({ next }: { next: string }) {
  const [signInState, signInAction, signInPending] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);

  return (
    <Card>
      <Tabs defaultValue="signin">
        <CardHeader>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="signin" className="space-y-4">
            <form action={signInAction} className="space-y-4">
              <input type="hidden" name="next" value={next} />
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              {signInState.error ? (
                <p className="text-sm text-destructive">{signInState.error}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={signInPending}>
                {signInPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup" className="space-y-4">
            <form action={signUpAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-company">Company</Label>
                <Input id="signup-company" name="companyName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-name">Your name</Label>
                <Input id="signup-name" name="fullName" required autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              {signUpState.error ? (
                <p className="text-sm text-destructive">{signUpState.error}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={signUpPending}>
                {signUpPending ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </CardContent>
      </Tabs>
      <CardFooter className="text-xs text-muted-foreground">
        By continuing you agree this is your own workspace for managing client proposals.
      </CardFooter>
    </Card>
  );
}
