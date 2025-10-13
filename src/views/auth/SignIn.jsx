import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";
import { useAuth } from "contexts/AuthContext";
import { useToast } from "components/common/ToastProvider";

function SignIn() {
  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => setShow(!show);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
      
      toast.success(`Welcome back, ${username}!`);

      // Navigate to dashboard
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Incorrect username or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-auto flex flex-col pl-5 pr-5 md:pr-0 md:pl-12 lg:max-w-[48%] lg:pl-0 xl:max-w-full">
      <div className="me-auto mb-6 mt-10">
        <h1 className="text-4xl font-bold text-navy-700 dark:text-white mb-3">
          Sign In
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Enter your username and password to sign in!
        </p>
      </div>
      
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Username Input */}
          <div>
            <label className="text-sm font-medium text-navy-700 dark:text-white mb-2 block">
              Username <span className="text-brand-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="text-sm font-medium text-navy-700 dark:text-white mb-2 block">
              Password <span className="text-brand-500">*</span>
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                placeholder="Min. 6 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {show ? (
                  <RiEyeCloseLine className="h-5 w-5" />
                ) : (
                  <MdOutlineRemoveRedEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Demo Accounts Info */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-navy-800 rounded-xl">
          <p className="text-sm font-medium text-navy-700 dark:text-white mb-2">
            Demo Accounts:
          </p>
          <div className="space-y-1">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              • tin.trantrung / secret (Admin)
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              • thao.nguyentrang / secret (User)
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              • vin.nguyenthai / secret (User)
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              • testuser1 / secret (Viewer)
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              • testuser2 / secret (Viewer)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
