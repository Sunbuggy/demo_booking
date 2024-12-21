import { Share } from 'lucide-react';
import { RWebShare } from 'react-web-share';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
}

const ShareButton = ({ title, text, url }: ShareButtonProps) => {
  return (
    <RWebShare
      data={{
        text: text,
        title: title,
        url: url
      }}
    >
      <button className="p-2 bg-background/50 rounded-full hover:bg-background/80 transition-colors duration-200">
        <Share className="w-5 h-5 text-foreground/50" />
        <span className="sr-only">Share Page</span>
      </button>
    </RWebShare>
  );
};

export default ShareButton;
