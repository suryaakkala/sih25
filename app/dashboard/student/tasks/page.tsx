import { requireStudent } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { format, parseISO } from "date-fns"

export default async function StudentTasksPage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  // Get all tasks for the student
  const { data: allTasks } = await supabase
    .from("tasks")
    .select(`
      *,
      classes:class_id (name, code),
      assignedBy:assigned_by (full_name)
    `)
    .eq("assigned_to", profile.id)
    .order("due_date", { ascending: true })

  const pendingTasks = allTasks?.filter((task) => task.status === "pending") || []
  const inProgressTasks = allTasks?.filter((task) => task.status === "in_progress") || []
  const completedTasks = allTasks?.filter((task) => task.status === "completed") || []
  const overdueTasks = allTasks?.filter((task) => task.status === "overdue") || []

  const TaskCard = ({ task }: { task: any }) => (
    <Card key={task.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{task.title}</h3>
              <Badge
                variant={
                  task.priority === "urgent"
                    ? "destructive"
                    : task.priority === "high"
                      ? "default"
                      : task.priority === "medium"
                        ? "secondary"
                        : "outline"
                }
              >
                {task.priority}
              </Badge>
              {task.ai_generated && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  AI Generated
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {task.classes?.name} ({task.classes?.code})
            </p>
            {task.description && <p className="text-sm text-gray-700 mb-3">{task.description}</p>}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {task.due_date && <span>Due: {format(parseISO(task.due_date), "MMM d, yyyy 'at' h:mm a")}</span>}
              {task.estimated_duration && <span>Est. {task.estimated_duration} min</span>}
              {task.assignedBy && <span>Assigned by: {task.assignedBy.full_name}</span>}
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href={`/dashboard/student/tasks/${task.id}`}>View Details</Link>
          </Button>
        </div>
        {task.ai_reasoning && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>AI Insight:</strong> {task.ai_reasoning}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
              <p className="text-gray-600">Manage your assignments and activities</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/student">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-orange-600">{pendingTasks.length}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
              <p className="text-sm text-gray-600">Overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({inProgressTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overdueTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending tasks</h3>
                  <p className="text-gray-600">Great job! You're all caught up.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            {inProgressTasks.length > 0 ? (
              inProgressTasks.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks in progress</h3>
                  <p className="text-gray-600">Start working on your pending tasks.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed tasks yet</h3>
                  <p className="text-gray-600">Complete some tasks to see them here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            {overdueTasks.length > 0 ? (
              overdueTasks.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <svg
                    className="w-16 h-16 text-green-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No overdue tasks</h3>
                  <p className="text-gray-600">Excellent! You're staying on top of your deadlines.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
