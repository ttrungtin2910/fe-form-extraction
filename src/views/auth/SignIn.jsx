import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MdOutlineRemoveRedEye, MdLock, MdPerson } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";
import { useAuth } from "contexts/AuthContext";
import { useToast } from "components/common/ToastProvider";
import BlurText from "components/animations/BlurText";

function SignIn() {
  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleClick = () => setShow(!show);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);

      toast.success(`Chào mừng trở lại, ${username}!`);

      // Navigate to dashboard
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Sai tên đăng nhập hoặc mật khẩu");
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const demoAccounts = [
    { username: "tin.trantrung", password: "secret", role: "Quản trị viên" },
    { username: "thao.nguyentrang", password: "secret", role: "Người dùng" },
    { username: "vin.nguyenthai", password: "secret", role: "Người dùng" },
    { username: "testuser1", password: "secret", role: "Người xem" },
    { username: "testuser2", password: "secret", role: "Người xem" },
  ];

  const handleDemoClick = (account) => {
    setUsername(account.username);
    setPassword(account.password);
  };

  return (
    <motion.div
      className="bg-black relative flex min-h-screen w-full items-center justify-center overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* DarkVeil Background is now in Auth Layout - applies to all auth pages */}

      {/* Login Card */}
      <motion.div
        variants={itemVariants}
        className="relative z-10 mx-4 w-full max-w-md"
      >
        {/* Glassmorphism Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl md:p-10">
          {/* Logo/Title Section */}
          <motion.div variants={itemVariants} className="mb-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm"
            >
              <MdLock className="h-8 w-8 text-white" />
            </motion.div>

            <BlurText
              text="Chào mừng trở lại"
              animateBy="words"
              direction="top"
              delay={150}
              className="mb-4 text-3xl font-bold leading-normal tracking-normal text-white md:text-4xl"
            />

            <motion.p
              variants={itemVariants}
              className="mt-3 text-sm leading-normal text-white/70 md:text-base"
            >
              Đăng nhập để tiếp tục với tài khoản của bạn
            </motion.p>
          </motion.div>

          {/* Form */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Username Input */}
            <motion.div variants={itemVariants}>
              <label className="mb-2.5 block text-sm font-medium text-white/90">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <MdPerson
                    className={`h-5 w-5 transition-colors ${
                      focusedField === "username"
                        ? "text-white"
                        : "text-white/50"
                    }`}
                  />
                </div>
                <motion.input
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 pl-12 pr-4 text-white placeholder-white/40 backdrop-blur-sm transition-all focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div variants={itemVariants}>
              <label className="mb-2.5 block text-sm font-medium text-white/90">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <MdLock
                    className={`h-5 w-5 transition-colors ${
                      focusedField === "password"
                        ? "text-white"
                        : "text-white/50"
                    }`}
                  />
                </div>
                <motion.input
                  type={show ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 pl-12 pr-12 text-white placeholder-white/40 backdrop-blur-sm transition-all focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                />
                <button
                  type="button"
                  onClick={handleClick}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/50 transition-colors hover:text-white"
                >
                  {show ? (
                    <RiEyeCloseLine className="h-5 w-5" />
                  ) : (
                    <MdOutlineRemoveRedEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Submit Button - Modern Glassmorphism Style */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="text-black group relative w-full overflow-hidden rounded-xl bg-white px-6 py-3.5 font-semibold shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
              whileHover={{
                scale: 1.02,
                boxShadow:
                  "0 20px 25px -5px rgba(255, 255, 255, 0.3), 0 10px 10px -5px rgba(255, 255, 255, 0.1)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shine effect */}
              <div className="from-transparent to-transparent absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r via-white/30 transition-transform duration-1000 group-hover:translate-x-full" />

              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg
                      className="text-black h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <svg
                      className="h-5 w-5 transform transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </span>
            </motion.button>
          </motion.form>

          {/* Demo Accounts */}
          <motion.div
            variants={itemVariants}
            className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
          >
            <p className="mb-3 text-center text-sm font-medium text-white/80">
              Tài khoản demo:
            </p>
            <div className="space-y-2">
              {demoAccounts.map((account, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleDemoClick(account)}
                  className="border-transparent group relative w-full overflow-hidden rounded-lg border bg-white/0 px-4 py-2.5 text-left text-xs text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  whileHover={{ x: 4, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <span className="relative z-10 flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{account.username}</span>
                      <span className="ml-2 text-white/50">
                        / {account.password}
                      </span>
                      <span className="ml-2 text-white/60">
                        ({account.role})
                      </span>
                    </div>
                    <svg
                      className="h-4 w-4 transform opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SignIn;
