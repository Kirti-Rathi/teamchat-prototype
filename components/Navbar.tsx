import React from "react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

const Navbar = () => {
  return (
    <header className="flex justify-between items-center bg-gray-800 text-white">
      <h1>Group GPT</h1>
      <ul className="flex justify-between items-center gap-4">
        <li>Products</li>
        <li>Services</li>
        <li>Features</li>
      </ul>
      <div className="flex justify-end items-center p-4 gap-4 h-16">
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
