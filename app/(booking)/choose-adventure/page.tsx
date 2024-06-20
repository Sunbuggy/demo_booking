import React from 'react';
import { Button } from '@/components/ui/button';
import AdventureCard from './cards';
import { familyFunRomp, minibajachase } from '@/utils/helpers';

const ChooseAdventure = () => {
  return (
    <div className="flex flex-col items-center gap-5">
      {' '}
      <h1>Choose an Adventure</h1>
      <AdventureCard
        description={minibajachase.description}
        title={minibajachase.title}
        videoId={minibajachase.videoId}
        playlistId={minibajachase.playlistId}
        autoplay={1}
        linkHref="/book/minibajachase"
      />
      <AdventureCard
        description={familyFunRomp.description}
        title={familyFunRomp.title}
        videoId={familyFunRomp.videoId}
        playlistId={familyFunRomp.playlistId}
        linkHref="/book/familyfunromp"
      />
    </div>
  );
};

export default ChooseAdventure;
