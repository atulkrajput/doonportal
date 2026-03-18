'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

interface FallbackImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

export default function FallbackImage({
  fallbackSrc = '/images/placeholder.svg',
  alt,
  ...props
}: FallbackImageProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <Image
      {...props}
      alt={alt}
      src={hasError ? fallbackSrc : props.src}
      onError={() => {
        if (!hasError) {
          setHasError(true);
        }
      }}
    />
  );
}
