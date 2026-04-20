import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";
import logo from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleProfileNavigate = (event) => {
    event.preventDefault();
    navigate("/profile");
  };

  return (
    <header className="py-4 px-6 sm:px-8 flex justify-between items-center sticky top-0 z-50 mb-6 bg-white/80 backdrop-blur-xl border-b border-white/40 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="relative group cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="FoodLens Logo" className="w-12 h-12 rounded-xl shadow-md group-hover:shadow-lg transition-shadow object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">FoodLens</h1>
          <p className="text-xs text-gray-700">AI Calorie Counter</p>
        </div>
      </div>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="rounded-full group">
              <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center group-hover:border-emerald-300 transition-colors">
                <User className="w-5 h-5 text-gray-800" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
            <div className="px-3 py-3">
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              {profile && (
                <p className="text-xs text-gray-700">
                  Goal: {profile.daily_calorie_goal || 2000} cal/day
                </p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={handleProfileNavigate}
              className="cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" />
              Update Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut} 
              className="cursor-pointer text-red-500 focus:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
};

export default Header;
