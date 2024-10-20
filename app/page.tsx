import ChooseAdventure from './(com)/choose-adventure/page';
import { default as InstallSunbuggy } from '@/components/add-to-screen/page';
export default async function MainPage() {
  return (
    <div>
      <ChooseAdventure />
      <InstallSunbuggy />
    </div>
  );
}
