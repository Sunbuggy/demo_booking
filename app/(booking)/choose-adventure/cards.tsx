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

  return (
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
        <Button asChild>
          <Link href={linkHref}>Book</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdventureCard;
