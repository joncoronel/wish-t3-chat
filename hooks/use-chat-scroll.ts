"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";

interface UseChatScrollOptions {
  messages: unknown[];
  chatId?: string;
  isStreaming?: boolean;
  branchName?: string;
}

export function useChatScroll({
  messages,
  chatId,
  isStreaming,
  branchName,
}: UseChatScrollOptions) {
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(false);

  // Enhanced state tracking
  const lastChatId = useRef<string | undefined>(chatId);
  const lastBranchName = useRef<string | undefined>(branchName);
  const lastMessageCount = useRef(messages.length);
  const userScrolledUp = useRef(false);
  const isScrollListenerAttached = useRef(false);
  const lastScrollTop = useRef(0);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const animationFrame = useRef<number | null>(null);
  const isSelecting = useRef(false);

  // Animation state
  const animationState = useRef({
    ignoreScrollEvents: false,
  });

  // Threshold for "near bottom" detection (pixels from bottom)
  const BOTTOM_THRESHOLD = 70; // Match library's threshold

  // Enhanced mouse/selection detection
  const checkIfSelecting = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const viewport = scrollAreaViewportRef.current;
    if (!viewport) return false;

    return (
      range.commonAncestorContainer.contains(viewport) ||
      viewport.contains(range.commonAncestorContainer)
    );
  }, []);

  // Enhanced bottom detection
  const checkIfNearBottom = useCallback(() => {
    const viewport = scrollAreaViewportRef.current;
    if (!viewport) return false;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom <= BOTTOM_THRESHOLD;
  }, []);

  // Scroll to bottom function using browser smooth scroll
  const scrollToBottom = useCallback((smooth = true) => {
    const viewport = scrollAreaViewportRef.current;
    const bottomMarker = messagesEndRef.current;

    if (viewport && bottomMarker) {
      // Cancel any ongoing custom animations
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      const targetScrollTop = viewport.scrollHeight - viewport.clientHeight;

      // Mark this as a programmatic scroll to ignore events
      animationState.current.ignoreScrollEvents = true;

      if (smooth) {
        viewport.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });

        // Reset the flag after smooth scroll completes
        setTimeout(() => {
          animationState.current.ignoreScrollEvents = false;
        }, 500);
      } else {
        // Instant scroll for initial load
        viewport.scrollTop = targetScrollTop;
        setTimeout(() => {
          animationState.current.ignoreScrollEvents = false;
        }, 50);
      }
    }
  }, []);

  // Enhanced scroll event handler
  const handleScroll = useCallback(() => {
    const viewport = scrollAreaViewportRef.current;
    if (!viewport) return;

    // Ignore events from our own animations
    if (animationState.current.ignoreScrollEvents) {
      return;
    }

    const currentScrollTop = viewport.scrollTop;
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);

    // Detect scroll direction
    const scrolledUp = currentScrollTop < lastScrollTop.current;
    const scrolledDown = currentScrollTop > lastScrollTop.current;

    // Check if user is selecting text
    const selecting = checkIfSelecting();
    if (selecting !== isSelecting.current) {
      isSelecting.current = selecting;
    }

    // Handle user scroll behavior
    if (scrolledUp && !selecting) {
      userScrolledUp.current = true;
      if (shouldAutoScroll) {
        setShouldAutoScroll(false);
      }
      // Stop any ongoing animation
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    }

    // Re-enable auto-scroll when user scrolls back to bottom
    if (nearBottom && scrolledDown) {
      userScrolledUp.current = false;
      if (!shouldAutoScroll) {
        setShouldAutoScroll(true);
      }
    }

    lastScrollTop.current = currentScrollTop;
  }, [checkIfNearBottom, checkIfSelecting, shouldAutoScroll]);

  // Enhanced wheel event handler
  const handleWheel = useCallback((event: WheelEvent) => {
    const viewport = scrollAreaViewportRef.current;
    if (!viewport) return;

    // If scrolling up with wheel, immediately disable auto-scroll
    if (event.deltaY < 0 && viewport.scrollHeight > viewport.clientHeight) {
      userScrolledUp.current = true;
      setShouldAutoScroll(false);

      // Stop any ongoing animation
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    }
  }, []);

  // Setup ResizeObserver for content changes
  useEffect(() => {
    const messagesEnd = messagesEndRef.current;
    if (!messagesEnd) return;

    resizeObserver.current?.disconnect();

    resizeObserver.current = new ResizeObserver(() => {
      // Content size changed, check if we should auto-scroll
      if (shouldAutoScroll && !userScrolledUp.current) {
        // Use a small delay to ensure DOM has updated
        setTimeout(() => {
          scrollToBottom(true);
        }, 0);
      }

      // Update bottom detection
      const nearBottom = checkIfNearBottom();
      setIsNearBottom(nearBottom);
    });

    // Observe the parent container of messagesEnd
    if (messagesEnd.parentElement) {
      resizeObserver.current.observe(messagesEnd.parentElement);
    }

    return () => {
      resizeObserver.current?.disconnect();
    };
  }, [shouldAutoScroll, checkIfNearBottom, scrollToBottom]);

  // Handle chat switching
  useEffect(() => {
    const chatChanged = chatId !== lastChatId.current;

    if (chatChanged) {
      // Immediately hide content to prevent flash
      setIsContentVisible(false);

      lastChatId.current = chatId;
      setIsInitialLoad(true);
      setShouldAutoScroll(true);
      setIsNearBottom(true);
      userScrolledUp.current = false;
      lastMessageCount.current = messages.length;
      isScrollListenerAttached.current = false;
      lastScrollTop.current = 0;
      isSelecting.current = false;

      // Reset animation state
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      animationState.current = {
        ignoreScrollEvents: false,
      };
    }
  }, [chatId, messages.length]);

  // Handle branch switching separately (without resetting scroll state)
  useEffect(() => {
    const branchChanged = branchName !== lastBranchName.current;

    if (branchChanged) {
      lastBranchName.current = branchName;

      // For branch changes, we need to check scroll position after content loads
      // but don't reset the auto-scroll behavior unless the user was actually scrolled up
      setTimeout(() => {
        const viewport = scrollAreaViewportRef.current;
        if (viewport) {
          const nearBottom = checkIfNearBottom();
          setIsNearBottom(nearBottom);

          // Only update auto-scroll state if we're not near bottom and weren't already scrolled up
          if (!nearBottom && !userScrolledUp.current) {
            userScrolledUp.current = true;
            setShouldAutoScroll(false);
          } else if (nearBottom && userScrolledUp.current) {
            // If we're at bottom after branch change, re-enable auto-scroll
            userScrolledUp.current = false;
            setShouldAutoScroll(true);
          }
        }
      }, 100);
    }
  }, [branchName, checkIfNearBottom]);

  // Initial scroll positioning (runs synchronously before paint)
  useLayoutEffect(() => {
    if (isInitialLoad && messages.length > 0) {
      const viewport = scrollAreaViewportRef.current;
      if (viewport) {
        // Set scroll position immediately without animation to prevent flash
        const targetScrollTop = viewport.scrollHeight - viewport.clientHeight;
        viewport.scrollTop = targetScrollTop;

        setIsInitialLoad(false);
        // Use a small delay to ensure scroll position is applied before showing content
        requestAnimationFrame(() => {
          setIsContentVisible(true);
        });
      }
    }
  }, [isInitialLoad, messages.length]);

  // Auto-scroll when messages change (after initial load)
  useEffect(() => {
    if (messages.length === 0) {
      setIsContentVisible(true);
      return;
    }

    const messageCountChanged = messages.length !== lastMessageCount.current;
    lastMessageCount.current = messages.length;

    // Skip if this is the initial load (handled by useLayoutEffect above)
    if (isInitialLoad) {
      return;
    }

    // Auto-scroll if conditions are met
    if (shouldAutoScroll && (!userScrolledUp.current || messageCountChanged)) {
      setTimeout(() => {
        scrollToBottom(true);
      }, 0);
    }
  }, [
    messages,
    shouldAutoScroll,
    isInitialLoad,
    scrollToBottom,
    checkIfNearBottom,
  ]);

  // Enhanced event listener setup
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 10;

    const setupEventListeners = () => {
      const viewport = scrollAreaViewportRef.current;

      if (!viewport) {
        if (retryCount < maxRetries) {
          retryCount++;
          timeoutId = setTimeout(setupEventListeners, 100 * retryCount);
        }
        return;
      }

      if (isScrollListenerAttached.current) {
        return;
      }

      // Add enhanced event listeners
      viewport.addEventListener("scroll", handleScroll, { passive: true });
      viewport.addEventListener("wheel", handleWheel, { passive: true });
      isScrollListenerAttached.current = true;

      // Initial position check
      setTimeout(() => {
        const nearBottom = checkIfNearBottom();
        setIsNearBottom(nearBottom);
      }, 100);
    };

    setupEventListeners();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      const viewport = scrollAreaViewportRef.current;
      if (viewport && isScrollListenerAttached.current) {
        viewport.removeEventListener("scroll", handleScroll);
        viewport.removeEventListener("wheel", handleWheel);
        isScrollListenerAttached.current = false;
      }

      resizeObserver.current?.disconnect();
    };
  }, [handleScroll, handleWheel, checkIfNearBottom]);

  // Handle scroll to bottom button click
  const handleScrollToBottomClick = useCallback(() => {
    scrollToBottom(true);
    setShouldAutoScroll(true);
    userScrolledUp.current = false;
  }, [scrollToBottom]);

  return {
    scrollAreaViewportRef,
    messagesEndRef,
    isNearBottom,
    shouldAutoScroll,
    isContentVisible,
    scrollToBottom: handleScrollToBottomClick,
  };
}
