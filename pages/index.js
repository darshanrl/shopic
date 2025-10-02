import { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  useEffect(() => {
    // Simple check for client-side errors
    console.log('App is running in the browser');
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Head>
        <title>ShoPic - Creative Contests</title>
        <meta name="description" content="Participate in creative contests and showcase your talent" />
      </Head>
      
      <main className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to ShoPic
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Creative contests platform is loading...
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="/contests"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Contests
          </a>
        </div>
      </main>
    </div>
  );
}
