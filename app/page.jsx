"use client";

import dynamic from "next/dynamic";

const DocpineTerminal = dynamic(() => import("../components/DocpineTerminal"), {
  ssr: false,
});

export default function Page() {
  return <DocpineTerminal />;
}
