import { NotFoundMessage } from "@/components/not-found-message";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="shell grid justify-items-start gap-6 py-20"><NotFoundMessage /></main>
      <SiteFooter />
    </>
  );
}
