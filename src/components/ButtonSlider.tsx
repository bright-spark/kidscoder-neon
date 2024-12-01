import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils';
import { getButtonStyles, ButtonIntent } from '@/lib/button-utils';

interface ButtonOption {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  intent?: ButtonIntent;
}

interface ButtonSliderProps {
  options: ButtonOption[];
  className?: string;
}

export function ButtonSlider({ options, className }: ButtonSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showLabels, setShowLabels] = useState(window.innerWidth >= 640);

  useEffect(() => {
    const handleResize = () => {
      setShowLabels(window.innerWidth >= 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = 200;
    const newScrollLeft = direction === 'left' 
      ? sliderRef.current.scrollLeft - scrollAmount
      : sliderRef.current.scrollLeft + scrollAmount;
    
    sliderRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  return (
    <div className={cn("relative flex items-center gap-2 w-full justify-end sticky right-0", className)}>
      <div className="relative flex-1 overflow-x-auto">
        <div
          ref={sliderRef}
          className={cn(
            "flex gap-1.5 justify-end overflow-x-auto scrollbar-hide snap-x snap-mandatory",
            "cursor-grab active:cursor-grabbing touch-pan-x",
            "scroll-smooth"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
        >
          {options.map((option, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                if (!isDragging) {
                  option.onClick();
                }
              }}
              disabled={option.disabled}
              className={getButtonStyles({
                intent: option.intent || 'secondary',
                size: showLabels ? 'sm' : 'icon',
                state: option.disabled ? 'inactive' : 'active',
                className: cn(
                  "snap-start whitespace-nowrap flex-shrink-0 justify-center transition-all duration-200 select-none h-8",
                  showLabels 
                    ? "w-[80px] md:w-[100px]" 
                    : "w-8"
                )
              })}
            >
              <span className={cn(
                "flex items-center justify-center",
                showLabels ? "gap-2" : "gap-0"
              )}>
                <span className={cn(
                  "transition-all duration-200 flex items-center justify-center",
                  !showLabels && "scale-75"
                )}>
                  {option.icon}
                </span>
                {showLabels && (
                  <span className="truncate text-xs">{option.label}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}