"use client";

import { useFormState } from "react-dom";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/SubmitButton"; // A custom button to show pending state
import { updateClass } from "./actions"; // We will create this next

// Define the shape of the data passed to this component
interface EditClassFormProps {
  classData: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    teacher_id: string | null;
    // Add other class fields here as needed
  };
  teachers: {
    id: string;
    full_name: string;
  }[];
}

// Initial state for the form action
const initialState = {
  message: "",
  error: false,
};

export default function EditClassForm({ classData, teachers }: EditClassFormProps) {
  const { toast } = useToast();
  // Bind the class ID to the server action
  const updateClassWithId = updateClass.bind(null, classData.id);
  const [state, formAction] = useFormState(updateClassWithId, initialState);

  // Show a toast message based on the form action's result
  useEffect(() => {
    if (state.message) {
      if (state.error) {
        toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: state.message,
        });
      }
    }
  }, [state, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Details</CardTitle>
        <CardDescription>Update the information for this class.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input id="name" name="name" defaultValue={classData.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Class Code</Label>
              <Input id="code" name="code" defaultValue={classData.code} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={classData.description || ""}
              placeholder="Enter a brief description of the class"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher_id">Assign Teacher</Label>
            <Select name="teacher_id" defaultValue={classData.teacher_id || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
             <Button variant="outline" type="button" onClick={() => window.history.back()}>
                Cancel
             </Button>
             <SubmitButton>Save Changes</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}