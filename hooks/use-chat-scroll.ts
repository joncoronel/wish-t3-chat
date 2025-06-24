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
      console.log(`[useChatScroll] Programmatic scroll initiated for chat: ${chatId}, smooth: ${smooth}`);
      
      viewport.scrollTo({ 
        top, 
        behavior: smooth ? "smooth" : "auto" 
      });
      
      // Reset the flag after scroll completes
      setTimeout(() => {
        isProgrammaticScroll.current = false;
        console.log(`[useChatScroll] Programmatic scroll completed for chat: ${chatId}`);
      }, smooth ? 500 : 100); // Longer timeout for smooth scrolling
    }
  }, [chatId]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const viewport = scrollAreaViewportRef.current;
    if (!viewport) return;

    const currentScrollTop = viewport.scrollTop;
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);

    // Skip processing if this is a programmatic scroll
    if (isProgrammaticScroll.current) {
      console.log(`[useChatScroll] Ignoring programmatic scroll event for chat: ${chatId}`);
      lastScrollTop.current = currentScrollTop;
      return;
    }

    // Detect scroll direction to determine if user manually scrolled up
    const scrolledUp = currentScrollTop < lastScrollTop.current;
    const scrolledDown = currentScrollTop > lastScrollTop.current;

    console.log(`[useChatScroll] User scroll event - nearBottom: ${nearBottom}, scrolledUp: ${scrolledUp}, scrolledDown: ${scrolledDown}, chatId: ${chatId}, shouldAutoScroll: ${shouldAutoScroll}, userScrolledUp: ${userScrolledUp.current}`);

    // Track if user manually scrolled up
    if (scrolledUp && !userScrolledUp.current) {
      userScrolledUp.current = true;
      console.log(`[useChatScroll] User manually scrolled up detected for chat: ${chatId}`);
    }

    // If user scrolled to bottom manually, re-enable auto-scroll
    if (nearBottom && scrolledDown) {
      if (userScrolledUp.current) {
        console.log(`[useChatScroll] User scrolled back to bottom for chat: ${chatId}`);
      }
      userScrolledUp.current = false;
      if (!shouldAutoScroll) {
        setShouldAutoScroll(true);
      }
    }
    // If user scrolled up while streaming, disable auto-scroll
    else if (scrolledUp && isStreaming && shouldAutoScroll) {
      console.log(`[useChatScroll] Disabling auto-scroll due to user scroll up during streaming for chat: ${chatId}`);
      setShouldAutoScroll(false);
    }

    lastScrollTop.current = currentScrollTop;
  }, [checkIfNearBottom, shouldAutoScroll, isStreaming, chatId]);

  // Handle chat switching
  useEffect(() => {
    if (chatId !== lastChatId.current) {
      console.log(`[useChatScroll] Chat switched from ${lastChatId.current} to ${chatId}`);
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
    const previousCount = lastMessageCount.current;
    lastMessageCount.current = messages.length;

    console.log(`[useChatScroll] Messages changed - count: ${messages.length}, previous: ${previousCount}, chatId: ${chatId}, isInitialLoad: ${isInitialLoad}, shouldAutoScroll: ${shouldAutoScroll}, userScrolledUp: ${userScrolledUp.current}`);

    // For initial load, scroll immediately without smooth animation and without delay
    if (isInitialLoad) {
      console.log(`[useChatScroll] Initial load scroll for chat: ${chatId}`);
      // Immediate scroll without setTimeout to prevent visual flash
      scrollToBottom(false);
      setIsInitialLoad(false);
      // Show content after scroll is positioned
      setTimeout(() => {
        setIsContentVisible(true);
      }, 50);
      return;
    }

    // Auto-scroll if enabled and conditions are met
    // Always auto-scroll if: shouldAutoScroll is true AND (user hasn't scrolled up OR new message was added)
    const shouldScroll = shouldAutoScroll && (!userScrolledUp.current || messageCountChanged);
    
    if (shouldScroll) {
      console.log(`[useChatScroll] Auto-scrolling for chat: ${chatId}, messageCountChanged: ${messageCountChanged}`);
      setTimeout(() => {
        scrollToBottom(true);
      }, 0);
    } else {
      console.log(`[useChatScroll] Skipping auto-scroll for chat: ${chatId}, shouldAutoScroll: ${shouldAutoScroll}, userScrolledUp: ${userScrolledUp.current}, messageCountChanged: ${messageCountChanged}`);
    }
  }, [messages, shouldAutoScroll, isInitialLoad, scrollToBottom, chatId]);

  // Set up scroll event listener with better lifecycle management
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 10;

    const setupScrollListener = () => {
      const viewport = scrollAreaViewportRef.current;
      
      if (!viewport) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`[useChatScroll] Viewport not ready, retry ${retryCount}/${maxRetries} for chat: ${chatId}`);
          timeoutId = setTimeout(setupScrollListener, 100 * retryCount);
        } else {
          console.log(`[useChatScroll] Failed to find viewport after ${maxRetries} retries for chat: ${chatId}`);
        }
        return;
      }

      if (isScrollListenerAttached.current) {
        console.log(`[useChatScroll] Scroll listener already attached for chat: ${chatId}`);
        return;
      }

      console.log(`[useChatScroll] Setting up scroll listener for chat: ${chatId} (attempt ${retryCount + 1})`);
      
      // Add scroll listener
      viewport.addEventListener("scroll", handleScroll, { passive: true });
      isScrollListenerAttached.current = true;
      
      // Initial check for scroll position - use multiple checks to ensure it works
      const performInitialCheck = () => {
        const nearBottom = checkIfNearBottom();
        setIsNearBottom(nearBottom);
        console.log(`[useChatScroll] Initial scroll check - nearBottom: ${nearBottom}, chatId: ${chatId}`);
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
        console.log(`[useChatScroll] Cleaning up scroll listener for chat: ${chatId}`);
        viewport.removeEventListener("scroll", handleScroll);
        isScrollListenerAttached.current = false;
      }
    };
  }, [handleScroll, checkIfNearBottom, chatId]); // Add chatId as dependency to re-setup on chat switch

  // Additional effect to ensure scroll position is detected after messages load
  useEffect(() => {
    if (messages.length > 0 && !isInitialLoad) {
      const checkScrollPosition = () => {
        const nearBottom = checkIfNearBottom();
        setIsNearBottom(nearBottom);
        console.log(`[useChatScroll] Post-message-load scroll check - nearBottom: ${nearBottom}, chatId: ${chatId}, messageCount: ${messages.length}`);
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
    isProgrammaticScroll.current = true; // This will be reset by scrollToBottom
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