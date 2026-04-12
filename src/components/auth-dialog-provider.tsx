"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthForm, type AuthView } from "@/components/auth-form";

type OpenAuthDialogOptions = {
  nextPath?: string;
  notice?: string | null;
};

type AuthDialogContextValue = {
  openAuthDialog: (view: AuthView, options?: OpenAuthDialogOptions) => void;
  closeAuthDialog: () => void;
};

type DialogState = {
  isOpen: boolean;
  view: AuthView;
  nextPath: string;
  notice: string | null;
  version: number;
};

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

const initialState: DialogState = {
  isOpen: false,
  view: "login",
  nextPath: "/dashboard",
  notice: null,
  version: 0
};

const DIALOG_TITLE_ID = "auth-dialog-title";

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

export function AuthDialogProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<DialogState>(initialState);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const closeAuthDialog = useCallback(() => {
    setState((current) => ({
      ...current,
      isOpen: false,
      notice: null
    }));
  }, []);

  const openAuthDialog = useCallback((view: AuthView, options?: OpenAuthDialogOptions) => {
    setState((current) => ({
      isOpen: true,
      view,
      nextPath: options?.nextPath ?? "/dashboard",
      notice: options?.notice ?? null,
      version: current.version + 1
    }));
  }, []);

  useEffect(() => {
    if (!state.isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const [firstFocusableElement] = getFocusableElements(dialog);
      (firstFocusableElement ?? dialog).focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAuthDialog();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusableElements = getFocusableElements(dialog);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const isFocusInsideDialog = activeElement ? dialog.contains(activeElement) : false;

      if (event.shiftKey) {
        if (!isFocusInsideDialog || activeElement === firstFocusableElement) {
          event.preventDefault();
          lastFocusableElement.focus();
        }

        return;
      }

      if (!isFocusInsideDialog || activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);

      if (previousFocusedElement?.isConnected) {
        previousFocusedElement.focus();
      }
    };
  }, [closeAuthDialog, state.isOpen]);

  const value = useMemo(
    () => ({
      openAuthDialog,
      closeAuthDialog
    }),
    [closeAuthDialog, openAuthDialog]
  );

  return (
    <AuthDialogContext.Provider value={value}>
      {children}

      {state.isOpen ? (
        <div className="fixed inset-0 z-[90] overflow-y-auto p-4 sm:p-6">
          <button
            type="button"
            onClick={closeAuthDialog}
            className="fixed inset-0 bg-[rgba(20,25,37,0.34)] backdrop-blur-md"
            aria-label="Закрити вікно авторизації"
          />

          <div className="relative flex min-h-full items-start justify-center py-4 sm:items-center sm:py-8">
            <div
              ref={dialogRef}
              className="relative z-[1] w-full max-w-[32rem]"
              aria-modal="true"
              role="dialog"
              aria-labelledby={DIALOG_TITLE_ID}
              tabIndex={-1}
            >
              <AuthForm
                key={`${state.view}:${state.nextPath}:${state.version}`}
                initialView={state.view}
                nextPath={state.nextPath}
                initialNotice={state.notice}
                display="modal"
                onClose={closeAuthDialog}
                titleId={DIALOG_TITLE_ID}
              />
            </div>
          </div>
        </div>
      ) : null}
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);

  if (!context) {
    throw new Error("useAuthDialog must be used within AuthDialogProvider.");
  }

  return context;
}
