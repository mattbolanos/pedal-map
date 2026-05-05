import { ArrowUDownLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowUDownLeft";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "#/components/ui/button";
import { cn } from "#/lib/utils";

type NotFoundProps = {
  actionLabel?: string;
  actionTo?: string;
  message?: string;
  title?: string;
};

export function NotFound({
  actionLabel = "Back home",
  actionTo = "/",
  message = "The page you requested could not be found.",
  title = "Not found",
}: NotFoundProps) {
  return (
    <main className="route-padding max-w-3xl translate-y-1/2 justify-center text-center">
      <div className="flex flex-col items-center space-y-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p>{message}</p>
        <Link
          to={actionTo}
          className={cn(buttonVariants({ variant: "text" }), "pl-0")}
        >
          <ArrowUDownLeftIcon className="size-5 md:size-4" />
          {actionLabel}
        </Link>
      </div>
    </main>
  );
}
