
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { UserNav } from "./UserNav";
import { auth } from "@/lib/auth";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="py-4 border-b">
      <nav className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Astewai Bookstore
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/books">Books</Link>
          <Link href="/bundles">Bundles</Link>
          <Link href="/blog">Blog</Link>
          {session?.user && <Link href="/library">Library</Link>}
          {session?.user ? (
            <UserNav user={session.user} />
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline" })}
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
