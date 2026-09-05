import { Suspense } from 'react';
import SearchResults from '@/components/search/SearchResults';

export const metadata = { title: 'Search' };

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={null}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
