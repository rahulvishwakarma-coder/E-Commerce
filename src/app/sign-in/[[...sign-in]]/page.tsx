import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90 text-sm',
            card: 'shadow-xl border border-border rounded-2xl',
          }
        }}
        routing="path" 
        path="/sign-in" 
        signUpUrl="/sign-up"
      />
    </div>
  );
}
