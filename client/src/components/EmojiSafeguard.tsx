import React from 'react';
import { safeguardBusinessModelEmoji, safeguardBusinessPathEmoji, safeguardBusinessDataArray } from '../utils/emojiHelper';

interface EmojiSafeguardProps {
  children: React.ReactNode;
  businessData?: any;
  businessDataArray?: any[];
}

/**
 * Component that automatically safeguards emojis in business data
 */
export const EmojiSafeguard: React.FC<EmojiSafeguardProps> = ({ 
  children, 
  businessData, 
  businessDataArray 
}) => {
  // Safeguard the data
  const safeBusinessData = businessData ? safeguardBusinessModelEmoji(businessData) : undefined;
  const safeBusinessDataArray = businessDataArray ? safeguardBusinessDataArray(businessDataArray) : undefined;

  // Clone children and pass safeguarded data
  const safeguardedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ...child.props,
        business: safeBusinessData,
        businessData: safeBusinessData,
        businesses: safeBusinessDataArray,
        businessDataArray: safeBusinessDataArray,
      });
    }
    return child;
  });

  return <>{safeguardedChildren}</>;
};

/**
 * Higher-order component to automatically safeguard emojis
 */
export function withEmojiSafeguard<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return React.forwardRef<any, P>((props, ref) => {
    // Safeguard any business-related props
    const safeguardedProps: Partial<P> = { ...props };
    
    // Check for common business data prop names
    const businessProps = ['business', 'businessData', 'businesses', 'businessDataArray', 'model', 'path'];
    
    businessProps.forEach(propName => {
      if (propName in safeguardedProps) {
        const data = (safeguardedProps as any)[propName];
        if (Array.isArray(data)) {
          (safeguardedProps as any)[propName] = safeguardBusinessDataArray(data) as any;
        } else if (data && typeof data === 'object' && data.id) {
          if (data.emoji !== undefined) {
            (safeguardedProps as any)[propName] = safeguardBusinessModelEmoji(data) as any;
          }
        }
      }
    });

    return <Component {...safeguardedProps} ref={ref} />;
  }) as unknown as React.ComponentType<P>;
}

/**
 * Hook to use emoji safeguarding in components
 */
export function useEmojiSafeguardData(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return safeguardBusinessDataArray(data);
  }
  
  if (typeof data === 'object' && data.id) {
    return safeguardBusinessModelEmoji(data);
  }
  
  return data;
} 