"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, User, Menu, X, ShoppingBag, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  SignInButton, 
  UserButton, 
  Show,
  useAuth 
} from "@clerk/nextjs";

const Navbar = () => {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProtectedClick = (path: string) => {
    if (!isSignedIn) {
      // If not signed in, we can either redirect to a sign-in page 
      // or just open the sign-in modal if we prefer.
      // Redirecting to /auth is what caused the confusion before.
      // We'll use router.push with a clerk path or just rely on middleware.
      router.push("/sign-in"); 
    } else {
      router.push(path);
    }
    setMobileOpen(false);
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { name: "Buy Books", path: "/marketplace", icon: <ShoppingBag className="h-4 w-4" />, protected: false },
    { name: "Sell Books", path: "/add-listing", icon: <Plus className="h-4 w-4" />, protected: true },
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, protected: true },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo Section */}
        <Link href="/" className="group flex items-center gap-2.5 transition-transform active:scale-95">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:rotate-12">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            BookBazzar
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => link.protected ? handleProtectedClick(link.path) : router.push(link.path)}
              className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 hover:text-primary ${
                isActive(link.path) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.name}
              {isActive(link.path) && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-4 md:flex">
            <Show when="signed-in">
              <Button 
                size="sm" 
                className="rounded-full bg-primary px-5 font-semibold hover:shadow-md transition-all"
                onClick={() => router.push("/add-listing")}
              >
                <Plus className="mr-1.5 h-4 w-4" /> List a Book
              </Button>
              <UserButton afterSignOutUrl="/" />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button className="rounded-full px-6 font-semibold">
                  Sign In
                </Button>
              </SignInButton>
            </Show>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t bg-card md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {navLinks.map((link, i) => (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={link.path}
                >
                  <Button
                    variant={isActive(link.path) ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 rounded-xl py-6 text-base font-medium"
                    onClick={() => link.protected ? handleProtectedClick(link.path) : router.push(link.path)}
                  >
                    {link.icon}
                    {link.name}
                  </Button>
                </motion.div>
              ))}
              
              <hr className="my-2 border-muted" />
              
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Show when="signed-in">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm font-medium text-muted-foreground">Account</span>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </Show>
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <Button className="w-full rounded-xl py-6 text-lg font-bold">
                      Sign In
                    </Button>
                  </SignInButton>
                </Show>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
