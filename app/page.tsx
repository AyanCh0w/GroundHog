"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col justify-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">Groundhog</h1>
        <Link href={"/dashboard"}>
          <Button className="cursor-pointer">
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
