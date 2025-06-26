"use client";
import React from "react";

interface ErrorBannerProps {
  message: string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => {
  if (!message) return null;

  return <div className="text-red-500 text-center py-2">{message}</div>;
};

export default ErrorBanner;
