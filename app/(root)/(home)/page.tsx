import LazyMeetingTypeList from '@/components/LazyMeetingTypeList';

const Home = () => {
  const now = new Date();

  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const date = (new Intl.DateTimeFormat('en-US', { dateStyle: 'full' })).format(now);

  return (
    <section className="flex size-full flex-col gap-5 text-white">
      <div className="h-[240px] w-full rounded-[20px] bg-hero bg-cover sm:h-[280px] lg:h-[303px]">
        <div className="flex h-full flex-col justify-end px-5 py-6 sm:px-6 sm:py-8 lg:p-11">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-7xl">
              {time}
            </h1>
            <p className="text-base font-medium text-sky-1 sm:text-lg lg:text-2xl">
              {date}
            </p>
          </div>
        </div>
      </div>

      <LazyMeetingTypeList />
    </section>
  );
};

export default Home;
