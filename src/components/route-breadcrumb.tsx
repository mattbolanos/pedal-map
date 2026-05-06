import { HouseIcon } from "@phosphor-icons/react/dist/csr/House";
import { Link } from "@tanstack/react-router";
import { Fragment, type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";

interface RouteBreadcrumbLink {
  label: string;
  to: string;
}

interface RouteBreadcrumbProps {
  current: ReactNode;

  links?: RouteBreadcrumbLink[];
}

function RouteBreadcrumb({
  current,

  links = [],
}: RouteBreadcrumbProps) {
  return (
    <Breadcrumb className="mb-4.5 min-w-0 overflow-hidden">
      <BreadcrumbList className="flex-nowrap overflow-hidden whitespace-nowrap">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink
            render={
              <Link to="/" className="flex items-center gap-x-1">
                <HouseIcon className="text-muted-foreground" weight="bold" />
                Home
              </Link>
            }
          />
        </BreadcrumbItem>
        {links.map((link) => (
          <Fragment key={link.to}>
            <BreadcrumbSeparator className="shrink-0" />
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink render={<Link to={link.to}>{link.label}</Link>} />
            </BreadcrumbItem>
          </Fragment>
        ))}
        <BreadcrumbSeparator className="shrink-0" />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate">{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { RouteBreadcrumb };
