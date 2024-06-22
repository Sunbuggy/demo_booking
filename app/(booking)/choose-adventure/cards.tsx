'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import LazyYoutube from '@/components/lazy-youtube';
import Link from 'next/link';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const AdventureCard = ({
  description,
  title,
  videoId,
  playlistId,
  autoplay = 0,
  linkHref
}: {
  description: string;
  title: string;
  videoId: string;
  playlistId: string;
  autoplay?: number;
  linkHref: string;
}) => {
  const [showmore, setShowmore] = React.useState(false);
  const firstSentence = description.split('. ')[0] + '.';
  const [loading, setLoading] = React.useState(false);

  return (
    <>
      <Card className="sm:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="max-w-lg text-balance leading-relaxed">
            {/* shorten discription to the first sentence and show more when button clicked */}
            {showmore ? description : firstSentence}
            <Button
              variant={'link'}
              size={'sm'}
              onClick={() => {
                setShowmore(!showmore);
              }}
            >
              {showmore ? 'show less' : 'show more'}
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LazyYoutube
            videoId={videoId}
            playlistId={playlistId}
            autoplay={autoplay}
          />
        </CardContent>
        <CardFooter>
          <Button asChild onClick={() => setLoading(true)}>
            <Link href={linkHref}>Book</Link>
          </Button>
        </CardFooter>
      </Card>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <AiOutlineLoading3Quarters className="animate-spin h-10 w-10" />
        </div>
      )}
    </>
  );
};

export default AdventureCard;
