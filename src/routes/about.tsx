import { ArrowBendUpLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowBendUpLeft";
import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "#/components/ui/button";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-5 py-10 md:py-16">
      <Link
        to="/"
        aria-label="Go back home"
        className={cn(buttonVariants({ variant: "text" }), "pl-0")}
      >
        <ArrowBendUpLeftIcon className="size-5 md:size-4" />
        Back
      </Link>
      <h1 className="text-xl font-bold">Pedal Map</h1>
      <p>I love Citi Bike!</p>
    </div>
  );
}
