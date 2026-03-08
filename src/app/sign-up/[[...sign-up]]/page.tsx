import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90 text-sm',
            card: 'shadow-xl border border-border rounded-2xl',
          }
        }}
        routing="path" 
        path="/sign-up" 
        signInUrl="/sign-in"
      />
    </div>
  );
}
