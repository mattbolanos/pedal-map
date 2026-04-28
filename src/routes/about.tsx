import { ArrowBendUpLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowBendUpLeft";
import { CoffeeIcon } from "@phosphor-icons/react/dist/csr/Coffee";
import { GithubLogoIcon } from "@phosphor-icons/react/dist/csr/GithubLogo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "#/components/ui/button";
import { cn } from "#/lib/utils";

const DESCRIPTION =
  "Learn how Pedal Map uses live Citi Bike data to make station availability and system activity easier to read.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      {
        title: "About | Pedal Map",
      },
      {
        name: "description",
        content: DESCRIPTION,
      },
      {
        property: "og:title",
        content: "About | Pedal Map",
      },
      {
        property: "og:description",
        content: DESCRIPTION,
      },
      {
        name: "twitter:title",
        content: "About | Pedal Map",
      },
      {
        name: "twitter:description",
        content: DESCRIPTION,
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="route-padding max-w-2xl space-y-3">
      <Link
        to="/"
        aria-label="Go back home"
        className={cn(buttonVariants({ variant: "text" }), "pl-0")}
      >
        <ArrowBendUpLeftIcon className="size-5 md:size-4" />
        Back
      </Link>
      <h1 className="text-xl font-bold">About Pedal Map</h1>
      <section className="mt-6 space-y-6 leading-[1.7] tracking-wide">
        <p>
          I love Citi Bike. As of the writing of this blurb, I have taken 1,959
          rides, covered 3,600+ miles, spent 360+ hours biking, and saved
          countless minutes by not having to rely on the subway for
          intra-Brooklyn travel.
        </p>
        <p>
          Pedal Map is my attempt to make the system feel a little more legible
          at a glance. It uses the General Bikeshare Feed Specification
          endpoints Citi Bike publishes to show live bikes, open docks, e-bikes,
          station capacity, and whether a station is actually taking pickups or
          dropoffs, refreshed every 15 seconds or so.
        </p>
        <p>
          The data aggregation layer lives in a small separate service. Every 15
          minutes it fetches station status, refreshes the station catalog when
          needed, and stores a compact sample for each station with occupancy,
          dock availability, empty and full flags, and inferred arrivals and
          departures. From there, another job rolls those samples into daily
          summaries, which is what powers the station table and keeps the raw
          samples from piling up forever.
        </p>
        <p>
          I want to give a shout out to{" "}
          <a
            href="https://bikemap.nyc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            bikemap.nyc
          </a>
          , who made an awesome project visualizing a Lyft data dump of user
          rides. Give it a visit.
        </p>
        <p>
          The project is open source and available at{" "}
          <a
            href="https://github.com/mattbolanos/pedal-map"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            <GithubLogoIcon className="size-3.5" />
            mattbolanos/pedal-map
          </a>
          , if you're into that kind of thing. If you want to support the
          project or just say thanks, you can{" "}
          <a
            href="https://www.buymeacoffee.com/mattbolanos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            <CoffeeIcon className="size-3.5" />
            buy me a coffee
          </a>
          .
        </p>
      </section>
    </div>
  );
}
