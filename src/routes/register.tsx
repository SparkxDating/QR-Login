import { createFileRoute } from "@tanstack/react-router";
import { RegistrationPage } from "@/components/registration-page";

export const Route = createFileRoute("/register")({ component: RegistrationPage });
