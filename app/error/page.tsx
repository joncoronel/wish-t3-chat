"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ErrorPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="bg-destructive/10 mx-auto mb-4 w-fit rounded-full p-3">
              <AlertCircle className="text-destructive h-6 w-6" />
            </div>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>
              Something went wrong during authentication. This could be due to:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>• Invalid email or password</li>
              <li>• Network connection issues</li>
              <li>• Account not yet verified</li>
              <li>• Server maintenance</li>
            </ul>

            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/login">Try Again</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
