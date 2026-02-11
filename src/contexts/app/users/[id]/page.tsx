"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UsersRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  useEffect(() => {
    if (id) {
      router.replace(`/profile/${id}`);
    }
  }, [id, router]);

  return null;
}