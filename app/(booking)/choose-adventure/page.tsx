import React from 'react';
import AdventureCard from './cards';
import { familyFunRomp, minibajachase, valleyOfFire } from '@/utils/helpers';

const ChooseAdventure = () => {
  return (
    <div className="flex flex-col items-center gap-5">
      {' '}
      <h1 className="text-xl font-bold">Choose an Adventure</h1>
      <AdventureCard
        description={minibajachase.description}
        title={minibajachase.title}
        videoId={minibajachase.videoId}
        playlistId={minibajachase.playlistId}
        // autoplay={1}
        linkHref="/book/minibajachase"
      />
      <AdventureCard
        description={familyFunRomp.description}
        title={familyFunRomp.title}
        videoId={familyFunRomp.videoId}
        playlistId={familyFunRomp.playlistId}
        linkHref="/book/familyfunromp"
      />
      <AdventureCard
        description={valleyOfFire.description}
        title={valleyOfFire.title}
        videoId={valleyOfFire.videoId}
        playlistId={valleyOfFire.playlistId}
        linkHref="/book/valleyoffire"
      />
    </div>
  );
};

export default ChooseAdventure;
