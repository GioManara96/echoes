export default function NowPlayingSkeleton() {
  return (
    <section className="now-playing now-playing--skeleton" aria-busy="true" aria-label="Loading now playing">
      <div className="now-playing__image">
        <div className="now-playing__bone now-playing__bone--art" />
      </div>
      <div className="now-playing__content">
        <div className="now-playing__bone now-playing__bone--status" />
        <div className="now-playing__bone now-playing__bone--track" />
        <div className="now-playing__bone now-playing__bone--artists" />
        <div className="now-playing__bone now-playing__bone--progress" />
      </div>
    </section>
  );
}
