'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import CategoriesNav from './CategoriesNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <>
      {!isDashboard && (
        <>
          <Header />
          <CategoriesNav />
        </>
      )}
      {children}
      {!isDashboard && <Footer />}
    </>
  );
}
