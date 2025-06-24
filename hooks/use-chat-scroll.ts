"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseChatScrollOptions {
  messages: unknown[];
  chatId?: string;
  isStreaming?: boolean;
}

export function useChatScroll({ messages, chatId, isStreaming }: UseChatScrollOptions) {
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const lastChatId = useRef<string | undefined>(chatId);
  const lastMessageCount = useRef(messages.length);
  const userScrolledUp = useRef(false);
  const isScrollListenerAttached = useRef(false);
  const isProgrammaticScroll = useRef(false);
  const lastScrollTop = useRef(0);

  // Threshold for "near bottom" detection (pixels from bottom)
  const BOTTOM_THRESHOLD = 100;

  // Check if user is near the bottom of the chat
  const checkIfNearBottom = useCallback(() => {
    const viewport = scrollAreaViewportRef.current;
    if (!viewport) return false;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom <= BOTTOM_THRESHOLD;
  }, []);

  // Scroll to bottom function
  const scrollToBottom = useCallback((smooth = true) => {
    const viewport = scrollAreaViewportRef.current;
    const bottomMarker = messagesEndRef.current;
    
    if (viewport && bottomMarker) {
      const top = bottomMarker.offsetTop;
      
      // Mark this as a programmatic scroll
      isProgrammaticScroll.current = true;
      
      viewport.scrollTo({ 
        top, 
        behavior: smooth ? "smooth" : "auto" 
      });
      
      // Reset the flag after scroll completes
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, smooth ? 500 : 100);
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const viewport = scrollAreaViewportRef.current;
    if (!viewport) return;

    const currentScrollTop = viewport.scrollTop;
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);

    // Skip processing if this is a programmatic scroll
    if (isProgrammaticScroll.current) {
      lastScrollTop.current = currentScrollTop;
      return;
    }

    // Detect scroll direction to determine if user manually scrolled up
    const scrolledUp = currentScrollTop < lastScrollTop.current;
    const scrolledDown = currentScrollTop > lastScrollTop.current;

    // Track if user manually scrolled up
    if (scrolledUp && !userScrolledUp.current) {
      userScrolledUp.current = true;
    }

    // If user scrolled to bottom manually, re-enable auto-scroll
    if (nearBottom && scrolledDown) {
      userScrolledUp.current = false;
      if (!shouldAutoScroll) {
        setShouldAutoScroll(true);
      }
    }
    // If user scrolled up while streaming, disable auto-scroll
    else if (scrolledUp && isStreaming && shouldAutoScroll) {
      setShouldAutoScroll(false);
    }

    lastScrollTop.current = currentScrollTop;
  }, [checkIfNearBottom, shouldAutoScroll, isStreaming, chatId]);

  // Handle chat switching
  useEffect(() => {
    if (chatId !== lastChatId.current) {
      lastChatId.current = chatId;
      setIsInitialLoad(true);
      setShouldAutoScroll(true);
      setIsNearBottom(true);
      setIsContentVisible(false);
      userScrolledUp.current = false;
      lastMessageCount.current = messages.length;
      isScrollListenerAttached.current = false;
      isProgrammaticScroll.current = false;
      lastScrollTop.current = 0;
    }
  }, [chatId, messages.length]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length === 0) {
      // For empty chats, show content immediately
      setIsContentVisible(true);
      return;
    }

    const viewport = scrollAreaViewportRef.current;
    if (!viewport) return;

    const messageCountChanged = messages.length !== lastMessageCount.current;
    lastMessageCount.current = messages.length;

    // For initial load, scroll immediately without smooth animation
    if (isInitialLoad) {
      scrollToBottom(false);
      setIsInitialLoad(false);
      // Show content after scroll is positioned
      setTimeout(() => {
        setIsContentVisible(true);
      }, 50);
      return;
    }

    // Auto-scroll if enabled and conditions are met
    const shouldScroll = shouldAutoScroll && (!userScrolledUp.current || messageCountChanged);
    
    if (shouldScroll) {
      setTimeout(() => {
        scrollToBottom(true);
      }, 0);
    }
  }, [messages, shouldAutoScroll, isInitialLoad, scrollToBottom, chatId]);

  // Set up scroll event listener
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 10;

    const setupScrollListener = () => {
      const viewport = scrollAreaViewportRef.current;
      
      if (!viewport) {
        if (retryCount < maxRetries) {
          retryCount++;
          timeoutId = setTimeout(setupScrollListener, 100 * retryCount);
        }
        return;
      }

      if (isScrollListenerAttached.current) {
        return;
      }
      
      // Add scroll listener
      viewport.addEventListener("scroll", handleScroll, { passive: true });
      isScrollListenerAttached.current = true;
      
      // Initial check for scroll position
      const performInitialCheck = () => {
        const nearBottom = checkIfNearBottom();
        setIsNearBottom(nearBottom);
      };

      // Perform multiple initial checks to ensure it works
      setTimeout(performInitialCheck, 100);
      setTimeout(performInitialCheck, 300);
      setTimeout(performInitialCheck, 500);
    };

    // Start the setup process
    setupScrollListener();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const viewport = scrollAreaViewportRef.current;
      if (viewport && isScrollListenerAttached.current) {
        viewport.removeEventListener("scroll", handleScroll);
        isScrollListenerAttached.current = false;
      }
    };
  }, [handleScroll, checkIfNearBottom, chatId]);

  // Additional effect to ensure scroll position is detected after messages load
  useEffect(() => {
    if (messages.length > 0 && !isInitialLoad) {
      const checkScrollPosition = () => {
        const nearBottom = checkIfNearBottom();
        setIsNearBottom(nearBottom);
      };

      // Check scroll position after messages are rendered
      setTimeout(checkScrollPosition, 100);
      setTimeout(checkScrollPosition, 300);
    }
  }, [messages.length, isInitialLoad, checkIfNearBottom, chatId]);

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