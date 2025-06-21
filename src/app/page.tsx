import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-5xl font-bold mb-4">Welcome to the AI Fashion Studio</h1>
      <p className="text-lg text-gray-600 mb-8">Discover your next look. Let&apos;s get started.</p>
      <Link href="/onboarding" className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-md hover:bg-indigo-700 text-lg">
          Start Here
      </Link>
    </div>
  );
}
