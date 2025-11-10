import Link from 'next/link';

export default function FluentlyNavLink() {
  return (
    <Link href="/fluently" className="hover:text-blue-600 transition-colors">
      Fluently
    </Link>
  );
}
