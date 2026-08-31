export function PhotoSlot({
  src,
  name,
  title,
}: {
  src: string;
  name: string;
  title: string;
}) {
  return (
    <figure className="flex w-[30%] min-w-0 flex-col items-center text-center">
      <div className="relative size-[4.6rem] overflow-hidden rounded-full bg-cream shadow-[0_0_0_3px_var(--color-paper),0_0_0_6px_var(--color-saffron-soft)] sm:size-24 md:size-28">
        <img src={src} alt="" className="size-full object-cover object-top" />
      </div>
      <figcaption className="mt-2.5 min-w-0">
        <p className="truncate text-[0.7rem] font-semibold leading-tight text-paper sm:text-sm">
          {name}
        </p>
        <p className="mt-0.5 truncate text-[0.62rem] leading-tight text-saffron-soft sm:text-xs">
          {title}
        </p>
      </figcaption>
    </figure>
  );
}
