"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

// The uploaded image never leaves the browser. We keep a temporary local
// link to it (an "object URL") in app state, so it survives moving from the
// drop zone to /theme/upload. A page refresh clears app state, so the image
// is gone after a refresh; the upload page explains that.
export type Upload = { url: string; name: string };

type UploadContext = { upload: Upload | null; setUpload: (upload: Upload) => void };

const Context = createContext<UploadContext>({ upload: null, setUpload: () => {} });

export function UploadProvider({ children }: { children: ReactNode }) {
  const [upload, setState] = useState<Upload | null>(null);

  const setUpload = useCallback((next: Upload) => {
    // Free the previous image's memory before replacing it.
    setState((previous) => {
      if (previous && previous.url !== next.url) URL.revokeObjectURL(previous.url);
      return next;
    });
  }, []);

  return <Context.Provider value={{ upload, setUpload }}>{children}</Context.Provider>;
}

export function useUpload() {
  return useContext(Context);
}
