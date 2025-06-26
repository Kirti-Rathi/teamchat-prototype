// import React from "react";
// import {
//   SignInButton,
//   SignUpButton,
//   SignedIn,
//   SignedOut,
//   UserButton,
// } from "@clerk/nextjs";

// const Navbar = () => {
//   return (
//     <header className="flex justify-between items-center bg-gray-800 text-white">
//       <h1>Group GPT</h1>
//       <ul className="flex justify-between items-center gap-4">
//         <li>Products</li>
//         <li>Services</li>
//         <li>Features</li>
//       </ul>
//       <div className="flex justify-end items-center p-4 gap-4 h-16">
//         <SignedOut>
//           <SignInButton />
//           <SignUpButton />
//         </SignedOut>
//         <SignedIn>
//           <UserButton />
//         </SignedIn>
//       </div>
//     </header>
//   );
// };

// export default Navbar;

"use client";
import React from "react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";

const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/auth/sign-in",
  "/auth/sign-up",
];

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) =>
    new RegExp(`^${route.replace("(.*)", ".*")}$`).test(pathname)
  );
}

const Navbar = () => {
  const pathname = usePathname();
  const isProtectedRoute = !isPublicRoute(pathname || "");

  return (
    <header className="flex justify-between items-center bg-gray-800 text-white p-4">
      {isProtectedRoute ? (
        <Link href="/dashboard">Group GPT</Link>
      ) : (
        <Link href="/">Group GPT</Link>
      )}

      {/* Hide this on protected routes */}
      {!isProtectedRoute && (
        <ul className="flex justify-between items-center gap-4">
          <li>Products</li>
          <li>Services</li>
          <li>Features</li>
        </ul>
      )}

      <div className="flex justify-end items-center gap-4 h-8">
        <SignedOut>
          <SignInButton />
          <SignUpButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;
