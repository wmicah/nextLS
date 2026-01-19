"use client";

import React, { useRef, useEffect, useState, useCallback, memo, useMemo } from "react";

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  columns: number;
  gap?: number;
  overscan?: number;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadMoreThreshold?: number;
}

/**
 * Virtualized grid component that only renders visible items
 * Significantly improves performance for large lists (100+ items)
 */
function VirtualizedGridInner<T>({
  items,
  renderItem,
  itemHeight,
  columns,
  gap = 12,
  overscan = 3,
  className = "",
  onLoadMore,
  hasMore = false,
  loadMoreThreshold = 200,
}: VirtualizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate row height including gap
  const rowHeight = itemHeight + gap;
  
  // Calculate total rows
  const totalRows = Math.ceil(items.length / columns);
  
  // Calculate total height
  const totalHeight = totalRows * rowHeight - gap;

  // Calculate visible range
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );

  // Get visible items
  const visibleItems = useMemo(() => {
    const start = startRow * columns;
    const end = Math.min(endRow * columns, items.length);
    return items.slice(start, end).map((item, idx) => ({
      item,
      index: start + idx,
    }));
  }, [items, startRow, endRow, columns]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop: newScrollTop, scrollHeight, clientHeight } = containerRef.current;
      setScrollTop(newScrollTop);

      // Check if we need to load more
      if (onLoadMore && hasMore) {
        const distanceFromBottom = scrollHeight - (newScrollTop + clientHeight);
        if (distanceFromBottom < loadMoreThreshold) {
          onLoadMore();
        }
      }
    }
  }, [onLoadMore, hasMore, loadMoreThreshold]);

  // Set up resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate item width based on columns and gap
  const itemWidth = `calc((100% - ${(columns - 1) * gap}px) / ${columns})`;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
      style={{ height: "100%" }}
    >
      <div
        style={{
          height: totalHeight,
          position: "relative",
        }}
      >
        {visibleItems.map(({ item, index }) => {
          const row = Math.floor(index / columns);
          const col = index % columns;
          const top = row * rowHeight;
          const left = col * (100 / columns);

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                top,
                left: `calc(${left}% + ${col * gap / columns}px)`,
                width: itemWidth,
                height: itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const VirtualizedGrid = memo(VirtualizedGridInner) as typeof VirtualizedGridInner;

/**
 * Simple virtualized list (single column)
 */
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  gap?: number;
  overscan?: number;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function VirtualizedListInner<T>({
  items,
  renderItem,
  itemHeight,
  gap = 8,
  overscan = 5,
  className = "",
  onLoadMore,
  hasMore = false,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const rowHeight = itemHeight + gap;
  const totalHeight = items.length * rowHeight - gap;

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, idx) => ({
      item,
      index: startIndex + idx,
    }));
  }, [items, startIndex, endIndex]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop: newScrollTop, scrollHeight, clientHeight } = containerRef.current;
      setScrollTop(newScrollTop);

      if (onLoadMore && hasMore) {
        const distanceFromBottom = scrollHeight - (newScrollTop + clientHeight);
        if (distanceFromBottom < 200) {
          onLoadMore();
        }
      }
    }
  }, [onLoadMore, hasMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: index * rowHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export const VirtualizedList = memo(VirtualizedListInner) as typeof VirtualizedListInner;

