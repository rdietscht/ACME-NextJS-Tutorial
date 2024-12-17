'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function Search({ placeholder }: { placeholder: string }) {

  const searchParams = useSearchParams (); // Obtain current search parameters
  const pathname = usePathname (); // Obtain current pathname
  const { replace } = useRouter (); // Obtain function for altering client URLs

  function handleSearch (term: string)
  {
    // Read the current parameters.
    const params = new URLSearchParams (searchParams);

    if (term)
    {
      // Set the URL parameters string based on user input.
      params.set ('query', term);
    } else
    {
      // EMPTY CASE - If input is empty, delete the 'query' parameter.
      params.delete ('query');
    }

    // Update the current URL with user search data.
    replace (`${pathname}?${params.toString ()}`);

    console.log (term); // DEBUGGING!
  }

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => { handleSearch (e.target.value); }}
        defaultValue={searchParams.get ('query')?.toString ()} // If the query parameter isn't empty, fill input with its value
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
