
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [defaultTheme, setDefaultTheme] = React.useState("dark"); // Default to dark initially

  React.useEffect(() => {
    const unsub = onSnapshot(doc(firestore, "settings", "appConfig"), (doc) => {
      if (doc.exists()) {
        const theme = doc.data().defaultTheme;
        if (theme && ['light', 'dark', 'system'].includes(theme)) {
          setDefaultTheme(theme);
        }
      }
    });
    return () => unsub();
  }, []);

  return <NextThemesProvider {...props} defaultTheme={defaultTheme}>{children}</NextThemesProvider>
}
