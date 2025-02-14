import React from 'react';
import AdventureCard from './cards';
import {
  familyFunRomp,
  lasvegas_atv_tours,
  minibajachase,
  valleyOfFire
} from '@/utils/helpers';

const ChooseAdventure = () => {
  return (
    <div className="flex flex-col gap-4 items-center">
      {' '}
      {/* homepage */}
      <h1 className="text-2xl font-bold text-center m-4 w-full">
        Choose an Adventures
      </h1>
      <AdventureCard
        description={minibajachase.description}
        title={minibajachase.title}
        videoId={minibajachase.videoId}
        playlistId={minibajachase.playlistId}
        linkHref="/book/minibaja-chase"
      />
      <AdventureCard
        description={familyFunRomp.description}
        title={familyFunRomp.title}
        videoId={familyFunRomp.videoId}
        playlistId={familyFunRomp.playlistId}
        linkHref="/book/family-fun-romp"
      />
      <AdventureCard
        description={valleyOfFire.description}
        title={valleyOfFire.title}
        videoId={valleyOfFire.videoId}
        playlistId={valleyOfFire.playlistId}
        linkHref="/book/valley-of-fire"
      />
      <AdventureCard
        description={lasvegas_atv_tours.description}
        title={lasvegas_atv_tours.title}
        playlistId=""
        videoId=""
        src={lasvegas_atv_tours.src}
        linkHref="/book/atv-tours"
      />
    </div>
  );
};

export default ChooseAdventure;
