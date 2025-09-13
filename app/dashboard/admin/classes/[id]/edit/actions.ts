"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Define a schema for form validation using Zod
const classSchema = z.object({
  name: z.string().min(3, "Class name must be at least 3 characters."),
  code: z.string().min(2, "Class code is required."),
  description: z.string().optional(),
  teacher_id: z.string().uuid("Invalid teacher ID.").optional().or(z.literal('')),
});

export async function updateClass(classId: string, prevState: any, formData: FormData) {
  const supabase = await createClient();

  // Extract form data and validate it
  const validatedFields = classSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description"),
    teacher_id: formData.get("teacher_id"),
  });

  // If validation fails, return the errors
  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors,
      error: true,
    };
  }
  
  const { name, code, description, teacher_id } = validatedFields.data;

  // Prepare data for Supabase, handling optional fields
  const dataToUpdate = {
    name,
    code,
    description,
    teacher_id: teacher_id || null, // Convert empty string to null for the database
    updated_at: new Date().toISOString(),
  };

  // Perform the update operation in the database
  const { error } = await supabase
    .from("classes")
    .update(dataToUpdate)
    .eq("id", classId);

  if (error) {
    console.error("Supabase error:", error);
    return {
      message: "Failed to update class. Please try again.",
      error: true,
    };
  }

  // Invalidate the cache for relevant pages to show updated data
  revalidatePath("/dashboard/admin/classes");
  revalidatePath(`/dashboard/admin/classes/${classId}`);
  
  // Redirect back to the main classes page on success
  redirect("/dashboard/admin/classes");
  
  // Note: The redirect will happen before this state is returned,
  // but it's good practice to handle the success state.
  return {
    message: "Class updated successfully!",
    error: false,
  };
}