import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Disable browser's automatic scroll restoration so we always start at top.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    // Force the top after route content and late-loading sections have both rendered.
    const scroll = () => {
      window.scrollTo(0, 0);
      document.scrollingElement?.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scroll();
    const raf = requestAnimationFrame(scroll);
    const timeout = window.setTimeout(scroll, 100);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
