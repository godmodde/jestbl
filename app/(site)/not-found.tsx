import { NotFoundMessage } from "@/components/not-found-message";

// Шапка и подвал уже есть в макете главной, корневая 404 дала бы вторые.
export default function NotFound() {
  return <main className="shell grid justify-items-start gap-6 py-20"><NotFoundMessage /></main>;
}
