import { useEffect, useRef } from 'react';

export default function SwipeViewer({ items, activeIndex, onActiveIndexChange, renderItem }) {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container || items.length === 0) {
            return;
        }

        const slideHeight = container.clientHeight || 1;

        container.scrollTo({
            top: slideHeight * activeIndex,
            behavior: 'smooth',
        });
    }, [activeIndex, items.length]);

    const handleScroll = () => {
        const container = containerRef.current;

        if (!container || items.length === 0) {
            return;
        }

        const slideHeight = container.clientHeight || 1;
        const index = Math.round(container.scrollTop / slideHeight);
        const normalizedIndex = Math.min(Math.max(index, 0), items.length - 1);

        if (normalizedIndex !== activeIndex) {
            onActiveIndexChange(normalizedIndex);
        }
    };

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain"
        >
            {items.map((item, index) => (
                <section key={item.id} className="h-full snap-start">
                    {renderItem(item, index, index === activeIndex)}
                </section>
            ))}
        </div>
    );
}
