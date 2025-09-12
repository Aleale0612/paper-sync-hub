"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"   // supaya dark mode pakai class `dark`
      defaultTheme="system" // default: ikut system
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
