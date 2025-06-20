import { login, signup } from "@/lib/auth/actions";

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-foreground mt-6 text-center text-3xl font-extrabold">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6">
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="border-border bg-card text-foreground placeholder-muted-foreground focus-visible:ring-ring/50 relative block w-full appearance-none rounded-none rounded-t-md border px-3 py-2 transition-[color,box-shadow] focus:z-10 focus:outline-none focus-visible:ring-[3px] sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="border-border bg-card text-foreground placeholder-muted-foreground focus-visible:ring-ring/50 relative block w-full appearance-none rounded-none rounded-b-md border px-3 py-2 transition-[color,box-shadow] focus:z-10 focus:outline-none focus-visible:ring-[3px] sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              formAction={login}
              className="group bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/50 relative flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium transition-[color,box-shadow] focus:outline-none focus-visible:ring-[3px]"
            >
              Sign in
            </button>
            <button
              formAction={signup}
              className="group border-primary bg-card text-primary hover:bg-secondary hover:text-secondary-foreground focus-visible:ring-ring/50 relative flex w-full justify-center rounded-md border px-4 py-2 text-sm font-medium transition-[color,box-shadow] focus:outline-none focus-visible:ring-[3px]"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
