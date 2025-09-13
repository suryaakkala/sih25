"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type SubmitButtonProps = ButtonProps & {
  children: React.ReactNode;
};

export function SubmitButton({ children, ...props }: SubmitButtonProps) {
  // This hook provides the pending status of the parent form.
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait...
        </>
      ) : (
        children
      )}
    </Button>
  );
}