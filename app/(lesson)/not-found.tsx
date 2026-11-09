import { NotFoundMessage } from "@/components/not-found-message";

// notFound() из страниц группы: шапка и поля уже есть в макете группы, корневая 404 дала бы вторые.
export default function NotFound() {
  return <div className="grid justify-items-start gap-6 py-20"><NotFoundMessage /></div>;
}
