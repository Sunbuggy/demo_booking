import HomepageSelector from '@/components/Homepage';
import { default as InstallSunbuggy } from '@/components/add-to-screen/page';

export const dynamic = 'force-dynamic';

const Home = async () => {
  return (
    <main>
      <HomepageSelector />
      <InstallSunbuggy/>
    </main>
  );
};

export default Home;