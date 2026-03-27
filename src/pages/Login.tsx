import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EggLogo } from "@/components/EggLogo";
import { AuthLayout } from "@/components/AuthLayout";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate("/dashboard");
    }, 1000);
  };


  return (
    <AuthLayout>
      <Card className="border-0 shadow-elevated animate-fade-in">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-4">
            <EggLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to EggPro</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 animate-fade-in-delay-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 animate-fade-in-delay-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 animate-fade-in-delay-3"
              variant="gradient"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="flex items-center justify-between mt-6 text-sm animate-fade-in-delay-3">
            <Link 
              to="/forgot-password" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
            <div className="text-muted-foreground">
              Need an account?{" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default Login;
