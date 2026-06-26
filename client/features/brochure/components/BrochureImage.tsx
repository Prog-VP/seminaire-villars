import Image from "next/image";
import { brochureImageUrl } from "../utils";

type BrochureImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
};

export function BrochureImage({
  src,
  alt,
  className,
  fill = false,
  sizes = "(min-width: 768px) 50vw, 100vw",
}: BrochureImageProps) {
  const imageSrc = brochureImageUrl(src);

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized
        className={className}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={1200}
      height={800}
      sizes={sizes}
      unoptimized
      className={className}
    />
  );
}
