import { useEffect, useRef } from 'react';

export default function SwipeViewer({ items, activeIndex, onActiveIndexChange, renderItem }) {
    const containerRef  = useRef(null);
    const isProgrammatic = useRef(false);  // true while we're driving scrollTo ourselves
    const debounceTimer  = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || items.length === 0) return;

        // Mark as programmatic so the scroll handler ignores this scroll.
        isProgrammatic.current = true;

        container.scrollTo({
            top: container.clientHeight * activeIndex,
            behavior: 'smooth',
        });

        // Clear the flag once the smooth scroll has had time to settle.
        // 450 ms covers the typical CSS scroll-behavior: smooth duration.
        const timer = window.setTimeout(() => {
            isProgrammatic.current = false;
        }, 450);

        return () => window.clearTimeout(timer);
    }, [activeIndex, items.length]);

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container || items.length === 0) return;

        // Ignore scroll events we triggered ourselves.
        if (isProgrammatic.current) return;

        // Debounce: wait until scroll has fully settled before reading index.
        window.clearTimeout(debounceTimer.current);
        debounceTimer.current = window.setTimeout(() => {
            const slideHeight = container.clientHeight || 1;
            const index = Math.round(container.scrollTop / slideHeight);
            const clamped = Math.min(Math.max(index, 0), items.length - 1);

            if (clamped !== activeIndex) {
                onActiveIndexChange(clamped);
            }
        }, 80); // 80 ms after the last scroll event fires = snap has settled
    };

    // Clean up debounce timer on unmount.
    useEffect(() => {
        return () => window.clearTimeout(debounceTimer.current);
    }, []);

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain"
            // Prevent scroll chaining to the page behind the modal on iOS.
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            {items.map((item, index) => (
                <section key={item.id} className="h-full snap-start">
                    {renderItem(item, index, index === activeIndex)}
                </section>
            ))}
        </div>
    );
}