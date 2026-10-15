import { Fragment } from "react";
import { Link } from "react-router-dom";
import { breadcrumbsFor } from "../../config/routes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

export function PageBreadcrumbs({ pathname }: { pathname: string }) {
  const entries = breadcrumbsFor(pathname);

  return (
    <Breadcrumb className="hidden min-w-0 sm:block">
      <BreadcrumbList>
        {entries.map((entry, index) => (
          <Fragment key={`${entry.label}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {entry.href ? (
                <BreadcrumbLink asChild>
                  <Link to={entry.href}>{entry.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="max-w-52 truncate">{entry.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
