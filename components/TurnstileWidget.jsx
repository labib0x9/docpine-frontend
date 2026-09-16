"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";

const DEFAULT_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export const TurnstileWidget = forwardRef(function TurnstileWidget(
  {
    siteKey = DEFAULT_SITE_KEY,
    theme = "dark",
    size = "normal",
    onSuccess,
    onExpire,
    onError,
    className = "",
  },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const isMountedRef = useRef(true);

  // Store latest callbacks in refs to avoid triggering re-mounts on inline prop functions
  const onSuccessRef = useRef(onSuccess);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  });

  // Expose imperative methods to parent (e.g. reset)
  const reset = useCallback(() => {
    if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current !== null) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (err) {
        console.warn("Turnstile reset error:", err);
      }
    }
  }, []);

  const getResponse = useCallback(() => {
    if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current !== null) {
      try {
        return window.turnstile.getResponse(widgetIdRef.current);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  useImperativeHandle(ref, () => ({
    reset,
    getResponse,
  }), [reset, getResponse]);

  useEffect(() => {
    isMountedRef.current = true;
    let checkInterval = null;

    const renderWidget = () => {
      if (!isMountedRef.current || !containerRef.current) return;
      if (!window.turnstile) return;

      // Clean up previous widget if existing
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme === "light" ? "light" : "dark",
          size: size,
          callback: token => {
            if (isMountedRef.current && onSuccessRef.current) {
              onSuccessRef.current(token);
            }
          },
          "expired-callback": () => {
            if (isMountedRef.current && onExpireRef.current) {
              onExpireRef.current();
            }
          },
          "error-callback": err => {
            if (isMountedRef.current && onErrorRef.current) {
              onErrorRef.current(err);
            }
          },
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.warn("Turnstile render error:", err);
      }
    };

    if (typeof window !== "undefined") {
      if (window.turnstile) {
        renderWidget();
      } else {
        // Poll until Turnstile script is loaded
        checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            renderWidget();
          }
        }, 100);
      }
    }

    return () => {
      isMountedRef.current = false;
      if (checkInterval) clearInterval(checkInterval);
      if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, size]);

  return (
    <div className={`turnstile-container ${className}`}>
      <div ref={containerRef} />
    </div>
  );
});

export default TurnstileWidget;
