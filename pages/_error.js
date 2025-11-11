import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Error({ statusCode }) {
  const router = useRouter();

  useEffect(() => {
    // Log the error for debugging
    console.error(`Error ${statusCode} occurred`);
  }, [statusCode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Error {statusCode} | ShoPic</title>
      </Head>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {statusCode ? `Error ${statusCode}` : 'An error occurred'}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {statusCode === 404
            ? 'The page you are looking for does not exist.'
            : 'An unexpected error has occurred.'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
