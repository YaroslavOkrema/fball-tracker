'use client';

import { ShieldIcon, TrophyIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';

type FootballLogoProps = {
  name: string;
  kind: 'team' | 'competition';
  src?: string | null;
  className?: string;
};

export function FootballLogo({
  name,
  kind,
  src,
  className,
}: FootballLogoProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageSource = src?.trim();
  const showImage = Boolean(imageSource && imageSource !== failedSource);
  const label = `${name} ${kind === 'team' ? 'crest' : 'logo'}`;
  const FallbackIcon = kind === 'team' ? ShieldIcon : TrophyIcon;

  return (
    <span
      className={cn(
        'inline-flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted p-2 text-muted-foreground',
        className,
      )}
    >
      {showImage && imageSource ? (
        <Image
          key={imageSource}
          src={imageSource}
          alt={label}
          width={48}
          height={48}
          unoptimized
          className="size-full object-contain"
          onError={() => setFailedSource(imageSource)}
          onLoad={() => setFailedSource(null)}
        />
      ) : (
        <span role="img" aria-label={label} className="size-full">
          <FallbackIcon aria-hidden="true" className="size-full" />
        </span>
      )}
    </span>
  );
}
