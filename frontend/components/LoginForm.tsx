'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const router = useRouter();
  const { setCurrentUser } = useCurrentUser();

  useEffect(() => {
    if (!error) return;

    const timeoutId = window.setTimeout(() => setError(""), 10_000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  useEffect(() => {
    if (!registerError) return;

    const timeoutId = window.setTimeout(() => setRegisterError(""), 10_000);
    return () => window.clearTimeout(timeoutId);
  }, [registerError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (e.target !== e.currentTarget) {
      return;
    }

    setError("");
    setRegisterError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_name: userName, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong!");
      }
      if (!data.user) {
        throw new Error("The server did not return the user profile.");
      }

      setCurrentUser(data.user);
      router.push("/challenges");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setError("");
    setRegisterError("");
    setIsRegistering(true);

    const formData = new FormData(e.currentTarget);
    const userName = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: userName, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.authenticated) {
        throw new Error(data.message || "Failed to create account.");
      }
      if (!data.user) {
        throw new Error("The server did not return the user profile.");
      }

      setCurrentUser(data.user);
      router.push("/challenges");
      router.refresh();
    } catch (err: unknown) {
      setRegisterError(
        err instanceof Error ? err.message : "Failed to connect to server."
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegisterOpenChange = (open: boolean) => {
    setIsRegisterOpen(open);

    if (open) {
      setError("");
    } else {
      setRegisterError("");
    }
  };

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <Card className="border-stone-200 dark:border-stone-800 shadow-xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-xl overflow-y-auto">

        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight text-stone-800 dark:text-stone-100">
            Welcome back
          </CardTitle>

          <CardDescription className="text-stone-500 dark:text-stone-400">
            Login here
          </CardDescription>
        </CardHeader>

        <CardContent>

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid gap-6">

              {/* Email / Username */}
              <div className="grid gap-2">
                <Label htmlFor="user-name">
                  Username
                </Label>

                <Input
                  id="user-name"
                  type="text"
                  placeholder="Username"
                  required
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setError("");
                  }}
                  className="bg-stone-50/50 dark:bg-stone-950/50"
                />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">
                    Password
                  </Label>

                  <a
                    href="#"
                    className="ml-auto text-sm text-violet-600 hover:text-violet-500 underline-offset-4 hover:underline"
                  >
                    Forgot password
                  </a>
                </div>

                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="bg-stone-50/50 dark:bg-stone-950/50"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="text-sm font-medium text-red-500 dark:text-red-400 text-center">
                  {error}
                </div>
              )}

              {/* Register Dialog */}
              <Dialog
                open={isRegisterOpen}
                onOpenChange={handleRegisterOpenChange}
              >
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                    >
                      Sign up
                    </Button>
                  }
                />

                <DialogContent className="sm:max-w-sm rounded-xl">

                  <form onSubmit={handleRegister} noValidate>
                    <DialogHeader>
                      <DialogTitle>
                        Create account
                      </DialogTitle>

                      <DialogDescription>
                        Create a new account to get started.
                      </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                      <Field>
                        <Label htmlFor="register-username">
                          Username
                        </Label>

                        <Input
                          id="register-username"
                          name="username"
                          placeholder="Username"
                          required
                          onChange={() => setRegisterError("")}
                        />
                      </Field>

                      <Field>
                        <Label htmlFor="register-password">
                          Password
                        </Label>

                        <Input
                          id="register-password"
                          name="password"
                          type="password"
                          placeholder="Password"
                          required
                          onChange={() => setRegisterError("")}
                        />
                      </Field>
                    </FieldGroup>

                    {registerError && (
                      <div className="mt-4 text-sm font-medium text-red-500 dark:text-red-400">
                        {registerError}
                      </div>
                    )}

                    <DialogFooter className="mt-6">
                      <DialogClose
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                          >
                            Cancel
                          </Button>
                        }
                      />

                      <Button
                        type="submit"
                        disabled={isRegistering}
                        className="rounded-xl bg-violet-600 hover:bg-violet-800 text-white"
                      >
                        {isRegistering && <Spinner />}
                        {isRegistering ? "Signing up..." : "Sign up"}
                      </Button>
                    </DialogFooter>
                  </form>

                </DialogContent>
              </Dialog>

              {/* LOGIN BUTTON */}
              <Button
                type="submit"
                disabled={isLoading}
                className="rounded-xl w-full bg-violet-600 hover:bg-violet-800 text-white font-medium disabled:opacity-50"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

            </div>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
