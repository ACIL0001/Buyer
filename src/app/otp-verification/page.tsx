"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Snackbar, Alert } from "@mui/material";
import type { AlertColor } from "@mui/material/Alert";
import useAuth from "@/hooks/useAuth";

export default function OTPVerification() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>("success");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { set } = useAuth();

  const [phone, setPhone] = useState(searchParams.get("phone") || "");

  useEffect(() => {
    if (!phone) {
      if (typeof window !== "undefined") {
        const storedData = localStorage.getItem("registrationData");
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            if (parsed.phone) {
              setPhone(parsed.phone);
            }
          } catch (e) {
            console.error("Error parsing registration data", e);
          }
        }
      }
    }
  }, [phone]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Check if OTP is complete
  useEffect(() => {
    const otpString = otp.join("");
    setIsComplete(otpString.length === 6);
  }, [otp]);

  // Format countdown time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSnackbarClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setSnackbarMessage("Veuillez saisir le code complet à 6 chiffres");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
          otp: otpCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSnackbarMessage("OTP vérifié avec succès !");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        if (data.data && data.data.user) {
          const authData = {
            user: data.data.user,
            tokens: {
              accessToken: data.data.access_token || data.data.session?.access_token,
              refreshToken: data.data.refresh_token || data.data.session?.refresh_token,
            },
          };
          set(authData);
          
          setTimeout(() => {
            router.push("/profile");
          }, 1500);
        } else {
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
        }
      } else {
        throw new Error(data.message || "Code OTP invalide");
      }
    } catch (error: unknown) {
      console.error("OTP verification error:", error);
      const errMsg = (error as { message?: string })?.message || "Erreur lors de la vérification du code";
      setSnackbarMessage(errMsg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);

      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);

      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSnackbarMessage("Un nouveau code a été envoyé !");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        setTimeLeft(300);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        throw new Error(data.message || "Erreur lors de l'envoi du code");
      }
    } catch (error: unknown) {
      console.error("OTP resend error:", error);
      const errMsg = (error as { message?: string })?.message || "Erreur lors de l'envoi du code";
      setSnackbarMessage(errMsg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isComplete) {
      handleVerifyOTP();
    }
  };

  const formatPhoneForDisplay = (phoneNumber: string) => {
    if (!phoneNumber) return "votre téléphone";
    if (phoneNumber.startsWith('+213')) {
      return '0' + phoneNumber.slice(4);
    }
    return phoneNumber;
  };

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background: #ffffff;
          overflow: hidden;
        }

        .verification-page {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
        }

        .verification-card {
          width: 100%;
          max-width: 680px;
          padding: 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .shield-icon {
          margin-bottom: 50px;
          color: #1a1a1a;
        }

        .verification-title {
          font-size: 32px;
          font-weight: 600;
          color: #333333;
          margin-bottom: 25px;
        }

        .verification-subtitle {
          font-size: 18px;
          color: #666666;
          margin-bottom: 50px;
          line-height: 1.5;
          max-width: 520px;
        }

        .otp-inputs {
          display: flex;
          gap: 18px;
          justify-content: center;
          margin-bottom: 60px;
        }

        .otp-input {
          width: 78px;
          height: 100px;
          border: 1px solid #D1D1D1;
          border-radius: 14px;
          text-align: center;
          font-size: 36px;
          font-weight: 500;
          color: #333;
          outline: none;
          transition: all 0.2s ease;
          background: transparent;
        }

        .otp-input:focus {
          border-color: #002795;
          box-shadow: 0 0 0 1px #002795;
        }

        .confirm-button {
          width: 100%;
          max-width: 360px;
          min-height: 54px;
          background: #002795;
          color: #ffffff;
          border: none;
          border-radius: 27px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .confirm-button:hover:not(:disabled) {
          background: #001e75;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 39, 149, 0.2);
        }

        .confirm-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .resend-link {
          background: none;
          border: none;
          color: #666666;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .resend-link:hover:not(:disabled) {
          color: #002795;
          text-decoration: underline;
        }

        .resend-link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes spinner {
          to { transform: rotate(360deg); }
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spinner 0.6s linear infinite;
        }

        @media (max-width: 600px) {
          .otp-input {
            width: 54px;
            height: 72px;
            font-size: 26px;
          }
          .otp-inputs {
            gap: 10px;
          }
          .verification-card {
            padding: 20px;
          }
          .verification-title {
            font-size: 26px;
          }
          .verification-subtitle {
            font-size: 15px;
          }
        }
      `}</style>

      <div className="verification-page">
        <div className="verification-card">
          {/* Shield Icon SVG matching the design */}
          <div className="shield-icon">
            <svg width="84" height="96" viewBox="0 0 84 96" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M42 0L6 12V42C6 66.6 21.36 89.28 42 96C62.64 89.28 78 66.6 78 42V12L42 0Z" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <text x="42" y="52" fontFamily="Arial" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#1a1a1a">x x x x</text>
            </svg>
          </div>

          <h2 className="verification-title">Entrez le code de vérification</h2>
          
          <p className="verification-subtitle">
            Un code à 6 chiffres a été envoyé au {formatPhoneForDisplay(phone)}.<br />
            Veuillez le saisir ci-dessous pour continuer.
          </p>

          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onKeyPress={handleKeyPress}
                className="otp-input"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button
            className="confirm-button"
            onClick={handleVerifyOTP}
            disabled={loading || !isComplete}
          >
            {loading ? <div className="loading-spinner" /> : "Confirmez"}
          </button>

          <button
            onClick={handleResendOTP}
            disabled={!canResend || resendLoading}
            className="resend-link"
          >
            {resendLoading ? "Envoi..." : canResend ? "Renvoyer le code" : `Renvoyer le code dans ${formatTime(timeLeft)}`}
          </button>
        </div>
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%", borderRadius: "12px" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
