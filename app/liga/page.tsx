"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Container from "../components/Container";

export default function LigaPage() {
  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase
        .from("leagues")
        .select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);
    };

    testConnection();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <h1 className="text-4xl font-bold">Liga</h1>
        <p className="mt-4 text-neutral-400">
          Här kommer dina ligor visas.
        </p>
      </Container>
    </main>
  );
}