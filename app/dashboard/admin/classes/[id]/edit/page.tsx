import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditClassForm from "./EditClassForm"; // We will create this next
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

// Define the shape of the props for the page component
interface EditClassPageProps {
  params: {
    id: string;
  };
}

export default async function EditClassPage({ params }: EditClassPageProps) {
  const supabase = await createClient();
  const classId = params.id;

  // Fetch the specific class details from the database
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .single();

  // Fetch the list of all teachers to populate a dropdown
  const { data: teachers, error: teachersError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "teacher")
    .order("full_name", { ascending: true });

  // If the class doesn't exist, show a 404 page
  if (classError || !classData) {
    notFound();
  }
  
  // Handle potential errors when fetching teachers
  if (teachersError) {
    console.error("Failed to fetch teachers:", teachersError);
    // You could return an error message component here
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/admin/classes">Classes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit: {classData.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <h1 className="text-3xl font-bold">Edit Class</h1>
      
      {/* Pass the fetched data to the client form component */}
      <EditClassForm classData={classData} teachers={teachers || []} />
    </div>
  );
}