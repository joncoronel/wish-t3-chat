import { MessageSquare } from "lucide-react";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { login, signup, signInWithGoogle } from "@/lib/auth/actions";

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="bg-primary/10 rounded-full p-4">
              <MessageSquare className="text-primary h-8 w-8" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight">
            Welcome to Wish T3 Chat
          </h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-muted-foreground">AI-powered chat application</p>
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Sign In */}
            <form action={signInWithGoogle}>
              <Button type="submit" variant="outline" className="w-full">
                <SiGoogle className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background text-muted-foreground px-2">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Email/Password Sign In */}
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="flex gap-2">
                <Button formAction={login} className="flex-1">
                  Sign In
                </Button>
                <Button
                  formAction={signup}
                  variant="outline"
                  className="flex-1"
                >
                  Sign Up
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-xs">
            Built for the T3 Chat Clone competition
          </p>
        </div>
      </div>
    </div>
  );
}
