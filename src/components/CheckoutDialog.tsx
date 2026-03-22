import { useState, FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, CreditCard, Banknote, Loader2 } from "lucide-react";
import { CartItem } from "@/hooks/useCart";
import { loadRazorpayScript } from "@/lib/razorpay";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  onSuccess: () => void;
}

const CheckoutDialog = ({ open, onOpenChange, cartItems, onSuccess }: CheckoutDialogProps) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [form, setForm] = useState({
    address_line: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price || 0), 0);
  const shipping = cartItems.length > 0 ? 40 : 0;
  const totalAmount = subtotal + shipping;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const processTransactions = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    
    // NOTE: Consider moving this to a single bulk endpoint on your backend to prevent partial failures!
    const promises = cartItems.map((item) => 
      fetch(`${apiUrl}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-clerk-id": user?.id || "",
        },
        body: JSON.stringify({
          bookId: item._id,
          sellerId: item.sellerId,
          type: item.is_swap ? "swap" : "purchase",
          paymentMethod,
          address_line: form.address_line,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          phone: form.phone,
        }),
      })
    );

    const results = await Promise.all(promises);
    const failed = results.filter(r => !r.ok);
    
    if (failed.length > 0) {
      throw new Error(`Failed to place some orders. Please contact support.`);
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault(); // Prevent default form submission

    if (!isLoaded || !isSignedIn || !user) {
      router.push("/sign-in");
      return;
    }

    if (!form.address_line || !form.city || !form.state || !form.pincode || !form.phone) {
      toast({ title: "Missing fields", description: "Please fill all address fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      if (paymentMethod === "online") {
        const resScript = await loadRazorpayScript();

        if (!resScript) {
          toast({ title: "Razorpay SDK failed to load", description: "Check your internet connection.", variant: "destructive" });
          setSubmitting(false);
          return;
        }

        // Create Order on Backend
        const orderRes = await fetch(`${apiUrl}/payments/order`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-clerk-id": user.id 
          },
          body: JSON.stringify({ amount: totalAmount }),
        });

        if (!orderRes.ok) {
          const errorData = await orderRes.json();
          throw new Error(errorData.message || "Failed to create Razorpay order");
        }

        const orderData = await orderRes.json();

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Removed hardcoded fallback!
          amount: orderData.amount,
          currency: orderData.currency,
          name: "BookBazzar",
          description: `Payment for ${cartItems.length} books`,
          order_id: orderData.id,
          handler: async function (response: any) {
            try {
              // Verify Payment on Backend
              const verifyRes = await fetch(`${apiUrl}/payments/verify`, {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "x-clerk-id": user.id 
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                await processTransactions();
                toast({ title: "Payment Successful! ✅", description: "Your orders have been placed." });
                onSuccess();
                onOpenChange(false);
              } else {
                toast({ title: "Payment Verification Failed", variant: "destructive" });
              }
            } catch (err) {
               toast({ title: "Error", description: "Failed to process transactions after payment.", variant: "destructive" });
            } finally {
               setSubmitting(false);
            }
          },
          prefill: {
            name: user.fullName || "",
            email: user.primaryEmailAddress?.emailAddress || "",
            contact: form.phone,
          },
          theme: { color: "#3b82f6" },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.on('payment.failed', function () {
            toast({ title: "Payment Failed", description: "Your transaction could not be completed.", variant: "destructive" });
            setSubmitting(false);
        });
        paymentObject.open();
      } else {
        // Cash on Delivery
        await processTransactions();
        toast({ title: "Orders Placed! ✅", description: "The sellers have been notified." });
        onSuccess();
        onOpenChange(false);
        setSubmitting(false);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Checkout ({cartItems.length} items)</DialogTitle>
          <p className="text-sm text-muted-foreground">Complete your order details.</p>
        </DialogHeader>

        {/* Form wrapper added here */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Delivery Address</span>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Address Line</Label>
                <Input
                  placeholder="Hostel name, Room no..."
                  value={form.address_line}
                  onChange={(e) => handleChange("address_line", e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">City</Label>
                  <Input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">State</Label>
                  <Input
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Pincode</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Pincode"
                    value={form.pincode}
                    onChange={(e) => handleChange("pincode", e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Payment Method</span>
            </div>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  paymentMethod === "cash" ? "border-primary bg-accent" : "border-border"
                }`}
              >
                <RadioGroupItem value="cash" id="cash" />
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Cash</span>
              </label>
              <label
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  paymentMethod === "online" ? "border-primary bg-accent" : "border-border"
                }`}
              >
                <RadioGroupItem value="online" id="online" />
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Online</span>
              </label>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary text-primary-foreground font-semibold"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ₹${totalAmount}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;