import Image from 'next/image';
import Link from 'next/link';

import LazyUserButton from './LazyUserButton';
import MobileNav from './MobileNav';

const Navbar = () => {
  return (
    <nav className="flex-between fixed z-50 w-full bg-dark-1 px-6 py-4 lg:px-10">
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/icons/logo.svg"
          width={32}
          height={32}
          alt="VideConnect logo"
          className="max-sm:h-10 max-sm:w-auto"
        />
        <p className="text-[26px] font-extrabold text-white max-sm:hidden">
          VideConnect
        </p>
      </Link>
      <div className="flex-between gap-5">
        <LazyUserButton />
        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
