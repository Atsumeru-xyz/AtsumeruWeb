import { useRef, useEffect } from 'react';

export const useHorizontalScroll = () => {
    const elRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = elRef.current;
        if (el) {
            const onWheel = (e: WheelEvent) => {
                if (el.scrollWidth > el.clientWidth && e.deltaY !== 0) {
                    // Предотвращаем стандартный скролл страницы
                    e.preventDefault();
                    el.scrollTo({
                        left: el.scrollLeft + e.deltaY * 2,
                        behavior: 'smooth'
                    });
                }
            };

            el.addEventListener('wheel', onWheel, { passive: false });

            return () => el.removeEventListener('wheel', onWheel);
        }
    }, []);

    return elRef;
};