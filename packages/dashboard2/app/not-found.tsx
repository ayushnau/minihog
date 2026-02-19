import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link href="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
