import Image from 'next/image';

const LoadingModal: React.FC = () => {
  return (
    <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center">
      <div className="rounded p-8">
        {/* Replace 'loading.gif' with the URL of  loading GIF */}
        <Image
          priority
          src="/SunBuggyLogo-Small.svg"
          alt="Loading"
          width={450}
          height={450}
        />
        <p className="mt-4 text-center">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingModal;
