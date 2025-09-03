'use client';

import { useState } from "react";
import { Input } from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { translations } from "@/lib/translations";

interface PasswordInputProps {
  password: string;
  setPassword: (password: string) => void;
  loading: boolean;
}

export const PasswordInput = ({
  password,
  setPassword,
  loading,
}: PasswordInputProps) => {
  const t = translations.components.passwordInput;
  const [showPassword, setShowPassword] = useState(false);

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Input
      className="pl-10 pr-12"
      id="password"
      name="password"
      type={showPassword ? "text" : "password"}
      placeholder={t.placeholder}
      required
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      disabled={loading}
      autoComplete="current-password"
      size="sm"
      label={t.label}
      endContent={
        <button
          type="button"
          className="focus:outline-solid outline-transparent"
          onClick={handleShowPassword}
          disabled={loading}
          aria-label={showPassword ? t.hidePassword : t.showPassword}
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      }
    />
  );
};
