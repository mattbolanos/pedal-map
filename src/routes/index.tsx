import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  stationInformationQueryOptions,
  stationStatusQueryOptions,
} from "#/lib/citibike";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const infoQuery = useQuery(stationInformationQueryOptions);
  const statusQuery = useQuery(stationStatusQueryOptions);
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        {infoQuery.data?.data.stations.length}
      </section>
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        {statusQuery.data?.data.stations.length}
      </section>
    </main>
  );
}
