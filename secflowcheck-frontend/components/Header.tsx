import Link from "next/link";

export const Header = () => {
  return (
    <header className="sticky top-0 backdrop-blur-sm z-50">
      <div className="py-5">
          <div className="container-mx-auto px-5 md:px-24">
              <div className="flex items-center justify-between">
                  <nav className="hidden md:flex gap-6 items-center text-black/60">
                    <a href="/about">About</a>
                    <a href="/features">Features</a>
                    <a href="/updates">Updates</a>
                    <a href="/help">Help</a>
                    <Link href={"/authentication/registration"}><button className="bg-black text-white px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center tracking-tight">Get for free</button></Link>
                  </nav>
              </div>
          </div>
        </div>
      <nav>

      </nav>
    </header>
  );
}