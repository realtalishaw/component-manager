import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';

type AuthFormProps = {
  // onSuccess: () => void;
};

export function AuthForm(/* { onSuccess }: AuthFormProps */) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      setIsSent(true);
      toast({
        title: "Magic Link Sent",
        description: "Check your email for the login link.",
      });
    } catch (error) {
      console.error('Error during magic link request:', error);
      toast({
        title: "Error",
        description: "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || isSent}>
        {isLoading ? 'Sending...' : isSent ? 'Check Your Email' : 'Send Magic Link'}
      </Button>
      {isSent && (
        <p className="text-sm text-center text-muted-foreground">
          A login link has been sent to your email. Please check your inbox.
        </p>
      )}
    </form>
  );
}
