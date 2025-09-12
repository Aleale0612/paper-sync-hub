"use client";

import { FaInstagram, FaDiscord } from "react-icons/fa";
import { cn } from "@/lib/utils";

// TikTok custom icon
const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
  >
    <path d="M224 88.1v41.9a96.1 96.1 0 0 1-96-96h41.9a54.1 54.1 0 0 0 54.1 54.1zM128 32a96 96 0 1 0 96 96h-32a64 64 0 1 1-64-64V32z"/>
  </svg>
);

export const Footer = () => {
  const socials = [
    { name: "Instagram", url: "https://instagram.com/youraccount", icon: FaInstagram },
    { name: "TikTok", url: "https://tiktok.com/@youraccount", icon: TikTokIcon },
    { name: "Discord", url: "https://discord.gg/yourinvite", icon: FaDiscord },
  ];

  return (
    <footer className="bg-card/80 backdrop-blur-sm border-t border-border mt-8 theme-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between">
        <p className="text-sm text-muted-foreground mb-4 sm:mb-0">
          © {new Date().getFullYear()} JournalPapers. All rights reserved.
        </p>
        <div className="flex space-x-4">
          {socials.map(({ name, url, icon: Icon }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("p-2 rounded-full hover:bg-secondary/80 transition-colors theme-transition")}
              title={name}
            >
              <Icon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};
