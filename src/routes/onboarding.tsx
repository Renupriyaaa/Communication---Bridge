import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingComponent,
});

function OnboardingComponent() {
  const nav = useNavigate();
  useEffect(() => {
    nav({ to: "/me", replace: true });
  }, [nav]);
  return null;
}
